import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
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
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardWillShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: isKeyboardVisible ? Math.max(insets.bottom, 16) : 110 },
      ]}
      pointerEvents="box-none"
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 0,
    paddingBottom: 110,
  },
  button: {
    backgroundColor: "#411E12",
    borderRadius: 100,
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
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAE5C4",
    fontFamily: "Quicksand_700Bold",
  },
  buttonTextDisabled: {
    color: "#FFFFFF",
    opacity: 0.8,
  },
});
