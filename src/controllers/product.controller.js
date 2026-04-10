import mongoose from 'mongoose';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';
import { uploadImageBuffer } from '../utils/cloudinary-upload.js';
import { normalizeNonNegativeIntStock, parsePagination } from '../utils/validators.js';

const normalizeImagesFromBody = (body) => {
  if (body.images === undefined || body.images === null) {
    return [];
  }
  if (Array.isArray(body.images)) {
    return body.images.filter(Boolean);
  }
  if (typeof body.images === 'string') {
    try {
      const parsed = JSON.parse(body.images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : body.images ? [body.images] : [];
    } catch {
      return body.images ? [body.images] : [];
    }
  }
  return [];
};

export const createProduct = async (req, res, next) => {
  const { name, description, price, categoryId, stock } = req.body;

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

  const priceNum = Number(price);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    return next(new AppError('Price must be a valid non-negative number', 400));
  }

  const stockParsed = normalizeNonNegativeIntStock(stock, 'Stock');
  if (stockParsed.error) {
    return next(new AppError(stockParsed.error, 400));
  }

  const images = normalizeImagesFromBody(req.body);
  if (req.files?.length) {
    for (const file of req.files) {
      const { url } = await uploadImageBuffer(file.buffer, 'products');
      images.push(url);
    }
  }

  const product = await Product.create({
    name,
    description,
    price: priceNum,
    category: categoryId,
    images,
    stock: stockParsed.value,
    seller: req.user?.id
  });

  await product.populate('category');
  return res.success(product, 'Product created successfully', 201);
};

export const listProducts = async (req, res, next) => {
  const { search, category, minPrice, maxPrice, inStock } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (search) filter.name = { $regex: search, $options: 'i' };

  const onlyInStock =
    inStock === true || inStock === 'true' || inStock === '1' || inStock === 1;
  if (onlyInStock) {
    filter.stock = { $gt: 0 };
  }
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
  const allowed = ['name', 'description'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.body.price !== undefined) {
    const priceNum = Number(req.body.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return next(new AppError('Price must be a valid non-negative number', 400));
    }
    updates.price = priceNum;
  }

  if (req.body.stock !== undefined) {
    const stockParsed = normalizeNonNegativeIntStock(req.body.stock, 'Stock');
    if (stockParsed.error) {
      return next(new AppError(stockParsed.error, 400));
    }
    updates.stock = stockParsed.value;
  }

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

  if (req.files?.length) {
    const uploaded = [];
    for (const file of req.files) {
      const { url } = await uploadImageBuffer(file.buffer, 'products');
      uploaded.push(url);
    }
    if (req.body.images !== undefined) {
      updates.images = [...normalizeImagesFromBody(req.body), ...uploaded];
    } else {
      const existing = await Product.findById(id).select('images');
      updates.images = [...(existing?.images || []), ...uploaded];
    }
  } else if (req.body.images !== undefined) {
    updates.images = normalizeImagesFromBody(req.body);
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

