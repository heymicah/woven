import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  Dimensions,
  Modal,
  ViewToken,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { Item } from "../../types";
import { itemsService } from "../../services/items.service";

// Palette: #FFD1D9, #E28D9B, #FAE5C4, #96755F, #411E12
const Palette = {
  pink: "#FFD1D9",
  rose: "#E28D9B",
  green: "#A8C9A8",
  cream: "#FAE5C4",
  brown: "#96755F",
  dark: "#411E12",
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function FullscreenImageModal({
  visible,
  uri,
  onClose,
}: {
  visible: boolean;
  uri: string;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 }}
          resizeMode="contain"
        />
      </Pressable>
    </Modal>
  );
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    itemsService
      .getById(id)
      .then((data) => setItem(data))
      .catch((err) => {
        console.error("[ItemDetail] Failed to fetch item:", err.message);
        setError("Couldn't load this item.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentImageIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToImage = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Palette.cream, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Palette.green} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={{ flex: 1, backgroundColor: Palette.cream, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Palette.brown} />
        <Text style={{ color: Palette.brown, fontSize: 16, marginTop: 16, textAlign: "center" }}>
          {error || "Item not found"}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: Palette.green, fontWeight: "600", fontSize: 16 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const images = item.imageUrls || [];
  const postedBy = typeof item.postedBy === "object" && item.postedBy !== null
    ? item.postedBy as { _id: string; username: string }
    : null;
  const tags = [
    item.intendedFit ? item.intendedFit.charAt(0).toUpperCase() + item.intendedFit.slice(1) : null,
    item.size ? `Size ${item.size}` : null,
    item.condition ? item.condition.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : null,
  ].filter(Boolean) as string[];

  return (
    <View className="flex-1" style={{ backgroundColor: Palette.cream }}>
      <ScrollView className="flex-1" bounces={true}>
        {/* Header — Back & Share */}
        <View
          className="flex-row justify-between items-center px-3 pb-2"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: "#FFF1DA",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Palette.dark} />
          </Pressable>
          <Pressable
            onPress={() => Alert.alert("Share", "Sharing coming soon!")}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: "#FFF1DA",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Ionicons name="share-outline" size={20} color={Palette.dark} />
          </Pressable>
        </View>

        {/* Main Photo Carousel */}
        <View
          className="relative mx-4 rounded-2xl overflow-hidden"
          onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}
        >
          {images.length > 0 && carouselWidth > 0 ? (
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(_, i) => i.toString()}
              getItemLayout={(_, index) => ({
                length: carouselWidth,
                offset: carouselWidth * index,
                index,
              })}
              renderItem={({ item: uri }) => (
                <Pressable onPress={() => setFullscreenVisible(true)}>
                  <View style={{ width: carouselWidth, aspectRatio: 3 / 4, backgroundColor: Palette.cream }}>
                    <Image
                      source={{ uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </View>
                </Pressable>
              )}
            />
          ) : (
            <View
              className="w-full bg-gray-200 items-center justify-center"
              style={{ aspectRatio: 3 / 4 }}
            >
              <Ionicons name="shirt-outline" size={64} color={Colors.textSecondary} />
            </View>
          )}

          {/* Page Indicator */}
          {images.length > 1 && (
            <View className="absolute bottom-14 left-0 right-0 flex-row justify-center" style={{ gap: 6 }}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: currentImageIndex === i ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: currentImageIndex === i ? Palette.green : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </View>
          )}

          {/* Heart Button */}
          <Pressable
            onPress={() => setLiked(!liked)}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: "#FFF1DA",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? Palette.green : Palette.dark}
            />
          </Pressable>
        </View>

        {/* Thumbnail Strip — all images */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {images.map((uri, index) => (
              <Pressable key={index} onPress={() => scrollToImage(index)}>
                <Image
                  source={{ uri }}
                  className="w-16 h-16 rounded-lg"
                  style={
                    currentImageIndex === index
                      ? { borderWidth: 2, borderColor: Palette.green }
                      : { borderWidth: 1, borderColor: "#E5E7EB" }
                  }
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Product Name */}
        <View className="px-4 pt-1">
          <Text className="text-xl font-bold" style={{ color: Palette.dark, fontFamily: "Quicksand_700Bold" }}>
            {item.title}
          </Text>
        </View>

        {/* Pill Tags */}
        <View className="flex-row px-4 pt-3 gap-2">
          {tags.map((tag) => (
            <View
              key={tag}
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: Palette.brown }}
            >
              <Text className="text-xs" style={{ color: "#FFFFFF", fontFamily: "Quicksand_600SemiBold" }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        {/* Seller Profile */}
        {postedBy && (
          <Pressable
            onPress={() => router.push(`/profile/${postedBy._id}`)}
            className="flex-row items-center mx-4 mt-4 p-3 rounded-xl"
            style={{ backgroundColor: "#FFF1DA" }}
          >
            <Ionicons name="person-circle" size={36} color={Palette.brown} />
            <Text className="text-sm font-medium ml-2" style={{ color: Palette.dark, fontFamily: "Quicksand_500Medium" }}>
              {postedBy.username}
            </Text>
            <View className="flex-1" />
            <Ionicons name="chevron-forward" size={16} color={Palette.brown} />
          </Pressable>
        )}

        {/* Description */}
        {item.description ? (
          <View className="mx-4 mt-3 p-4 rounded-xl" style={{ backgroundColor: "#FFF1DA" }}>
            <Text className="text-sm leading-5" style={{ color: Palette.brown, fontFamily: "Quicksand_400Regular" }}>
              {item.description}
            </Text>
          </View>
        ) : null}

        {/* Bottom spacing for scroll */}
        <View className="h-48" />
      </ScrollView>

      {/* Floating Message Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
        }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => Alert.alert("Message", "Messaging coming soon!")}
          className="rounded-full py-4 items-center"
          style={{
            backgroundColor: Palette.green,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            className="font-semibold text-base"
            style={{ color: Palette.dark, fontFamily: "Quicksand_600SemiBold" }}
          >
            Message
          </Text>
        </Pressable>
      </View>

      {/* Fullscreen Photo Overlay */}
      <FullscreenImageModal
        visible={fullscreenVisible}
        uri={images[currentImageIndex] || ""}
        onClose={() => setFullscreenVisible(false)}
      />
    </View>
  );
}
