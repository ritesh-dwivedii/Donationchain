import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  campaignId: mongoose.Types.ObjectId;
  donorAddress: string;
  amount: number;
  transactionHash: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema: Schema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  donorAddress: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionHash: { type: String, required: true, unique: true },
  message: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IDonation>('Donation', DonationSchema); 