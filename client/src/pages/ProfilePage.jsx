import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaCalendarAlt, FaHeart, FaPenFancy, FaStar, FaFolderOpen, FaEdit, FaPlus } from 'react-icons/fa';
import { fetchUserProfile } from '../services/userService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => fetchUserProfile(id),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <p className="text-center text-red-500">{error.message}</p>;
  }

  if (!data?.user) {
    return <p className="text-center text-red-500">User not found.</p>;
  }

  const authoredPosts = data.posts ?? [];
  const totalLikes = authoredPosts.reduce((sum, post) => sum + (post.likes?.length ?? 0), 0);
  const postsCount = authoredPosts.length;
  const averageLikes = postsCount ? (totalLikes / postsCount).toFixed(1) : '0';

  const scrollToPosts = () => {
    const section = document.getElementById('profile-posts');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <section className="overflow-hidden rounded-[32px] border border-rose-100 bg-white shadow-2xl">
        <div className="h-40 bg-gradient-to-r from-rose-200 via-orange-200 to-fuchsia-100" />
        <div className="px-8 pb-8">
          <div className="-mt-16 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              {data.user.avatar ? (
                <img
                  src={data.user.avatar}
                  alt={data.user.username}
                  className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-2xl"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-rose-300 via-orange-200 to-amber-100 text-4xl font-bold text-rose-600 shadow-2xl">
                  {data.user.username[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{data.user.username}</h1>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                    <FaCalendarAlt className="h-3.5 w-3.5" />
                  </span>
                  Joined {formatDistanceToNow(new Date(data.user.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            {user?._id === data.user._id && (
              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/profile/${data.user._id}/edit`} className="btn-secondary inline-flex items-center gap-2">
                  <FaEdit className="h-4 w-4" />
                  Edit profile
                </Link>
                <Link to="/posts/create" className="btn-primary inline-flex items-center gap-2">
                  <FaPlus className="h-4 w-4" />
                  Write a new post
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-6 rounded-2xl border border-rose-100 bg-white/80 px-6 py-5 shadow-sm sm:grid-cols-3">
            <div className="text-center">
              <button
                type="button"
                onClick={scrollToPosts}
                className="group w-full rounded-2xl border border-rose-100 bg-white/80 px-5 py-4 text-sm font-semibold text-rose-500 transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg"
              >
                <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                  <FaFolderOpen className="h-4 w-4" />
                </span>
                View full projects
              </button>
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-400">{postsCount} posts</p>
            </div>
            <div className="text-center">
              <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                <FaHeart className="h-4 w-4" />
              </span>
              <p className="text-3xl font-semibold text-slate-900">{totalLikes}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total Likes</p>
            </div>
            <div className="text-center">
              <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                <FaStar className="h-4 w-4" />
              </span>
              <p className="text-3xl font-semibold text-slate-900">{averageLikes}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Avg. Likes</p>
            </div>
          </div>
        </div>
      </section>

  <section id="profile-posts" className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Posts by {data.user.username}</h2>

        {postsCount ? (
          <div className="grid gap-6 md:grid-cols-2">
            {authoredPosts.map((post) => (
              <article
                key={post._id}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  <span>{post.likes?.length ?? 0} likes</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    <Link to={`/posts/${post._id}`} className="transition hover:text-rose-500">
                      {post.title}
                    </Link>
                  </h3>
                  {post.coverImage ? (
                    <Link to={`/posts/${post._id}`} className="block overflow-hidden rounded-2xl">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </Link>
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-xs uppercase tracking-[0.3em] text-slate-400">
                      No cover image
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {post.tags?.length ? (
                      post.tags.map((tag) => (
                        <span key={tag} className="tag-pill">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="uppercase tracking-[0.3em] text-slate-400">No tags</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/posts/${post._id}`}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                >
                  Read post
                  <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-rose-100 bg-white/70 p-10 text-center text-sm text-slate-500">
            No posts yet. When {data.user.username} publishes, their work will show up here.
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
