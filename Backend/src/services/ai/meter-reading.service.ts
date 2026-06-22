import { env } from "../../config/env.js";

export type GeminiExtractionResult = {
  readingValue: number;
  confidenceScore: number;
  meterType?: "analog" | "digital";
};

export async function extractReadingFromImage(args: {
  imageBuffer: Buffer;
  meterType?: "analog" | "digital";
}): Promise<GeminiExtractionResult> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([args.imageBuffer], { type: "image/jpeg" }),
    "meter.jpg",
  );

  const response = await fetch(`${env.METER_AI_URL}/predict`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meter AI service error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    success: boolean;
    reading: number | null;
    best_variant: string;
    confidence: number;
    num_digits: number;
  };

  if (!json.success || json.reading === null || json.reading === undefined) {
    throw new Error(
      "Meter AI service could not extract a reading from the image.",
    );
  }

  if (!Number.isFinite(json.reading) || json.reading < 0) {
    throw new Error(
      `Meter AI service returned invalid reading: ${json.reading}`,
    );
  }

  return {
    readingValue: json.reading,
    confidenceScore: Math.max(0, Math.min(1, json.confidence)),
    meterType: args.meterType,
  };
}
