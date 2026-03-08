import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../hooks/useAuth";
import { router } from "expo-router";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleRegister() {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await register({ username, email, password });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.response?.data?.message || "Something went wrong");
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
            style={{ width: 300, height: 120, alignSelf: "center", marginBottom: 8 }}
            resizeMode="contain"
          />
          <ThemedText style={{ fontSize: 16, textAlign: "center", color: "#6B7280", marginBottom: 40 }}>
            Join the community
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#96755F"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={emailRef}
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
            onSubmitEditing={handleRegister}
          />

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="bg-[#A8C9A8] rounded-full py-4 items-center"
            style={({ pressed }) => pressed && { opacity: 0.8 }}
          >
            <ThemedText variant="semibold" style={{ color: "#411E12", fontSize: 16 }}>
              {loading ? "Creating account..." : "Create Account"}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
            className="mt-6 items-center"
          >
            <ThemedText style={{ color: "#6B7280" }}>
              Already have an account?{" "}
              <ThemedText variant="semibold" style={{ color: "#411E12" }}>Sign In</ThemedText>
            </ThemedText>
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
    fontFamily: "Quicksand_400Regular",
  },
});
