import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

let cloudinaryEnabled = false;

if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
  cloudinaryEnabled = true;
}

export const uploadToCloudinary = async (fileBuffer, fileName, mimeType = 'image/jpeg') => {
  if (!cloudinaryEnabled) {
    return null;
  }

  const uploadOptions = {
    folder: 'personal-blog-platform',
    public_id: fileName
  };

  const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${fileBuffer.toString('base64')}`, uploadOptions);
  return {
    url: result.secure_url,
    publicId: result.public_id
  };
};

export const deleteFromCloudinary = async (publicId) => {
  if (!cloudinaryEnabled || !publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId);
};

export const isCloudinaryEnabled = () => cloudinaryEnabled;
