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
} from "../controllers/items.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getItems);
router.get("/mine", authMiddleware, getMyItems);
router.get("/claimed", authMiddleware, getClaimedItems);
router.get("/:id", getItem);
router.post("/", authMiddleware, createItem);
router.post("/:id/claim", authMiddleware, claimItem);
router.put("/:id", authMiddleware, updateItem);
router.delete("/:id", authMiddleware, deleteItem);

export default router;
