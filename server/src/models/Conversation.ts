import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  itemId?: mongoose.Types.ObjectId;
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  readBy: Map<string, Date>;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
    lastMessage: {
      text: String,
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: Date,
    },
    readBy: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
