import React, { useState, useEffect } from "react";
import { View, Text, Image, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { itemsService } from "../../services/items.service";
import { Item } from "../../types";

export default function ReceiptScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    itemsService
      .getById(itemId)
      .then(setItem)
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        // Refresh user token balance after render is stable
        refreshUser();
      });
  }, [itemId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: Colors.textSecondary }}>Could not load receipt</Text>
        <Pressable onPress={() => router.replace("/(tabs)/profile")} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.primary, fontWeight: "600" }}>Go to Profile</Text>
        </Pressable>
      </View>
    );
  }

  const seller =
    typeof item.postedBy === "object" && item.postedBy !== null
      ? (item.postedBy as any)
      : null;
  const buyer =
    typeof item.receivedBy === "object" && item.receivedBy !== null
      ? (item.receivedBy as any)
      : null;
  const isSeller = user?._id === seller?._id;
  const thumbnail = item.imageUrls?.[0];
  const timestamp = new Date(item.updatedAt).toLocaleString();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Success icon */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="checkmark" size={36} color="#fff" />
        </View>

        <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.text, marginBottom: 24 }}>
          Transfer Complete!
        </Text>

        {/* Item card */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            width: "100%",
            alignItems: "center",
          }}
        >
          {thumbnail && (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 100, height: 100, borderRadius: 12, marginBottom: 12 }}
              resizeMode="cover"
            />
          )}
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 16, textAlign: "center" }}>
            {item.title}
          </Text>

          {/* Seller */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, width: "100%" }}>
            {seller?.avatarUrl ? (
              <Image source={{ uri: seller.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <Ionicons name="person-circle" size={32} color={Colors.accent} />
            )}
            <Text style={{ fontSize: 14, color: Colors.text, marginLeft: 8, flex: 1 }}>
              {seller?.username || "Seller"}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.success }}>+1 token</Text>
          </View>

          {/* Buyer */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, width: "100%" }}>
            {buyer?.avatarUrl ? (
              <Image source={{ uri: buyer.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <Ionicons name="person-circle" size={32} color={Colors.accent} />
            )}
            <Text style={{ fontSize: 14, color: Colors.text, marginLeft: 8, flex: 1 }}>
              {buyer?.username || "Buyer"}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textSecondary }}>-1 token</Text>
          </View>

          {/* Timestamp */}
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{timestamp}</Text>
        </View>
      </View>

      {/* Done button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={() => router.replace("/(tabs)/profile")}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.text }}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}
