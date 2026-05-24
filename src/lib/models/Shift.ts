import mongoose, { Schema, Document } from 'mongoose';

export type ShiftStatus = 'open' | 'closed';

export interface IShift extends Document {
  station: mongoose.Types.ObjectId;
  gerant: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  closingCash?: number;
  status: ShiftStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    station: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
    },
    gerant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    openingCash: {
      type: Number,
      required: true,
      min: 0,
    },
    closingCash: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Shift =
  mongoose.models.Shift || mongoose.model<IShift>('Shift', shiftSchema);
