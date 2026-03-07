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
      if (!files || files.length === 0) {
        res.status(400).json({ message: "No images provided" });
        return;
      }
      const urls = await Promise.all(
        files.map((file) => uploadToCloudinary(file.buffer, "woven/items"))
      );
      res.json({ urls });
    } catch (error) {
      console.error("Images upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

export default router;
