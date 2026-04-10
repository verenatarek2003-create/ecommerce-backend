import { AppError } from '../utils/app-error.js';
import { uploadImageBuffer } from '../utils/cloudinary-upload.js';

export const storeCategoryImage = async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Image file is required (field name: image)', 400));
  }

  const { url, publicId } = await uploadImageBuffer(req.file.buffer, 'categories');
  return res.success({ url, publicId }, 'Image uploaded', 201);
};

export const storeProductImages = async (req, res, next) => {
  if (!req.files?.length) {
    return next(new AppError('At least one image is required (field name: images)', 400));
  }

  const results = [];
  for (const file of req.files) {
    const { url, publicId } = await uploadImageBuffer(file.buffer, 'products');
    results.push({ url, publicId });
  }

  return res.success(
    { urls: results.map((r) => r.url), items: results },
    'Images uploaded',
    201
  );
};
