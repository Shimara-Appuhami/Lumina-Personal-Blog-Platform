import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaBell } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useAuthContext } from '../context/AuthContext.jsx';
import { fetchUserNotifications } from '../services/userService.js';
import { markCommentAsRead } from '../services/postService.js';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const queryClient = useQueryClient();
  const [isBulkMarking, setIsBulkMarking] = useState(false);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const handleClickAway = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsNotificationsOpen(false);
    }
  }, [isAuthenticated]);

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    error: notificationsErrorData,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: () => fetchUserNotifications(user._id, { limit: 20 }),
    enabled: isAuthenticated && Boolean(user?._id),
    staleTime: 60_000,
    refetchInterval: 60_000
  });

  const notificationCount = notifications.length;
  const badgeLabel = notificationCount > 99 ? '99+' : notificationCount;

  const markNotificationMutation = useMutation({
    mutationFn: ({ postId, commentId }) => markCommentAsRead({ postId, commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?._id] });
    }
  });

  const handleMarkAll = async () => {
    if (!notifications.length || isBulkMarking) {
      return;
    }

    setIsBulkMarking(true);

    try {
      await Promise.all(
        notifications
          .filter((notification) => notification.post?._id)
          .map((notification) =>
            markNotificationMutation.mutateAsync({
              postId: notification.post._id,
              commentId: notification._id
            })
          )
      );
      setIsNotificationsOpen(false);
    } catch (error) {
    } finally {
      setIsBulkMarking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-rose-100 bg-white/85 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-slate-700">
        <Link
          to="/"
          className="group flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-800 transition hover:text-rose-500"
        >
          <img
            src="/assets/lumina-logo.png"
            alt="Lumina"
            className="h-10 w-10 overflow-hidden rounded-full logo-icon transition duration-300 group-hover:scale-105"
          />
          <span className="tracking-tight">Lumina</span>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-6 text-sm font-medium md:gap-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `transition ${isActive ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`
            }
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/posts/create"
            className={({ isActive }) =>
              `hidden rounded-full px-4 py-2 text-sm transition md:inline-flex ${
                isActive
                  ? 'bg-gradient-to-r from-rose-400 to-orange-300 text-white shadow-sm'
                  : 'border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600'
              }`
            }
          >
            Write
          </NavLink>
          <NavLink
            to={isAuthenticated ? `/profile/${user._id}` : '/register'}
            className={({ isActive }) =>
              `hidden text-sm transition md:inline-flex ${isActive ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`
            }
          >
            {isAuthenticated ? 'Profile' : 'Authors'}
          </NavLink>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white/90 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
                >
                  <FaBell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold leading-4 text-white">
                      {badgeLabel}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-80 max-w-xs rounded-3xl border border-rose-100 bg-white/95 p-5 text-sm text-slate-700 shadow-xl backdrop-blur-lg">
                    <div className="flex items-center justify-between text-xs text-rose-400">
                      <span className="font-semibold uppercase tracking-[0.3em]">Notifications</span>
                      <button
                        type="button"
                        onClick={() => refetchNotifications()}
                        className="rounded-full border border-rose-100 px-3 py-1 text-[11px] font-medium text-rose-500 transition hover:border-rose-200 hover:text-rose-600"
                      >
                        Refresh
                      </button>
                    </div>
                    {notificationCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAll}
                        disabled={isBulkMarking || markNotificationMutation.isPending}
                        className="mt-3 w-full rounded-full border border-rose-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-500 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBulkMarking ? 'Marking…' : 'Mark all as read'}
                      </button>
                    )}
                    {notificationsLoading ? (
                      <p className="mt-4 text-xs text-slate-500">Loading activity…</p>
                    ) : notificationsError ? (
                      <p className="mt-4 text-xs text-rose-500">
                        {notificationsErrorData?.response?.data?.message ?? notificationsErrorData?.message ?? 'Unable to load notifications'}
                      </p>
                    ) : notificationCount ? (
                      <ul className="mt-4 space-y-3">
                        {notifications.map((notification) => (
                          <li
                            key={notification._id}
                            className="rounded-2xl border border-rose-100 bg-white p-3 transition hover:border-rose-200 hover:bg-rose-50"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (notification.post?._id) {
                                  markNotificationMutation.mutate({
                                    postId: notification.post._id,
                                    commentId: notification._id
                                  });
                                }
                                setIsNotificationsOpen(false);
                                if (notification.post?._id) {
                                  const params = new URLSearchParams({ replyTo: notification._id });
                                  navigate(`/posts/${notification.post._id}?${params.toString()}`);
                                }
                              }}
                              className="flex w-full items-start gap-3 text-left"
                            >
                              {notification.user?.avatar ? (
                                <img
                                  src={notification.user.avatar}
                                  alt={notification.user.username ?? 'Reader'}
                                  className="h-10 w-10 flex-none rounded-full border border-rose-100 object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-xs font-semibold text-rose-500">
                                  {notification.user?.username?.[0]?.toUpperCase() ?? 'U'}
                                </span>
                              )}
                              <div className="space-y-1">
                                <p className="text-xs text-slate-600">
                                  <span className="font-semibold text-rose-500">{notification.user?.username ?? 'Someone'}</span>
                                  {` commented on `}
                                  <span className="font-semibold text-slate-800">
                                    {notification.post?.title ?? 'your post'}
                                  </span>
                                </p>
                                {notification.createdAt && (
                                  <p className="text-[11px] uppercase tracking-[0.25em] text-rose-400">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </p>
                                )}
                                <p
                                  className="text-xs text-slate-500"
                                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                >
                                  {notification.content}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 rounded-2xl border border-dashed border-rose-100 bg-white p-4 text-xs text-slate-500">
                        You're all caught up. No new conversations yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate(`/profile/${user._id}`)}
                className="flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-1.5 text-slate-700 transition hover:border-rose-200 hover:bg-rose-50"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-500">
                    {user.username[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
                <span className="hidden md:inline">{user.username}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full bg-gradient-to-r from-rose-400 to-orange-300 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow md:inline-flex"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full border border-rose-100 px-4 py-2 text-sm text-rose-500 transition hover:-translate-y-0.5 hover:bg-rose-50"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-rose-400 to-orange-300 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                Join free
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
