import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export async function extractReadingFromImage(args) {
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
    const readingValue = Number(json.readingValue);
    const confidenceScore = Number(json.confidenceScore);
    if (!Number.isFinite(readingValue) || readingValue < 0)
        throw new Error("Gemini returned invalid readingValue");
    if (!Number.isFinite(confidenceScore))
        throw new Error("Gemini returned invalid confidenceScore");
    return {
        readingValue,
        confidenceScore: Math.max(0, Math.min(1, confidenceScore)),
        meterType: json.meterType === "analog" || json.meterType === "digital"
            ? json.meterType
            : undefined,
    };
}
function safeJson(text) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    const slice = first >= 0 && last >= 0 ? text.slice(first, last + 1) : text;
    return JSON.parse(slice);
}
//# sourceMappingURL=gemini.service.js.map