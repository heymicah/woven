import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "../../constants/Colors";
import {
  ItemCategory,
  ItemCondition,
  IntendedFit,
} from "../../types";
import { itemsService } from "../../services/items.service";
import { uploadService } from "../../services/upload.service";

// Components
import PhotoStrip from "../../components/post/PhotoStrip";
import ImageCropModal from "../../components/post/ImageCropModal";
import SizeSelector from "../../components/post/SizeSelector";
import PostButton from "../../components/post/PostButton";
import SingleSelectChipGroup from "../../components/SingleSelectChipGroup";

// ── Chip option builders ────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: ItemCategory.T_SHIRTS, label: "T-Shirts" },
  { value: ItemCategory.BLOUSES, label: "Blouses & Button-Ups" },
  { value: ItemCategory.SWEATERS, label: "Sweaters & Hoodies" },
  { value: ItemCategory.JACKETS, label: "Jackets & Coats" },
  { value: ItemCategory.JEANS, label: "Jeans" },
  { value: ItemCategory.PANTS, label: "Pants & Trousers" },
  { value: ItemCategory.SHORTS, label: "Shorts" },
  { value: ItemCategory.SKIRTS, label: "Skirts" },
  { value: ItemCategory.DRESSES, label: "Dresses" },
  { value: ItemCategory.ACTIVEWEAR, label: "Activewear" },
  { value: ItemCategory.SHOES, label: "Shoes" },
  { value: ItemCategory.BAGS, label: "Bags" },
  { value: ItemCategory.ACCESSORIES, label: "Hats & Accessories" },
];

const FIT_OPTIONS = [
  { value: IntendedFit.WOMEN, label: "Women" },
  { value: IntendedFit.MEN, label: "Men" },
  { value: IntendedFit.UNISEX, label: "Unisex" },
];

const CONDITION_OPTIONS = Object.values(ItemCondition).map((val) => ({
  value: val,
  label: val
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
}));

// ── Screen ──────────────────────────────────────────────────────

export default function PostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditMode = !!id;

  // Form state
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [intendedFit, setIntendedFit] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const scrollRef = useRef<ScrollView>(null);

  // Crop modal state
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const cropUri = cropIndex !== null ? photos[cropIndex] : "";

  // ── Derived validation ──────────────────────────────────────
  const isFormValid = useMemo(
    () =>
      photos.length > 0 &&
      title.trim().length > 0 &&
      category !== "" &&
      intendedFit !== "" &&
      size !== "" &&
      condition !== "",
    [photos, title, category, intendedFit, size, condition]
  );

  // ── Photo handlers ──────────────────────────────────────────
  const handleAddPhotos = useCallback(async () => {
    const remaining = 10 - photos.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris]);
    }
  }, [photos.length]);

  const handleDeletePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSetMain = useCallback((index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleCropPhoto = useCallback((index: number) => {
    setCropIndex(index);
  }, []);

  const handleCropDone = useCallback(
    (croppedUri: string) => {
      if (cropIndex !== null) {
        setPhotos((prev) =>
          prev.map((uri, i) => (i === cropIndex ? croppedUri : uri))
        );
      }
      setCropIndex(null);
    },
    [cropIndex]
  );

  const handleCropCancel = useCallback(() => {
    setCropIndex(null);
  }, []);

  // ── Load existing item for edit ─────────────────────────────
  useEffect(() => {
    if (id) {
      setInitialLoading(true);
      itemsService
        .getById(id)
        .then((item) => {
          setPhotos(item.imageUrls || []);
          setTitle(item.title);
          setCategory(item.category);
          setIntendedFit(item.intendedFit || "");
          setSize(item.size);
          setCondition(item.condition);
          setDescription(item.description || "");
        })
        .catch((err) => {
          console.error("[PostScreen] Fetch Error:", err);
          Alert.alert("Error", "Could not load item details for editing");
          router.back();
        })
        .finally(() => setInitialLoading(false));
    } else {
      // Clear form for "New Post"
      setPhotos([]);
      setTitle("");
      setCategory("");
      setIntendedFit("");
      setSize("");
      setCondition("");
      setDescription("");
      setInitialLoading(false);
    }
  }, [id, router]);

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Upload images to Cloudinary first
      console.log("[PostScreen] Uploading", photos.length, "images...");
      const imageUrls = await uploadService.uploadImages(photos);
      console.log("[PostScreen] Upload success, URLs:", imageUrls);

      // 2. Create or Update the item
      console.log("[PostScreen] Saving item...");
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        category: category as ItemCategory,
        size: size as any,
        condition: condition as ItemCondition,
        intendedFit: intendedFit as IntendedFit,
        imageUrls,
      };

      if (isEditMode) {
        await itemsService.update(id, itemData);
      } else {
        await itemsService.create(itemData);
      }

      // Clear form
      setPhotos([]);
      setTitle("");
      setCategory("");
      setIntendedFit("");
      setSize("");
      setCondition("");
      setDescription("");

      Alert.alert(isEditMode ? "Updated!" : "Posted!", isEditMode ? "Your item has been updated." : "Your item is now live.");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[PostScreen] ERROR:", error.message);
      console.error("[PostScreen] Response data:", JSON.stringify(error?.response?.data));
      console.error("[PostScreen] Response status:", error?.response?.status);
      Alert.alert(
        "Couldn't Post",
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFocusDescription = useCallback(() => {
    // Small delay to ensure keyboard is up on some devices, or just scroll
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200); // Increased delay for smoother transition
  }, []);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={[styles.scrollView, { backgroundColor: Colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {initialLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                {isEditMode && (
                  <Pressable
                    onPress={() => router.back()}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#FFF1DA",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                  </Pressable>
                )}
                <ThemedText variant="bold" style={[styles.heading, { marginBottom: 0 }]}>
                  {isEditMode ? "Edit Post" : "New Post"}
                </ThemedText>
              </View>

              {/* 1. Photos */}
              <PhotoStrip
                photos={photos}
                onAddPhotos={handleAddPhotos}
                onDeletePhoto={handleDeletePhoto}
                onCropPhoto={handleCropPhoto}
                onSetMain={handleSetMain}
                onReorder={handleReorder}
              />

              {/* 2. Title */}
              <View style={styles.fieldGroup}>
                <ThemedText variant="semibold" style={styles.fieldLabel}>Title<ThemedText style={{ color: Colors.error }}> *</ThemedText></ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Vintage denim jacket"
                  placeholderTextColor={Colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  returnKeyType="done"
                  accessibilityLabel="Item title"
                />
              </View>

              {/* 3. Category */}
              <SingleSelectChipGroup
                label="Category"
                options={CATEGORY_OPTIONS}
                selected={category}
                onSelect={setCategory}
                required
              />

              {/* 4. Intended Fit */}
              <SingleSelectChipGroup
                label="Intended Fit"
                options={FIT_OPTIONS}
                selected={intendedFit}
                onSelect={setIntendedFit}
                required
              />

              {/* 5. Size */}
              <SizeSelector selected={size} onSelect={setSize} />

              {/* 6. Condition */}
              <SingleSelectChipGroup
                label="Condition"
                options={CONDITION_OPTIONS}
                selected={condition}
                onSelect={setCondition}
                required
              />

              {/* 7. Description (optional) */}
              <View style={styles.fieldGroup}>
                <ThemedText variant="semibold" style={[styles.fieldLabel, styles.optionalLabel]}>
                  Description{" "}
                  <ThemedText style={styles.optionalHint}>(optional)</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Share details about fit, brand, material, wear…"
                  placeholderTextColor={Colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={1000}
                  onFocus={handleFocusDescription}
                  accessibilityLabel="Item description, optional"
                />
              </View>

            </>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* 8. Post button — sticky at bottom */}
        <PostButton
          disabled={!isFormValid}
          loading={isSubmitting}
          onPress={handleSubmit}
          label={isEditMode ? "Update Item" : "Post Item"}
        />

        {/* Crop modal */}
        <ImageCropModal
          visible={cropIndex !== null}
          imageUri={cropUri}
          onCancel={handleCropCancel}
          onDone={handleCropDone}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 75,
  },
  heading: {
    fontSize: 22,
    color: Colors.text,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 8,
  },
  optionalLabel: {
    marginBottom: 8,
  },
  optionalHint: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  textInput: {
    backgroundColor: "#FFF1DA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Quicksand_500Medium",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
});
