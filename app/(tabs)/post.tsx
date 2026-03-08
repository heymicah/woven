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
} from "react-native";
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

const CATEGORY_OPTIONS = Object.values(ItemCategory).map((val) => ({
  value: val,
  label: val.charAt(0).toUpperCase() + val.slice(1),
}));

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
    if (isEditMode) {
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
    }
  }, [id, isEditMode]);

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
      {/* 1. Permanent beige ground footer at the absolute bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 110,
          backgroundColor: Colors.background,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={[styles.scrollView, { backgroundColor: "transparent" }]}
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
              <Text style={styles.heading}>{isEditMode ? "Edit Post" : "New Post"}</Text>

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
                <Text style={styles.fieldLabel}>Title</Text>
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
              />

              {/* 4. Intended Fit */}
              <SingleSelectChipGroup
                label="Intended Fit"
                options={FIT_OPTIONS}
                selected={intendedFit}
                onSelect={setIntendedFit}
              />

              {/* 5. Size */}
              <SizeSelector selected={size} onSelect={setSize} />

              {/* 6. Condition */}
              <SingleSelectChipGroup
                label="Condition"
                options={CONDITION_OPTIONS}
                selected={condition}
                onSelect={setCondition}
              />

              {/* 7. Description (optional) */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, styles.optionalLabel]}>
                  Description{" "}
                  <Text style={styles.optionalHint}>(optional)</Text>
                </Text>
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
          <View style={{ height: 150 }} />
        </ScrollView>

        {/* 8. Post button — sticky at bottom */}
        <PostButton
          disabled={!isFormValid}
          loading={isSubmitting}
          onPress={handleSubmit}
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
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
    fontFamily: "Quicksand_700Bold",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    fontFamily: "Quicksand_600SemiBold",
  },
  optionalLabel: {
    marginBottom: 8,
  },
  optionalHint: {
    fontWeight: "400",
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Quicksand_400Regular",
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
