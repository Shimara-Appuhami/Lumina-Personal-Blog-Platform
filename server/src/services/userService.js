import crypto from 'crypto';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryEnabled } from '../utils/cloudinary.js';
import { saveBufferToDisk, deleteFromDisk } from '../utils/fileStorage.js';

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

const handleAvatarUpload = async ({ buffer, originalName, mimeType }) => {
  if (!buffer) {
    return { avatarUrl: '', avatarId: '', localPath: '' };
  }

  const extension = resolveExtension(originalName, mimeType);
  const baseName = originalName?.replace(/\.[^/.]+$/, '') || 'avatar';
  const safeOriginalName = `${baseName}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueName = `avatar-${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}${extension}`;

  if (isCloudinaryEnabled()) {
    const uploadResult = await uploadToCloudinary(buffer, uniqueName, mimeType);
    if (uploadResult) {
      return {
        avatarUrl: uploadResult.url,
        avatarId: uploadResult.publicId,
        localPath: ''
      };
    }
  }

  const savedPath = await saveBufferToDisk(buffer, uniqueName);
  return {
    avatarUrl: `${env.serverUrl.replace(/\/$/, '')}/uploads/${uniqueName}`,
    avatarId: '',
    localPath: savedPath
  };
};

const cleanupAvatar = async ({ avatarId, avatarLocalPath }) => {
  await deleteFromCloudinary(avatarId);
  await deleteFromDisk(avatarLocalPath);
};

export const getUserProfile = async (userId) => {
  const userDoc = await User.findById(userId).select('-password');

  if (!userDoc) {
    throw new ApiError(404, 'User not found');
  }

  const posts = await Post.find({ author: userId })
    .sort({ createdAt: -1 })
    .select('title coverImage createdAt tags likes')
    .lean();

  const normalizedPosts = posts.map((post) => ({
    ...post,
    likes: post.likes?.map((id) => id.toString()) ?? []
  }));

  return { user: userDoc.toJSON(), posts: normalizedPosts };
};

export const getUserNotifications = async ({ userId, limit = 20 }) => {
  const parsed = Number(limit);
  const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;

  const authoredPosts = await Post.find({ author: userId }).select('_id title').lean();

  if (!authoredPosts.length) {
    return [];
  }

  const postIds = authoredPosts.map((post) => post._id);

  const comments = await Comment.find({
    post: { $in: postIds },
    user: { $ne: userId },
    readBy: { $nin: [userId] }
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate('user', 'username avatar')
    .populate('post', 'title')
    .lean();

  return comments.map((comment) => ({
    _id: comment._id.toString(),
    content: comment.content,
    createdAt: comment.createdAt,
    post: comment.post
      ? {
          _id: comment.post._id?.toString(),
          title: comment.post.title
        }
      : null,
    user: comment.user
      ? {
          _id: comment.user._id?.toString(),
          username: comment.user.username,
          avatar: comment.user.avatar ?? ''
        }
      : null
  }));
};

export const updateUserProfile = async ({
  userId,
  username,
  avatarFile
}) => {
  const userDoc = await User.findById(userId).select('+avatarId +avatarLocalPath');

  if (!userDoc) {
    throw new ApiError(404, 'User not found');
  }

  let hasChanges = false;

  if (username !== undefined) {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new ApiError(400, 'Username cannot be empty');
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      throw new ApiError(400, 'Username must be between 3 and 30 characters');
    }
    if (trimmed !== userDoc.username) {
      const existing = await User.findOne({ username: trimmed, _id: { $ne: userId } });
      if (existing) {
        throw new ApiError(409, 'That username is already taken');
      }
      userDoc.username = trimmed;
      hasChanges = true;
    }
  }

  if (avatarFile?.buffer?.length) {
    const { avatarUrl, avatarId, localPath } = await handleAvatarUpload({
      buffer: avatarFile.buffer,
      originalName: avatarFile.originalname,
      mimeType: avatarFile.mimetype
    });

    if (avatarUrl) {
      await cleanupAvatar({
        avatarId: userDoc.avatarId,
        avatarLocalPath: userDoc.avatarLocalPath
      });

      userDoc.avatar = avatarUrl;
      userDoc.avatarId = avatarId;
      userDoc.avatarLocalPath = localPath;
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return userDoc.toJSON();
  }

  await userDoc.save();
  return userDoc.toJSON();
};
