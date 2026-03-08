import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Image,
  Pressable,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { Colors } from "../../constants/Colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONTAINER_HEIGHT = SCREEN_HEIGHT - 180;
const PADDING = 24;
const MIN_SIZE = 60;
const HANDLE_HIT = 32; // touch target size for corner handles

interface CropRect { x: number; y: number; w: number; h: number }

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
}

// Calculates where the image actually renders inside the container (letterboxed)
function getImageLayout(imgW: number, imgH: number) {
  if (!imgW || !imgH) return { x: 0, y: 0, w: SCREEN_WIDTH, h: CONTAINER_HEIGHT };
  const containerAR = SCREEN_WIDTH / CONTAINER_HEIGHT;
  const imageAR = imgW / imgH;
  let w: number, h: number;
  if (imageAR > containerAR) {
    w = SCREEN_WIDTH;
    h = SCREEN_WIDTH / imageAR;
  } else {
    h = CONTAINER_HEIGHT;
    w = CONTAINER_HEIGHT * imageAR;
  }
  return {
    x: (SCREEN_WIDTH - w) / 2,
    y: (CONTAINER_HEIGHT - h) / 2,
    w,
    h,
  };
}

type Corner = "tl" | "tr" | "bl" | "br";

function CornerHandle({
  corner,
  cropRect,
  imgLayout,
  onChange,
}: {
  corner: Corner;
  cropRect: CropRect;
  imgLayout: { x: number; y: number; w: number; h: number };
  onChange: (rect: CropRect) => void;
}) {
  const last = useRef({ x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        last.current = { ...cropRect };
      },
      onPanResponderMove: (_, gs) => {
        const { dx, dy } = gs;
        let { x, y, w, h } = last.current;

        const imgRight = imgLayout.x + imgLayout.w;
        const imgBottom = imgLayout.y + imgLayout.h;

        if (corner === "tl") {
          const newX = Math.max(imgLayout.x, Math.min(x + dx, x + w - MIN_SIZE));
          const newY = Math.max(imgLayout.y, Math.min(y + dy, y + h - MIN_SIZE));
          onChange({ x: newX, y: newY, w: w + (x - newX), h: h + (y - newY) });
        } else if (corner === "tr") {
          const newW = Math.max(MIN_SIZE, Math.min(w + dx, imgRight - x));
          const newY = Math.max(imgLayout.y, Math.min(y + dy, y + h - MIN_SIZE));
          onChange({ x, y: newY, w: newW, h: h + (y - newY) });
        } else if (corner === "bl") {
          const newX = Math.max(imgLayout.x, Math.min(x + dx, x + w - MIN_SIZE));
          const newH = Math.max(MIN_SIZE, Math.min(h + dy, imgBottom - y));
          onChange({ x: newX, y, w: w + (x - newX), h: newH });
        } else {
          const newW = Math.max(MIN_SIZE, Math.min(w + dx, imgRight - x));
          const newH = Math.max(MIN_SIZE, Math.min(h + dy, imgBottom - y));
          onChange({ x, y, w: newW, h: newH });
        }
      },
      onPanResponderRelease: () => {
        last.current = { ...cropRect };
      },
    })
  ).current;

  const posStyle = {
    tl: { top: -HANDLE_HIT / 2, left: -HANDLE_HIT / 2 },
    tr: { top: -HANDLE_HIT / 2, right: -HANDLE_HIT / 2 },
    bl: { bottom: -HANDLE_HIT / 2, left: -HANDLE_HIT / 2 },
    br: { bottom: -HANDLE_HIT / 2, right: -HANDLE_HIT / 2 },
  }[corner];

  const borderStyle = {
    tl: { borderTopWidth: 3, borderLeftWidth: 3 },
    tr: { borderTopWidth: 3, borderRightWidth: 3 },
    bl: { borderBottomWidth: 3, borderLeftWidth: 3 },
    br: { borderBottomWidth: 3, borderRightWidth: 3 },
  }[corner];

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.handle, posStyle, borderStyle]}
    />
  );
}

export default function ImageCropModal({
  visible,
  imageUri,
  onCancel,
  onDone,
}: ImageCropModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropRect, setCropRect] = useState<CropRect>({ x: PADDING, y: 0, w: SCREEN_WIDTH - PADDING * 2, h: SCREEN_WIDTH - PADDING * 2 });

  const imgLayout = getImageLayout(imageSize.width, imageSize.height);

  React.useEffect(() => {
    if (visible && imageUri) {
      Image.getSize(imageUri, (w, h) => {
        setImageSize({ width: w, height: h });
        const layout = getImageLayout(w, h);
        // Initial crop = full image area
        setCropRect({ x: layout.x, y: layout.y, w: layout.w, h: layout.h });
      });
    }
  }, [visible, imageUri]);

  const handleCropChange = useCallback((rect: CropRect) => {
    setCropRect(rect);
  }, []);

  async function handleCrop() {
    if (!imageSize.width || !imageSize.height) return;
    setLoading(true);
    try {
      // Map crop window (screen coords) → original image coords
      const scaleX = imageSize.width / imgLayout.w;
      const scaleY = imageSize.height / imgLayout.h;

      const relX = cropRect.x - imgLayout.x;
      const relY = cropRect.y - imgLayout.y;

      const originX = Math.max(0, Math.round(relX * scaleX));
      const originY = Math.max(0, Math.round(relY * scaleY));
      const cropW = Math.min(Math.round(cropRect.w * scaleX), imageSize.width - originX);
      const cropH = Math.min(Math.round(cropRect.h * scaleY), imageSize.height - originY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      onDone(result.uri);
    } catch {
      onDone(imageUri);
    } finally {
      setLoading(false);
    }
  }

  // Overlay rects surrounding the crop window
  const oy = cropRect.y;
  const ox = cropRect.x;
  const ow = cropRect.w;
  const oh = cropRect.h;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Crop Photo</Text>
          <Pressable
            onPress={handleCrop}
            style={[styles.headerButton, styles.doneButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.doneText}>Done</Text>
            )}
          </Pressable>
        </View>

        {/* Image + crop overlay */}
        <View style={styles.cropArea}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}

          {/* Dark overlay — 4 surrounding rects */}
          <View pointerEvents="none" style={[styles.overlayRect, { top: 0, left: 0, right: 0, height: oy }]} />
          <View pointerEvents="none" style={[styles.overlayRect, { top: oy, left: 0, width: ox, height: oh }]} />
          <View pointerEvents="none" style={[styles.overlayRect, { top: oy, left: ox + ow, right: 0, height: oh }]} />
          <View pointerEvents="none" style={[styles.overlayRect, { top: oy + oh, left: 0, right: 0, bottom: 0 }]} />

          {/* Crop window border + corner handles */}
          <View
            pointerEvents="box-none"
            style={[
              styles.cropWindow,
              { top: oy, left: ox, width: ow, height: oh },
            ]}
          >
            {/* Rule-of-thirds grid lines */}
            <View pointerEvents="none" style={[styles.gridLine, styles.gridV1]} />
            <View pointerEvents="none" style={[styles.gridLine, styles.gridV2]} />
            <View pointerEvents="none" style={[styles.gridLine, styles.gridH1]} />
            <View pointerEvents="none" style={[styles.gridLine, styles.gridH2]} />

            <CornerHandle corner="tl" cropRect={cropRect} imgLayout={imgLayout} onChange={handleCropChange} />
            <CornerHandle corner="tr" cropRect={cropRect} imgLayout={imgLayout} onChange={handleCropChange} />
            <CornerHandle corner="bl" cropRect={cropRect} imgLayout={imgLayout} onChange={handleCropChange} />
            <CornerHandle corner="br" cropRect={cropRect} imgLayout={imgLayout} onChange={handleCropChange} />
          </View>
        </View>

        <Text style={styles.hint}>Drag corners to crop</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Quicksand_600SemiBold",
  },
  cancelText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: "Quicksand_500Medium",
  },
  doneButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  doneText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Quicksand_600SemiBold",
  },
  cropArea: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: CONTAINER_HEIGHT,
  },
  image: {
    width: SCREEN_WIDTH,
    height: CONTAINER_HEIGHT,
  },
  overlayRect: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cropWindow: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  gridV1: { left: "33.3%", top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  gridV2: { left: "66.6%", top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  gridH1: { top: "33.3%", left: 0, right: 0, height: StyleSheet.hairlineWidth },
  gridH2: { top: "66.6%", left: 0, right: 0, height: StyleSheet.hairlineWidth },
  handle: {
    position: "absolute",
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    borderColor: "#FFFFFF",
  },
  hint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    paddingBottom: 40,
    fontFamily: "Quicksand_400Regular",
  },
});
