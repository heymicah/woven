import mongoose, { Document, Schema } from "mongoose";
import { ItemCategory, ItemCondition, ItemSize, ItemStatus } from "../types";

export interface IItem extends Document {
  title: string;
  description: string;
  category: ItemCategory;
  size: ItemSize;
  condition: ItemCondition;
  imageUrls: string[];
  tokenCost: number;
  status: ItemStatus;
  postedBy: mongoose.Types.ObjectId;
  claimedBy?: mongoose.Types.ObjectId;
}

const itemSchema = new Schema<IItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(ItemCategory),
      required: true,
    },
    size: {
      type: String,
      enum: Object.values(ItemSize),
      required: true,
    },
    condition: {
      type: String,
      enum: Object.values(ItemCondition),
      required: true,
    },
    imageUrls: { type: [String], default: [] },
    tokenCost: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(ItemStatus),
      default: ItemStatus.AVAILABLE,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Item = mongoose.model<IItem>("Item", itemSchema);
