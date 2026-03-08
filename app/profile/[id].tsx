import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";
import { userService } from "../../services/user.service";
import { reviewsService } from "../../services/reviews.service";
import { Item, ItemStatus, User } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MasonryImage } from "../../components/MasonryImage";
import { fetchAspectRatiosBatch } from "../../utils/image";

type ProfileTab = "current" | "past";

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "past", label: "Past" },
];

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("current");
  const [items, setItems] = useState<Item[]>([]);
  const [aspectRatios, setAspectRatios] = useState<{ [key: string]: number }>({});
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [userData, userItems, reviewsData] = await Promise.all([
        userService.getById(id),
        itemsService.getAll({
          userId: id,
          status: activeTab === "current" ? ItemStatus.AVAILABLE : ItemStatus.COMPLETED
        }),
        reviewsService.getForUser(id),
      ]);
      setUser(userData);
      setItems(userItems);
      setAvgRating(reviewsData.avgRating);

      // Batch fetch aspect ratios to prevent glitching
      const uris = userItems.map(i => i.imageUrls?.[0]).filter((u): u is string => !!u);
      const ratiosMap = await fetchAspectRatiosBatch(uris);
      setAspectRatios(prev => ({ ...prev, ...ratiosMap }));
    } catch (error) {
      console.error("Failed to fetch public profile data:", error);
    }
  }, [id, activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [id, activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getEmptyState = () => {
    switch (activeTab) {
      case "current":
        return { icon: "shirt-outline" as const, message: "No active listings" };
      case "past":
        return { icon: "time-outline" as const, message: "No past listings" };
    }
  };

  const emptyState = getEmptyState();

  // Masonry layout constants (matching Explore page)
  const gap = 12;
  const padding = 16;
  const columnWidth = (width - padding * 2 - gap) / 2;

  const renderGridItem = (item: Item) => {
    return (
      <MasonryImage
        key={item._id}
        uri={item.imageUrls?.[0] || "https://via.placeholder.com/300x400?text=No+Image"}
        aspectRatio={aspectRatios[item._id]}
        columnWidth={columnWidth}
        onPress={() => router.push(`/item/${item._id}`)}
      />
    );
  };

  // Split items into 2 columns using a "greedy" balancing algorithm
  const leftColumn: Item[] = [];
  const rightColumn: Item[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.forEach((item) => {
    const ratio = aspectRatios[item._id] || 1;
    const heightWeight = 1 / ratio;

    if (leftHeight <= rightHeight) {
      leftColumn.push(item);
      leftHeight += heightWeight;
    } else {
      rightColumn.push(item);
      rightHeight += heightWeight;
    }
  });

  if (loading && !refreshing && !user) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header with Back Button */}
        <View style={{ position: "absolute", top: insets.top + 8, left: 16, zIndex: 10 }}>
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
            <Ionicons name="arrow-back" size={24} color={Colors.brown.dark} />
          </Pressable>
        </View>

        {/* Profile Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingTop: insets.top + 60,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: Colors.secondary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 18,
              overflow: "hidden",
            }}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 96, height: 96 }} />
            ) : (
              <Ionicons name="person" size={40} color={Colors.primary} />
            )}
          </View>

          <View style={{ flex: 1, paddingTop: 6 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.heading }}>
              {user?.username}
            </Text>
            {user?.bio ? (
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 3 }}>
                {user.bio}
              </Text>
            ) : null}

            {/* Rating Display — tappable to open reviews */}
            <Pressable
              onPress={() => router.push(`/reviews?userId=${id}`)}
              style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const fill = Math.min(1, Math.max(0, avgRating - (n - 1)));
                return (
                  <View key={n} style={{ width: 15, height: 15, marginRight: 1 }}>
                    <Ionicons
                      name="star-outline"
                      size={15}
                      color={Colors.primary}
                      style={{ position: "absolute" }}
                    />
                    <View style={{ overflow: "hidden", width: 15 * fill, height: 15 }}>
                      <Ionicons
                        name="star"
                        size={15}
                        color={Colors.primary}
                      />
                    </View>
                  </View>
                );
              })}
              <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text, marginLeft: 5 }}>
                {avgRating.toFixed(1)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={Colors.textSecondary}
                style={{ marginLeft: 3 }}
              />
            </Pressable>
          </View>
        </View>

        {/* Subtab Bar (Filing Cabinet Style) */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: Colors.background,
            paddingHorizontal: 12,
            paddingTop: 8,
            borderBottomWidth: 1,
            borderBottomColor: Colors.brown.dark,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  marginHorizontal: 3,
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                  backgroundColor: isActive ? Colors.primary : "transparent",
                  borderWidth: 1,
                  borderBottomWidth: isActive ? 0 : 1,
                  borderColor: Colors.brown.dark,
                  marginBottom: -1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? Colors.brown.dark : Colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Grid Content */}
        <View style={{ padding: padding, flexDirection: "row", gap: gap }}>
          {items.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
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
                <Ionicons name={emptyState?.icon as any} size={32} color={Colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.textSecondary, textAlign: "center" }}>
                {emptyState?.message}
              </Text>
            </View>
          ) : (
            <>
              {/* Left Column */}
              <View style={{ flex: 1 }}>
                {leftColumn.map((item) => renderGridItem(item))}
              </View>
              {/* Right Column */}
              <View style={{ flex: 1 }}>
                {rightColumn.map((item) => renderGridItem(item))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
