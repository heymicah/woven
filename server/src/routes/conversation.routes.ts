import { Router } from "express";
import {
  getMyConversations,
  createOrGetConversation,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from "../controllers/conversations.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/me", getMyConversations);
router.get("/unread-count", getUnreadCount);
router.post("/", createOrGetConversation);
router.get("/:id", getConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/read", markAsRead);

export default router;
