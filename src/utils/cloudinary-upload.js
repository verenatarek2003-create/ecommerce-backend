import { Readable } from 'stream';
import cloudinary, {
  ensureCloudinaryConfigured,
  getCloudinaryUploadRoot
} from '../config/cloudinary.js';
import { AppError } from './app-error.js';

export const uploadImageBuffer = (buffer, subfolder) => {
  if (!ensureCloudinaryConfigured()) {
    return Promise.reject(new AppError('Cloudinary is not configured', 500));
  }

  const root = getCloudinaryUploadRoot();
  const folder = `${root}/${subfolder}`.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};
