import { Router } from "express";
import {
  getMyConversations,
  createOrGetConversation,
  getConversation,
  getMessages,
  sendMessage,
} from "../controllers/conversations.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/me", getMyConversations);
router.post("/", createOrGetConversation);
router.get("/:id", getConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);

export default router;
