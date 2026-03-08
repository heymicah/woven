import dotenv from "dotenv";
dotenv.config({ override: true });

import mongoose from "mongoose";
import { Item } from "../models/Item";
import { generateEmbedding, buildEmbeddingText } from "../utils/embeddings";

async function backfill() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/woven";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const items = await Item.find({
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  });
  console.log(`Found ${items.length} items without embeddings`);

  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const text = buildEmbeddingText(item);
      const embedding = await generateEmbedding(text);
      await Item.findByIdAndUpdate(item._id, { embedding });
      success++;
      console.log(`[${success}/${items.length}] Embedded: ${item.title}`);
    } catch (err: any) {
      failed++;
      console.error(`Failed to embed "${item.title}":`, err.message);
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error("Backfill error:", err);
  process.exit(1);
});
