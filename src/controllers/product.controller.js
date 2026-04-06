import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { parsePagination } from '../utils/validators.js';

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, images, stock } = req.body;

    if (!name || price == null || stock == null) {
      return res.status(400).json({ success: false, message: 'Name, price, and stock are required' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      images,
      stock,
      seller: req.user?.id
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }

    const [items, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const updates = {};
    const allowed = ['name', 'description', 'price', 'category', 'images', 'stock'];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    return next(err);
  }
};

