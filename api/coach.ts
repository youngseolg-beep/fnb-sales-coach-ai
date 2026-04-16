import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const { prompt, modelName, country } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const model =
      modelName ||
      process.env.GEMINI_MODEL_COACH ||
      "gemini-2.5-flash";

    // ✅ 핵심: 국가 기반 프롬프트 강화
    const countryContext = country
      ? `
[시장 정보]
이 매장은 ${country}에 위치해 있습니다.
현지 외식 시장 특성, 소비 패턴, 가격 민감도, 배달 비중 등을 고려하여 분석 및 코칭을 작성하세요.
가능하면 해당 국가의 통화 및 소비 특성을 반영하세요.
`
      : "";

    const mergedPrompt = `
${countryContext}

${prompt}
`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: mergedPrompt }] }],
    });

    const text = response?.text;
    if (!text) {
      return res.status(500).json({ error: "EMPTY_RESPONSE" });
    }

    return res.status(200).json({ ok: true, text });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: error?.message || String(error),
    });
  }
}
