import { Request, Response } from "express";
import { Item } from "../models/Item";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import mongoose from "mongoose";
import { AuthRequest, ItemStatus, TransactionType } from "../types";
import { generateEmbedding, buildEmbeddingText } from "../utils/embeddings";

const CLAIM_COST = 1;

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const { category, size, condition, search, userId, status } = req.query;

    // If search query provided, try vector search first, fall back to regex
    if (search) {
      const term = (search as string).trim();

      try {
        const queryVector = await generateEmbedding(term);

        const pipeline: any[] = [
          {
            $vectorSearch: {
              index: "vector_index",
              queryVector,
              path: "embedding",
              numCandidates: 100,
              limit: 50,
            },
          },
          {
            $addFields: { score: { $meta: "vectorSearchScore" } },
          },
          {
            $match: {
              score: { $gte: 0.6 },
              status: (status as string) || ItemStatus.AVAILABLE,
              ...(userId && { postedBy: new mongoose.Types.ObjectId(userId as string) }),
              ...(category && { category }),
              ...(size && { size }),
              ...(condition && { condition }),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "postedBy",
              foreignField: "_id",
              as: "postedBy",
              pipeline: [{ $project: { username: 1, avatarUrl: 1 } }],
            },
          },
          { $unwind: { path: "$postedBy", preserveNullAndEmptyArrays: true } },
          { $project: { embedding: 0 } },
        ];

        const items = await Item.aggregate(pipeline);
        res.json(items);
        return;
      } catch (searchErr: any) {
        console.warn("[getItems] Vector search failed, falling back to regex:", searchErr.message);
      }

      // Regex fallback
      const filter: Record<string, any> = { status: status || ItemStatus.AVAILABLE };
      if (userId) filter.postedBy = userId;
      if (category) filter.category = category;
      if (size) filter.size = size;
      if (condition) filter.condition = condition;

      let stem = term;
      if (/ies$/i.test(term)) stem = term.replace(/ies$/i, "");
      else if (/es$/i.test(term)) stem = term.replace(/es$/i, "");
      else if (/s$/i.test(term)) stem = term.replace(/s$/i, "");
      const pattern = stem + "(?:y|ies|es|s|e)?";
      filter.$or = [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ];

      const items = await Item.find(filter)
        .populate("postedBy", "username avatarUrl")
        .sort({ createdAt: -1 });

      res.json(items);
      return;
    }

    // No search — regular filtered listing
    const filter: Record<string, any> = { status: status || ItemStatus.AVAILABLE };
    if (userId) filter.postedBy = userId;
    if (category) filter.category = category;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;

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

    // Generate embedding in background (don't block response)
    generateEmbedding(buildEmbeddingText(item))
      .then((embedding) => {
        Item.findByIdAndUpdate(item._id, { embedding }).exec();
        console.log("[createItem] Embedding saved for:", item._id);
      })
      .catch((err) => console.error("[createItem] Embedding failed:", err.message));

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

    // Regenerate embedding in background
    if (updatedItem) {
      generateEmbedding(buildEmbeddingText(updatedItem))
        .then((embedding) => {
          Item.findByIdAndUpdate(updatedItem._id, { embedding }).exec();
        })
        .catch((err) => console.error("[updateItem] Embedding failed:", err.message));
    }

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

