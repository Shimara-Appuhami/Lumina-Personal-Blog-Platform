import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';
import {
  listPosts,
  createPost,
  getPostById,
  updatePost,
  deletePostById,
  toggleLike
} from '../services/postService.js';
import { addComment, listCommentsForPost, markCommentAsRead } from '../services/commentService.js';

export const getPosts = async (req, res) => {
  const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
  const limitRaw = parseInt(req.query.limit ?? '9', 10) || 9;
  const limit = Math.min(Math.max(limitRaw, 3), 24);
  const search = req.query.search ?? '';
  const tag = req.query.tag ?? undefined;

  const result = await listPosts({ page, limit, search, tag });

  res.json({
    success: true,
    data: result
  });
};

export const getPost = async (req, res) => {
  const { post, comments } = await getPostById(req.params.id);

  res.json({
    success: true,
    data: { post, comments }
  });
};

export const createPostController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation error', errors.array());
  }

  const { title, content, tags } = req.body;
  const created = await createPost({
    title,
    content,
    tags,
    authorId: req.user.id,
    imageBuffer: req.file?.buffer,
    imageOriginalName: req.file?.originalname ?? '',
    imageMimeType: req.file?.mimetype ?? ''
  });

  res.status(201).json({
    success: true,
    data: created
  });
};

export const updatePostController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation error', errors.array());
  }

  const { title, content, tags } = req.body;

  const updated = await updatePost({
    postId: req.params.id,
    requesterId: req.user.id,
    title,
    content,
    tags,
    imageBuffer: req.file?.buffer,
    imageOriginalName: req.file?.originalname ?? '',
    imageMimeType: req.file?.mimetype ?? ''
  });

  res.json({
    success: true,
    data: updated
  });
};

export const deletePostController = async (req, res) => {
  await deletePostById({
    postId: req.params.id,
    requesterId: req.user.id
  });

  res.json({
    success: true,
    message: 'Post deleted'
  });
};

export const toggleLikeController = async (req, res) => {
  const result = await toggleLike({ postId: req.params.id, userId: req.user.id });

  res.json({
    success: true,
    data: result
  });
};

export const addCommentController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation error', errors.array());
  }

  const comment = await addComment({
    postId: req.params.id,
    userId: req.user.id,
    content: req.body.content,
    parentCommentId: req.body.parentCommentId ?? null
  });

  res.status(201).json({
    success: true,
    data: comment
  });
};

export const listCommentsController = async (req, res) => {
  const comments = await listCommentsForPost(req.params.id);

  res.json({
    success: true,
    data: comments
  });
};

export const markCommentReadController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation error', errors.array());
  }

  const result = await markCommentAsRead({
    postId: req.params.id,
    commentId: req.params.commentId,
    userId: req.user.id
  });

  res.json({
    success: true,
    data: result
  });
};
