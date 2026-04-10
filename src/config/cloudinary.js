import { v2 as cloudinary } from 'cloudinary';

const readCloudinaryEnv = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return { cloud_name, api_key, api_secret };
};


export const ensureCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = readCloudinaryEnv();
  if (!cloud_name || !api_key || !api_secret) {
    return false;
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  return true;
};

export default cloudinary;

export const getCloudinaryUploadRoot = () => {
  const raw = process.env.UPLOADS_FOLDER;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed || 'ecommerce-verina';
};
