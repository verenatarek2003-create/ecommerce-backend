import mongoose from 'mongoose';
import { itemsProductWithCategory } from '../config/populate.js';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';

/** Works when `items.product` is an ObjectId or a populated Product doc. */
const cartLineProductId = (itemProduct) => {
  if (itemProduct == null) return '';
  if (itemProduct instanceof mongoose.Types.ObjectId) return itemProduct.toString();
  if (typeof itemProduct === 'object' && itemProduct._id != null) {
    return itemProduct._id.toString();
  }
  return String(itemProduct);
};

const ensureCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate(itemsProductWithCategory);
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate(itemsProductWithCategory);
  }
  return cart;
};

const buildCartResponse = (cart) => {
  const items = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    priceSnapshot: item.priceSnapshot,
    lineTotal: item.quantity * item.priceSnapshot
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return { items, subtotal };
};

export const getCart = async (req, res) => {
  const cart = await ensureCart(req.user.id);
  return res.success(buildCartResponse(cart));
};

export const addItem = async (req, res, next) => {
  const { productId } = req.body;
  const quantity = Number(req.body.quantity);

  if (!productId || req.body.quantity == null || req.body.quantity === '') {
    return next(new AppError('productId and quantity are required', 400));
  }

  if (!mongoose.isValidObjectId(productId)) {
    return next(new AppError('Invalid product id', 400));
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new AppError('Quantity must be a positive integer', 400));
  }

  const product = await Product.findById(productId);
  if (!product || product.stock <= 0) {
    return next(new AppError('Product not available', 400));
  }

  const cart = await ensureCart(req.user.id);
  const pid = product._id.toString();
  const existing = cart.items.find((item) => cartLineProductId(item.product) === pid);
  const newQuantity = existing ? existing.quantity + quantity : quantity;

  if (newQuantity > product.stock) {
    return next(new AppError('Quantity exceeds stock', 400));
  }

  if (existing) {
    existing.quantity = newQuantity;
    existing.priceSnapshot = product.price;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      priceSnapshot: product.price
    });
  }

  await cart.save();
  await cart.populate(itemsProductWithCategory);
  return res.success(buildCartResponse(cart), 'Item added to cart', 201);
};

export const updateItemQuantity = async (req, res, next) => {
  const { productId } = req.params;
  const quantity = Number(req.body.quantity);

  if (!mongoose.isValidObjectId(productId)) {
    return next(new AppError('Invalid product id', 400));
  }

  if (req.body.quantity == null || req.body.quantity === '') {
    return next(new AppError('Quantity is required', 400));
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new AppError('Quantity must be a positive integer', 400));
  }

  const product = await Product.findById(productId);
  if (!product || product.stock <= 0) {
    return next(new AppError('Product not available', 400));
  }

  if (quantity > product.stock) {
    return next(new AppError('Quantity exceeds stock', 400));
  }

  const cart = await ensureCart(req.user.id);
  const pid = product._id.toString();
  const item = cart.items.find((i) => cartLineProductId(i.product) === pid);

  if (!item) {
    return next(new AppError('Item not in cart', 404));
  }

  item.quantity = quantity;
  item.priceSnapshot = product.price;
  await cart.save();
  await cart.populate(itemsProductWithCategory);
  return res.success(buildCartResponse(cart), 'Cart item updated');
};

export const removeItem = async (req, res, next) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return next(new AppError('Invalid product id', 400));
  }

  const cart = await ensureCart(req.user.id);
  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => cartLineProductId(item.product) !== productId);

  if (cart.items.length === initialLength) {
    return next(new AppError('Item not in cart', 404));
  }

  await cart.save();
  await cart.populate(itemsProductWithCategory);
  return res.success(buildCartResponse(cart), 'Item removed from cart');
};

