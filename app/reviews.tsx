import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import { reviewsService, ReviewSortOption } from "../services/reviews.service";
import { Review } from "../types/review";

const SORT_OPTIONS: { key: ReviewSortOption; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "oldest", label: "Oldest" },
    { key: "high", label: "Highest" },
    { key: "low", label: "Lowest" },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <View style={{ flexDirection: "row", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((n) => {
                const fill = Math.min(1, Math.max(0, rating - (n - 1)));
                return (
                    <View key={n} style={{ width: size, height: size }}>
                        <Ionicons
                            name="star-outline"
                            size={size}
                            color={fill > 0 ? Colors.primary : Colors.border}
                            style={{ position: "absolute" }}
                        />
                        <View style={{ overflow: "hidden", width: size * fill, height: size }}>
                            <Ionicons
                                name="star"
                                size={size}
                                color={Colors.primary}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export default function ReviewsScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const router = useRouter();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [sort, setSort] = useState<ReviewSortOption>("newest");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReviews = useCallback(
        async (sortBy: ReviewSortOption) => {
            if (!userId) return;
            try {
                const data = await reviewsService.getForUser(userId, sortBy);
                setReviews(data.reviews);
                setAvgRating(data.avgRating);
                setTotalReviews(data.totalReviews);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            }
        },
        [userId]
    );

    useEffect(() => {
        setLoading(true);
        fetchReviews(sort).finally(() => setLoading(false));
    }, [fetchReviews, sort]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchReviews(sort);
        setRefreshing(false);
    }, [fetchReviews, sort]);

    const handleSortChange = (newSort: ReviewSortOption) => {
        if (newSort !== sort) {
            setSort(newSort);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingTop: 56,
                    paddingBottom: 16,
                    paddingHorizontal: 16,
                    backgroundColor: Colors.background,
                }}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color={Colors.heading} />
                </Pressable>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: Colors.heading,
                        }}
                    >
                        Reviews
                    </Text>
                    {totalReviews > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                            <StarRow rating={avgRating} size={15} />
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: Colors.text,
                                    marginLeft: 6,
                                }}
                            >
                                {avgRating.toFixed(1)}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: Colors.textSecondary,
                                    marginLeft: 4,
                                }}
                            >
                                · {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Sort Bar */}
            <View
                style={{
                    flexDirection: "row",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 8,
                    backgroundColor: Colors.background,
                }}
            >
                {SORT_OPTIONS.map((option) => {
                    const isActive = sort === option.key;
                    return (
                        <Pressable
                            key={option.key}
                            onPress={() => handleSortChange(option.key)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 9,
                                borderRadius: 20,
                                minHeight: 38,
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: isActive ? Colors.primary : "#FFF1DA",
                                borderWidth: isActive ? 0 : 1,
                                borderColor: "#E5E7EB",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: isActive ? "600" : "500",
                                    color: isActive ? Colors.brown.dark : Colors.textSecondary,
                                    fontFamily: isActive ? "Quicksand_600SemiBold" : "Quicksand_500Medium",
                                }}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Reviews List */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {loading ? (
                    <View style={{ alignItems: "center", paddingTop: 60 }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : reviews.length === 0 ? (
                    <View style={{ alignItems: "center", paddingTop: 60 }}>
                        <View
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 36,
                                backgroundColor: Colors.secondary,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={32} color={Colors.primary} />
                        </View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: Colors.textSecondary,
                            }}
                        >
                            No reviews yet
                        </Text>
                    </View>
                ) : (
                    reviews.map((review) => (
                        <View
                            key={review._id}
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: Colors.border,
                            }}
                        >
                            {/* Reviewer info */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: Colors.secondary,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 10,
                                    }}
                                >
                                    <Ionicons name="person" size={16} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "600",
                                            color: Colors.heading,
                                        }}
                                    >
                                        {review.reviewer.username}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: Colors.textSecondary,
                                            marginTop: 1,
                                        }}
                                    >
                                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </Text>
                                </View>
                                <StarRow rating={review.rating} size={14} />
                            </View>

                            {/* Comment */}
                            {review.comment ? (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: Colors.text,
                                        lineHeight: 20,
                                    }}
                                >
                                    {review.comment}
                                </Text>
                            ) : null}

                            {/* Item reference */}
                            {review.itemId && (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginTop: 10,
                                        paddingTop: 10,
                                        borderTopWidth: 1,
                                        borderTopColor: Colors.border,
                                    }}
                                >
                                    <Ionicons name="shirt-outline" size={14} color={Colors.textSecondary} />
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: Colors.textSecondary,
                                            marginLeft: 6,
                                        }}
                                        numberOfLines={1}
                                    >
                                        {review.itemId.title}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
