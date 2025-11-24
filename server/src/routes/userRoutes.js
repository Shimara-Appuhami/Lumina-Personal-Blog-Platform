import { Router } from 'express';
import { getProfile, getNotifications, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/:id/notifications', authenticate, getNotifications);
router.patch('/:id', authenticate, upload.single('avatar'), updateProfile);
router.get('/:id', getProfile);

export default router;
