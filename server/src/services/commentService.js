import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import ApiError from '../utils/ApiError.js';

const normalizeComment = (commentDoc) => ({
  _id: commentDoc._id.toString(),
  content: commentDoc.content,
  createdAt: commentDoc.createdAt,
  parentComment: commentDoc.parentComment ? commentDoc.parentComment.toString() : null,
  isOwnerReply: Boolean(commentDoc.isOwnerReply),
  readBy: Array.isArray(commentDoc.readBy)
    ? commentDoc.readBy.map((id) => id.toString())
    : [],
  user: commentDoc.user
    ? {
        _id: commentDoc.user._id?.toString(),
        username: commentDoc.user.username,
        avatar: commentDoc.user.avatar ?? ''
      }
    : null
});

export const addComment = async ({ postId, userId, content, parentCommentId }) => {
  if (!content || !content.trim()) {
    throw new ApiError(400, 'Comment content is required');
  }

  const post = await Post.findById(postId).select('author');
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  let parentComment = null;

  if (parentCommentId) {
    parentComment = await Comment.findById(parentCommentId).select('post parentComment');

    if (!parentComment || parentComment.post.toString() !== postId) {
      throw new ApiError(404, 'Parent comment not found');
    }

    if (parentComment.parentComment) {
      throw new ApiError(400, 'Replies are only allowed on top-level comments');
    }

    if (post.author.toString() !== userId) {
      throw new ApiError(403, 'Only the post owner can reply to comments');
    }
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    content: content.trim(),
    parentComment: parentCommentId ?? null,
    isOwnerReply: post.author.toString() === userId && Boolean(parentCommentId)
  });

  await comment.populate('user', 'username avatar');

  return normalizeComment(comment);
};

export const listCommentsForPost = async (postId) => {
  const commentDocs = await Comment.find({ post: postId })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 })
    .lean();

  const topLevel = [];
  const repliesMap = new Map();

  commentDocs.forEach((doc) => {
    const normalized = normalizeComment(doc);

    if (normalized.parentComment) {
      if (!repliesMap.has(normalized.parentComment)) {
        repliesMap.set(normalized.parentComment, []);
      }
      repliesMap.get(normalized.parentComment).push(normalized);
      return;
    }

    topLevel.push({ ...normalized, replies: [] });
  });

  topLevel.forEach((comment) => {
    const replies = repliesMap.get(comment._id) ?? [];
    replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    comment.replies = replies;
  });

  return topLevel;
};

export const markCommentAsRead = async ({ postId, commentId, userId }) => {
  const post = await Post.findById(postId).select('author');

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.author.toString() !== userId) {
    throw new ApiError(403, 'Only the post owner can mark comments as read');
  }

  const comment = await Comment.findOne({ _id: commentId, post: postId });

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const alreadyRead = Array.isArray(comment.readBy)
    ? comment.readBy.some((id) => id.toString() === userId)
    : false;

  if (!alreadyRead) {
    if (!Array.isArray(comment.readBy)) {
      comment.readBy = [];
    }
    comment.readBy.push(userId);
    await comment.save();
  }

  return {
    _id: comment._id.toString(),
    readBy: comment.readBy.map((id) => id.toString())
  };
};
