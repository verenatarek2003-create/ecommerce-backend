import crypto from 'crypto';
import mongoose from 'mongoose';
import { itemsProductWithCategory } from '../config/populate.js';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from '../enums/order-status.enum.js';
import { USER_ROLES } from '../enums/user-role.enum.js';
import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';

const generateOrderNumber = () => `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

const buildShippingAddress = (user, body) => {
  const { addressIndex, shippingAddress } = body;

  if (addressIndex != null) {
    const idx = Number(addressIndex);
    if (!Number.isInteger(idx) || idx < 0 || !user.addresses || idx >= user.addresses.length) {
      return { error: 'Invalid addressIndex' };
    }
    return { value: user.addresses[idx].toObject ? user.addresses[idx].toObject() : { ...user.addresses[idx] } };
  }

  if (!shippingAddress || !shippingAddress.line1) {
    return { error: 'shippingAddress with line1 is required, or provide addressIndex' };
  }

  return { value: shippingAddress };
};

export const createOrder = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const addr = buildShippingAddress(user, req.body);
  if (addr.error) {
    return next(new AppError(addr.error, 400));
  }

  const cart = await Cart.findOne({ user: req.user.id }).populate(itemsProductWithCategory);
  if (!cart || !cart.items.length) {
    return next(new AppError('Cart is empty', 400));
  }

  const lineItems = [];
  let subtotal = 0;

  for (const line of cart.items) {
    const productDoc = line.product;
    if (!productDoc || !productDoc._id) {
      return next(new AppError('Invalid product in cart', 400));
    }

    if (productDoc.stock < line.quantity) {
      return next(new AppError(`Insufficient stock for "${productDoc.name}"`, 400));
    }

    const unitPrice = line.priceSnapshot;
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;

    lineItems.push({
      product: productDoc._id,
      name: productDoc.name,
      quantity: line.quantity,
      unitPrice,
      lineTotal
    });
  }

  const stockDecrements = [];

  for (const line of cart.items) {
    const productId = line.product._id || line.product;
    const qty = line.quantity;

    const updated = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!updated) {
      for (const rollback of stockDecrements) {
        await Product.updateOne({ _id: rollback.id }, { $inc: { stock: rollback.qty } });
      }
      return next(new AppError('Could not reserve stock; try again', 400));
    }

    stockDecrements.push({ id: productId, qty });
  }

  try {
    const order = await Order.create({
      user: req.user.id,
      orderNumber: generateOrderNumber(),
      items: lineItems,
      subtotal,
      total: subtotal,
      shippingAddress: addr.value,
      status: ORDER_STATUS.PENDING,
      paymentMethod: req.body.paymentMethod
    });

    cart.items = [];
    await cart.save();
    await order.populate(itemsProductWithCategory);

    return res.success(order, 'Order created successfully', 201);
  } catch (err) {
    for (const rollback of stockDecrements) {
      await Product.updateOne({ _id: rollback.id }, { $inc: { stock: rollback.qty } });
    }
    return next(err);
  }
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate(itemsProductWithCategory);

  return res.success(orders);
};

export const getOrderById = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid order id', 400));
  }

  const order = await Order.findById(id).populate(itemsProductWithCategory);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const isOwner = order.user.toString() === req.user.id;
  const isAdmin = req.user.role === USER_ROLES.ADMIN;
  if (!isOwner && !isAdmin) {
    return next(new AppError('Forbidden', 403));
  }

  return res.success(order);
};

export const updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid order id', 400));
  }

  if (!status || !ORDER_STATUS_VALUES.includes(status)) {
    return next(new AppError('Valid status is required', 400));
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  ).populate(itemsProductWithCategory);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  return res.success(order, 'Order status updated');
};

