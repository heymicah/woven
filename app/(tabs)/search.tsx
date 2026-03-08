import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ItemCategory, Item } from "../../types";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";

const CATEGORIES = Object.values(ItemCategory);

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { width } = useWindowDimensions();
  const gap = 12;
  const padding = 16;
  const columnWidth = (width - padding * 2 - gap) / 2;

  const fetchItems = useCallback(async () => {
    const params: Record<string, string> = {};
    if (query.trim()) params.search = query.trim();
    if (selectedCategory) params.category = selectedCategory;

    // Only search if there's a query or a category filter
    if (!params.search && !params.category) {
      setItems([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await itemsService.getAll(params);
      setItems(data);
    } catch (err: any) {
      console.error("[Search] Failed to fetch items:", err.message);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  // Re-fetch when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchItems();
    }
  }, [selectedCategory]);

  // Split items into 2 columns for masonry layout
  const leftColumn: Item[] = [];
  const rightColumn: Item[] = [];
  items.forEach((item, index) => {
    if (index % 2 === 0) leftColumn.push(item);
    else rightColumn.push(item);
  });

  const renderItem = (item: Item) => {
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
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
            placeholder="Search items..."
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={fetchItems}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16, paddingVertical: 12, maxHeight: 56 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat ? null : cat)
            }
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: selectedCategory === cat ? Colors.primary : "white",
              borderWidth: 1,
              borderColor: selectedCategory === cat ? Colors.primary : "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                textTransform: "capitalize",
                color: selectedCategory === cat ? "white" : Colors.text,
                fontWeight: selectedCategory === cat ? "600" : "400",
              }}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !hasSearched ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <Ionicons name="search-outline" size={48} color={Colors.border} />
            <Text style={{ color: Colors.textSecondary, marginTop: 16, fontSize: 16 }}>
              Search for clothing items
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="shirt-outline" size={48} color={Colors.border} />
            <Text style={{ color: Colors.textSecondary, marginTop: 16, fontSize: 16 }}>
              No items found
            </Text>
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
      </ScrollView>
    </View>
  );
}
