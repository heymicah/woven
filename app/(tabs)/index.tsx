import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Item } from "../../types";
import { itemsService } from "../../services/items.service";

export default function ExploreScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const data = await itemsService.getAll();
      setItems(data);
    } catch (err: any) {
      console.error("[Explore] Failed to fetch items:", err.message);
      setError("Couldn't load items. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  // Split items into 2 columns for masonry layout
  const leftColumn: Item[] = [];
  const rightColumn: Item[] = [];

  items.forEach((item, index) => {
    if (index % 2 === 0) leftColumn.push(item);
    else rightColumn.push(item);
  });

  const { width } = useWindowDimensions();
  const gap = 12;
  const padding = 16;
  const columnWidth = (width - padding * 2 - gap) / 2;

  const renderItem = (item: Item) => {
    // Generate a pseudo-random height between 180 and 320 based on the item ID
    const hash = item._id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const height = 180 + (hash % 140);

    const sourceUri = item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls[0]
      : "https://via.placeholder.com/300x400?text=No+Image";

    return (
      <Pressable
        key={item._id}
        onPress={() => router.push(`/item/${item._id}`)}
        style={{
          width: columnWidth,
          height,
          marginBottom: gap,
          borderRadius: 16,
          backgroundColor: "#C4DBC4",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Image
          source={{ uri: sourceUri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding, paddingTop: 90, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 16, textAlign: "center" }}>
              {error}
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>No items found</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap }}>
            {/* Left Column */}
            <View style={{ flex: 1 }}>
              {leftColumn.map((item) => renderItem(item))}
            </View>
            {/* Right Column */}
            <View style={{ flex: 1 }}>
              {rightColumn.map((item) => renderItem(item))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
