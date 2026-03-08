import "../global.css";
import React, { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "@expo-google-fonts/quicksand";
import {
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "../components/LoadingScreen";

function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const prevAuth = useRef<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Only act when authentication state actually changes
    if (prevAuth.current === isAuthenticated) return;
    prevAuth.current = isAuthenticated;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else if (inAuthGroup || segments.length === 0) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading]);
}

function RootLayoutNav() {
  const { isLoading } = useAuth();
  useProtectedRoute();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_300Light,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <RootLayoutNav />
      </SocketProvider>
    </AuthProvider>
  );
}
