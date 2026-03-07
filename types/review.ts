export interface Review {
    _id: string;
    reviewer: {
        _id: string;
        username: string;
        avatarUrl?: string;
    };
    reviewee: string;
    itemId: {
        _id: string;
        title: string;
        imageUrls: string[];
    };
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewsResponse {
    reviews: Review[];
    avgRating: number;
    totalReviews: number;
}
