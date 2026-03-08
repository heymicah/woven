import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

interface PostButtonProps {
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}

export default function PostButton({ disabled, loading, onPress }: PostButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          (disabled || loading) && styles.buttonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Post item"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text
            style={[
              styles.buttonText,
              (disabled || loading) && styles.buttonTextDisabled,
            ]}
          >
            Post Item
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Quicksand_700Bold",
  },
  buttonTextDisabled: {
    color: Colors.textSecondary,
  },
});
