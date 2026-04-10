import mongoose from 'mongoose';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';
import { uploadImageBuffer } from '../utils/cloudinary-upload.js';
import { parsePagination } from '../utils/validators.js';

export const listCategories = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    Category.find().skip(skip).limit(limit).sort({ name: 1 }),
    Category.countDocuments()
  ]);

  return res.success({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
};

export const getCategoryById = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid category id', 400));
  }

  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  return res.success(category);
};

export const createCategory = async (req, res, next) => {
  const { name, slug, description } = req.body;

  if (!name) {
    return next(new AppError('Name is required', 400));
  }

  let image = req.body.image;
  if (req.file) {
    const { url } = await uploadImageBuffer(req.file.buffer, 'categories');
    image = url;
  }

  const category = await Category.create({ name, slug, description, image });
  return res.success(category, 'Category created successfully', 201);
};

export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid category id', 400));
  }

  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.slug !== undefined) updates.slug = req.body.slug;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.image !== undefined) updates.image = req.body.image;

  if (req.file) {
    const { url } = await uploadImageBuffer(req.file.buffer, 'categories');
    updates.image = url;
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  return res.success(category, 'Category updated successfully');
};

export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid category id', 400));
  }

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return next(
      new AppError(`Cannot delete category: ${productCount} product(s) still use it`, 400)
    );
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  return res.success(null, 'Category deleted');
};
