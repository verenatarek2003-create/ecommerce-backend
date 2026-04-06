import mongoose from 'mongoose';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

const ensureCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product');
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

export const getCart = async (req, res, next) => {
  try {
    const cart = await ensureCart(req.user.id);
    return res.json({ success: true, data: buildCartResponse(cart) });
  } catch (err) {
    return next(err);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'productId and quantity are required' });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findById(productId);
    if (!product || product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Product not available' });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await ensureCart(req.user.id);

    const existing = cart.items.find(
      (item) => item.product.toString() === product._id.toString()
    );

    const newQuantity = existing ? existing.quantity + quantity : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds stock' });
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
    await cart.populate('items.product');

    return res.status(201).json({ success: true, data: buildCartResponse(cart) });
  } catch (err) {
    return next(err);
  }
};

export const updateItemQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    if (quantity == null) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product || product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Product not available' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds stock' });
    }

    const cart = await ensureCart(req.user.id);

    const item = cart.items.find(
      (i) => i.product.toString() === product._id.toString()
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    item.quantity = quantity;
    item.priceSnapshot = product.price;

    await cart.save();
    await cart.populate('items.product');

    return res.json({ success: true, data: buildCartResponse(cart) });
  } catch (err) {
    return next(err);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const cart = await ensureCart(req.user.id);

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    await cart.save();
    await cart.populate('items.product');

    return res.json({ success: true, data: buildCartResponse(cart) });
  } catch (err) {
    return next(err);
  }
};

