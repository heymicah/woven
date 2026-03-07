import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { ItemCard } from "../../components/ItemCard";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";
import { Item, ItemStatus } from "../../types";
import { useRouter } from "expo-router";

type ProfileTab = "current" | "past" | "received" | "likes";

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "past", label: "Past" },
  { key: "received", label: "Received" },
  { key: "likes", label: "Likes" },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("current");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [claimedItems, setClaimedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mine, claimed] = await Promise.all([
        itemsService.getMine(),
        itemsService.getClaimed(),
      ]);
      setMyItems(mine);
      setClaimedItems(claimed);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

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
      case "likes":
        return [];
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
      case "received":
        return { icon: "bag-outline" as const, message: "No received items yet" };
      case "likes":
        return { icon: "heart-outline" as const, message: "No liked items yet" };
    }
  };

  const tabData = getTabData();
  const emptyState = getEmptyState();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
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
            backgroundColor: Colors.surface,
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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: Colors.text,
                  marginLeft: 5,
                }}
              >
                3.5
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

        {/* ── Subtab Bar (filing cabinet style) ── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: Colors.surface,
            paddingHorizontal: 12,
            paddingTop: 8,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
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
                  borderWidth: isActive ? 0 : 1,
                  borderBottomWidth: 0,
                  borderColor: Colors.border,
                  marginBottom: -1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#FFFFFF" : Colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
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
                <Ionicons name={emptyState.icon} size={32} color={Colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: Colors.textSecondary,
                }}
              >
                {emptyState.message}
              </Text>
              {activeTab === "likes" && (
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.accent,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  Tap the ♥ on items you love — they'll show up here!
                </Text>
              )}
            </View>
          ) : (
            tabData.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onPress={(i) => {
                  console.log("Pressed item:", i._id);
                }}
              />
            ))
          )}
        </View>
      </ScrollView >
    </View >
  );
}
