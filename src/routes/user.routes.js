import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, getProfile);
router.patch('/me', authMiddleware, updateProfile);
router.patch('/me/password', authMiddleware, changePassword);

export default router;

