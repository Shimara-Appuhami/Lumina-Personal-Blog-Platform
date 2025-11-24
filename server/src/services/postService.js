import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import env from '../config/env.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import ApiError from '../utils/ApiError.js';
import { listCommentsForPost } from './commentService.js';
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryEnabled } from '../utils/cloudinary.js';
import { saveBufferToDisk, deleteFromDisk } from '../utils/fileStorage.js';

const formatTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    const formatted = tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => tag.toLowerCase());
    return Array.from(new Set(formatted));
  }

  const formatted = tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());
  return Array.from(new Set(formatted));
};

const sanitizeContent = (content) =>
  sanitizeHtml(content, {
    allowedTags: [
      'p',
      'strong',
      'em',
      'u',
      'ol',
      'ul',
      'li',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'pre',
      'code',
      'img',
      'br'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' })
    },
    parser: {
      lowerCaseAttributeNames: true
    }
  });

const extractPlainText = (html) =>
  sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\s+/g, ' ')
    .trim();

const parseFilterTags = (tagQuery) => {
  const tags = formatTags(tagQuery);
  return tags.length ? tags : undefined;
};

const resolveExtension = (fileName, mimeType) => {
  const extensionFromName = fileName?.includes('.') ? fileName.split('.').pop() : '';
  if (extensionFromName) {
    return `.${extensionFromName.split('?')[0]}`;
  }

  if (!mimeType) {
    return '.jpg';
  }

  const [type, subtype] = mimeType.split('/');
  if (type === 'image' && subtype) {
    if (subtype === 'jpeg') return '.jpg';
    return `.${subtype}`;
  }

  return '.jpg';
};

const handleCoverImageUpload = async (imageBuffer, originalName, mimeType) => {
  if (!imageBuffer) {
    return { coverImage: '', coverImageId: '', localPath: '' };
  }

  const extension = resolveExtension(originalName, mimeType);
  const baseName = originalName?.replace(/\.[^/.]+$/, '') || 'cover';
  const safeOriginalName = `${baseName}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}${extension}`;

  if (isCloudinaryEnabled()) {
    const uploadResult = await uploadToCloudinary(imageBuffer, uniqueName, mimeType);
    if (uploadResult) {
      return {
        coverImage: uploadResult.url,
        coverImageId: uploadResult.publicId,
        localPath: ''
      };
    }
  }

  const savedPath = await saveBufferToDisk(imageBuffer, uniqueName);

  return {
    coverImage: `${env.serverUrl.replace(/\/$/, '')}/uploads/${uniqueName}`,
    coverImageId: '',
    localPath: savedPath
  };
};

const cleanupCoverImage = async ({ coverImageId, localPath }) => {
  if (coverImageId) {
    await deleteFromCloudinary(coverImageId);
  }

  if (localPath) {
    await deleteFromDisk(localPath);
  }
};

export const listPosts = async ({ page = 1, limit = 10, search = '', tag }) => {
  const filters = {};

  if (search) {
    filters.title = { $regex: search, $options: 'i' };
  }

  if (tag) {
    const tagFilters = parseFilterTags(tag);
    if (tagFilters) {
      filters.tags = { $in: tagFilters };
    }
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(filters)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filters)
  ]);

  const postIds = posts.map((post) => post._id);
  const commentAggregate = postIds.length
    ? await Comment.aggregate([
        {
          $match: {
            post: { $in: postIds },
            $or: [{ isOwnerReply: { $exists: false } }, { isOwnerReply: false }]
          }
        },
        {
          $group: {
            _id: '$post',
            total: { $sum: 1 }
          }
        }
      ])
    : [];

  const commentCountMap = new Map(commentAggregate.map((c) => [c._id.toString(), c.total]));

  const postsWithCounts = posts.map((post) => {
    const { coverImageLocalPath, ...rest } = post;
    const plainText = extractPlainText(post.content ?? '');
    const excerpt = plainText.length > 200 ? `${plainText.slice(0, 200)}…` : plainText;
    return {
      ...rest,
      likes: post.likes?.map((id) => id.toString()) ?? [],
      commentCount: commentCountMap.get(post._id.toString()) ?? 0,
      excerpt
    };
  });

  return {
    posts: postsWithCounts,
    pagination: {
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1)
    }
  };
};

export const getPostById = async (postId) => {
  const post = await Post.findById(postId)
    .populate('author', 'username avatar')
    .lean();

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const { coverImageLocalPath, ...rest } = post;
  rest.likes = post.likes?.map((id) => id.toString()) ?? [];
 
   const comments = await listCommentsForPost(postId);

  return { post: rest, comments };
};

export const createPost = async ({
  title,
  content,
  tags,
  authorId,
  imageBuffer,
  imageOriginalName,
  imageMimeType
}) => {
  if (!title || !content) {
    throw new ApiError(400, 'Title and content are required');
  }

  const sanitizedContent = sanitizeContent(content);
  const plainText = extractPlainText(sanitizedContent);

  if (plainText.length < 20) {
    throw new ApiError(400, 'Content must be at least 20 characters');
  }

  const { coverImage, coverImageId, localPath } = await handleCoverImageUpload(
    imageBuffer,
    imageOriginalName,
    imageMimeType
  );

  try {
    const post = await Post.create({
      title,
      content: sanitizedContent,
      author: authorId,
      tags: formatTags(tags),
      coverImage,
      coverImageId,
      coverImageLocalPath: localPath
    });

    return post;
  } catch (error) {
    await cleanupCoverImage({ coverImageId, localPath });
    throw error;
  }
};

export const updatePost = async ({
  postId,
  requesterId,
  title,
  content,
  tags,
  imageBuffer,
  imageOriginalName,
  imageMimeType
}) => {
  const post = await Post.findById(postId).select('+coverImageLocalPath');

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.author.toString() !== requesterId) {
    throw new ApiError(403, 'You are not allowed to update this post');
  }

  let newCoverData;

  if (imageBuffer && imageOriginalName) {
    newCoverData = await handleCoverImageUpload(imageBuffer, imageOriginalName, imageMimeType);
  }

  if (title) post.title = title;
  if (content) {
    const sanitizedContent = sanitizeContent(content);
    const plainText = extractPlainText(sanitizedContent);
    if (plainText.length < 20) {
      throw new ApiError(400, 'Content must be at least 20 characters');
    }
    post.content = sanitizedContent;
  }
  if (typeof tags !== 'undefined') post.tags = formatTags(tags);

  if (newCoverData) {
    await cleanupCoverImage({ coverImageId: post.coverImageId, localPath: post.coverImageLocalPath });
    post.coverImage = newCoverData.coverImage;
    post.coverImageId = newCoverData.coverImageId;
    post.coverImageLocalPath = newCoverData.localPath;
  }

  await post.save();
  return post;
};

export const deletePostById = async ({ postId, requesterId }) => {
  const post = await Post.findById(postId).select('+coverImageLocalPath');

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.author.toString() !== requesterId) {
    throw new ApiError(403, 'You are not allowed to delete this post');
  }

  await cleanupCoverImage({ coverImageId: post.coverImageId, localPath: post.coverImageLocalPath });

  await Comment.deleteMany({ post: postId });
  await post.deleteOne();
};

export const toggleLike = async ({ postId, userId }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const hasLiked = post.likes.some((id) => id.toString() === userId);

  if (hasLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  return { likes: post.likes.length, liked: !hasLiked };
};
