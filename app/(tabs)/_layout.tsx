import React from "react";
import { Pressable, View, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarLabelPosition: 'below-icon', // Force text not to wrap or squish
        tabBarActiveBackgroundColor: '#a8c9a8',
        tabBarItemStyle: {
          borderRadius: 40,
          marginVertical: 5,
          marginHorizontal: 0, // Reduced from 12 to stop text from truncating horizontally
          overflow: 'hidden',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          marginHorizontal: '5%',
          elevation: 5,
          backgroundColor: '#FFF1DA',
          borderRadius: 40,
          height: 70, // Increased slightly from 64 so text fits
          borderTopWidth: 0,
          shadowColor: Colors.heading,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          paddingBottom: 0,
          paddingTop: 2,
          paddingHorizontal: 8, // Reduced from 15 to give labels more width
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.heading,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "Post",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default behavior and explicitly navigate to clear params
            e.preventDefault();
            router.push("/(tabs)/post");
          },
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
