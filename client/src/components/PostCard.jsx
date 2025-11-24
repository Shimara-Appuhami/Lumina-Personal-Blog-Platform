import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaHeart, FaRegHeart, FaCommentAlt, FaRegClock } from 'react-icons/fa';
import useAuth from '../hooks/useAuth.js';

const PostCard = ({ post, onLike }) => {
  const { isAuthenticated, user } = useAuth();
  const isLiked = post.likes?.some((id) => id === user?._id) ?? false;
  const likeCount = post.likes?.length ?? 0;

  return (
    <article className="group flex h-full w-full max-w-[1000px] flex-col overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_36px_-20px_rgba(15,23,42,0.2)] md:flex-row">
      <Link
        to={`/posts/${post._id}`}
        className="relative block h-48 w-full overflow-hidden md:h-auto md:w-[360px]"
      >
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 via-amber-100 to-indigo-100 text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-5 px-6 py-6 md:px-7">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {post.author?.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author?.username ?? 'Author avatar'}
              className="h-11 w-11 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
              {post.author?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">{post.author?.username ?? 'Anonymous'}</p>
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <FaRegClock className="text-slate-300" />
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to={`/posts/${post._id}`}
            className="block text-xl font-semibold tracking-tight text-slate-900 transition hover:text-rose-500"
          >
            {post.title}
          </Link>
          <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">{post.excerpt}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          {post.tags?.length ? (
            post.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                #{tag}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Untagged
            </span>
          )}
          {post.tags?.length > 4 && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              +{post.tags.length - 4}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => onLike(post._id)}
            className={`flex items-center gap-2 rounded-[14px] px-4 py-2 font-semibold transition ${
              isLiked
                ? 'bg-rose-500 text-white shadow-[0_12px_24px_-20px_rgba(244,114,182,0.55)]'
                : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300`}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span>{likeCount}</span>
          </button>

          <Link
            to={`/posts/${post._id}`}
            className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-slate-100 px-4 py-2 font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <FaCommentAlt className="text-slate-400" />
            <span>Comment</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
