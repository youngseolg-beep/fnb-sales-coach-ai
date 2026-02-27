import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "GEMINI_API_KEY is not set" });
    }

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "imageBase64 is required" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const model =
      process.env.GEMINI_MODEL_OCR ||
      "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,           // ✅ base64 "data:" 제외한 값
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text:
                "Extract all visible text from this receipt image exactly as it appears.\n" +
                "Keep line breaks.\n" +
                "Do not summarize or format.\n" +
                "Do not add anything.",
            },
          ],
        },
      ],
    });

    const text = response?.text || "";

    // ✅ 핵심: 프론트가 기대하는 키(rawText)로 내려준다
    return res.status(200).json({
      ok: true,
      rawText: text,
      items: [],   // (지금은 비워도 됨. 다음 단계에서 구조화 붙일 수 있음)
      totals: {},
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: error?.message || String(error),
    });
  }
}
