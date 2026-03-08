import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { Item } from "../../types";
import { itemsService } from "../../services/items.service";
import { MasonryImage } from "../../components/MasonryImage";
import { fetchAspectRatiosBatch } from "../../utils/image";

const DRAWER_HEIGHT = 400;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [aspectRatios, setAspectRatios] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolledToStart = useRef(false);

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
    fetchItems().then(() => {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: true });
      }, 300);
    });
  }, [fetchItems]);

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

  // Scroll past the drawer on first layout
  const handleContentSizeChange = useCallback(() => {
    if (!hasScrolledToStart.current) {
      scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: false });
      hasScrolledToStart.current = true;
    }
  }, []);

  const snapping = useRef(false);

  // Snap back to hide drawer when user releases
  const snapBackIfNeeded = useCallback((y: number) => {
    if (y < DRAWER_HEIGHT && !snapping.current && !refreshing) {
      snapping.current = true;
      scrollRef.current?.scrollTo({ y: DRAWER_HEIGHT, animated: true });
      setTimeout(() => { snapping.current = false; }, 500);
    }
  }, [refreshing]);

  const handleScrollEndDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapBackIfNeeded(e.nativeEvent.contentOffset.y);
  }, [snapBackIfNeeded]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapBackIfNeeded(e.nativeEvent.contentOffset.y);
  }, [snapBackIfNeeded]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: padding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        bounces={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Drawer image — hidden above the fold, revealed on pull-down */}
        <View style={{ height: DRAWER_HEIGHT, width: "100%", overflow: "hidden", marginHorizontal: -padding }}>
          <Image
            source={require("../../assets/drawer.jpg")}
            style={{ width: width, height: "100%" }}
            resizeMode="contain"
          />
        </View>

        {/* Main content */}
        <View style={{ paddingTop: insets.top + 16 }}>
          {loading ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 16, textAlign: "center", fontFamily: "Quicksand_400Regular" }}>
                {error}
              </Text>
            </View>
          ) : items.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 16, fontFamily: "Quicksand_400Regular" }}>No items found</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap }}>
              <View style={{ flex: 1 }}>
                {leftColumn.map((item) => renderItem(item))}
              </View>
              <View style={{ flex: 1 }}>
                {rightColumn.map((item) => renderItem(item))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
