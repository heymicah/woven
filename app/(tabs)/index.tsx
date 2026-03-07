import React from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Item, ItemCategory, ItemCondition, ItemSize, ItemStatus } from "../../types";

const MOCK_ITEMS: Item[] = [
  {
    _id: "1",
    title: "Vintage Denim Jacket",
    description: "Classic 90s denim jacket in great condition. Perfect for layering.",
    category: ItemCategory.OUTERWEAR,
    size: ItemSize.M,
    condition: ItemCondition.GOOD,
    imageUrls: [
      "https://picsum.photos/seed/denim1/600/800",
      "https://picsum.photos/seed/denim2/600/800",
      "https://picsum.photos/seed/denim3/600/800",
      "https://picsum.photos/seed/denim4/600/800",
      "https://picsum.photos/seed/denim5/600/800",
      "https://picsum.photos/seed/denim6/600/800",
    ],
    tokenCost: 1,
    status: ItemStatus.AVAILABLE,
    postedBy: "user1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "2",
    title: "Floral Summer Dress",
    description: "Light and breezy floral print dress. Great for warm weather.",
    category: ItemCategory.DRESSES,
    size: ItemSize.S,
    condition: ItemCondition.LIKE_NEW,
    imageUrls: [
      "https://picsum.photos/seed/floral1/600/800",
      "https://picsum.photos/seed/floral2/600/800",
      "https://picsum.photos/seed/floral3/600/800",
    ],
    tokenCost: 1,
    status: ItemStatus.AVAILABLE,
    postedBy: "user2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "3",
    title: "Wool Beanie",
    description: "Hand-knitted wool beanie in forest green.",
    category: ItemCategory.ACCESSORIES,
    size: ItemSize.ONE_SIZE,
    condition: ItemCondition.NEW,
    imageUrls: [
      "https://picsum.photos/seed/beanie1/600/800",
      "https://picsum.photos/seed/beanie2/600/800",
    ],
    tokenCost: 1,
    status: ItemStatus.AVAILABLE,
    postedBy: "user3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const items = MOCK_ITEMS;

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
    // This creates the asymmetrical Pinterest/masonry look
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
      >
        {items.length === 0 ? (
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
