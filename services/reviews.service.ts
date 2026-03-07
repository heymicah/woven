import api from "./api";
import { ReviewsResponse } from "../types/review";

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
};
