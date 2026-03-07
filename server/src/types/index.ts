import { Request } from "express";

// TODO: Extract shared types into a common package with the frontend
export interface AuthRequest extends Request {
  userId?: string;
}

export enum ItemCategory {
  TOPS = "tops",
  BOTTOMS = "bottoms",
  DRESSES = "dresses",
  OUTERWEAR = "outerwear",
  SHOES = "shoes",
  ACCESSORIES = "accessories",
  OTHER = "other",
}

export enum ItemCondition {
  NEW = "new",
  LIKE_NEW = "like_new",
  GOOD = "good",
  FAIR = "fair",
  WORN = "worn",
}

export enum ItemSize {
  XXS = "XXS",
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
  XXXL = "XXXL",
  ONE_SIZE = "One Size",
}

export enum IntendedFit {
  MEN = "men",
  WOMEN = "women",
  UNISEX = "unisex",
}

export enum ItemStatus {
  AVAILABLE = "available",
  CLAIMED = "claimed",
  COMPLETED = "completed",
}

export enum TransactionType {
  POST_REWARD = "post_reward",
  CLAIM_COST = "claim_cost",
}
