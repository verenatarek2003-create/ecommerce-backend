import crypto from 'crypto';
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true }
  },
  { timestamps: true }
);

categorySchema.pre('validate', function categoryPreValidate(next) {
  if (!this.slug && this.name) {
    let slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) {
      slug = `cat-${crypto.randomBytes(4).toString('hex')}`;
    }
    this.slug = slug;
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
