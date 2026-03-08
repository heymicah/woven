import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { itemsService } from "../../services/items.service";
import { reviewsService } from "../../services/reviews.service";
import { Item } from "../../types";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const postedBy =
    item && typeof item.postedBy === "object" && item.postedBy !== null
      ? (item.postedBy as { _id: string; username: string; avatarUrl?: string })
      : null;

  const receivedBy =
    item && typeof item.receivedBy === "object" && item.receivedBy !== null
      ? (item.receivedBy as { _id: string; username: string; avatarUrl?: string })
      : null;

  // Determine who to review: if I'm the seller, review the buyer; if I'm the buyer, review the seller
  const isCurrentUserSeller = postedBy && user?._id === postedBy._id;
  const reviewee = isCurrentUserSeller ? receivedBy : postedBy;

  useEffect(() => {
    if (!id) return;
    itemsService
      .getById(id)
      .then(setItem)
      .catch(() => Alert.alert("Error", "Could not load item"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!reviewee || !id || rating === 0) return;
    setSubmitting(true);
    try {
      await reviewsService.create({
        revieweeId: reviewee._id,
        itemId: id,
        rating,
        comment: comment.trim(),
      });
      router.back();
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Something went wrong";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("duplicate")) {
        Alert.alert("Already Reviewed", "You have already left a review for this item.");
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!item || !reviewee) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
        <Text style={{ color: Colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center", fontFamily: "Quicksand_500Medium" }}>
          Unable to load review details.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: Colors.primary, fontSize: 16, fontFamily: "Quicksand_600SemiBold" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFF1DA",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 18,
              color: Colors.text,
              fontFamily: "Quicksand_700Bold",
              marginRight: 40,
            }}
          >
            Leave a Review
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          {/* Item info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.surface,
              borderRadius: 16,
              padding: 12,
              marginBottom: 24,
            }}
          >
            {item.imageUrls?.[0] ? (
              <Image
                source={{ uri: item.imageUrls[0] }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="shirt-outline" size={24} color={Colors.textSecondary} />
              </View>
            )}
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: Colors.text,
                fontFamily: "Quicksand_600SemiBold",
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>

          {/* Reviewee info */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            {reviewee.avatarUrl ? (
              <Image
                source={{ uri: reviewee.avatarUrl }}
                style={{ width: 64, height: 64, borderRadius: 32 }}
              />
            ) : (
              <Ionicons name="person-circle" size={64} color={Colors.textSecondary} />
            )}
            <Text
              style={{
                marginTop: 8,
                fontSize: 16,
                color: Colors.text,
                fontFamily: "Quicksand_600SemiBold",
              }}
            >
              {reviewee.username}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 13,
                color: Colors.textSecondary,
                fontFamily: "Quicksand_500Medium",
              }}
            >
              How was your experience?
            </Text>
          </View>

          {/* Star rating picker */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 28, gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} style={{ padding: 4 }}>
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={40}
                  color={Colors.primary}
                />
              </Pressable>
            ))}
          </View>

          {/* Comment */}
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={Colors.textSecondary}
            multiline
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 16,
              padding: 16,
              minHeight: 100,
              fontSize: 15,
              color: Colors.text,
              fontFamily: "Quicksand_500Medium",
              textAlignVertical: "top",
            }}
          />
        </View>
      </ScrollView>

      {/* Submit button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 12 }}>
        <Pressable
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          style={{
            backgroundColor: rating === 0 ? Colors.secondary : Colors.primary,
            borderRadius: 9999,
            paddingVertical: 16,
            alignItems: "center",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={{ fontSize: 16, color: Colors.text, fontFamily: "Quicksand_600SemiBold" }}>
              Submit Review
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
