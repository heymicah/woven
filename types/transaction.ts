export enum TransactionType {
  POST_REWARD = "post_reward",
  CLAIM_COST = "claim_cost",
}

export interface Transaction {
  _id: string;
  userId: string;
  itemId: string;
  type: TransactionType;
  tokenAmount: number;
  createdAt: string;
  updatedAt: string;
}
