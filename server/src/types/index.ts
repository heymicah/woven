import { Request } from "express";

// TODO: Extract shared types into a common package with the frontend
export interface AuthRequest extends Request {
  userId?: string;
  file?: any;
  files?: any;
}

export enum ItemCategory {
  T_SHIRTS = "t_shirts",
  BLOUSES = "blouses",
  SWEATERS = "sweaters",
  JACKETS = "jackets",
  JEANS = "jeans",
  PANTS = "pants",
  SHORTS = "shorts",
  SKIRTS = "skirts",
  DRESSES = "dresses",
  ACTIVEWEAR = "activewear",
  SHOES = "shoes",
  BAGS = "bags",
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
  // Numeric sizes
  N0 = "0",
  N2 = "2",
  N4 = "4",
  N6 = "6",
  N8 = "8",
  N10 = "10",
  N12 = "12",
  N14 = "14",
  N16 = "16",
  // Shoe sizes
  S5 = "5",
  S5_5 = "5.5",
  S6_5 = "6.5",
  S7 = "7",
  S7_5 = "7.5",
  S8_5 = "8.5",
  S9 = "9",
  S9_5 = "9.5",
  S10_5 = "10.5",
  S11 = "11",
  S11_5 = "11.5",
  S13 = "13",
  ONE_SIZE = "One Size",
}

export enum IntendedFit {
  MEN = "men",
  WOMEN = "women",
  UNISEX = "unisex",
}

export enum ItemStatus {
  AVAILABLE = "available",
  COMPLETED = "completed",
}

export enum TransactionType {
  POST_REWARD = "post_reward",
  TRANSFER_COMPLETE = "transfer_complete",
}
