import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";
import { ItemCard } from "../../components/ItemCard";
import { Item } from "../../types";

export default function CategorySearchScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const decodedCategory = decodeURIComponent(category || "");
  const [query, setQuery] = useState(decodedCategory);
  const [results, setResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const items = await itemsService.getAll({ search: searchQuery });
      setResults(items);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search when typing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Safe area spacer */}
      <View style={{ height: insets.top }} />

      {/* Search bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFF1DA",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 4,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <TextInput
          style={{
            flex: 1,
            color: Colors.text,
            fontSize: 16,
            paddingVertical: 0,
          }}
          placeholder="Search items..."
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          paddingBottom: insets.bottom + 16,
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {isSearching ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : results.length > 0 ? (
          results.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onPress={(i) => router.push(`/item/${i._id}`)}
            />
          ))
        ) : hasSearched ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons
              name="search-outline"
              size={56}
              color={Colors.textSecondary}
              style={{ opacity: 0.4, marginBottom: 14 }}
            />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: Colors.heading,
                textAlign: "center",
                marginBottom: 6,
                fontFamily: "Quicksand_600SemiBold",
              }}
            >
              No results found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                fontFamily: "Quicksand_400Regular",
              }}
            >
              No items match "{query}". Try a different search.
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons
              name="search-outline"
              size={56}
              color={Colors.textSecondary}
              style={{ opacity: 0.4, marginBottom: 14 }}
            />
            <Text
              style={{
                fontSize: 14,
                color: Colors.textSecondary,
                textAlign: "center",
                fontFamily: "Quicksand_400Regular",
              }}
            >
              Type something to search
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
