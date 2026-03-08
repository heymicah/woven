import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
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

const DRAWER_HEIGHT = 400;

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width, height: screenHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>("current");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [claimedItems, setClaimedItems] = useState<Item[]>([]);
  const [likedItems, setLikedItems] = useState<Item[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolledToStart = useRef(false);

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
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: true });
    }, 300);
  }, [fetchData]);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    if (!hasScrolledToStart.current) {
      scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: false });
      hasScrolledToStart.current = true;
    }
  }, []);

  const snapping = useRef(false);

  const snapBackIfNeeded = useCallback((y: number) => {
    if (y < DRAWER_HEIGHT && !snapping.current && !refreshing) {
      snapping.current = true;
      scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: true });
      // Refresh after snap-back animation completes
      setTimeout(() => {
        snapping.current = false;
        fetchData();
      }, 500);
    }
  }, [refreshing, fetchData]);

  const handleScrollEndDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapBackIfNeeded(e.nativeEvent.contentOffset.y);
  }, [snapBackIfNeeded]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapBackIfNeeded(e.nativeEvent.contentOffset.y);
  }, [snapBackIfNeeded]);

  // When tab changes, ensure drawer stays hidden
  useEffect(() => {
    if (hasScrolledToStart.current) {
      scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: false });
    }
  }, [activeTab]);

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
        ref={scrollRef}
        contentOffset={{ x: 0, y: DRAWER_HEIGHT }}
        onContentSizeChange={handleContentSizeChange}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Drawer image — hidden above the fold, revealed on pull-down */}
        <View style={{ height: DRAWER_HEIGHT, width: "100%", overflow: "hidden" }}>
          <Image
            source={require("../../assets/drawer.jpg")}
            style={{ width: width, height: "100%" }}
            resizeMode="contain"
          />
        </View>

        {/* Wrapper — minHeight ensures ScrollView can always scroll past the drawer */}
        <View style={{ minHeight: screenHeight, flexDirection: "column" }}>

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
                fontFamily: "Quicksand_700Bold",
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
                  fontFamily: "Quicksand_400Regular",
                }}
                numberOfLines={2}
              >
                {user.bio}
              </Text>
            ) : null}

            {/* Tokens */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 9, fontWeight: "800", color: Colors.primary, marginTop: -0.5, fontFamily: "Quicksand_700Bold" }}>$</Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: Colors.text,
                  marginLeft: 5,
                  fontFamily: "Quicksand_600SemiBold",
                }}
              >
                {user?.tokenBalance ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.textSecondary,
                  marginLeft: 3,
                  fontFamily: "Quicksand_500Medium",
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
                  fontFamily: "Quicksand_600SemiBold",
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
                  backgroundColor: isActive ? "#E9D2B3" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? Colors.brown.dark : Colors.textSecondary,
                    fontFamily: isActive ? "Quicksand_700Bold" : "Quicksand_500Medium",
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Tab Content (fixed window with internal scroll) ── */}
        <View style={{
          flex: 1,
          marginHorizontal: 16,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor: Colors.brown.dark,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          overflow: "hidden",
          marginBottom: 110,
          backgroundColor: "#E9D2B3",
        }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
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
          </ScrollView>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}
