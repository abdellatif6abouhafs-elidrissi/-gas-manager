import mongoose, { Schema, Document } from 'mongoose';

export interface IStation extends Document {
  name: string;
  address: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stationSchema = new Schema<IStation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Station =
  mongoose.models.Station || mongoose.model<IStation>('Station', stationSchema);
