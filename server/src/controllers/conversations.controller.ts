import { Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { AuthRequest } from "../types";
import { getIO } from "../socket";

export async function getMyConversations(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate("participants", "username avatarUrl")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function createOrGetConversation(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { participantId, itemId } = req.body;

    if (!participantId) {
      res.status(400).json({ message: "participantId is required" });
      return;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(participantId)) {
      res.status(400).json({ message: "Invalid participantId" });
      return;
    }

    if (participantId === req.userId) {
      res.status(400).json({ message: "Cannot message yourself" });
      return;
    }

    // Find existing conversation between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId], $size: 2 },
    }).populate("participants", "username avatarUrl");

    if (!conversation) {
      const doc: any = { participants: [req.userId, participantId] };
      if (itemId && /^[0-9a-fA-F]{24}$/.test(itemId)) {
        doc.itemId = itemId;
      }
      conversation = await Conversation.create(doc);
      conversation = await conversation.populate(
        "participants",
        "username avatarUrl"
      );
    }

    res.json(conversation);
  } catch (error) {
    console.error("createOrGetConversation error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getConversation(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "participants",
      "username avatarUrl"
    );

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === req.userId
    );
    if (!isParticipant) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMessages(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.userId
    );
    if (!isParticipant) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    const messages = await Message.find({
      conversationId: req.params.id,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function sendMessage(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Message text is required" });
      return;
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.userId
    );
    if (!isParticipant) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    const message = await Message.create({
      conversationId: req.params.id,
      senderId: req.userId,
      text: text.trim(),
    });

    // Update lastMessage on conversation
    conversation.lastMessage = {
      text: text.trim(),
      senderId: message.senderId,
      createdAt: new Date(),
    };
    await conversation.save();

    // Emit to all participants via Socket.io
    const io = getIO();
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.userId) {
        io.to(participantId.toString()).emit("newMessage", {
          message,
          conversationId: req.params.id,
        });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
