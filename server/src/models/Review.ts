import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
    reviewer: mongoose.Types.ObjectId;
    reviewee: mongoose.Types.ObjectId;
    itemId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
}

const reviewSchema = new Schema<IReview>(
    {
        reviewer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reviewee: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        itemId: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// One review per reviewer per item
reviewSchema.index({ reviewer: 1, itemId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
