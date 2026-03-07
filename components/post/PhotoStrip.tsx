import React, { useRef, useState } from "react";
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
  PanResponder,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

const MAX_PHOTOS = 10;
const THUMB_SIZE = 80;
const GAP = 10;
const ITEM_W = THUMB_SIZE + GAP;

interface PhotoStripProps {
  photos: string[];
  onAddPhotos: () => void;
  onDeletePhoto: (index: number) => void;
  onCropPhoto: (index: number) => void;
  onSetMain: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

interface DraggableThumbProps {
  uri: string;
  index: number;
  total: number;
  isMain: boolean;
  draggingIndex: number | null;
  hoverIndex: number | null;
  onReorder: (from: number, to: number) => void;
  onPress: () => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onHoverChange: (index: number) => void;
}

function DraggableThumb({
  uri,
  index,
  total,
  isMain,
  draggingIndex,
  hoverIndex,
  onReorder,
  onPress,
  onDragStart,
  onDragEnd,
  onHoverChange,
}: DraggableThumbProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isDragging = draggingIndex === index;
  const isAnyDragging = draggingIndex !== null;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activated = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => activated.current,

      onPanResponderGrant: () => {
        activated.current = false;
        longPressTimer.current = setTimeout(() => {
          activated.current = true;
          onDragStart(index);
          Animated.spring(scale, {
            toValue: 1.08,
            useNativeDriver: true,
          }).start();
        }, 300);
      },

      onPanResponderMove: (_, gs) => {
        if (!activated.current) return;
        pan.setValue({ x: gs.dx, y: 0 });
        const newHover = Math.min(
          Math.max(0, Math.round(index + gs.dx / ITEM_W)),
          total - 1
        );
        onHoverChange(newHover);
      },

      onPanResponderRelease: (_, gs) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (!activated.current) {
          onPress();
          return;
        }
        activated.current = false;
        const to = Math.min(
          Math.max(0, Math.round(index + gs.dx / ITEM_W)),
          total - 1
        );
        // Reset transforms and state before reordering so no stale shifts
        pan.setValue({ x: 0, y: 0 });
        scale.setValue(1);
        onDragEnd();
        if (to !== index) onReorder(index, to);
      },

      onPanResponderTerminate: () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        activated.current = false;
        pan.setValue({ x: 0, y: 0 });
        scale.setValue(1);
        onDragEnd();
      },
    })
  ).current;

  // Compute shift for non-dragged items
  let shift = 0;
  if (draggingIndex !== null && hoverIndex !== null && draggingIndex !== index) {
    if (draggingIndex < hoverIndex && index > draggingIndex && index <= hoverIndex) {
      shift = -ITEM_W;
    } else if (draggingIndex > hoverIndex && index >= hoverIndex && index < draggingIndex) {
      shift = ITEM_W;
    }
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.thumbnail,
        isMain && styles.thumbnailMain,
        isDragging && styles.thumbnailDragging,
        {
          transform: isDragging
            ? [{ translateX: pan.x }, { scale }]
            : [{ translateX: shift }, { scale: isAnyDragging ? 0.95 : 1 }],
          zIndex: isDragging ? 10 : 1,
          opacity: !isDragging && isAnyDragging ? 0.7 : 1,
        },
      ]}
    >
      <Image source={{ uri }} style={styles.thumbnailImage} />
      {isMain && (
        <View style={styles.mainBadge}>
          <Text style={styles.mainBadgeText}>Main</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function PhotoStrip({
  photos,
  onAddPhotos,
  onDeletePhoto,
  onCropPhoto,
  onSetMain,
  onReorder,
}: PhotoStripProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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
        scrollEnabled={draggingIndex === null}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
      >
        {photos.map((uri, index) => (
          <DraggableThumb
            key={`photo-${index}`}
            uri={uri}
            index={index}
            total={photos.length}
            isMain={index === 0}
            draggingIndex={draggingIndex}
            hoverIndex={hoverIndex}
            onReorder={onReorder}
            onPress={() => handleThumbnailPress(index)}
            onDragStart={setDraggingIndex}
            onDragEnd={() => { setDraggingIndex(null); setHoverIndex(null); }}
            onHoverChange={setHoverIndex}
          />
        ))}

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
  thumbnailDragging: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
