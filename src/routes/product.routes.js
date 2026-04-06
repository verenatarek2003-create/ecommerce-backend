import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';

const router = express.Router();

router.post('/', authMiddleware, requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN), asyncHandler(createProduct));
router.get('/', asyncHandler(listProducts));
router.get('/:id', asyncHandler(getProductById));
router.patch('/:id', authMiddleware, requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN), asyncHandler(updateProduct));
router.delete('/:id', authMiddleware, requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN), asyncHandler(deleteProduct));

export default router;

