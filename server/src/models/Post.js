import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
      default: ''
    },
    coverImageId: {
      type: String,
      default: ''
    },
    coverImageLocalPath: {
      type: String,
      default: '',
      select: false
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: {
      type: [String],
      default: []
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    }
  },
  {
    timestamps: true
  }
);

postSchema.index({ title: 'text' });

const Post = mongoose.model('Post', postSchema);
export default Post;
