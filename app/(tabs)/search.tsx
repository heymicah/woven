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
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
            placeholder="Search items..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
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

      {/* TODO: Display search results with FlatList of ItemCards */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="search-outline" size={48} color={Colors.border} />
        <Text style={{ color: Colors.textSecondary, marginTop: 16, fontSize: 16 }}>
          Search for clothing items
        </Text>
      </View>
    </View>
  );
}
