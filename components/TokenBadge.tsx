import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

interface TokenBadgeProps {
  balance: number;
  size?: "sm" | "lg";
}

export function TokenBadge({ balance, size = "sm" }: TokenBadgeProps) {
  const isLarge = size === "lg";

  return (
    <View
      className={`flex-row items-center bg-amber-50 rounded-full ${
        isLarge ? "px-4 py-2" : "px-3 py-1"
      }`}
    >
      <Ionicons
        name="star"
        size={isLarge ? 20 : 14}
        color={Colors.accent}
      />
      <Text
        className={`font-bold text-amber-600 ml-1 ${
          isLarge ? "text-xl" : "text-sm"
        }`}
      >
        {balance}
      </Text>
    </View>
  );
}
