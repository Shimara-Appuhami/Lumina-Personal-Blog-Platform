import apiClient from './apiClient.js';

export const registerUser = async (payload) => {
  const { data } = await apiClient.post('/auth/register', payload);
  return data.data;
};

export const loginUser = async (payload) => {
  const { data } = await apiClient.post('/auth/login', payload);
  return data.data;
};
