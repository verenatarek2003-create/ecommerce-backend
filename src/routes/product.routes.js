import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';

const router = express.Router();

router.post('/', authMiddleware, requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN), createProduct);
router.get('/', listProducts);
router.get('/:id', getProductById);
router.patch('/:id', authMiddleware, requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN), updateProduct);
router.delete('/:id', authMiddleware, requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN), deleteProduct);

export default router;

