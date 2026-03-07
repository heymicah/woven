import React from "react";
import { View, FlatList, Text } from "react-native";
import { ItemCard } from "../../components/ItemCard";
import { Item, ItemCategory, ItemCondition, ItemSize, ItemStatus } from "../../types";

// TODO: Replace with real API call to itemsService.getAll()
const MOCK_ITEMS: Item[] = [
  {
    _id: "1",
    title: "Vintage Denim Jacket",
    description: "Classic 90s denim jacket in great condition. Perfect for layering.",
    category: ItemCategory.OUTERWEAR,
    size: ItemSize.M,
    condition: ItemCondition.GOOD,
    imageUrls: [],
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
    imageUrls: [],
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
    imageUrls: [],
    tokenCost: 1,
    status: ItemStatus.AVAILABLE,
    postedBy: "user3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ExploreScreen() {
  // TODO: Fetch items from API, add pull-to-refresh, pagination
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={MOCK_ITEMS}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={(i) => {
              // TODO: Navigate to item detail screen
              console.log("Pressed item:", i._id);
            }}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Discover Items
          </Text>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400 text-base">No items yet</Text>
          </View>
        }
      />
    </View>
  );
}
