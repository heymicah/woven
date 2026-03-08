import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/SocketContext";
import { useUnread } from "../../context/UnreadContext";
import { messagesService } from "../../services/messages.service";
import { reviewsService } from "../../services/reviews.service";
import { Conversation, Message } from "../../types";
import { Colors } from "../../constants/Colors";

const Palette = {
  pink: "#FFD1D9",
  rose: "#E28D9B",
  cream: "#FAE5C4",
  brown: "#96755F",
  dark: "#411E12",
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const socket = useSocket();
  const { refresh: refreshUnread } = useUnread();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partnerRating, setPartnerRating] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const otherUser = conversation?.participants.find(
    (p) => p._id !== user?._id
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [convo, msgs] = await Promise.all([
        messagesService.getConversation(id),
        messagesService.getMessages(id),
      ]);
      setConversation(convo);
      setMessages(msgs);
      // Mark conversation as read and refresh badge
      messagesService.markAsRead(id).then(() => refreshUnread()).catch(() => { });
    } catch (error) {
      console.error("Failed to load chat:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (otherUser?._id) {
      reviewsService.getForUser(otherUser._id)
        .then(res => setPartnerRating(res.avgRating))
        .catch(err => console.error("Failed to fetch partner rating:", err));
    }
  }, [otherUser?._id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handler = (data: { message: Message; conversationId: string }) => {
      if (data.conversationId === id) {
        setMessages((prev) => [...prev, data.message]);
        messagesService.markAsRead(id).catch(() => {});
      }
    };

    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, id]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !id || sending) return;

    setSending(true);
    setText("");

    try {
      const message = await messagesService.sendMessage(id, trimmed);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setText(trimmed);
    } finally {
      setSending(false);
    }
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
      <View
        className="flex-row items-center px-4 pb-3 border-b"
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: Palette.cream,
          borderBottomColor: "#E5D5B8",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#FFF1DA" }}
        >
          <Ionicons name="arrow-back" size={20} color={Palette.dark} />
        </Pressable>
        <Pressable
          onPress={() => otherUser?._id && router.push(`/profile/${otherUser._id}`)}
          className="flex-1 flex-row items-center"
        >
          {otherUser?.avatarUrl ? (
            <Image
              source={{ uri: otherUser.avatarUrl }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#E5D5B8", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person" size={20} color={Palette.brown} />
            </View>
          )}
          <View className="ml-2">
            <Text
              className="text-base font-semibold"
              style={{
                color: Palette.dark,
                fontFamily: "Quicksand_600SemiBold",
              }}
            >
              {otherUser?.username ?? "Chat"}
            </Text>
            {partnerRating !== null && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={10} color="#fbbf24" />
                <Text
                  className="ml-1 text-xs"
                  style={{
                    color: Palette.brown,
                    fontFamily: "Quicksand_500Medium",
                  }}
                >
                  {partnerRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: msg }) => {
            const isMine = msg.senderId === user?._id;
            return (
              <View
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                }}
              >
                <View
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: isMine ? "#a8c9a8" : "#FFF1DA",
                    borderBottomRightRadius: isMine ? 4 : 16,
                    borderBottomLeftRadius: isMine ? 16 : 4,
                  }}
                >
                  <Text
                    style={{
                      color: isMine ? "#411E12" : Palette.dark,
                      fontFamily: "Quicksand_400Regular",
                      fontSize: 15,
                    }}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          }}
          onRefresh={loadData}
          refreshing={false}
        />

        {/* Input Bar */}
        <View
          className="flex-row items-end px-4 py-3 border-t"
          style={{
            paddingBottom: insets.bottom + 8,
            backgroundColor: Palette.cream,
            borderTopColor: "#E5D5B8",
          }}
        >
          <TextInput
            className="flex-1 px-4 py-3 rounded-full mr-3"
            style={{
              backgroundColor: "#FFF1DA",
              color: Palette.dark,
              fontFamily: "Quicksand_400Regular",
              fontSize: 15,
              maxHeight: 100,
            }}
            placeholder="Type a message..."
            placeholderTextColor={Palette.brown}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            onPress={handleSend}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{
              backgroundColor: "#a8c9a8",
              opacity: text.trim() ? 1 : 0.5,
            }}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#411E12" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
