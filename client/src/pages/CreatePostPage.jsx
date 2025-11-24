import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createPost } from '../services/postService.js';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in">
      <div className="space-y-4 text-center md:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
          New draft
        </span>
        <h1 className="page-heading">Craft a story that inspires.</h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
          Use the rich text editor to structure your ideas, add cover imagery, and tag topics so the right readers can discover your work.
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
                placeholder="Give your story a standout headline"
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
                placeholder="product design, leadership, growth"
                {...register('tags')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="coverImage" className="form-label">
                Cover image
              </label>
              <label
                htmlFor="coverImage"
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-100 bg-white/70 p-6 text-sm text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
              >
                <span>Drop an image or click to upload</span>
                <span className="text-xs text-slate-400">Recommended 1200x628px • JPG or PNG</span>
              </label>
              <input id="coverImage" type="file" accept="image/*" className="hidden" {...register('coverImage')} />
            </div>

            {errors.root && <p className="text-xs font-medium text-rose-500">{errors.root.message}</p>}

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
                {mutation.isLoading ? 'Publishing…' : 'Publish story'}
              </button>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Autosave disabled • remember to publish</span>
            </div>
          </form>
        </div>

  <aside className="hidden flex-col gap-6 rounded-[28px] border border-rose-100 bg-white/80 p-6 shadow-lg backdrop-blur-xl lg:flex">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Publishing tips</h3>
          <ul className="space-y-4 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-900">Lead with clarity.</span> Summarise your key insight in the opening paragraph.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Keep formatting balanced.</span> Break up long paragraphs with subheadings, lists, or visuals.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Tag responsibly.</span> Use 3-5 specific tags so the right audience can find you.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Add a cover image.</span> Posts with imagery get up to 40% more reads.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default CreatePostPage;
