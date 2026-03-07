import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ItemCategory, ItemCondition, ItemSize } from "../../types";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";
import { uploadService } from "../../services/upload.service";

export default function PostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [size, setSize] = useState<ItemSize | "">("");
  const [condition, setCondition] = useState<ItemCondition | "">("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setImageUris((prev) => [...prev, ...newUris].slice(0, 6));
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  async function handlePost() {
    if (!title || !description || !category || !size || !condition) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setPosting(true);
    try {
      let imageUrls: string[] = [];
      if (imageUris.length > 0) {
        imageUrls = await uploadService.uploadImages(imageUris);
      }

      await itemsService.create({
        title,
        description,
        category: category as ItemCategory,
        size: size as ItemSize,
        condition: condition as ItemCondition,
        imageUrls,
      });

      Alert.alert("Success", "Item posted! You earned 1 token.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);

      setTitle("");
      setDescription("");
      setCategory("");
      setSize("");
      setCondition("");
      setImageUris([]);
    } catch {
      Alert.alert("Error", "Failed to post item. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Post an Item</Text>

      {/* Image picker */}
      {imageUris.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {imageUris.map((uri, index) => (
            <View key={index} style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden" }}>
              <Image source={{ uri }} style={{ width: 100, height: 100 }} />
              <Pressable
                onPress={() => removeImage(index)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {imageUris.length < 6 && (
            <Pressable
              onPress={pickImages}
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: Colors.textSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={28} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          onPress={pickImages}
          className="h-48 bg-white border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center mb-6"
        >
          <Ionicons name="camera-outline" size={40} color={Colors.textSecondary} />
          <Text className="text-gray-400 mt-2">Add Photos (up to 6)</Text>
        </Pressable>
      )}

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
        disabled={posting}
        className="bg-indigo-600 rounded-xl py-4 items-center mb-10"
        style={{ opacity: posting ? 0.6 : 1 }}
      >
        {posting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            Post Item (+1 Token)
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
