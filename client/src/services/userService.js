import apiClient from './apiClient.js';

export const fetchUserProfile = async (userId) => {
  const { data } = await apiClient.get(`/users/${userId}`);
  return data.data;
};

export const fetchUserNotifications = async (userId, { limit = 20 } = {}) => {
  const params = { limit };
  const { data } = await apiClient.get(`/users/${userId}/notifications`, { params });
  return data.data;
};

export const updateUserProfile = async (userId, { username, avatar } = {}) => {
  const formData = new FormData();

  if (username !== undefined) {
    formData.append('username', username);
  }

  if (avatar instanceof File) {
    formData.append('avatar', avatar);
  }

  const { data } = await apiClient.patch(`/users/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return data.data;
};
