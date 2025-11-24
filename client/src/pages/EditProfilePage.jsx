import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';
import { fetchUserProfile, updateUserProfile } from '../services/userService.js';

const EditProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token, login } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => fetchUserProfile(id),
    enabled: Boolean(id)
  });

  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data?.user?.username) {
      setUsername(data.user.username);
    }
  }, [data?.user?.username]);

  useEffect(() => {
    if (avatarFile) {
      const objectUrl = URL.createObjectURL(avatarFile);
      setAvatarPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setAvatarPreview(data?.user?.avatar ?? '');
  }, [avatarFile, data?.user?.avatar]);

  useEffect(() => {
    if (user?._id && id && user._id !== id) {
      navigate(`/profile/${user._id}`, { replace: true });
    }
  }, [id, navigate, user?._id]);

  const mutation = useMutation({
    mutationFn: (payload) => updateUserProfile(id, payload),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', id] });
      if (user?._id === updatedUser._id && token) {
        login(updatedUser, token);
      }
      navigate(`/profile/${id}`);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username.trim()) {
      return;
    }
    mutation.mutate({ username: username.trim(), avatar: avatarFile ?? undefined });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(data?.user?.avatar ?? '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <p className="text-center text-red-500">{error.message}</p>;
  }

  if (!data?.user) {
    return <p className="text-center text-red-500">User not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <header className="space-y-2 text-center">
        <h1 className="page-heading">Edit profile</h1>
        <p className="sub-heading">Update how others see you across the community.</p>
      </header>

      <form
        className="glass-panel space-y-6 p-8"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-28 w-28 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-rose-200 bg-rose-50 text-2xl font-semibold text-rose-400">
                {username?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <label className="form-label" htmlFor="avatar">
              Profile picture
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              className="form-field"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {avatarFile && (
              <button
                type="button"
                className="text-xs font-semibold text-rose-400 transition hover:text-rose-500"
                onClick={handleRemoveAvatar}
              >
                Clear selected image
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="form-label" htmlFor="username">
            Display name
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="form-field"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={30}
            required
          />
          <p className="text-xs text-slate-400">Between 3 and 30 characters. This will appear on all of your posts and comments.</p>
        </div>

        {mutation.isError && (
          <p className="text-sm font-medium text-red-500">
            {mutation.error.response?.data?.message ?? mutation.error.message}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/profile/${id}`)}
            disabled={mutation.isLoading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
