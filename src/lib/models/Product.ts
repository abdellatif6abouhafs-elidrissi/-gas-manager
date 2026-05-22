import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  shift: mongoose.Types.ObjectId;
  productType: 'oil' | 'air' | 'car_wash' | 'accessories' | 'other';
  quantity: number;
  amountMAD: number;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    productType: {
      type: String,
      enum: ['oil', 'air', 'car_wash', 'accessories', 'other'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    amountMAD: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
