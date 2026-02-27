import { GoogleGenAI } from "@google/genai";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } }, // 이미지 base64 크면 여기/리사이즈 필요
};

// 모델이 ```json``` 으로 감싸서 줄 때 대비
function safeJsonParse(text: string) {
  const cleaned = text
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not set" });

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

    const ai = new GoogleGenAI({ apiKey });

    // Vercel env에 GEMINI_MODEL_OCR 넣어둔 거 활용
    const model = process.env.GEMINI_MODEL_OCR || "gemini-2.5-flash";

    // ✅ 여기 prompt를 AI Studio에서 “완성한 OCR 프롬프트”로 그대로 교체하면 결과 스펙 동일
    const OCR_PROMPT = `
You are a receipt OCR extractor.
Return JSON only. No markdown. No explanations.

Schema:
{
  "rawText": string,
  "items": [
    { "name": string, "qty": number|null, "price": number|null, "amount": number|null }
  ],
  "totals": { "subtotal": number|null, "tax": number|null, "total": number|null }
}

Rules:
- Keep rawText with line breaks as seen.
- If uncertain, use null but keep valid JSON.
- If duplicate lines exist (split receipts), still best effort.
    `.trim();

    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
            { text: OCR_PROMPT },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    });

    const text = result?.response?.text?.() ?? "";
    const parsed = safeJsonParse(text);

    // JSON이 깨져도 최소한 rawText라도 돌려주기
    if (!parsed) {
      return res.status(200).json({ ok: true, rawText: text, items: [], totals: {} });
    }

    return res.status(200).json({ ok: true, ...parsed });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: error?.message || String(error),
    });
  }
}
