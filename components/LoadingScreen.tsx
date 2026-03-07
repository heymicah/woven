import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Colors } from "../constants/Colors";

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text className="text-gray-400 mt-4 text-base">Loading...</Text>
    </View>
  );
}
