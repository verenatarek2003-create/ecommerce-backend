import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import {
  createOrder,
  listMyOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/order.controller.js';

const router = express.Router();

router.post('/', authMiddleware, asyncHandler(createOrder));
router.get('/', authMiddleware, asyncHandler(listMyOrders));
router.get('/:id', authMiddleware, asyncHandler(getOrderById));
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  asyncHandler(updateOrderStatus)
);

export default router;
