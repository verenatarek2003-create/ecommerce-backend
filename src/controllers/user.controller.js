import bcrypt from 'bcryptjs';
import { USER_ROLES, USER_ROLE_VALUES } from '../enums/user-role.enum.js';
import { signToken } from '../config/jwt.js';
import User from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';

export const register = async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email, and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(new AppError('Invalid email format', 400));
  }

  if (!isValidPassword(password)) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('Email already in use', 409));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: role && USER_ROLE_VALUES.includes(role) ? role : USER_ROLES.CUSTOMER
  });

  const token = signToken({ id: user._id, role: user.role });
  return res.success({ token, user }, 'Registered successfully', 201);
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  const token = signToken({ id: user._id, role: user.role });
  return res.success({ token, user }, 'Login successful');
};

export const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  return res.success(user);
};

export const updateProfile = async (req, res, next) => {
  const { name, phone, addresses } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (addresses !== undefined) updates.addresses = addresses;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.success(user, 'Profile updated successfully');
};

export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current and new password are required', 400));
  }

  if (!isValidPassword(newPassword)) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.success(null, 'Password updated successfully');
};

