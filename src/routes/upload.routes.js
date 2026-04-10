import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import { uploadCategoryImage, uploadProductImages } from '../middleware/upload.middleware.js';
import { storeCategoryImage, storeProductImages } from '../controllers/upload.controller.js';

const router = express.Router();

router.post(
  '/category-image',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  uploadCategoryImage,
  asyncHandler(storeCategoryImage)
);

router.post(
  '/product-images',
  authMiddleware,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  uploadProductImages,
  asyncHandler(storeProductImages)
);

export default router;
