import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item } from "../types";
import { Colors } from "../constants/Colors";

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-100"
    >
      {/* TODO: Replace placeholder with actual image */}
      <View className="h-48 bg-gray-200 items-center justify-center">
        {item.imageUrls.length > 0 ? (
          <Image
            source={{ uri: item.imageUrls[0] }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="shirt-outline" size={48} color={Colors.textSecondary} />
        )}
      </View>
      <View className="p-3">
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
          {item.description}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-gray-400 capitalize">{item.size}</Text>
            <Text className="text-xs text-gray-300">|</Text>
            <Text className="text-xs text-gray-400 capitalize">
              {item.condition.replace("_", " ")}
            </Text>
          </View>
          <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-full">
            <Ionicons name="star" size={12} color={Colors.accent} />
            <Text className="text-xs font-medium text-amber-600 ml-1">
              {item.tokenCost}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
