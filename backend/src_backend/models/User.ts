import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  address: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  address: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);