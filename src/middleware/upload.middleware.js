import multer from 'multer';
import { AppError } from '../utils/app-error.js';

const maxFileSize = 5 * 1024 * 1024;
const imageMime = /^image\/(jpeg|jpg|png|gif|webp)$/i;

const imageFileFilter = (req, file, cb) => {
  if (imageMime.test(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new AppError('Only JPEG, PNG, GIF, or WebP images are allowed', 400));
};

const memory = multer.memoryStorage();

export const uploadCategoryImage = multer({
  storage: memory,
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: imageFileFilter
}).single('image');

export const uploadProductImages = multer({
  storage: memory,
  limits: { fileSize: maxFileSize, files: 10 },
  fileFilter: imageFileFilter
}).array('images', 10);

export const whenMultipart = (multerMiddleware) => {
  return (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      multerMiddleware(req, res, next);
      return;
    }
    next();
  };
};
