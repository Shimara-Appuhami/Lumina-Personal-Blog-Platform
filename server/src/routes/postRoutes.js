import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getPosts,
  getPost,
  createPostController,
  updatePostController,
  deletePostController,
  toggleLikeController,
  addCommentController,
  listCommentsController,
  markCommentReadController
} from '../controllers/postController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

const postValidators = [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('content').optional().isLength({ min: 20 }).withMessage('Content must be at least 20 characters'),
  body('tags').optional()
];

router.get('/', getPosts);
router.get('/:id', getPost);

router.post(
  '/',
  authenticate,
  upload.single('coverImage'),
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('content').isLength({ min: 20 }).withMessage('Content must be at least 20 characters')
  ],
  createPostController
);

router.put('/:id', authenticate, upload.single('coverImage'), postValidators, updatePostController);

router.delete('/:id', authenticate, deletePostController);

router.post('/:id/like', authenticate, toggleLikeController);

router.get('/:id/comments', listCommentsController);
router.post(
  '/:id/comments',
  authenticate,
  [
    body('content').trim().isLength({ min: 1 }).withMessage('Comment content is required'),
    body('parentCommentId')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Invalid parent comment')
  ],
  addCommentController
);
router.patch(
  '/:id/comments/:commentId/read',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid post'),
    param('commentId').isMongoId().withMessage('Invalid comment')
  ],
  markCommentReadController
);

export default router;
