import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItemCategory, ItemCondition, ItemSize } from "../../types";
import { Colors } from "../../constants/Colors";

export default function PostScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [size, setSize] = useState<ItemSize | "">("");
  const [condition, setCondition] = useState<ItemCondition | "">("");

  async function handlePost() {
    if (!title || !description || !category || !size || !condition) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // TODO: Call itemsService.create() and handle image upload
    Alert.alert("Success", "Item posted! You earned 1 token.");
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Post an Item</Text>

      {/* TODO: Image picker */}
      <Pressable className="h-48 bg-white border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center mb-6">
        <Ionicons name="camera-outline" size={40} color={Colors.textSecondary} />
        <Text className="text-gray-400 mt-2">Add Photos</Text>
      </Pressable>

      <Text className="text-sm font-medium text-gray-700 mb-1">Title</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
        placeholder="e.g. Vintage Denim Jacket"
        value={title}
        onChangeText={setTitle}
      />

      <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
        placeholder="Describe the item..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text className="text-sm font-medium text-gray-700 mb-2">Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {Object.values(ItemCategory).map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full ${
              category === cat ? "bg-indigo-600" : "bg-white border border-gray-200"
            }`}
          >
            <Text
              className={`text-sm capitalize ${
                category === cat ? "text-white" : "text-gray-600"
              }`}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="text-sm font-medium text-gray-700 mb-2">Size</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {Object.values(ItemSize).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSize(s)}
            className={`px-4 py-2 rounded-full ${
              size === s ? "bg-indigo-600" : "bg-white border border-gray-200"
            }`}
          >
            <Text
              className={`text-sm ${
                size === s ? "text-white" : "text-gray-600"
              }`}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="text-sm font-medium text-gray-700 mb-2">Condition</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerStyle={{ gap: 8 }}
      >
        {Object.values(ItemCondition).map((c) => (
          <Pressable
            key={c}
            onPress={() => setCondition(c)}
            className={`px-4 py-2 rounded-full ${
              condition === c ? "bg-indigo-600" : "bg-white border border-gray-200"
            }`}
          >
            <Text
              className={`text-sm capitalize ${
                condition === c ? "text-white" : "text-gray-600"
              }`}
            >
              {c.replace("_", " ")}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={handlePost}
        className="bg-indigo-600 rounded-xl py-4 items-center mb-10"
      >
        <Text className="text-white font-semibold text-base">
          Post Item (+1 Token)
        </Text>
      </Pressable>
    </ScrollView>
  );
}
