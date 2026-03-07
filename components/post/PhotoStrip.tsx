import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  ScrollView,
  Text,
  Alert,
  StyleSheet,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

const MAX_PHOTOS = 10;
const THUMB_SIZE = 80;

interface PhotoStripProps {
  photos: string[]; // array of local URIs
  onAddPhotos: () => void;
  onDeletePhoto: (index: number) => void;
  onCropPhoto: (index: number) => void;
  onSetMain: (index: number) => void;
}

export default function PhotoStrip({
  photos,
  onAddPhotos,
  onDeletePhoto,
  onCropPhoto,
  onSetMain,
}: PhotoStripProps) {
  // Show actions when tapping a thumbnail
  function handleThumbnailPress(index: number) {
    const isMain = index === 0;
    if (Platform.OS === "ios") {
      const options = isMain
        ? ["Crop", "Delete", "Cancel"]
        : ["Set as Main", "Crop", "Delete", "Cancel"];
      const destructiveButtonIndex = isMain ? 1 : 2;
      const cancelButtonIndex = isMain ? 2 : 3;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: isMain ? "Main Photo" : `Photo ${index + 1}`,
        },
        (buttonIndex) => {
          if (!isMain) {
            if (buttonIndex === 0) onSetMain(index);
            if (buttonIndex === 1) onCropPhoto(index);
            if (buttonIndex === 2) onDeletePhoto(index);
          } else {
            if (buttonIndex === 0) onCropPhoto(index);
            if (buttonIndex === 1) onDeletePhoto(index);
          }
        }
      );
    } else {
      // Android fallback
      const actions: any[] = [];
      if (!isMain) {
        actions.push({ text: "Set as Main", onPress: () => onSetMain(index) });
      }
      actions.push(
        { text: "Crop", onPress: () => onCropPhoto(index) },
        { text: "Delete", style: "destructive", onPress: () => onDeletePhoto(index) },
        { text: "Cancel", style: "cancel" }
      );
      Alert.alert(
        isMain ? "Main Photo" : `Photo ${index + 1}`,
        "Choose an action",
        actions
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Photos{" "}
        <Text style={styles.counter}>
          {photos.length}/{MAX_PHOTOS}
        </Text>
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
      >
        {/* Existing photos */}
        {photos.map((uri, index) => (
          <Pressable
            key={`photo-${index}`}
            onPress={() => handleThumbnailPress(index)}
            style={[
              styles.thumbnail,
              index === 0 && styles.thumbnailMain,
            ]}
            accessibilityLabel={
              index === 0
                ? "Main photo, tap to edit"
                : `Photo ${index + 1}, tap to edit`
            }
          >
            <Image source={{ uri }} style={styles.thumbnailImage} />
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
          </Pressable>
        ))}

        {/* Add photo tile */}
        {photos.length < MAX_PHOTOS && (
          <Pressable
            onPress={onAddPhotos}
            style={styles.addTile}
            accessibilityLabel="Add photo"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={28} color={Colors.textSecondary} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    fontFamily: "Quicksand_600SemiBold",
  },
  counter: {
    fontWeight: "400",
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Quicksand_400Regular",
  },
  stripContent: {
    gap: 10,
    paddingRight: 4,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  thumbnailMain: {
    borderWidth: 2.5,
    borderColor: Colors.secondary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mainBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(226, 141, 155, 0.85)",
    paddingVertical: 2,
    alignItems: "center",
  },
  mainBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Quicksand_700Bold",
  },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#FFF1DA",
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: "Quicksand_500Medium",
  },
});
