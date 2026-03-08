import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  Share,
  Dimensions,
  Modal,
  ActivityIndicator,
  ViewToken,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { messagesService } from "../../services/messages.service";
import { itemsService } from "../../services/items.service";
import { reviewsService } from "../../services/reviews.service";
import { Item, User } from "../../types";

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
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    itemsService
      .getById(id)
      .then((data) => {
        setItem(data);
        if (user?.likedItems?.includes(id)) {
          setIsLiked(true);
        }
        if (data.status === "completed") {
          reviewsService.checkExists(id).then(setHasReviewed).catch(() => { });
        }
        // Fetch seller rating
        const seller = typeof data.postedBy === "object" && data.postedBy !== null
          ? (data.postedBy as { _id: string })._id
          : null;
        if (seller) {
          reviewsService.getForUser(seller)
            .then(res => setSellerRating(res.avgRating))
            .catch(() => { });
        }
      })
      .catch(() => setError("Could not load item"))
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

  const handleToggleLike = async () => {
    if (!item || isLiking) return;
    setIsLiking(true);
    // Optimistic UI
    const newLiked = !isLiked;
    setIsLiked(newLiked);

    try {
      const response = await itemsService.toggleLike(item._id);
      setIsLiked(response.liked);

      // Update global user state
      if (user) {
        const currentLiked = user.likedItems || [];
        let nextLiked = [...currentLiked];
        if (response.liked) {
          if (!nextLiked.includes(item._id)) nextLiked.push(item._id);
        } else {
          nextLiked = nextLiked.filter(id => id !== item._id);
        }
        updateUser({ ...user, likedItems: nextLiked });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(!newLiked); // Revert
      Alert.alert("Error", "Could not save to favorites");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      "Delete Item?",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await itemsService.delete(item._id);
              router.replace("/(tabs)");
              Alert.alert("Deleted", "Your item has been removed.");
            } catch (err) {
              console.error("Failed to delete item:", err);
              Alert.alert("Error", "Could not delete item. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
        <ThemedText style={{ color: Palette.brown, fontSize: 16, marginTop: 16, textAlign: "center" }}>
          {error || "Item not found"}
        </ThemedText>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <ThemedText variant="semibold" style={{ color: Palette.green, fontSize: 16 }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const images = item.imageUrls || [];
  const postedBy = typeof item.postedBy === "object" && item.postedBy !== null
    ? item.postedBy as { _id: string; username: string; avatarUrl?: string }
    : null;
  const receivedBy = typeof item.receivedBy === "object" && item.receivedBy !== null
    ? item.receivedBy as { _id: string; username: string }
    : null;
  const isParticipant = (postedBy && user?._id === postedBy._id) || (receivedBy && user?._id === receivedBy._id);
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

          <View className="flex-row items-center" style={{ gap: 8 }}>
            {postedBy && user?._id === postedBy._id && (
              <>
                <Pressable
                  onPress={handleDelete}
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
                  <Ionicons name="trash-outline" size={20} color={Palette.dark} />
                </Pressable>

                <Pressable
                  onPress={() => router.push(`/item/edit?id=${item._id}`)}
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
                  <Ionicons name="create-outline" size={20} color={Palette.dark} />
                </Pressable>
              </>
            )}

            <Pressable
              onPress={handleToggleLike}
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
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#E91E63" : Palette.dark}
              />
            </Pressable>

            <Pressable
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Check out "${item.title}" on Woven!`,
                  });
                } catch { }
              }}
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
          <ThemedText variant="bold" style={{ fontSize: 20, color: Palette.dark }}>
            {item.title}
          </ThemedText>
        </View>

        {/* Pill Tags */}
        <View className="flex-row px-4 pt-3 gap-2">
          {tags.map((tag) => (
            <View
              key={tag}
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: Palette.brown }}
            >
              <ThemedText variant="semibold" style={{ fontSize: 12, color: "#FFFFFF" }}>
                {tag}
              </ThemedText>
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
            {postedBy.avatarUrl ? (
              <Image
                source={{ uri: postedBy.avatarUrl }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
              />
            ) : (
              <Ionicons name="person-circle" size={36} color={Palette.brown} />
            )}
            <ThemedText variant="medium" style={{ fontSize: 14, color: Palette.dark, marginLeft: 8 }}>
              {postedBy.username}
            </ThemedText>
            {sellerRating !== null && (
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                <Ionicons name="star" size={13} color={Colors.primary} />
                <ThemedText style={{ fontSize: 13, color: Palette.brown, marginLeft: 3 }}>
                  {sellerRating > 0 ? sellerRating.toFixed(1) : "New"}
                </ThemedText>
              </View>
            )}
            <View className="flex-1" />
            <Ionicons name="chevron-forward" size={16} color={Palette.brown} />
          </Pressable>
        )}

        {/* Description */}
        {item.description ? (
          <View className="mx-4 mt-3 p-4 rounded-xl" style={{ backgroundColor: "#FFF1DA" }}>
            <ThemedText style={{ fontSize: 14, lineHeight: 20, color: Palette.brown }}>
              {item.description}
            </ThemedText>
          </View>
        ) : null}

        {/* Bottom spacing for scroll */}
        <View className="h-48" />
      </ScrollView>

      {/* Docked Bottom Button */}
      {postedBy && user?._id === postedBy._id && item.status === "available" && (
        <View style={{ position: "absolute", bottom: 40, left: 0, right: 0, paddingHorizontal: 16 }}>
          <Pressable
            onPress={() => router.push(`/transfer/qr-generate?itemId=${item._id}`)}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: Palette.green }}
          >
            <Text className="font-semibold text-base" style={{ color: Palette.dark, fontFamily: "Quicksand_600SemiBold" }}>
              Start Transfer
            </Text>
          </Pressable>
        </View>
      )}
      {postedBy && user?._id !== postedBy._id && item.status === "available" && (
        <View style={{ position: "absolute", bottom: 40, left: 0, right: 0, paddingHorizontal: 16 }}>
          <Pressable
            onPress={async () => {
              try {
                const convo = await messagesService.getOrCreateConversation(
                  postedBy!._id,
                  item._id
                );
                router.push(`/chat/${convo._id}`);
              } catch (error) {
                Alert.alert("Error", "Could not start conversation");
              }
            }}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: "#a8c9a8" }}
          >
            <ThemedText variant="semibold" style={{ fontSize: 16, color: Palette.dark }}>
              Message
            </ThemedText>
          </Pressable>
        </View>
      )}
      {item.status === "completed" && isParticipant && !hasReviewed && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: Palette.cream }}>
          <View className="px-4 pb-4">
            <Pressable
              onPress={() => router.push(`/review/${item._id}`)}
              className="rounded-full py-4 items-center"
              style={{ backgroundColor: Palette.green }}
            >
              <Text className="font-semibold text-base" style={{ color: Palette.dark, fontFamily: "Quicksand_600SemiBold" }}>
                Leave a Review
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
      {item.status === "completed" && isParticipant && hasReviewed && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: Palette.cream }}>
          <View className="px-4 pb-4">
            <View className="rounded-full py-4 items-center" style={{ backgroundColor: Palette.brown, opacity: 0.6 }}>
              <Text className="font-semibold text-base" style={{ color: "#fff", fontFamily: "Quicksand_600SemiBold" }}>
                Already Reviewed
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}
      {item.status === "completed" && !isParticipant && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: Palette.cream }}>
          <View className="px-4 pb-4">
            <View className="rounded-full py-4 items-center" style={{ backgroundColor: Palette.brown, opacity: 0.6 }}>
              <Text className="font-semibold text-base" style={{ color: "#fff", fontFamily: "Quicksand_600SemiBold" }}>
                No Longer Available
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
