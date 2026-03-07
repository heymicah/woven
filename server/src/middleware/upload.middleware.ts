import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadSingle = upload.single("image");
export const uploadMultiple = upload.array("images", 10);
