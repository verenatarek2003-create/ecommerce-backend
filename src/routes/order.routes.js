import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import {
  createOrder,
  listMyOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/order.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, listMyOrders);
router.get('/:id', authMiddleware, getOrderById);
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  updateOrderStatus
);

export default router;
