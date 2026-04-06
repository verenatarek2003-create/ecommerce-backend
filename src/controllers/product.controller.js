import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination } from '../utils/validators.js';

export const createProduct = async (req, res, next) => {
  const { name, description, price, category, images, stock } = req.body;

  if (!name || price == null || stock == null) {
    return next(new AppError('Name, price, and stock are required', 400));
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

  return res.success(product, 'Product created successfully', 201);
};

export const listProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) filter.category = category;

  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }

  const [items, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
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

  const product = await Product.findById(id);
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
  const allowed = ['name', 'description', 'price', 'category', 'images', 'stock'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

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

