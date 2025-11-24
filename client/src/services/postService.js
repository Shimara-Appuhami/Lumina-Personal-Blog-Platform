import apiClient from './apiClient.js';

export const fetchPosts = async (params) => {
  const { data } = await apiClient.get('/posts', { params });
  return data.data;
};

export const fetchPostById = async (postId) => {
  const { data } = await apiClient.get(`/posts/${postId}`);
  return data.data;
};

export const createPost = async (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, value);
      }
    }
  });

  const { data } = await apiClient.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data.data;
};

export const updatePost = async (postId, payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, value);
      }
    }
  });

  const { data } = await apiClient.put(`/posts/${postId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data.data;
};

export const deletePost = async (postId) => {
  const { data } = await apiClient.delete(`/posts/${postId}`);
  return data;
};

export const toggleLikePost = async (postId) => {
  const { data } = await apiClient.post(`/posts/${postId}/like`);
  return data.data;
};

export const addCommentToPost = async (postId, { content, parentCommentId } = {}) => {
  const payload = { content };

  if (parentCommentId) {
    payload.parentCommentId = parentCommentId;
  }

  const { data } = await apiClient.post(`/posts/${postId}/comments`, payload);
  return data.data;
};

export const fetchCommentsForPost = async (postId) => {
  const { data } = await apiClient.get(`/posts/${postId}/comments`);
  return data.data;
};

export const markCommentAsRead = async ({ postId, commentId }) => {
  const { data } = await apiClient.patch(`/posts/${postId}/comments/${commentId}/read`);
  return data.data;
};
