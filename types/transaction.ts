export enum TransactionType {
  POST_REWARD = "post_reward",
  TRANSFER_COMPLETE = "transfer_complete",
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
