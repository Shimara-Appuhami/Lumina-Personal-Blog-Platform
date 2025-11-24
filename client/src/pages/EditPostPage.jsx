import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { fetchPostById, updatePost } from '../services/postService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    setError
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      tags: '',
      coverImage: null
    }
  });

  useEffect(() => {
    register('content', {
      validate: (value) => {
        const textContent = value.replace(/<[^>]*>?/gm, '').trim();
        if (!textContent) {
          return 'Content is required';
        }
        if (textContent.length < 20) {
          return 'Content must be at least 20 characters';
        }
        return true;
      }
    });
  }, [register]);

  const { data, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id),
    enabled: Boolean(id)
  });

  useEffect(() => {
    if (!data?.post) return;
    const { post } = data;
    const tagString = Array.isArray(post.tags) ? post.tags.join(', ') : '';
    reset({
      title: post.title ?? '',
      content: post.content ?? '',
      tags: tagString,
      coverImage: null
    });
    setValue('content', post.content ?? '', { shouldValidate: false });
    setValue('tags', tagString, { shouldValidate: false });
    setValue('title', post.title ?? '', { shouldValidate: false });
  }, [data?.post, reset, setValue]);

  const mutation = useMutation({
    mutationFn: (payload) => updatePost(id, payload),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      navigate(`/posts/${post._id}`);
    },
    onError: (err) => {
      setError('root', { message: err.response?.data?.message ?? err.message });
    }
  });

  const onSubmit = (values) => {
    const payload = {
      title: values.title,
      content: values.content,
      tags: values.tags ? values.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      coverImage: values.coverImage?.[0]
    };
    mutation.mutate(payload);
  };

  const content = watch('content');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data?.post) {
    return <p className="text-center text-red-500">Post not found.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in">
      <div className="space-y-3 text-center md:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
          Update story
        </span>
        <h1 className="page-heading">Refresh your post</h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
          Iterate on your ideas, refine the narrative, and keep readers updated with the latest insights and visuals.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.4fr]">
        <div className="surface-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="title" className="form-label">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="form-field"
                placeholder="Update your headline"
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 3, message: 'Minimum 3 characters' }
                })}
              />
              {errors.title && <p className="text-xs font-medium text-rose-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-3">
              <label className="form-label">Content</label>
              <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={(value) => setValue('content', value, { shouldValidate: true })}
                  className="prose prose-slate max-w-none"
                />
              </div>
              {errors.content && <p className="text-xs font-medium text-rose-500">{errors.content.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="tags" className="form-label">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                className="form-field"
                placeholder="editing, leadership, release notes"
                {...register('tags')}
              />
            </div>

            {data.post.coverImage && (
              <div className="space-y-3">
                <span className="form-label">Current cover</span>
                <img src={data.post.coverImage} alt={data.post.title} className="h-48 w-full rounded-2xl object-cover shadow" />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="coverImage" className="form-label">
                Replace cover image
              </label>
              <label
                htmlFor="coverImage"
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-100 bg-white/70 p-6 text-sm text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
              >
                <span>Upload a refreshed visual</span>
                <span className="text-xs text-slate-400">High-resolution imagery keeps your story compelling.</span>
              </label>
              <input id="coverImage" type="file" accept="image/*" className="hidden" {...register('coverImage')} />
            </div>

            {errors.root && <p className="text-xs font-medium text-rose-500">{errors.root.message}</p>}

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
                {mutation.isLoading ? 'Saving changes…' : 'Save changes'}
              </button>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Version history updates automatically</span>
            </div>
          </form>
        </div>

  <aside className="hidden flex-col gap-6 rounded-[28px] border border-rose-100 bg-white/80 p-6 shadow-lg backdrop-blur-xl lg:flex">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Revision checklist</h3>
          <ul className="space-y-4 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-900">Clarify new context.</span> Highlight what changed since the last publish.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Update data points.</span> Ensure stats and quotes are timely and linked.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Preview formatting.</span> Use the live preview to catch spacing issues.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Engage your readers.</span> Close with a CTA inviting discussion or feedback.
            </li>
          </ul>
          <div className="rounded-2xl border border-rose-100 bg-white/70 p-4 text-xs text-slate-500">
            Tip: Major edits trigger notifications for readers who liked your post.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EditPostPage;
