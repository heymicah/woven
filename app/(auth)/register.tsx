import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await register({ username, email, password });
    } catch (error: any) {
      Alert.alert("Registration Failed", error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-bold text-center text-indigo-600 mb-2">
          Woven
        </Text>
        <Text className="text-base text-center text-gray-500 mb-10">
          Join the community
        </Text>

        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-base"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          className="bg-indigo-600 rounded-xl py-4 items-center"
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Creating account..." : "Create Account"}
          </Text>
        </Pressable>

        <Text className="text-center text-gray-400 text-sm mt-4">
          You'll start with 2 tokens to claim items!
        </Text>

        <View className="flex-row justify-center mt-4">
          <Text className="text-gray-500">Already have an account? </Text>
          <Link href="/(auth)/login" className="text-indigo-600 font-semibold">
            Sign In
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
