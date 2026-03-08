import React, { useState, useRef } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { itemsService } from "../../services/items.service";

export default function QRScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const scannedRef = useRef(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setProcessing(true);

    try {
      const parsed = JSON.parse(data);
      const { itemId, sellerId } = parsed;

      if (!itemId || !sellerId) {
        Alert.alert("Invalid QR Code", "This QR code is not a valid transfer code.", [
          { text: "OK", onPress: () => { scannedRef.current = false; } },
        ]);
        setProcessing(false);
        return;
      }

      await itemsService.complete(itemId, sellerId);
      router.push(`/transfer/receipt?itemId=${itemId}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Transfer failed. Please try again.";
      Alert.alert("Transfer Error", message, [
        { text: "OK", onPress: () => { scannedRef.current = false; } },
      ]);
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Ionicons name="camera-outline" size={48} color={Colors.accent} />
        <Text style={{ color: Colors.text, fontSize: 16, marginTop: 16, textAlign: "center" }}>
          Camera access is needed to scan transfer codes.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{ marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
        >
          <Text style={{ color: Colors.text, fontWeight: "600" }}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={processing ? undefined : handleBarCodeScanned}
      />

      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </Pressable>

      {/* Scan indicator */}
      <View style={{ position: "absolute", bottom: 100, left: 0, right: 0, alignItems: "center" }}>
        {processing ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
            Point camera at the seller's QR code
          </Text>
        )}
      </View>
    </View>
  );
}
