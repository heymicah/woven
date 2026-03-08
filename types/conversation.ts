import { User } from "./user";

export interface LastMessage {
  text: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: Pick<User, "_id" | "username" | "avatarUrl">[];
  itemId?: string;
  lastMessage?: LastMessage;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}
