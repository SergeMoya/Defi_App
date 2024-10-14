import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  change24h: number;
  image?: string;
}

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId | string;
  assets: IAsset[];
  totalValue: number;
  totalChange24h: number;
  lastUpdated: Date;
}

const AssetSchema: Schema = new Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  value: { type: Number, required: true },
  change24h: { type: Number, required: true },
  image: { type: String },
});

const PortfolioSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true },
  assets: [AssetSchema],
  totalValue: { type: Number, required: true },
  totalChange24h: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);