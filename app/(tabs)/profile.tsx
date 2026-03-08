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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";
import { reviewsService } from "../../services/reviews.service";
import { Item, ItemStatus } from "../../types";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchAspectRatiosBatch } from "../../utils/image";

type ProfileTab = "current" | "past" | "received" | "liked";


function ProfileCard({ uri, cardWidth, onPress }: { uri: string; cardWidth: number; onPress: () => void }) {
  const [ratio, setRatio] = useState<number>(3 / 4);
  useEffect(() => {
    Image.getSize(uri, (w, h) => setRatio(w / h), () => { });
  }, [uri]);

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "100%",
        aspectRatio: ratio,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#C4DBC4",
        marginBottom: 10,
      }}
    >
      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
    </Pressable>
  );
}

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "past", label: "Past" },
  { key: "received", label: "Received" },
  { key: "liked", label: "Likes" },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>("current");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [claimedItems, setClaimedItems] = useState<Item[]>([]);
  const [likedItems, setLikedItems] = useState<Item[]>([]);
  const [aspectRatios, setAspectRatios] = useState<{ [key: string]: number }>({});
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mine, received, liked, reviewsData] = await Promise.all([
        itemsService.getMine(),
        itemsService.getReceived(),
        itemsService.getLiked(),
        user?._id ? reviewsService.getForUser(user._id) : Promise.resolve({ reviews: [], avgRating: 0, totalReviews: 0 }),
      ]);
      setMyItems(mine);
      setClaimedItems(received);
      setLikedItems(liked);
      setAvgRating(reviewsData.avgRating);

      // Batch fetch aspect ratios to prevent glitching
      const allItems = [...mine, ...received, ...liked];
      const uris = allItems.map(i => i.imageUrls?.[0]).filter((u): u is string => !!u);
      const ratiosMap = await fetchAspectRatiosBatch(uris);
      setAspectRatios(prev => ({ ...prev, ...ratiosMap }));
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const currentItems = myItems.filter((i) => i.status === ItemStatus.AVAILABLE);
  const pastItems = myItems.filter((i) => i.status !== ItemStatus.AVAILABLE);

  const getTabData = (): Item[] => {
    switch (activeTab) {
      case "current":
        return currentItems;
      case "past":
        return pastItems;
      case "received":
        return claimedItems;
      case "liked":
        return likedItems;
      default:
        return [];
    }
  };

  const getEmptyState = () => {
    switch (activeTab) {
      case "current":
        return { icon: "shirt-outline" as const, message: "No active listings" };
      case "past":
        return { icon: "time-outline" as const, message: "No past listings" };
      case "liked":
        return { icon: "heart-outline" as const, message: "No liked items yet" };
      case "received":
        return { icon: "bag-outline" as const, message: "No received items yet" };
    }
  };

  const tabData = getTabData();
  const emptyState = getEmptyState();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Profile Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingTop: 90,
            paddingBottom: 20,
            paddingHorizontal: 20,
            backgroundColor: Colors.background,
          }}
        >
          {/* Avatar */}
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
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 96, height: 96 }}
              />
            ) : (
              <Ionicons name="person" size={40} color={Colors.primary} />
            )}
          </View>

          {/* Info */}
          <View style={{ flex: 1, paddingTop: 6 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: Colors.heading,
              }}
            >
              {user?.username || "Username"}
            </Text>
            {user?.bio ? (
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.textSecondary,
                  marginTop: 3,
                }}
                numberOfLines={2}
              >
                {user.bio}
              </Text>
            ) : null}

            {/* Tokens */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 9, fontWeight: "800", color: Colors.primary, marginTop: -0.5 }}>$</Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: Colors.text,
                  marginLeft: 5,
                }}
              >
                {user?.tokenBalance ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.textSecondary,
                  marginLeft: 3,
                }}
              >
                tokens
              </Text>
            </View>

            {/* Rating — 5 stars, tappable to open reviews */}
            <Pressable
              onPress={() => router.push(`/reviews?userId=${user?._id}`)}
              style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: Colors.text,
                  marginLeft: 5,
                }}
              >
                {avgRating > 0 ? avgRating.toFixed(1) : "New"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={Colors.textSecondary}
                style={{ marginLeft: 3 }}
              />
            </Pressable>
          </View>

          {/* Settings Gear — top-right, no background */}
          <Pressable
            onPress={() => router.push("/settings")}
            style={{
              padding: 4,
              marginTop: -2,
            }}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* ── Subtab Bar ── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: Colors.background,
            marginHorizontal: 16,
            paddingTop: 8,
          }}
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === (tab.key as any);
            const isFirst = index === 0;
            const isLast = index === TABS.length - 1;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  borderTopWidth: isActive ? 1 : 0,
                  borderLeftWidth: isActive ? 1 : 0,
                  borderRightWidth: isActive ? 1 : 0,
                  borderBottomWidth: isActive ? 0 : 1,
                  borderColor: Colors.brown.dark,
                  borderTopLeftRadius: isActive ? 14 : 0,
                  borderTopRightRadius: isActive ? 14 : 0,
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

        {/* ── Tab Content ── */}
        <View style={{
          marginHorizontal: 16,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: Colors.brown.dark,
          paddingHorizontal: 8,
          paddingTop: 12,
          paddingBottom: 12,
        }}>
          {loading ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : tabData.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingTop: 60,
                paddingBottom: 40,
              }}
            >
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: Colors.textSecondary,
                }}
              >
                {emptyState?.message}
              </Text>
            </View>
          ) : (
            (() => {
              const leftColumn: Item[] = [];
              const rightColumn: Item[] = [];
              tabData.forEach((item, i) => {
                (i % 2 === 0 ? leftColumn : rightColumn).push(item);
              });
              const gap = 10;
              // 16 margin + 1 border + 8 padding per side = 50 total
              const cardWidth = (width - 50 - gap) / 2;

              const renderCard = (item: Item) => {
                const uri = item.imageUrls?.[0]
                  || "https://via.placeholder.com/300x400?text=No+Image";
                return (
                  <ProfileCard
                    key={item._id}
                    uri={uri}
                    cardWidth={cardWidth}
                    onPress={() => router.push(`/item/${item._id}`)}
                  />
                );
              };

              return (
                <View style={{ flexDirection: "row", gap }}>
                  <View style={{ width: cardWidth }}>{leftColumn.map(renderCard)}</View>
                  <View style={{ width: cardWidth }}>{rightColumn.map(renderCard)}</View>
                </View>
              );
            })()
          )}
        </View>
      </ScrollView >
    </View >
  );
}
