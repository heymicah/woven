import { Request, Response } from "express";
import { Item } from "../models/Item";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import mongoose from "mongoose";
import { AuthRequest, ItemStatus, TransactionType } from "../types";

const CLAIM_COST = 1;

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const { category, size, condition, search, userId, status } = req.query;
    const filter: Record<string, any> = { status: status || ItemStatus.AVAILABLE };

    if (userId) filter.postedBy = userId;

    if (category) filter.category = category;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Item.find(filter)
      .populate("postedBy", "username avatarUrl")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await Item.findById(req.params.id).populate(
      "postedBy",
      "username avatarUrl"
    );
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function createItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    console.log("[createItem] userId:", req.userId);
    console.log("[createItem] req.body:", JSON.stringify(req.body, null, 2));

    const item = await Item.create({
      ...req.body,
      postedBy: req.userId,
    });

    console.log("[createItem] Item created:", item._id);

    res.status(201).json(item);
  } catch (error: any) {
    console.error("[createItem] ERROR:", error.message);
    console.error("[createItem] Stack:", error.stack);
    if (error.name === "ValidationError") {
      console.error("[createItem] Validation details:", JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function claimItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    if (item.status !== ItemStatus.AVAILABLE) {
      res.status(400).json({ message: "Item is not available" });
      return;
    }

    if (item.postedBy.toString() === req.userId) {
      res.status(400).json({ message: "Cannot claim your own item" });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user || user.tokenBalance < CLAIM_COST) {
      res.status(400).json({ message: "Insufficient token balance" });
      return;
    }

    // Deduct tokens and claim item
    user.tokenBalance -= CLAIM_COST;
    await user.save();

    item.status = ItemStatus.CLAIMED;
    item.claimedBy = user._id as any;
    await item.save();

    // Record transaction
    await Transaction.create({
      userId: req.userId,
      itemId: item._id,
      type: TransactionType.CLAIM_COST,
      tokenAmount: -CLAIM_COST,
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    if (item.postedBy.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized to edit this item" });
      return;
    }

    if (item.status !== ItemStatus.AVAILABLE) {
      res.status(400).json({ message: "Cannot edit an item that is not available" });
      return;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("postedBy", "username avatarUrl");

    res.json(updatedItem);
  } catch (error: any) {
    console.error("[updateItem] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function deleteItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    if (item.postedBy.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMyItems(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const items = await Item.find({ postedBy: req.userId })
      .populate("claimedBy", "username avatarUrl")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getClaimedItems(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const items = await Item.find({ claimedBy: req.userId })
      .populate("postedBy", "username avatarUrl")
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
