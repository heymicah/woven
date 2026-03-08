import React from "react";
import { View, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useUnread } from "../../context/UnreadContext";

export default function TabsLayout() {
  const router = useRouter();
  const { unreadCount } = useUnread();

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
        tabBarLabelPosition: 'below-icon',
        tabBarActiveBackgroundColor: '#a8c9a8',
        tabBarItemStyle: {
          borderRadius: 40,
          marginVertical: 5,
          marginHorizontal: 0,
          overflow: 'hidden',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          marginHorizontal: '5%',
          elevation: 5,
          backgroundColor: '#FFF1DA',
          borderRadius: 40,
          height: 70,
          borderTopWidth: 0,
          shadowColor: Colors.heading,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          paddingBottom: 0,
          paddingTop: 2,
          paddingHorizontal: 8,
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
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#E53935",
            color: "#fff",
            fontSize: 10,
            fontWeight: "800",
            minWidth: 18,
            height: 18,
            lineHeight: 17,
            borderRadius: 9,
          },
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
