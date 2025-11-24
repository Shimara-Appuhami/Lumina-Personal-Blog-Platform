import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaKey } from 'react-icons/fa';
import { loginUser } from '../services/authService.js';
import useAuth from '../hooks/useAuth.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.user, data.token);
      const redirectPath = location.state?.from?.pathname ?? '/';
      navigate(redirectPath, { replace: true });
    },
    onError: (err) => {
      setError('root', { message: err.response?.data?.message ?? err.message });
    }
  });

  const onSubmit = (formValues) => {
    mutation.mutate(formValues);
  };

  const handleDemo = () => {
    reset({ email: 'demo@example.com', password: 'password123' });
  };

  return (
    <div className="relative mx-auto max-w-4xl animate-fade-in">
      <div className="absolute -right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-200/70 via-orange-200/40 to-transparent blur-[120px]" />
      <div className="relative grid overflow-hidden rounded-[32px] border border-rose-100 bg-white shadow-2xl backdrop-blur-xl md:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-rose-300 via-orange-200 to-amber-100 p-10 text-slate-800 md:flex">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
              Welcome back
            </span>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">Pick up where you left off.</h2>
            <p className="text-sm text-slate-600">
              Continue writing drafts, engage with your audience, or discover what the community published overnight.
            </p>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-orange-200 text-lg text-rose-600">
                  <FaKey />
                </span>
                <p>Secure single sign-on safeguards your account with modern encryption.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Need an account?</p>
            <Link to="/register" className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-orange-300 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow">
              Create one
              <FaArrowRight />
            </Link>
          </div>
        </aside>

        <div className="space-y-8 p-8 md:p-12">
          <div className="space-y-3">
            <h1 className="page-heading">Sign in to Personal Blog</h1>
            <p className="text-sm text-slate-600">Access your dashboard, track analytics, and share fresh ideas in seconds.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-field"
                placeholder="your@email.com"
                {...register('email', { required: 'Email is required' })}
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
                placeholder="Enter your password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="text-xs font-medium text-rose-500">{errors.password.message}</p>}
            </div>

            {errors.root && <p className="text-xs font-medium text-rose-500">{errors.root.message}</p>}

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
                {mutation.isLoading ? 'Signing in…' : 'Sign in'}
              </button>
             
            </div>
          </form>

          <p className="text-sm text-slate-600">
            No account yet?{' '}
            <Link to="/register" className="font-semibold text-rose-500 underline">
              Join the community
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
