import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { QrCodeSvg } from "react-native-qr-svg";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { itemsService } from "../../services/items.service";
import { Item, ItemStatus } from "../../types";

export default function QRGenerateScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    itemsService
      .getById(itemId)
      .then((data) => {
        if (data.status !== ItemStatus.AVAILABLE) {
          setError("Item is no longer available for transfer");
          return;
        }
        const posterId =
          typeof data.postedBy === "object" && data.postedBy !== null
            ? (data.postedBy as any)._id
            : data.postedBy;
        if (posterId !== user?._id) {
          setError("Only the seller can generate a transfer code");
          return;
        }
        setItem(data);
      })
      .catch(() => setError("Could not load item"))
      .finally(() => setLoading(false));
  }, [itemId]);

  // Poll for completion so seller gets redirected to receipt
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (!item || !itemId) return;
    const interval = setInterval(async () => {
      if (navigatedRef.current) {
        clearInterval(interval);
        return;
      }
      try {
        const latest = await itemsService.getById(itemId);
        if (latest.status === ItemStatus.COMPLETED) {
          clearInterval(interval);
          navigatedRef.current = true;
          router.push(`/transfer/receipt?itemId=${itemId}`);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [!!item, itemId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.accent} />
        <Text style={{ color: Colors.accent, fontSize: 16, marginTop: 16, textAlign: "center" }}>
          {error || "Item not found"}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: 16 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const qrData = JSON.stringify({ itemId: item._id, sellerId: user?._id });
  const thumbnail = item.imageUrls?.[0];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.text, marginLeft: 12 }}>Transfer Item</Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Item preview */}
        {thumbnail && (
          <Image
            source={{ uri: thumbnail }}
            style={{ width: 80, height: 80, borderRadius: 12, marginBottom: 12 }}
            resizeMode="cover"
          />
        )}
        <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 24, textAlign: "center" }}>
          {item.title}
        </Text>

        {/* QR Code */}
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 16 }}>
          <QrCodeSvg value={qrData} frameSize={220} />
        </View>

        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 24, textAlign: "center" }}>
          Waiting for buyer to scan...
        </Text>
      </View>
    </View>
  );
}
