import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Item } from "../../types";
import { itemsService } from "../../services/items.service";
import { MasonryImage } from "../../components/MasonryImage";
import { fetchAspectRatiosBatch } from "../../utils/image";

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  // Masonry columns
  const leftCol: Item[] = [];
  const rightCol: Item[] = [];
  let lh = 0, rh = 0;
  items.forEach((item) => {
    const hw = 1 / (aspectRatios[item._id] || 1);
    if (lh <= rh) { leftCol.push(item); lh += hw; }
    else { rightCol.push(item); rh += hw; }
  });

  const { width } = useWindowDimensions();
  const gap = 12;
  const padding = 16;
  const colW = (width - padding * 2 - gap) / 2;

  const renderItem = (d: Item) => (
    <MasonryImage
      key={d._id}
      uri={d.imageUrls?.[0] ?? "https://via.placeholder.com/300x400?text=No+Image"}
      aspectRatio={aspectRatios[d._id]}
      columnWidth={colW}
      onPress={() => router.push(`/item/${d._id}`)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding, paddingTop: insets.top + 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 100 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingTop: 100 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 16, textAlign: "center", fontFamily: "Quicksand_400Regular" }}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 100 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 16, fontFamily: "Quicksand_400Regular" }}>No items found</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap }}>
            <View style={{ flex: 1 }}>{leftCol.map(renderItem)}</View>
            <View style={{ flex: 1 }}>{rightCol.map(renderItem)}</View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
