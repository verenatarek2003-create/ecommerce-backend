import mongoose from 'mongoose';
import { USER_ROLES, USER_ROLE_VALUES } from '../enums/user-role.enum.js';
import addressSchema from './address.model.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: USER_ROLES.CUSTOMER
    },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

