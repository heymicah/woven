import { Request, Response } from "express";
import { Review } from "../models/Review";
import { AuthRequest } from "../types";

export async function getReviewsForUser(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { userId } = req.params;
        const { sort } = req.query;

        let sortOption: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest
        if (sort === "oldest") sortOption = { createdAt: 1 };
        else if (sort === "high") sortOption = { rating: -1, createdAt: -1 };
        else if (sort === "low") sortOption = { rating: 1, createdAt: -1 };

        const reviews = await Review.find({ reviewee: userId })
            .populate("reviewer", "username avatarUrl")
            .populate("itemId", "title imageUrls")
            .sort(sortOption);

        // Also compute average rating
        const stats = await Review.aggregate([
            { $match: { reviewee: new (require("mongoose").Types.ObjectId)(userId) } },
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]);

        const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
        const totalReviews = stats.length > 0 ? stats[0].count : 0;

        res.json({ reviews, avgRating, totalReviews });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

export async function checkReviewExists(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const { itemId } = req.params;
        const existing = await Review.findOne({ reviewer: req.userId, itemId });
        res.json({ exists: !!existing });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

export async function createReview(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const { revieweeId, itemId, rating, comment } = req.body;

        if (req.userId === revieweeId) {
            res.status(400).json({ message: "Cannot review yourself" });
            return;
        }

        const review = await Review.create({
            reviewer: req.userId,
            reviewee: revieweeId,
            itemId,
            rating,
            comment,
        });

        const populated = await review.populate("reviewer", "username avatarUrl");
        res.status(201).json(populated);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: "You have already reviewed this item" });
            return;
        }
        res.status(500).json({ message: "Server error" });
    }
}
