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
import { useAuth } from "../../hooks/useAuth";

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
          <Text className="text-base text-center text-gray-500 mb-10">
            Join the community
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
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
            <Text className="text-[#411E12] font-semibold text-base">
              {loading ? "Creating account..." : "Create Account"}
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
