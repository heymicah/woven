import { Router } from "express";
import {
  getItems,
  getItem,
  createItem,
  completeTransfer,
  updateItem,
  deleteItem,
  getMyItems,
  getReceivedItems,
} from "../controllers/items.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getItems);
router.get("/mine", authMiddleware, getMyItems);
router.get("/received", authMiddleware, getReceivedItems);
router.get("/:id", getItem);
router.post("/", authMiddleware, createItem);
router.post("/:id/complete", authMiddleware, completeTransfer);
router.put("/:id", authMiddleware, updateItem);
router.delete("/:id", authMiddleware, deleteItem);

export default router;
