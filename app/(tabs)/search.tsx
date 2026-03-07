import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Keyboard,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { Colors } from "../../constants/Colors";

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT = 10;

const CATEGORIES = [
  "Recently Added",
  "T-Shirts",
  "Blouses & Button-Ups",
  "Sweaters & Hoodies",
  "Jackets & Coats",
  "Jeans",
  "Pants & Trousers",
  "Shorts",
  "Skirts",
  "Dresses",
  "Activewear",
  "Shoes",
  "Bags",
  "Hats & Accessories",
];

async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addRecentSearch(term: string): Promise<string[]> {
  const recent = await getRecentSearches();
  const filtered = recent.filter((s) => s.toLowerCase() !== term.toLowerCase());
  const updated = [term, ...filtered].slice(0, MAX_RECENT);
  await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

async function removeRecentSearch(term: string): Promise<string[]> {
  const recent = await getRecentSearches();
  const updated = recent.filter((s) => s !== term);
  await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 16;
  const gap = 12;
  const buttonWidth = (screenWidth - horizontalPadding * 2 - gap) / 2;

  // Load recent searches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getRecentSearches().then(setRecentSearches);
    }, [])
  );

  const navigateToSearch = async (searchTerm: string) => {
    Keyboard.dismiss();
    setIsFocused(false);
    const updated = await addRecentSearch(searchTerm);
    setRecentSearches(updated);
    router.push(`/search/${encodeURIComponent(searchTerm)}`);
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) {
      navigateToSearch(trimmed);
    }
  };

  const handleCategoryPress = (category: string) => {
    navigateToSearch(category);
  };

  const handleRecentPress = (term: string) => {
    setQuery(term);
    navigateToSearch(term);
  };

  const handleRemoveRecent = async (term: string) => {
    const updated = await removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleCancelFocus = () => {
    Keyboard.dismiss();
    setIsFocused(false);
    setQuery("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Search Bar - always on top */}
      <View
        style={{
          paddingHorizontal: horizontalPadding,
          paddingTop: insets.top + 16,
          paddingBottom: 8,
          backgroundColor: Colors.background,
          zIndex: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFF1DA",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 14,
            }}
          >
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={{ marginTop: 2 }} />
            <TextInput
              ref={inputRef}
              style={{
                flex: 1,
                marginLeft: 8,
                color: Colors.text,
                fontSize: 16,
                lineHeight: 22,
              }}
              placeholder="Search items..."
              placeholderTextColor={Colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {isFocused && (
            <TouchableOpacity onPress={handleCancelFocus} style={{ marginLeft: 12 }}>
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 15,
                  fontFamily: "Quicksand_500Medium",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Searches Overlay */}
      {isFocused && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.background,
            zIndex: 5,
            paddingTop: insets.top + 16 + 60,
            paddingHorizontal: horizontalPadding,
          }}
          onPress={handleCancelFocus}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {recentSearches.length > 0 ? (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: Colors.textSecondary,
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontFamily: "Quicksand_600SemiBold",
                  }}
                >
                  Recent Searches
                </Text>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => handleRecentPress(term)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 13,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={Colors.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.text,
                        fontFamily: "Quicksand_500Medium",
                      }}
                    >
                      {term}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveRecent(term)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Ionicons
                  name="time-outline"
                  size={40}
                  color={Colors.textSecondary}
                  style={{ opacity: 0.4, marginBottom: 10 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: Colors.textSecondary,
                    fontFamily: "Quicksand_400Regular",
                  }}
                >
                  No recent searches
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      )}

      {/* Category Grid - shown when not focused */}
      {!isFocused && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: gap,
            }}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
                style={{
                  width: buttonWidth,
                  backgroundColor: "#FFF1DA",
                  paddingVertical: 20,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontWeight: "600",
                    textAlign: "center",
                    fontFamily: "Quicksand_600SemiBold",
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
