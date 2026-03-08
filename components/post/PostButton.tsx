import React from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Platform,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { Colors } from "../../constants/Colors";

// Floating tab bar: bottom 30 + height 70 = 100px from screen bottom
const TAB_BAR_CLEARANCE = 110;

interface PostButtonProps {
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
  label?: string;
}

export default function PostButton({ disabled, loading, onPress, label = "Post Item" }: PostButtonProps) {
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
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <ThemedText
            variant="bold"
            style={[
              styles.buttonText,
              (disabled || loading) && styles.buttonTextDisabled,
            ]}
          >
            {label}
          </ThemedText>
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
    color: "#FAE5C4",
  },
  buttonTextDisabled: {
    color: "#FFFFFF",
    opacity: 0.8,
  },
});
