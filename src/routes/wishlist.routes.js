import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlist.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getWishlist));
router.post('/items', asyncHandler(addToWishlist));
router.delete('/items/:productId', asyncHandler(removeFromWishlist));

export default router;
