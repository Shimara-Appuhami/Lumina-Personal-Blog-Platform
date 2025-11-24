import ApiError from '../utils/ApiError.js';
import { getUserProfile, getUserNotifications, updateUserProfile } from '../services/userService.js';

export const getProfile = async (req, res) => {
  const { id } = req.params;
  const profile = await getUserProfile(id);

  res.json({
    success: true,
    data: profile
  });
};

export const getNotifications = async (req, res) => {
  const { id } = req.params;

  if (!req.user || req.user.id !== id) {
    throw new ApiError(403, 'You can only view your own notifications');
  }

  const notifications = await getUserNotifications({ userId: id, limit: req.query.limit });

  res.json({
    success: true,
    data: notifications
  });
};

export const updateProfile = async (req, res) => {
  const { id } = req.params;

  if (!req.user || req.user.id !== id) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const updatedUser = await updateUserProfile({
    userId: id,
    username: req.body.username,
    avatarFile: req.file
  });

  res.json({
    success: true,
    data: updatedUser
  });
};
