import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export type GeminiExtractionResult = {
  readingValue: number;
  confidenceScore: number;
  meterType?: "analog" | "digital";
};

export async function extractReadingFromImage(args: { imageBuffer: Buffer; meterType?: "analog" | "digital" }): Promise<GeminiExtractionResult> {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const prompt = [
    "You are extracting an electricity meter reading from an image.",
    "Return ONLY valid JSON with keys: readingValue (number), confidenceScore (number 0..1), meterType (analog|digital optional).",
    "readingValue must be the full kWh number visible on the meter display/dials.",
    args.meterType ? `The meter type is likely: ${args.meterType}.` : "",
  ].filter(Boolean).join("\n");

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: args.imageBuffer.toString("base64"),
      },
    },
  ]);

  const text = result.response.text().trim();
  const json = safeJson(text);
  const readingValue = Number((json as Record<string, unknown>).readingValue);
  const confidenceScore = Number((json as Record<string, unknown>).confidenceScore);

  if (!Number.isFinite(readingValue) || readingValue < 0) throw new Error("Gemini returned invalid readingValue");
  if (!Number.isFinite(confidenceScore)) throw new Error("Gemini returned invalid confidenceScore");

  return {
    readingValue,
    confidenceScore: Math.max(0, Math.min(1, confidenceScore)),
    meterType:
      (json as Record<string, unknown>).meterType === "analog" || (json as Record<string, unknown>).meterType === "digital"
        ? ((json as Record<string, unknown>).meterType as "analog" | "digital")
        : undefined,
  };
}

function safeJson(text: string): unknown {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  const slice = first >= 0 && last >= 0 ? text.slice(first, last + 1) : text;
  return JSON.parse(slice);
}

