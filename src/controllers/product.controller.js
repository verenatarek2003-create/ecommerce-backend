import mongoose from 'mongoose';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination } from '../utils/validators.js';

export const createProduct = async (req, res, next) => {
  const { name, description, price, categoryId, images, stock } = req.body;

  if (!name || price == null || stock == null) {
    return next(new AppError('Name, price, and stock are required', 400));
  }

  if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
    return next(new AppError('Valid categoryId is required', 400));
  }

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    return next(new AppError('Category not found', 404));
  }

  const product = await Product.create({
    name,
    description,
    price,
    category: categoryId,
    images,
    stock,
    seller: req.user?.id
  });

  await product.populate('category');
  return res.success(product, 'Product created successfully', 201);
};

export const listProducts = async (req, res, next) => {
  const { search, category, minPrice, maxPrice } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      return next(new AppError('Invalid category filter id', 400));
    }
    filter.category = category;
  }

  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Product.countDocuments(filter)
  ]);

  return res.success({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
};

export const getProductById = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid product id', 400));
  }

  const product = await Product.findById(id).populate('category');
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  return res.success(product);
};

export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid product id', 400));
  }

  const updates = {};
  const allowed = ['name', 'description', 'price', 'images', 'stock'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.body.categoryId !== undefined) {
    if (!mongoose.isValidObjectId(req.body.categoryId)) {
      return next(new AppError('Valid categoryId is required', 400));
    }
    const categoryExists = await Category.findById(req.body.categoryId);
    if (!categoryExists) {
      return next(new AppError('Category not found', 404));
    }
    updates.category = req.body.categoryId;
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('category');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  return res.success(product, 'Product updated successfully');
};

export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid product id', 400));
  }

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  return res.success(null, 'Product deleted');
};

