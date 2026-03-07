import { Response } from "express";
import { Transaction } from "../models/Transaction";
import { AuthRequest } from "../types";

export async function getMyTransactions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate("itemId", "title")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
