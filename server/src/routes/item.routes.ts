import { Router } from "express";
import {
  getItems,
  getItem,
  createItem,
  claimItem,
  updateItem,
  deleteItem,
  getMyItems,
  getClaimedItems,
  toggleLike,
  getLikedItems,
} from "../controllers/items.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getItems);
router.get("/mine", authMiddleware, getMyItems);
router.get("/claimed", authMiddleware, getClaimedItems);
router.get("/liked", authMiddleware, getLikedItems);
router.get("/:id", getItem);
router.post("/", authMiddleware, createItem);
router.post("/:id/claim", authMiddleware, claimItem);
router.post("/:id/toggle-like", authMiddleware, toggleLike);
router.put("/:id", authMiddleware, updateItem);
router.delete("/:id", authMiddleware, deleteItem);

export default router;
