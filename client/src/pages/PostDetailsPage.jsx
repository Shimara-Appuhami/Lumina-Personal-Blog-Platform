import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaHeart, FaRegHeart, FaEdit, FaTrashAlt } from 'react-icons/fa';
import {
  addCommentToPost,
  deletePost,
  fetchPostById,
  markCommentAsRead,
  toggleLikePost
} from '../services/postService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';

const PostDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const replyTargetId = searchParams.get('replyTo');
  const commentTextareaRef = useRef(null);
  const markedCommentsRef = useRef(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [hasAutoSelectedReply, setHasAutoSelectedReply] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id),
    enabled: Boolean(id)
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLikePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/');
    }
  });

  const commentMutation = useMutation({
    mutationFn: (payload) => addCommentToPost(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    }
  });

  const { mutate: markCommentRead } = useMutation({
    mutationFn: (commentId) => markCommentAsRead({ postId: id, commentId }),
    onSuccess: () => {
      if (user?._id) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user._id] });
      }
    }
  });

  const handleAddComment = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content')?.toString().trim() ?? '';
    if (!content) return;
    commentMutation.mutate(
      {
        content,
        parentCommentId: replyingTo?._id ?? null
      },
      {
        onSuccess: () => {
          event.currentTarget.reset();
          setReplyingTo(null);
        }
      }
    );
  };

  const post = data?.post;
  const comments = data?.comments ?? [];
  const totalComments = useMemo(() => {
    return comments.reduce((accumulator, comment) => {
      const replyCount = (comment.replies ?? []).reduce(
        (replyAccumulator, reply) => replyAccumulator + (reply.isOwnerReply ? 0 : 1),
        0
      );

      const topLevelContribution = comment.isOwnerReply ? 0 : 1;
      return accumulator + topLevelContribution + replyCount;
    }, 0);
  }, [comments]);

  const isAuthor = useMemo(() => post?.author?._id === user?._id, [post?.author?._id, user?._id]);
  const isLiked = post?.likes?.some((likeId) => likeId === user?._id) ?? false;
  const likeCount = post?.likes?.length ?? 0;

  useEffect(() => {
    if (!isAuthor || !isAuthenticated || !comments.length) {
      return;
    }

    const unreadTopLevel = comments
      .filter((comment) => {
        if (!comment || comment.user?._id === user?._id) {
          return false;
        }

        const readBy = Array.isArray(comment.readBy) ? comment.readBy : [];
        return !readBy.includes(user?._id);
      })
      .map((comment) => comment._id)
      .filter((commentId) => commentId && !markedCommentsRef.current.has(commentId));

    if (!unreadTopLevel.length) {
      return;
    }

    unreadTopLevel.forEach((commentId) => {
      markedCommentsRef.current.add(commentId);
      markCommentRead(commentId, {
        onError: () => {
          markedCommentsRef.current.delete(commentId);
        }
      });
    });
  }, [comments, isAuthor, isAuthenticated, markCommentRead, user?._id]);

  useEffect(() => {
    setHasAutoSelectedReply(false);
  }, [replyTargetId]);

  useEffect(() => {
    if (!replyTargetId || !isAuthor || !isAuthenticated || replyingTo || hasAutoSelectedReply) {
      return;
    }

    const directMatch = comments.find((comment) => comment._id === replyTargetId);
    if (directMatch) {
      setReplyingTo(directMatch);
      setHasAutoSelectedReply(true);
      return;
    }

    const parentMatch = comments.find((comment) =>
      comment.replies?.some((reply) => reply._id === replyTargetId)
    );

    if (parentMatch) {
      setReplyingTo(parentMatch);
      setHasAutoSelectedReply(true);
    }
  }, [replyTargetId, comments, isAuthor, isAuthenticated, replyingTo, hasAutoSelectedReply]);

  useEffect(() => {
    if (!replyingTo || !isAuthor || !isAuthenticated || !commentTextareaRef.current) {
      return;
    }

    try {
      commentTextareaRef.current.focus({ preventScroll: true });
    } catch (error) {
      commentTextareaRef.current.focus();
    }
    commentTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [replyingTo, isAuthor, isAuthenticated]);

  const handleReplyClick = (comment) => {
    setReplyingTo(comment);
    if (!commentTextareaRef.current) return;

    try {
      commentTextareaRef.current.focus({ preventScroll: true });
    } catch (error) {
      commentTextareaRef.current.focus();
    }
    commentTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <p className="text-center text-red-500">{error.message}</p>;
  }

  if (!post) {
    return <p className="text-center text-red-500">Post not found.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-fade-in">
      <article className="surface-card overflow-hidden">
        <div className="relative border-b border-rose-100 bg-white/85 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-rose-50 px-4 py-2 font-semibold text-rose-500">
                  {post.author?.username}
                </span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                <span>•</span>
                <span>{totalComments} comments</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition ${
                  isLiked
                    ? 'bg-gradient-to-r from-rose-400 to-orange-300 text-white shadow-sm'
                    : 'border border-rose-100 bg-white text-rose-500 hover:border-rose-200 hover:bg-rose-50'
                }`}
                onClick={() => likeMutation.mutate()}
                disabled={!isAuthenticated}
              >
                {isLiked ? <FaHeart /> : <FaRegHeart />}
                <span>{likeCount}</span>
              </button>
              {isAuthor && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link to={`/posts/${post._id}/edit`} className="btn-secondary inline-flex items-center gap-2">
                    <FaEdit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-2 text-red-500"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isLoading}
                  >
                    <FaTrashAlt className="h-4 w-4" />
                    <span>{deleteMutation.isLoading ? 'Deleting…' : 'Delete'}</span>
                  </button>
                  {deleteMutation.isError && (
                    <p className="w-full text-xs font-medium text-rose-500">
                      {deleteMutation.error.response?.data?.message ?? deleteMutation.error.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {post.coverImage && (
          <div className="relative">
            <img src={post.coverImage} alt={post.title} className="h-[420px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-rose-200/50 via-rose-100/20 to-transparent" />
          </div>
        )}

        <div className="prose prose-slate max-w-none space-y-6 p-8 text-slate-700">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
          <div className="flex flex-wrap gap-2 text-sm">
            {post.tags?.length ? (
              post.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">No tags</span>
            )}
          </div>
        </div>
      </article>

      <section className="glass-panel p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Conversation</h2>
            <p className="text-sm text-slate-500">Share insights, ask questions, and build relationships with fellow readers.</p>
          </div>
          <span className="rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            {totalComments} comments
          </span>
        </div>

        {isAuthenticated ? (
          <form className="mt-6 space-y-3" onSubmit={handleAddComment}>
            {replyingTo && (
              <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
                <span>
                  Replying to{' '}
                  <span className="font-semibold text-rose-500">
                    @{replyingTo.user?.username ?? 'reader'}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400 transition hover:text-rose-500"
                  onClick={handleCancelReply}
                >
                  Cancel
                </button>
              </div>
            )}
            <textarea
              name="content"
              rows="3"
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.user?.username ?? 'this reader'}…`
                  : 'Add a thoughtful response…'
              }
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none"
              required
              minLength={1}
              maxLength={500}
              ref={commentTextareaRef}
            />
            {commentMutation.isError && (
              <p className="text-xs font-medium text-rose-500">
                {commentMutation.error.response?.data?.message ?? commentMutation.error.message}
              </p>
            )}
            <button type="submit" className="btn-primary" disabled={commentMutation.isLoading}>
              {commentMutation.isLoading ? 'Posting…' : 'Post comment'}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-slate-500">
            <Link to="/login" className="font-semibold text-rose-500 underline">
              Sign in
            </Link>{' '}
            to join the conversation.
          </p>
        )}

        <div className="mt-8 space-y-6">
          {totalComments ? (
            comments.map((comment) => {
              const replies = comment.replies ?? [];
              const isDirectTarget = replyTargetId === comment._id;
              const isReplyTarget = replies.some((reply) => reply._id === replyTargetId);
              const highlightClass = isDirectTarget
                ? 'border-rose-300 shadow-lg ring-2 ring-rose-200'
                : isReplyTarget
                ? 'border-rose-200'
                : 'border-rose-100';
              const ownerResponded = replies.some((reply) => reply.isOwnerReply);

              return (
                <div key={comment._id} className="space-y-3">
                  <div
                    className={`flex gap-4 rounded-2xl border bg-white p-4 text-slate-700 shadow-sm transition ${highlightClass}`}
                  >
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user?.username ?? 'Comment author'}
                        className="h-12 w-12 flex-none rounded-full border border-rose-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-sm font-semibold text-rose-500">
                        {comment.user?.username?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-rose-500">{comment.user?.username ?? 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{comment.content}</p>
                      {isAuthor && !ownerResponded && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                          onClick={() => handleReplyClick(comment)}
                        >
                          Reply to comment
                        </button>
                      )}
                    </div>
                  </div>

                  {replies.length ? (
                    <div className="ml-14 space-y-3">
                      {replies.map((reply) => {
                        const replyHighlight = replyTargetId === reply._id;
                        return (
                          <div
                            key={reply._id}
                            className={`flex gap-3 rounded-2xl border bg-white/90 p-3 text-sm text-slate-700 shadow-sm transition ${
                              replyHighlight ? 'border-rose-300 shadow-lg ring-2 ring-rose-200' : 'border-rose-100'
                            } ${reply.isOwnerReply ? 'border-rose-200 bg-rose-50/80' : ''}`}
                          >
                            {reply.user?.avatar ? (
                              <img
                                src={reply.user.avatar}
                                alt={reply.user?.username ?? 'Comment author'}
                                className="h-10 w-10 flex-none rounded-full border border-rose-100 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-xs font-semibold text-rose-500">
                                {reply.user?.username?.[0]?.toUpperCase() ?? 'U'}
                              </div>
                            )}
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                <span
                                  className={`font-semibold ${
                                    reply.isOwnerReply ? 'text-rose-500' : 'text-slate-600'
                                  }`}
                                >
                                  {reply.user?.username ?? 'Anonymous'}
                                </span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                                {reply.isOwnerReply && (
                                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-500">
                                    Author
                                  </span>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed text-slate-700">{reply.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-rose-100 bg-white p-5 text-sm text-slate-500">
              No comments yet. Be the first to add your perspective.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default PostDetailsPage;
