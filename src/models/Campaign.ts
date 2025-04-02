import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  creatorAddress: string;
  contractAddress: string;
  imageUrl?: string;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  creatorAddress: { type: String, required: true },
  contractAddress: { type: String, required: true },
  imageUrl: { type: String },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

export default mongoose.model<ICampaign>('Campaign', CampaignSchema); 