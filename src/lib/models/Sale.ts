import mongoose, { Schema, Document } from 'mongoose';

export type FuelType = 'gasoil' | 'essence' | 'gpl';

export interface ISale extends Document {
  shift: mongoose.Types.ObjectId;
  pumpNumber: number;
  fuelType: FuelType;
  liters: number;
  amountMAD: number;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>(
  {
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    pumpNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    fuelType: {
      type: String,
      enum: ['gasoil', 'essence', 'gpl'],
      required: true,
    },
    liters: {
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
  {
    timestamps: true,
  }
);

export const Sale =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', saleSchema);
