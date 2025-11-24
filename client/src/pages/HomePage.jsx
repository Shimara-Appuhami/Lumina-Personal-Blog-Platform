import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { FaArrowRight, FaSearch } from 'react-icons/fa';
import PostCard from '../components/PostCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { fetchPosts, toggleLikePost } from '../services/postService.js';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams({ page: '1', limit: '6' });
  const queryClient = useQueryClient();

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 6);
  const search = searchParams.get('search') ?? '';
  const tag = searchParams.get('tag') ?? '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['posts', { page, limit, search, tag }],
    queryFn: () => fetchPosts({ page, limit, search, tag }),
    keepPreviousData: true
  });

  const likeMutation = useMutation({
    mutationFn: toggleLikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const pagination = data?.pagination ?? { page: 1, pages: 1 };

  const uniqueTags = useMemo(() => {
    if (!data?.posts) return [];
    const tagMap = new Map();
    data.posts.forEach((post) => {
      post.tags?.forEach((t) => tagMap.set(t, (tagMap.get(t) ?? 0) + 1));
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tagName]) => tagName);
  }, [data?.posts]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams(searchParams);
    const nextSearch = formData.get('search')?.toString().trim() ?? '';
    if (nextSearch) {
      nextParams.set('search', nextSearch);
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleTagFilter = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set('tag', value);
    } else {
      nextParams.delete('tag');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (nextPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <p className="text-center text-red-500">{error.message}</p>;
  }

  const featuredPost = data?.posts?.[0];
  const remainingPosts = data?.posts?.slice(1) ?? [];

  return (
    <div className="space-y-14 animate-fade-in">
      <section className="rounded-3xl border border-rose-100 bg-white/85 p-8 text-slate-700 shadow-xl backdrop-blur md:p-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-1 text-xs uppercase tracking-[0.4em] text-rose-500">
              Fresh Perspectives Daily
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Stories, ideas, and insights from the creators building tomorrow.
            </h1>
            <p className="max-w-lg text-base text-slate-500 md:text-lg">
              Follow your favourite writers, discover emerging voices, and share your own journey with a vibrant community of storytellers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/posts/create"
                className="rounded-full bg-gradient-to-r from-rose-400 to-orange-300 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                Start writing
              </Link>
            </div>
          </div>
          <form onSubmit={handleSearchSubmit} className="w-full max-w-md rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-xl">
            <label htmlFor="search" className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-400">
              Search the library
            </label>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2">
              <FaSearch className="text-rose-400" />
              <input
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Search posts by title or topic"
                className="w-full bg-transparent text-sm text-slate-600 placeholder:text-rose-200 focus:outline-none"
              />
            </div>
            <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-400 to-orange-300 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow">
              Discover
              <FaArrowRight />
            </button>
          </form>
        </div>
        {uniqueTags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {uniqueTags.slice(0, 8).map((tagOption) => (
              <button
                type="button"
                key={tagOption}
                onClick={() => handleTagFilter(tagOption)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition ${
                  tag === tagOption
                    ? 'bg-gradient-to-r from-rose-400 to-orange-300 text-white shadow-sm'
                    : 'border border-rose-100 bg-rose-50 text-rose-500 hover:border-rose-200 hover:bg-rose-100'
                }`}
              >
                #{tagOption}
              </button>
            ))}
          </div>
        )}
      </section>

      {likeMutation.isError && (
        <p className="rounded-xl border border-red-300/60 bg-red-50/90 p-4 text-sm text-red-600 shadow-sm">
          {likeMutation.error.response?.data?.message ?? likeMutation.error.message}
        </p>
      )}

      {data?.posts?.length ? (
        <div className="space-y-12">
          {featuredPost && (
            <section className="grid gap-8 overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-xl md:grid-cols-5">
              <div className="relative md:col-span-3">
                {featuredPost.coverImage ? (
                  <Link to={`/posts/${featuredPost._id}`} className="block h-full">
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center bg-slate-200">
                    <span className="text-sm text-slate-500">No cover image</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/70 to-transparent p-6 text-slate-800">
                  <p className="text-xs uppercase tracking-[0.4em] text-rose-400">Editor&apos;s choice</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    <Link to={`/posts/${featuredPost._id}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{featuredPost.excerpt}</p>
                </div>
              </div>
              <div className="space-y-6 p-8 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{featuredPost.author?.username}</span>
                  <span>•</span>
                  <span>{featuredPost.commentCount ?? 0} comments</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {featuredPost.tags?.map((featuredTag) => (
                    <span key={featuredTag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      #{featuredTag}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/posts/${featuredPost._id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                >
                  Keep reading
                  <FaArrowRight />
                </Link>
              </div>
            </section>
          )}

          {remainingPosts.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="page-heading">Latest from the community</h2>
                  <p className="sub-heading">Curated perspectives from creators across design, engineering, and product.</p>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                 
                 
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                {remainingPosts.map((post) => (
                  <PostCard key={post._id} post={post} onLike={(id) => likeMutation.mutate(id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-rose-100 bg-white/80 p-10 text-center text-slate-600 shadow-inner">
          No posts found yet. Be the first to publish a story!
        </p>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400 disabled:border-slate-100 disabled:text-slate-300"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400 disabled:border-slate-100 disabled:text-slate-300"
            disabled={pagination.page === pagination.pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
