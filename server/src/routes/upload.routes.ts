import { Router, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadSingle, uploadMultiple } from "../middleware/upload.middleware";
import { uploadToCloudinary } from "../utils/cloudinary.upload";
import { AuthRequest } from "../types";

const router = Router();

router.post(
  "/image",
  authMiddleware,
  uploadSingle,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No image provided" });
        return;
      }
      const url = await uploadToCloudinary(req.file.buffer, "woven/avatars");
      res.json({ url });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.post(
  "/images",
  authMiddleware,
  uploadMultiple,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      console.log("[upload/images] files received:", files?.length ?? 0);
      if (!files || files.length === 0) {
        res.status(400).json({ message: "No images provided" });
        return;
      }
      console.log("[upload/images] Uploading to Cloudinary...");
      const urls = await Promise.all(
        files.map((file) => uploadToCloudinary(file.buffer, "woven/items"))
      );
      console.log("[upload/images] Upload success, urls:", urls);
      res.json({ urls });
    } catch (error: any) {
      console.error("[upload/images] ERROR:", error.message);
      console.error("[upload/images] Stack:", error.stack);
      res.status(500).json({ message: "Upload failed", error: error.message });
    }
  }
);

export default router;
