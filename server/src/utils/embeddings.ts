import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

// Load .env directly to avoid system env var conflicts
const envResult = dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });
const MODEL = "text-embedding-3-small";

let _openai: OpenAI;
function getClient() {
  if (!_openai) {
    const key = envResult.parsed?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export function buildEmbeddingText(item: {
  title: string;
  description?: string;
  category?: string;
  size?: string;
  condition?: string;
  intendedFit?: string;
}): string {
  const parts = [
    item.title,
    item.description || "",
    item.category || "",
    item.size ? `Size ${item.size}` : "",
    item.condition || "",
    item.intendedFit || "",
  ];
  return parts.filter(Boolean).join(". ");
}
