import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import {
  ItemCategory,
  ItemCondition,
  IntendedFit,
} from "../../types";
import { itemsService } from "../../services/items.service";

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

  // Form state
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [intendedFit, setIntendedFit] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Build form data for the API
      const item = await itemsService.create({
        title: title.trim(),
        description: description.trim(),
        category: category as ItemCategory,
        size: size as any,
        condition: condition as ItemCondition,
        intendedFit: intendedFit as IntendedFit,
        imageUrls: photos, // URIs — server would handle upload in production
      });

      // Navigate to the newly created item
      router.replace(`/item/${item._id}`);
    } catch (error: any) {
      Alert.alert(
        "Couldn't Post",
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.heading}>New Post</Text>

        {/* 1. Photos */}
        <PhotoStrip
          photos={photos}
          onAddPhotos={handleAddPhotos}
          onDeletePhoto={handleDeletePhoto}
          onCropPhoto={handleCropPhoto}
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
            accessibilityLabel="Item description, optional"
          />
        </View>

        {/* Bottom spacer for the sticky button */}
        <View style={{ height: 24 }} />
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
    paddingTop: 8,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
