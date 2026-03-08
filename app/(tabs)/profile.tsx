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
import { ThemedText } from "../../components/ThemedText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";
import { Item, ItemStatus } from "../../types";
import { useRouter, useFocusEffect } from "expo-router";
import { MasonryImage } from "../../components/MasonryImage";
import { fetchAspectRatiosBatch } from "../../utils/image";

type ProfileTab = "current" | "past" | "received" | "liked";

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "past", label: "Past" },
  { key: "received", label: "Received" },
  { key: "liked", label: "Likes" },
];

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>("current");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [receivedItems, setReceivedItems] = useState<Item[]>([]);
  const [likedItems, setLikedItems] = useState<Item[]>([]);
  const [aspectRatios, setAspectRatios] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mine, received, liked] = await Promise.all([
        itemsService.getMine(),
        itemsService.getReceived(),
        itemsService.getLiked(),
      ]);
      setMyItems(mine);
      setReceivedItems(received);
      setLikedItems(liked);

      // Batch fetch aspect ratios to prevent glitching
      const allItems = [...mine, ...claimed, ...liked];
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
    // Refresh user in background without awaiting to avoid re-render during gesture
    refreshUser();
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
        return receivedItems;
      case "received":
        return receivedItems;
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
            <ThemedText
              variant="bold"
              style={{
                fontSize: 22,
                color: Colors.heading,
              }}
            >
              {user?.username || "Username"}
            </ThemedText>
            {user?.bio ? (
              <ThemedText
                style={{
                  fontSize: 13,
                  color: Colors.textSecondary,
                  marginTop: 3,
                }}
                numberOfLines={2}
              >
                {user.bio}
              </ThemedText>
            ) : null}

            {/* Tokens */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center" }}>
                <ThemedText variant="bold" style={{ fontSize: 9, color: Colors.primary, marginTop: -0.5 }}>$</ThemedText>
              </View>
              <ThemedText
                variant="semibold"
                style={{
                  fontSize: 15,
                  color: Colors.text,
                  marginLeft: 5,
                }}
              >
                {user?.tokenBalance ?? 0}
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 13,
                  color: Colors.textSecondary,
                  marginLeft: 3,
                }}
              >
                tokens
              </ThemedText>
            </View>

            {/* Rating — 5 stars, tappable to open reviews */}
            <Pressable
              onPress={() => router.push(`/reviews?userId=${user?._id}`)}
              style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const rating = 3.5;
                const fill = Math.min(1, Math.max(0, rating - (n - 1)));
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
              <ThemedText
                variant="semibold"
                style={{
                  fontSize: 14,
                  color: Colors.text,
                  marginLeft: 5,
                }}
              >
                3.5
              </ThemedText>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={Colors.textSecondary}
                style={{ marginLeft: 3 }}
              />
            </Pressable>
          </View>

          {/* Top-right icons */}
          <View style={{ flexDirection: "column", alignItems: "center", gap: 12, marginTop: -2 }}>
            <Pressable
              onPress={() => router.push("/transfer/qr-scan")}
              style={{ padding: 4 }}
            >
              <Ionicons name="scan-outline" size={24} color={Colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings")}
              style={{ padding: 4 }}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Subtab Bar (filing cabinet style) ── */}
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
            const isActive = activeTab === (tab.key as any);
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
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
                <ThemedText
                  variant={isActive ? "bold" : "medium"}
                  style={{
                    fontSize: 13,
                    color: isActive ? Colors.brown.dark : Colors.textSecondary,
                  }}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* ── Tab Content ── */}
        <View style={{ padding: 16, minHeight: 300 }}>
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
              <ThemedText
                variant="semibold"
                style={{
                  fontSize: 16,
                  color: Colors.textSecondary,
                }}
              >
                {emptyState?.message}
              </ThemedText>
            </View>
          ) : (
            (() => {
              // Split items into 2 columns using a "greedy" balancing algorithm
              const leftColumn: Item[] = [];
              const rightColumn: Item[] = [];
              let leftHeight = 0;
              let rightHeight = 0;

              tabData.forEach((item) => {
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

              const gap = 12;
              const columnWidth = (width - 32 - gap) / 2;

              const renderMasonryItem = (item: Item) => {
                const sourceUri = item.imageUrls && item.imageUrls.length > 0
                  ? item.imageUrls[0]
                  : "https://via.placeholder.com/300x400?text=No+Image";

                return (
                  <MasonryImage
                    key={item._id}
                    uri={sourceUri}
                    aspectRatio={aspectRatios[item._id]}
                    columnWidth={columnWidth}
                    onPress={() => router.push(`/item/${item._id}`)}
                  />
                );
              };

              return (
                <View style={{ flexDirection: "row", gap }}>
                  {/* Left Column */}
                  <View style={{ flex: 1 }}>
                    {leftColumn.map((item) => renderMasonryItem(item))}
                  </View>
                  {/* Right Column */}
                  <View style={{ flex: 1 }}>
                    {rightColumn.map((item) => renderMasonryItem(item))}
                  </View>
                </View>
              );
            })()
          )}
        </View>
      </ScrollView >
    </View >
  );
}
