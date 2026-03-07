import { Router } from "express";
import { getUser, updateMe } from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/:id", getUser);
router.put("/me", authMiddleware, updateMe);

export default router;
