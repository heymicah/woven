import React, { useState, useCallback } from "react";
import { View, FlatList, Pressable, ActivityIndicator, Image } from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/SocketContext";
import { useUnread } from "../../context/UnreadContext";
import { messagesService } from "../../services/messages.service";
import { Conversation } from "../../types";
import { Colors } from "../../constants/Colors";

const Palette = {
  pink: "#FFD1D9",
  rose: "#E28D9B",
  cream: "#FAE5C4",
  brown: "#96755F",
  dark: "#411E12",
  green: "#a8c9a8",
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
  const { setUnreadCount } = useUnread();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await messagesService.getMyConversations();
      setConversations(data);
      const total = data.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUnreadCount]);

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
        <ActivityIndicator size="large" color={Palette.green} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Palette.cream }}>
      {/* Header */}
      <View style={{ paddingTop: 70, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: Palette.cream }}>
        <ThemedText variant="bold" style={{ fontSize: 22, color: Palette.dark }}>
          Inbox
        </ThemedText>
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
            <ThemedText
              variant="medium"
              style={{
                fontSize: 16,
                marginTop: 12,
                color: Palette.brown,
              }}
            >
              No conversations yet
            </ThemedText>
          </View>
        }
        renderItem={({ item: convo }) => {
          const otherUser = convo.participants.find(
            (p) => p._id !== user?._id
          );
          const isUnread = (convo.unreadCount ?? 0) > 0;

          return (
            <Pressable
              onPress={() => router.push(`/chat/${convo._id}`)}
              className="flex-row items-center px-4 py-3 border-b"
              style={{ borderBottomColor: "#E5D5B8" }}
            >
              {/* Unread dot */}
              {isUnread && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#E53935",
                    marginRight: 8,
                  }}
                />
              )}

              {otherUser?.avatarUrl ? (
                <Image
                  source={{ uri: otherUser.avatarUrl }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E5D5B8", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person" size={26} color={Palette.brown} />
                </View>
              )}
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <ThemedText
                    variant="semibold"
                    style={{
                      fontSize: 16,
                      color: Palette.dark,
                      fontWeight: isUnread ? "800" : "600",
                    }}
                  >
                    {otherUser?.username ?? "Unknown"}
                  </ThemedText>
                  {convo.lastMessage && (
                    <ThemedText
                      style={{
                        fontSize: 12,
                        color: isUnread ? "#E53935" : Palette.brown,
                        fontWeight: isUnread ? "700" : "400",
                      }}
                    >
                      {timeAgo(convo.lastMessage.createdAt)}
                    </ThemedText>
                  )}
                </View>
                {convo.lastMessage && (
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      marginTop: 4,
                      color: Palette.brown,
                      fontWeight: isUnread ? "700" : "400",
                    }}
                  >
                    {convo.lastMessage.text}
                  </ThemedText>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
