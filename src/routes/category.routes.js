import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { uploadCategoryImage, whenMultipart } from '../middleware/upload.middleware.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', asyncHandler(listCategories));
router.get('/:id', asyncHandler(getCategoryById));
router.post(
  '/',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  whenMultipart(uploadCategoryImage),
  asyncHandler(createCategory)
);
router.patch(
  '/:id',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  whenMultipart(uploadCategoryImage),
  asyncHandler(updateCategory)
);
router.delete(
  '/:id',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  asyncHandler(deleteCategory)
);

export default router;
