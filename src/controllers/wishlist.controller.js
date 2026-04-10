import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';

const wishlistPopulate = {
  path: 'wishlist',
  populate: { path: 'category' }
};

const fetchWishlistPayload = async (userId) => {
  const user = await User.findById(userId).select('wishlist').populate(wishlistPopulate);
  if (!user) {
    return null;
  }
  return { items: user.wishlist };
};

export const getWishlist = async (req, res, next) => {
  const data = await fetchWishlistPayload(req.user.id);
  if (!data) {
    return next(new AppError('User not found', 404));
  }
  return res.success(data);
};

export const addToWishlist = async (req, res, next) => {
  const { productId } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    return next(new AppError('Valid productId is required', 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  await User.updateOne({ _id: req.user.id }, { $addToSet: { wishlist: productId } });

  const data = await fetchWishlistPayload(req.user.id);
  return res.success(data, 'Wishlist updated', 201);
};

export const removeFromWishlist = async (req, res, next) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return next(new AppError('Invalid product id', 400));
  }

  const oid = new mongoose.Types.ObjectId(productId);
  const result = await User.updateOne(
    { _id: req.user.id, wishlist: oid },
    { $pull: { wishlist: oid } }
  );

  if (result.matchedCount === 0) {
    return next(new AppError('Product not in wishlist', 404));
  }

  const data = await fetchWishlistPayload(req.user.id);
  return res.success(data, 'Removed from wishlist');
};
