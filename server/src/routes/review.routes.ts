import { Router } from "express";
import {
    getReviewsForUser,
    checkReviewExists,
    createReview,
} from "../controllers/reviews.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/user/:userId", getReviewsForUser);
router.get("/check/:itemId", authMiddleware, checkReviewExists);
router.post("/", authMiddleware, createReview);

export default router;
