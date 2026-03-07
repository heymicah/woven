import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { TokenBadge } from "../../components/TokenBadge";
import { Colors } from "../../constants/Colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="items-center pt-8 pb-6 bg-white">
        {/* TODO: Replace with actual avatar image */}
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4">
          <Ionicons name="person" size={40} color={Colors.textSecondary} />
        </View>
        <Text className="text-xl font-bold text-gray-900">
          {user?.username || "Username"}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {user?.email || "email@example.com"}
        </Text>
        <View className="mt-3">
          <TokenBadge balance={user?.tokenBalance ?? 0} size="lg" />
        </View>
      </View>

      {/* TODO: Show user's listed items */}
      <View className="mt-6 px-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">My Listings</Text>
        <View className="bg-white rounded-xl items-center py-10">
          <Ionicons name="shirt-outline" size={32} color={Colors.border} />
          <Text className="text-gray-400 mt-2">No listings yet</Text>
        </View>
      </View>

      {/* TODO: Show user's claimed items */}
      <View className="mt-6 px-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Claimed Items</Text>
        <View className="bg-white rounded-xl items-center py-10">
          <Ionicons name="bag-outline" size={32} color={Colors.border} />
          <Text className="text-gray-400 mt-2">No claimed items</Text>
        </View>
      </View>

      <Pressable
        onPress={logout}
        className="mx-4 mt-8 mb-10 border border-red-200 rounded-xl py-4 items-center"
      >
        <Text className="text-red-500 font-semibold">Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}
