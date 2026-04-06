import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from '../enums/order-status.enum.js';
import { USER_ROLES } from '../enums/user-role.enum.js';

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
};

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
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addr = buildShippingAddress(user, req.body);
    if (addr.error) {
      return res.status(400).json({ success: false, message: addr.error });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const lineItems = [];
    let subtotal = 0;

    for (const line of cart.items) {
      const productDoc = line.product;
      if (!productDoc || !productDoc._id) {
        return res.status(400).json({ success: false, message: 'Invalid product in cart' });
      }
      if (productDoc.stock < line.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${productDoc.name}"`
        });
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
        for (const r of stockDecrements) {
          await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } });
        }
        return res.status(400).json({ success: false, message: 'Could not reserve stock; try again' });
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

      await order.populate('items.product');

      return res.status(201).json({ success: true, data: order });
    } catch (err) {
      for (const r of stockDecrements) {
        await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } });
      }
      throw err;
    }
  } catch (err) {
    return next(err);
  }
};

export const listMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product');

    return res.json({ success: true, data: orders });
  } catch (err) {
    return next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const order = await Order.findById(id).populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    if (!status || !ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
};
