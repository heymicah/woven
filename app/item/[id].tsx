import React, { useState, useRef, useCallback } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

// Palette: #FFD1D9, #E28D9B, #FAE5C4, #96755F, #411E12
const Palette = {
  pink: "#FFD1D9",
  rose: "#E28D9B",
  green: "#A8C9A8",
  cream: "#FAE5C4",
  brown: "#96755F",
  dark: "#411E12",
};

const MOCK_ITEMS: Record<
  string,
  {
    _id: string;
    title: string;
    description: string;
    size: string;
    condition: string;
    gender: string;
    imageUrls: string[];
    postedBy: { _id: string; username: string };
  }
> = {
  "1": {
    _id: "1",
    title: "Vintage Denim Jacket",
    description:
      "Classic 90s denim jacket in great condition. Perfect for layering in the fall or spring. Medium wash with subtle fading. No stains or tears. Fits true to size.",
    size: "M",
    condition: "Good",
    gender: "Unisex",
    imageUrls: [
      "https://picsum.photos/seed/denim1/600/800",
      "https://picsum.photos/seed/denim2/800/600",
      "https://picsum.photos/seed/denim3/600/600",
      "https://picsum.photos/seed/denim4/400/900",
      "https://picsum.photos/seed/denim5/900/400",
      "https://picsum.photos/seed/denim6/600/800",
    ],
    postedBy: { _id: "user1", username: "vintagefinds" },
  },
  "2": {
    _id: "2",
    title: "Floral Summer Dress",
    description:
      "Light and breezy floral print dress in a gorgeous watercolor pattern featuring soft pinks, lavenders, and sage green on a cream base. This dress is perfect for warm weather outings, garden parties, brunches, weddings, or just feeling your best on a sunny afternoon. I purchased this from a boutique last summer and only wore it twice, so it is in excellent shape with absolutely no signs of wear, stains, or damage.\n\nThe dress features a flattering A-line silhouette that falls just above the knee, making it versatile enough to dress up with heels or keep casual with sandals. The side zip closure makes it easy to slip on and off, and the fully lined interior means you never have to worry about sheerness. The fabric is a lightweight polyester-chiffon blend that drapes beautifully and moves with you as you walk, giving it that effortless flowy feel everyone loves.\n\nSizing runs true to a small. I typically wear a size 4 in most brands and this fit perfectly with just a little room in the waist for comfort. The bust area is lightly gathered which provides a nice shape without being too tight or restrictive. The straps are adjustable so you can customize the fit to your torso length, which I found really helpful.\n\nCare instructions are simple: machine wash cold on a gentle cycle and hang to dry. I would avoid putting it in the dryer as the heat can affect the chiffon overlay. I have washed it once following these instructions and it came out looking brand new with no fading or shrinkage whatsoever.\n\nI am selling this because I am doing a major closet cleanout and trying to simplify my wardrobe. It deserves to be worn and loved by someone who will get more use out of it than I did. It is such a beautiful piece and I always got compliments whenever I wore it. Multiple friends asked me where I got it and one even tried to buy it off me at a party.\n\nThis would pair wonderfully with a cropped cardigan or denim jacket for cooler evenings, or a simple pair of stud earrings and a clutch for a more polished look. The color palette is really versatile and works well with both gold and silver jewelry. I have also worn it with a wide belt to cinch the waist for a slightly different silhouette which looked amazing.\n\nHappy to answer any questions about fit, measurements, or styling. I can also provide additional photos from different angles if needed. Smoke-free and pet-free home. Would love for this dress to go to someone who will enjoy wearing it as much as I did.",
    size: "S",
    condition: "Like New",
    gender: "Women",
    imageUrls: [
      "https://picsum.photos/seed/floral1/600/800",
      "https://picsum.photos/seed/floral2/600/800",
      "https://picsum.photos/seed/floral3/600/800",
    ],
    postedBy: { _id: "user2", username: "summerstyle" },
  },
  "3": {
    _id: "3",
    title: "Wool Beanie",
    description:
      "Hand-knitted wool beanie in forest green. Brand new, never worn. One size fits most. Perfect for cold weather.",
    size: "One Size",
    condition: "New",
    gender: "Unisex",
    imageUrls: [
      "https://picsum.photos/seed/beanie1/600/800",
      "https://picsum.photos/seed/beanie2/600/800",
    ],
    postedBy: { _id: "user3", username: "knitcraft" },
  },
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const item = MOCK_ITEMS[id ?? "1"] ?? MOCK_ITEMS["1"];
  const images = item.imageUrls;
  const tags = [item.gender, `Size ${item.size}`, item.condition];

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
        <Pressable
          onPress={() => router.push(`/profile/${item.postedBy._id}`)}
          className="flex-row items-center mx-4 mt-4 p-3 rounded-xl"
          style={{ backgroundColor: "#FFF1DA" }}
        >
          <Ionicons name="person-circle" size={36} color={Palette.brown} />
          <Text className="text-sm font-medium ml-2" style={{ color: Palette.dark, fontFamily: "Quicksand_500Medium" }}>
            {item.postedBy.username}
          </Text>
          <View className="flex-1" />
          <Ionicons name="chevron-forward" size={16} color={Palette.brown} />
        </Pressable>

        {/* Description */}
        <View className="mx-4 mt-3 p-4 rounded-xl" style={{ backgroundColor: "#FFF1DA" }}>
          <Text className="text-sm leading-5" style={{ color: Palette.brown, fontFamily: "Quicksand_400Regular" }}>
            {item.description}
          </Text>
        </View>

        {/* Bottom spacing for scroll */}
        <View className="h-24" />
      </ScrollView>

      {/* Docked Message Button */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: Palette.cream }}>
        <View className="px-4 pb-4">
          <Pressable
            onPress={() => Alert.alert("Message", "Messaging coming soon!")}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: "#A8C9A8" }}
          >
            <Text className="font-semibold text-base" style={{ color: "#A8C9A8", fontFamily: "Quicksand_600SemiBold" }}>
              Message
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Fullscreen Photo Overlay */}
      <FullscreenImageModal
        visible={fullscreenVisible}
        uri={images[currentImageIndex]}
        onClose={() => setFullscreenVisible(false)}
      />
    </View>
  );
}
