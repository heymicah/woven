import { Request, Response } from "express";
import { Item } from "../models/Item";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import mongoose from "mongoose";
import { AuthRequest, ItemStatus, TransactionType } from "../types";

const POST_REWARD = 1;

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const { category, size, condition, search, userId, status } = req.query;
    const filter: Record<string, any> = { status: status || ItemStatus.AVAILABLE };

    if (userId) filter.postedBy = userId;

    if (category) filter.category = category;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;
    if (search) {
      const term = (search as string).trim();
      // Strip common plural endings to get stem, then match with optional plural suffix
      let stem = term;
      if (/ies$/i.test(term)) {
        stem = term.replace(/ies$/i, "");
        // matches: stem + "y", stem + "ies"
      } else if (/es$/i.test(term)) {
        stem = term.replace(/es$/i, "");
        // matches: stem, stem + "e", stem + "es"
      } else if (/s$/i.test(term)) {
        stem = term.replace(/s$/i, "");
        // matches: stem, stem + "s"
      }
      // Regex: stem followed by optional plural endings
      const pattern = stem + "(?:y|ies|es|s|e)?";
      filter.$or = [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
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
    const item = await Item.findById(req.params.id)
      .populate("postedBy", "username avatarUrl")
      .populate("receivedBy", "username avatarUrl");
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
      .populate("receivedBy", "username avatarUrl")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function completeTransfer(
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

    const { sellerId } = req.body;
    if (item.postedBy.toString() !== sellerId) {
      res.status(400).json({ message: "Seller ID does not match item poster" });
      return;
    }

    if (req.userId === sellerId) {
      res.status(400).json({ message: "Cannot transfer to yourself" });
      return;
    }

    // Check buyer has enough tokens
    const buyer = await User.findById(req.userId);
    if (!buyer || buyer.tokenBalance < 1) {
      res.status(400).json({ message: "Insufficient token balance" });
      return;
    }

    // Deduct token from buyer
    buyer.tokenBalance -= 1;
    await buyer.save();

    // Transition item to COMPLETED and record buyer
    item.status = ItemStatus.COMPLETED;
    item.receivedBy = new mongoose.Types.ObjectId(req.userId!) as any;
    await item.save();

    // Award seller 1 token
    const seller = await User.findById(sellerId);
    if (seller) {
      seller.tokenBalance += POST_REWARD;
      await seller.save();
    }

    // Record transactions for both parties
    await Transaction.create([
      {
        userId: sellerId,
        itemId: item._id,
        type: TransactionType.TRANSFER_COMPLETE,
        tokenAmount: POST_REWARD,
      },
      {
        userId: req.userId,
        itemId: item._id,
        type: TransactionType.TRANSFER_COMPLETE,
        tokenAmount: -1,
      },
    ]);

    // Return populated item
    const populatedItem = await Item.findById(item._id)
      .populate("postedBy", "username avatarUrl")
      .populate("receivedBy", "username avatarUrl");

    res.json(populatedItem);
  } catch (error: any) {
    console.error("[completeTransfer] ERROR:", error.message, error.stack);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getReceivedItems(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const items = await Item.find({ receivedBy: req.userId })
      .populate("postedBy", "username avatarUrl")
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function toggleLike(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const likedItems = user.likedItems || [];
    const index = likedItems.indexOf(item._id as any);

    if (index > -1) {
      // Unlike
      likedItems.splice(index, 1);
    } else {
      // Like
      likedItems.push(item._id as any);
    }

    user.likedItems = likedItems;
    await user.save();

    res.json({ liked: index === -1 });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getLikedItems(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const user = await User.findById(req.userId).populate("likedItems");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Populate the postedBy field of each liked item as well
    const items = await Item.find({ _id: { $in: user.likedItems } })
      .populate("postedBy", "username avatarUrl")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

