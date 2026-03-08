import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.screen}>
        <View style={styles.form}>
          <Image
            source={require("../../assets/woven word.png")}
            style={{ width: 300, height: 120, alignSelf: "center", marginBottom: -16 }}
            resizeMode="contain"
          />
          <Text className="text-base text-center text-gray-500 mb-10">
            Community clothing upcycling
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#96755F"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={passwordRef}
            style={[styles.input, { marginBottom: 24 }]}
            placeholder="Password"
            placeholderTextColor="#96755F"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="bg-[#A8C9A8] rounded-full py-4 items-center"
            style={({ pressed }) => pressed && { opacity: 0.8 }}
          >
            <Text className="text-[#411E12] font-semibold text-base">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/register")}
            className="mt-6 items-center"
          >
            <Text className="text-gray-500">
              Don't have an account?{" "}
              <Text className="text-[#411E12] font-semibold">Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAE5C4",
    justifyContent: "center",
    paddingBottom: "40%",
  },
  form: {
    paddingHorizontal: 32,
  },
  input: {
    backgroundColor: "#FFF1DA",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    color: "#411E12",
  },
});
