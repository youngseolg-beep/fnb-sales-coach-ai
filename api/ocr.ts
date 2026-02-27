import { GoogleGenAI } from "@google/genai";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } },
};

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
    const model = process.env.GEMINI_MODEL_OCR || "gemini-2.5-flash";

    // ✅ 여기만 나중에 “AI Studio에서 완성한 최종 OCR 프롬프트”로 교체하면
    // 결과가 동일 스펙으로 나옵니다.
    const OCR_PROMPT = [
      "You are a receipt OCR extractor.",
      "Return JSON only. No markdown. No explanation.",
      "JSON schema:",
      "{",
      '  "rawText": string,',
      '  "items": [{ "name": string, "qty": number|null, "price": number|null, "amount": number|null }],',
      '  "totals": { "subtotal": number|null, "tax": number|null, "total": number|null }',
      "}",
      "Rules:",
      "- If receipt is long, still do best effort.",
      "- Duplicates may exist; keep best interpretation.",
      "- If uncertain, use null.",
    ].join("\n");

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

    if (!parsed) {
      // JSON이 깨져도 최소 반환
      return res.status(200).json({ ok: true, rawText: text, items: [], totals: {} });
    }

    return res.status(200).json({ ok: true, ...parsed });
  } catch (e: any) {
    return res.status(500).json({ error: "Server error", details: String(e?.message || e) });
  }
}
