import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FaFeatherAlt, FaShieldAlt, FaUserFriends } from 'react-icons/fa';
import { registerUser } from '../services/authService.js';
import useAuth from '../hooks/useAuth.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    clearErrors
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      avatar: ''
    }
  });

  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/', { replace: true });
    },
    onError: (err) => {
      setError('root', { message: err.response?.data?.message ?? err.message });
    }
  });

  const onSubmit = (values) => {
    mutation.mutate(values);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarPreview('');
      setValue('avatar', '');
      clearErrors('avatar');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('avatar', { message: 'Avatar must be smaller than 2MB' });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() ?? '';
      setAvatarPreview(base64);
      setValue('avatar', base64);
      clearErrors('avatar');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarPreview('');
    setValue('avatar', '');
    clearErrors('avatar');
  };

  return (
    <div className="relative mx-auto max-w-5xl animate-fade-in">
      <div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-200/70 via-orange-200/40 to-transparent blur-[120px]" />
      <div className="relative grid gap-10 overflow-hidden rounded-[32px] border border-rose-100 bg-white p-8 shadow-2xl backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
              Become a contributor
            </p>
            <h1 className="page-heading">Join the community shaping tomorrow&apos;s stories.</h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600">
              Create a profile, showcase your expertise, and inspire others with long-form storytelling, micro updates, and curated collections. Your voice matters.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="form-field"
                placeholder="Choose a unique handle"
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
              />
              {errors.username && <p className="text-xs font-medium text-rose-500">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-field"
                placeholder="name@youremail.com"
                {...register('email', {
                  required: 'Email is required'
                })}
              />
              {errors.email && <p className="text-xs font-medium text-rose-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-field"
                placeholder="Create a strong password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
              />
              {errors.password && <p className="text-xs font-medium text-rose-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-3">
              <label htmlFor="avatar" className="form-label">
                Avatar (optional)
              </label>
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-rose-100 bg-white/70 p-4 shadow-inner">
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-rose-500 file:px-5 file:py-2 file:font-semibold file:text-white hover:file:bg-rose-600"
                />
                <input type="hidden" {...register('avatar')} />
                {avatarPreview && (
                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-3 shadow-sm">
                    <img src={avatarPreview} alt="Avatar preview" className="h-14 w-14 rounded-full object-cover" />
                    <button type="button" onClick={handleAvatarRemove} className="text-sm font-semibold text-rose-500 underline">
                      Remove
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-500">JPG, PNG, or GIF up to 2MB. You can always upload later.</p>
              </div>
              {errors.avatar && <p className="text-xs font-medium text-rose-500">{errors.avatar.message}</p>}
            </div>

            {errors.root && <p className="text-xs font-medium text-rose-500">{errors.root.message}</p>}

            <button type="submit" className="btn-primary w-full" disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Creating account...' : 'Create your account'}
            </button>
          </form>

          <p className="text-sm text-slate-600">
            Already a member?{' '}
            <Link to="/login" className="font-semibold text-rose-500 underline">
              Sign in
            </Link>
          </p>
        </div>

        <aside className="relative hidden overflow-hidden rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-300 via-orange-200 to-amber-100 p-8 text-slate-800 shadow-xl md:flex md:flex-col md:justify-between">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold leading-tight text-slate-900">Create, curate, and connect.</h2>
              <p className="text-sm text-slate-600">
                Publish thoughtful stories, share quick takes with the community, and grow your readership with beautiful author profiles.
              </p>
            </div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-lg text-rose-500">
                  <FaFeatherAlt />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Powerful editor experience</p>
                  <p className="text-slate-600">Compose long-form drafts with rich formatting and media embeds.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-lg text-rose-500">
                  <FaUserFriends />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Community-first discovery</p>
                  <p className="text-slate-600">Find readers through tags, collections, and personalised recommendations.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-lg text-rose-500">
                  <FaShieldAlt />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Secure by design</p>
                  <p className="text-slate-600">Your information is encrypted and protected with modern best practices.</p>
                </div>
              </li>
            </ul>
          </div>

        
        </aside>
      </div>
    </div>
  );
};

export default RegisterPage;
