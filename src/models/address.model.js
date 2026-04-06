import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String }
  },
  { _id: false }
);

export default addressSchema;

