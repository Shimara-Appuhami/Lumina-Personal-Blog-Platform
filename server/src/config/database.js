import mongoose from 'mongoose';
import env from './env.js';

export const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not defined. Please set it in your environment variables.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
};
