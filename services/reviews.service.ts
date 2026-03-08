import api from "./api";
import { Review, ReviewsResponse } from "../types/review";

export type ReviewSortOption = "newest" | "oldest" | "high" | "low";

export const reviewsService = {
    getForUser: async (
        userId: string,
        sort: ReviewSortOption = "newest"
    ): Promise<ReviewsResponse> => {
        const { data } = await api.get<ReviewsResponse>(
            `/reviews/user/${userId}`,
            { params: { sort } }
        );
        return data;
    },

    checkExists: async (itemId: string): Promise<boolean> => {
        const { data } = await api.get<{ exists: boolean }>(`/reviews/check/${itemId}`);
        return data.exists;
    },

    create: async (data: {
        revieweeId: string;
        itemId: string;
        rating: number;
        comment: string;
    }): Promise<Review> => {
        const { data: review } = await api.post<Review>("/reviews", data);
        return review;
    },
};
