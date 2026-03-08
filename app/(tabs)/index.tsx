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
import { MasonryImage } from "../../components/MasonryImage";
import { fetchAspectRatiosBatch } from "../../utils/image";

export default function ExploreScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [aspectRatios, setAspectRatios] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const data = await itemsService.getAll();
      setItems(data);

      // Batch fetch aspect ratios to prevent glitching
      const uris = data.map(item => item.imageUrls?.[0]).filter((u): u is string => !!u);
      const ratiosMap = await fetchAspectRatiosBatch(uris);
      setAspectRatios(prev => ({ ...prev, ...ratiosMap }));
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

  // Split items into 2 columns using a "greedy" balancing algorithm
  const leftColumn: Item[] = [];
  const rightColumn: Item[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.forEach((item) => {
    const ratio = aspectRatios[item._id] || 1;
    const heightWeight = 1 / ratio; // Estimated relative height

    if (leftHeight <= rightHeight) {
      leftColumn.push(item);
      leftHeight += heightWeight;
    } else {
      rightColumn.push(item);
      rightHeight += heightWeight;
    }
  });

  const { width } = useWindowDimensions();
  const gap = 12;
  const padding = 16;
  const columnWidth = (width - padding * 2 - gap) / 2;

  const renderItem = (itemData: Item) => {
    const photoUri = itemData.imageUrls && itemData.imageUrls.length > 0
      ? itemData.imageUrls[0]
      : "https://via.placeholder.com/300x400?text=No+Image";

    return (
      <MasonryImage
        key={itemData._id}
        uri={photoUri}
        aspectRatio={aspectRatios[itemData._id]}
        columnWidth={columnWidth}
        onPress={() => router.push(`/item/${itemData._id}`)}
      />
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
