import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not set" });

    const { prompt, modelName } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const ai = new GoogleGenAI({ apiKey });

    const model =
      modelName ||
      process.env.GEMINI_MODEL_COACH ||
      "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response?.text;
    if (!text) return res.status(500).json({ error: "EMPTY_RESPONSE" });

    return res.status(200).json({ ok: true, text });
  } catch (error: any) {
    const msg = error?.message || String(error);
    return res.status(500).json({ error: "SERVER_ERROR", message: msg });
  }
}
