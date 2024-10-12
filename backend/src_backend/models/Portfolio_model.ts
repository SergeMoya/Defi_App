import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset {
  symbol: string;
  amount: number;
  value: number;
}

export interface IPortfolio extends Document {
  user: mongoose.Types.ObjectId;
  assets: IAsset[];
  totalValue: number;
  lastUpdated: Date;
}

const AssetSchema: Schema = new Schema({
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  value: { type: Number, required: true },
});

const PortfolioSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assets: [AssetSchema],
  totalValue: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);