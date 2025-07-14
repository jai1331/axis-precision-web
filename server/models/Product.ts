import mongoose, { Schema, Document } from 'mongoose';
import { Product } from '../../types';

export interface ProductDocument extends Omit<Product, '_id'>, Document {}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    supplier: {
      type: String,
      required: [true, 'Supplier is required'],
      trim: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update inStock based on quantity
ProductSchema.pre<ProductDocument>('save', function (next) {
  this.inStock = this.quantity > 0;
  next();
});

export default mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);