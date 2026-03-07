import { Router } from "express";
import {
  getItems,
  getItem,
  createItem,
  claimItem,
  deleteItem,
} from "../controllers/items.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getItems);
router.get("/:id", getItem);
router.post("/", authMiddleware, createItem);
router.post("/:id/claim", authMiddleware, claimItem);
router.delete("/:id", authMiddleware, deleteItem);

export default router;
