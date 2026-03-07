import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItemCategory } from "../../types";
import { Colors } from "../../constants/Colors";

const CATEGORIES = Object.values(ItemCategory);

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // TODO: Implement search with itemsService.getAll({ search: query, category: selectedCategory })

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search items..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat ? null : cat)
            }
            className={`px-4 py-2 rounded-full ${
              selectedCategory === cat
                ? "bg-indigo-600"
                : "bg-white border border-gray-200"
            }`}
          >
            <Text
              className={`text-sm capitalize ${
                selectedCategory === cat ? "text-white font-medium" : "text-gray-600"
              }`}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* TODO: Display search results with FlatList of ItemCards */}
      <View className="flex-1 items-center justify-center">
        <Ionicons name="search-outline" size={48} color={Colors.border} />
        <Text className="text-gray-400 mt-4 text-base">
          Search for clothing items
        </Text>
      </View>
    </View>
  );
}
