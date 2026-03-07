import api from "./api";
import { Conversation, Message } from "../types";

export const messagesService = {
  getMyConversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get<Conversation[]>("/conversations/me");
    return data;
  },

  getOrCreateConversation: async (
    participantId: string,
    itemId?: string
  ): Promise<Conversation> => {
    const { data } = await api.post<Conversation>("/conversations", {
      participantId,
      itemId,
    });
    return data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const { data } = await api.get<Conversation>(`/conversations/${id}`);
    return data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data } = await api.get<Message[]>(
      `/conversations/${conversationId}/messages`
    );
    return data;
  },

  sendMessage: async (
    conversationId: string,
    text: string
  ): Promise<Message> => {
    const { data } = await api.post<Message>(
      `/conversations/${conversationId}/messages`,
      { text }
    );
    return data;
  },
};
