import React, { useState, useRef } from "react";
import {
  View,
  Image,
  Pressable,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  State,
  PinchGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
  HandlerStateChangeEvent,
} from "react-native-gesture-handler";
import * as ImageManipulator from "expo-image-manipulator";
import { Colors } from "../../constants/Colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CROP_SIZE = SCREEN_WIDTH - 48; // square crop area with padding

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
}

export default function ImageCropModal({
  visible,
  imageUri,
  onCancel,
  onDone,
}: ImageCropModalProps) {
  const [loading, setLoading] = useState(false);

  // Track image position/scale for the crop
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Refs for gesture state tracking
  const baseScale = useRef(1);
  const baseTranslateX = useRef(0);
  const baseTranslateY = useRef(0);

  // Load image dimensions when modal opens
  React.useEffect(() => {
    if (visible && imageUri) {
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      baseScale.current = 1;
      baseTranslateX.current = 0;
      baseTranslateY.current = 0;
      Image.getSize(imageUri, (w, h) => {
        setImageSize({ width: w, height: h });
      });
    }
  }, [visible, imageUri]);

  function onPinchGestureEvent(event: PinchGestureHandlerGestureEvent) {
    const newScale = Math.max(0.5, Math.min(baseScale.current * event.nativeEvent.scale, 4));
    setScale(newScale);
  }

  function onPinchHandlerStateChange(event: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      baseScale.current = scale;
    }
  }

  function onPanGestureEvent(event: PanGestureHandlerGestureEvent) {
    setTranslateX(baseTranslateX.current + event.nativeEvent.translationX);
    setTranslateY(baseTranslateY.current + event.nativeEvent.translationY);
  }

  function onPanHandlerStateChange(event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      baseTranslateX.current = translateX;
      baseTranslateY.current = translateY;
    }
  }

  async function handleCrop() {
    if (imageSize.width === 0 || imageSize.height === 0) return;
    setLoading(true);
    try {
      // Calculate the displayed image size (fit to screen width)
      const aspectRatio = imageSize.width / imageSize.height;
      let displayW: number, displayH: number;

      if (aspectRatio > 1) {
        displayW = SCREEN_WIDTH * scale;
        displayH = (SCREEN_WIDTH / aspectRatio) * scale;
      } else {
        displayH = SCREEN_WIDTH * scale;
        displayW = SCREEN_WIDTH * aspectRatio * scale;
      }

      // Crop region center is the center of the crop overlay
      // Translate from display coords to original image coords
      const scaleToOriginalX = imageSize.width / displayW;
      const scaleToOriginalY = imageSize.height / displayH;

      // The crop square center in display space is at (SCREEN_WIDTH/2, centered vertically in the crop zone)
      // The image is offset by translateX/Y from its default centered position
      const cropCenterDisplayX = SCREEN_WIDTH / 2 - translateX;
      const cropCenterDisplayY = SCREEN_WIDTH / 2 - translateY;

      const originX = Math.max(0, (cropCenterDisplayX - CROP_SIZE / 2) * scaleToOriginalX);
      const originY = Math.max(0, (cropCenterDisplayY - CROP_SIZE / 2) * scaleToOriginalY);
      const cropW = Math.min(CROP_SIZE * scaleToOriginalX, imageSize.width - originX);
      const cropH = Math.min(CROP_SIZE * scaleToOriginalY, imageSize.height - originY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropW),
              height: Math.round(cropH),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      onDone(result.uri);
    } catch (error) {
      console.warn("Crop failed:", error);
      // Fall back to returning the original
      onDone(imageUri);
    } finally {
      setLoading(false);
    }
  }

  // Calculate display dimensions for the image
  const aspectRatio = imageSize.width / imageSize.height || 1;
  let imgDisplayW: number, imgDisplayH: number;
  if (aspectRatio > 1) {
    imgDisplayW = SCREEN_WIDTH;
    imgDisplayH = SCREEN_WIDTH / aspectRatio;
  } else {
    imgDisplayH = SCREEN_WIDTH;
    imgDisplayW = SCREEN_WIDTH * aspectRatio;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <GestureHandlerRootView style={styles.modalContainer}>
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

        {/* Crop area */}
        <View style={styles.cropArea}>
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}
          >
            <PinchGestureHandler
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <View style={styles.imageContainer}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: imgDisplayW,
                      height: imgDisplayH,
                      transform: [
                        { translateX },
                        { translateY },
                        { scale },
                      ],
                    }}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            </PinchGestureHandler>
          </PanGestureHandler>

          {/* Crop overlay — darkens everything outside the crop square */}
          <View style={styles.overlayContainer} pointerEvents="none">
            {/* Top */}
            <View style={[styles.overlayDark, { height: (SCREEN_HEIGHT - CROP_SIZE) / 2 - 80 }]} />
            {/* Middle row */}
            <View style={{ flexDirection: "row", height: CROP_SIZE }}>
              <View style={[styles.overlayDark, { width: 24 }]} />
              <View style={styles.cropWindow} />
              <View style={[styles.overlayDark, { width: 24 }]} />
            </View>
            {/* Bottom */}
            <View style={[styles.overlayDark, { flex: 1 }]} />
          </View>
        </View>

        <Text style={styles.hint}>Pinch to zoom, drag to reposition</Text>
      </GestureHandlerRootView>
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
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 180,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDark: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  cropWindow: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 4,
  },
  hint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    paddingBottom: 40,
    fontFamily: "Quicksand_400Regular",
  },
});
