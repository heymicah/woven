import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/SocketContext";
import { messagesService } from "../../services/messages.service";
import { Conversation } from "../../types";

const Palette = {
  pink: "#FFD1D9",
  rose: "#E28D9B",
  cream: "#FAE5C4",
  brown: "#96755F",
  dark: "#411E12",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await messagesService.getMyConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Refresh when a new message arrives
  React.useEffect(() => {
    if (!socket) return;

    const handler = () => {
      loadConversations();
    };

    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, loadConversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Palette.cream }}
      >
        <ActivityIndicator size="large" color={Palette.rose} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Palette.cream }}>
      {/* Header */}
      <View style={{ paddingTop: 70, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: Palette.cream }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: Palette.dark, fontFamily: "Quicksand_700Bold" }}>
          Inbox
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          conversations.length === 0 ? { flex: 1 } : { paddingBottom: 100 }
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={Palette.brown}
            />
            <Text
              className="mt-3 text-base"
              style={{
                color: Palette.brown,
                fontFamily: "Quicksand_500Medium",
              }}
            >
              No conversations yet
            </Text>
          </View>
        }
        renderItem={({ item: convo }) => {
          const otherUser = convo.participants.find(
            (p) => p._id !== user?._id
          );

          return (
            <Pressable
              onPress={() => router.push(`/chat/${convo._id}`)}
              className="flex-row items-center px-4 py-3 border-b"
              style={{ borderBottomColor: "#E5D5B8" }}
            >
              <Ionicons
                name="person-circle"
                size={44}
                color={Palette.brown}
              />
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-semibold"
                    style={{
                      color: Palette.dark,
                      fontFamily: "Quicksand_600SemiBold",
                    }}
                  >
                    {otherUser?.username ?? "Unknown"}
                  </Text>
                  {convo.lastMessage && (
                    <Text
                      className="text-xs"
                      style={{
                        color: Palette.brown,
                        fontFamily: "Quicksand_400Regular",
                      }}
                    >
                      {timeAgo(convo.lastMessage.createdAt)}
                    </Text>
                  )}
                </View>
                {convo.lastMessage && (
                  <Text
                    className="text-sm mt-1"
                    numberOfLines={1}
                    style={{
                      color: Palette.brown,
                      fontFamily: "Quicksand_400Regular",
                    }}
                  >
                    {convo.lastMessage.text}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Palette.brown}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
