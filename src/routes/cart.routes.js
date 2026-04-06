import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem
} from '../controllers/cart.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:productId', updateItemQuantity);
router.delete('/items/:productId', removeItem);

export default router;

