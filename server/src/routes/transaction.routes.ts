import { Router } from "express";
import { getMyTransactions } from "../controllers/transactions.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, getMyTransactions);

export default router;
