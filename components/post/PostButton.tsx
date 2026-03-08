import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Platform,
} from "react-native";
import { Colors } from "../../constants/Colors";

// Floating tab bar: bottom 30 + height 70 = 100px from screen bottom
const TAB_BAR_CLEARANCE = 110;

interface PostButtonProps {
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}

export default function PostButton({ disabled, loading, onPress }: PostButtonProps) {
  const [keyboardUp, setKeyboardUp] = React.useState(false);

  React.useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardUp(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardUp(false)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  return (
    <View style={[styles.footer, { paddingBottom: keyboardUp ? 8 : TAB_BAR_CLEARANCE }]}>
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
