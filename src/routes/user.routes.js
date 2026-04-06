import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

router.get('/me', authMiddleware, asyncHandler(getProfile));
router.patch('/me', authMiddleware, asyncHandler(updateProfile));
router.patch('/me/password', authMiddleware, asyncHandler(changePassword));

export default router;

