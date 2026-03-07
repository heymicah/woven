import { Router } from "express";
import { getUser, updateMe, changePassword } from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/:id", getUser);
router.put("/me", authMiddleware, updateMe);
router.put("/me/password", authMiddleware, changePassword);

export default router;
