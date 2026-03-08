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

export interface Item {
  _id: string;
  title: string;
  description: string;
  category: ItemCategory;
  size: ItemSize;
  condition: ItemCondition;
  intendedFit?: IntendedFit;
  imageUrls: string[];
  tokenCost: number;
  status: ItemStatus;
  postedBy: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}
