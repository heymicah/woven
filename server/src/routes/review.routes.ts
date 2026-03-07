import { Router } from "express";
import {
    getReviewsForUser,
    createReview,
} from "../controllers/reviews.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/user/:userId", getReviewsForUser);
router.post("/", authMiddleware, createReview);

export default router;
