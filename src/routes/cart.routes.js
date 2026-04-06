import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem
} from '../controllers/cart.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getCart));
router.post('/items', asyncHandler(addItem));
router.patch('/items/:productId', asyncHandler(updateItemQuantity));
router.delete('/items/:productId', asyncHandler(removeItem));

export default router;

