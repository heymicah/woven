import React from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900 ml-3">Profile</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="person-circle" size={80} color="#9CA3AF" />
        <Text className="text-gray-500 mt-4">User {id}</Text>
        <Text className="text-gray-400 text-sm mt-1">Profile page coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
