import { GoogleGenAI } from "@google/genai";

function extractJsonBlock(text: string) {
  if (!text) return null;

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const raw = text.slice(start, end + 1);
    try {
      return JSON.parse(raw);
    } catch {}
  }

  return null;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "GEMINI_API_KEY is not set" });
    }

    const {
      imageBase64,
      mimeType,
      userEmail,
      country,
      brand,
      menuCandidates,
    } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "imageBase64 is required" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL_OCR || "gemini-2.5-flash";

    const normalizedEmail = String(userEmail || "").trim().toUpperCase();
    const isJapanPilot = normalizedEmail === "JP_PN@THEBORN.CO.KR";

    if (!isJapanPilot) {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: imageBase64,
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

      return res.status(200).json({
        ok: true,
        mode: "raw_text",
        rawText: text,
        items: [],
        totals: {},
      });
    }

    const allowedMenus = Array.isArray(menuCandidates)
      ? menuCandidates
          .map((v) => String(v || "").trim())
          .filter(Boolean)
      : [];

    const defaultJapanHongkongBanjeomMenus = [
      "짬뽕",
      "짬뽕 곱빼기",
      "짬뽕밥",
      "고추짬뽕",
      "고추짬뽕 곱빼기",
      "고추짬뽕밥",
      "짜장",
      "짜장 곱빼기",
      "짜장밥",
      "볶음짬뽕",
      "쟁반짜장",
      "탕수육 소",
      "탕수육 대",
      "탕수육 하프",
      "깐풍기",
      "고기짜장",
      "고기짜장 곱빼기",
      "고기짬뽕",
      "고기짬뽕 곱빼기",
      "고기짬뽕밥",
      "콩국수",
      "모야시짬뽕",
      "중화냉면",
      "생맥주",
      "병맥주",
      "논알콜",
      "참이슬",
      "참이슬 머스캣",
      "참이슬 자두",
      "처음처럼",
      "좋은데이",
      "하이볼",
      "레몬사와",
      "우롱하이",
      "콜라",
      "제로콜라",
      "사이다",
      "오렌지주스",
      "칼피스",
      "우롱차",
      "옥수수차",
      "배주스",
      "포도봉봉",
      "복숭아주스",
      "IGIN하이볼",
      "콘차하이",
    ];

    const finalMenuCandidates =
      allowedMenus.length > 0 ? allowedMenus : defaultJapanHongkongBanjeomMenus;

    const menuListText = finalMenuCandidates.map((name) => `- ${name}`).join("\n");

    const prompt = `
You are analyzing a restaurant receipt or admin sales screen image.

Context:
- Pilot account email: JP_PN@THEBORN.CO.KR
- Country: ${country || "Japan"}
- Brand: ${brand || "Hong Kong Banjeom"}

Goal:
Extract sold menu items from this Japanese data and map each item to the closest canonical Korean menu name from the allowed menu list.

Allowed canonical Korean menu list:
${menuListText}

Important mapping guidance:
- Japanese item names may appear in katakana, hiragana, kanji, abbreviations, or POS-style shortened text.
- Infer the closest canonical Korean menu from the allowed list.
- Use menu size information carefully.
  - Examples:
    - タンスユク小 -> 탕수육 소
    - タンスユク大 -> 탕수육 대
    - ハーフ -> 하프
- Distinguish similar noodle/rice items carefully.
  - 짬뽕 / 짬뽕 곱빼기 / 짬뽕밥 / 모야시짬뽕 are different menus.
  - 짜장 / 짜장 곱빼기 / 짜장밥 / 고기짜장 are different menus.
- In this dataset, if a menu name starts with "※" or "★", it indicates DELIVERY.
- If a menu name does not start with "※" or "★", classify it as POS.
- Remove leading "※" and "★" symbols when determining the matched_name.
- Keep the original text including symbols in receipt_name.
- Add "order_type" with value "DELIVERY" or "POS".
- Do not invent new Korean menu names.
- If uncertain, still choose the closest allowed menu, but set needs_review=true and lower confidence.
- Ignore totals, subtotal, tax, address, phone number, time, table info, and staff info.

Return ONLY valid JSON in this exact shape:
{
  "items": [
    {
      "receipt_name": "original receipt item text",
      "matched_name": "one of allowed canonical Korean menu list",
      "qty": 1,
      "price": 0,
      "order_type": "POS",
      "confidence": 0.0,
      "needs_review": true
    }
  ]
}

Rules:
- matched_name must be exactly one of the allowed canonical Korean menu list.
- qty must be a number.
- price must be a number. If unknown, use 0.
- order_type must be either "POS" or "DELIVERY".
- confidence must be a number between 0 and 1.
- needs_review must be boolean.
- Return JSON only. No markdown. No explanation.
`.trim();

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = response?.text || "";
    const parsed = extractJsonBlock(text);

    const items = Array.isArray(parsed?.items)
      ? parsed.items.map((item: any) => {
          const matchedName = String(item?.matched_name || "").trim();
          const safeMatchedName = finalMenuCandidates.includes(matchedName)
            ? matchedName
            : finalMenuCandidates[0] || "";

          const qty = Number(item?.qty || 0);
          const price = Number(item?.price || 0);
          const confidenceRaw = Number(item?.confidence || 0);
          const confidence =
            Number.isFinite(confidenceRaw) && confidenceRaw >= 0
              ? Math.min(1, confidenceRaw)
              : 0;

          const rawOrderType = String(item?.order_type || "POS").trim().toUpperCase();
          const orderType = rawOrderType === "DELIVERY" ? "DELIVERY" : "POS";

          return {
            receipt_name: String(item?.receipt_name || "").trim(),
            matched_name: safeMatchedName,
            qty: Number.isFinite(qty) ? qty : 0,
            price: Number.isFinite(price) ? price : 0,
            order_type: orderType,
            confidence,
            needs_review: Boolean(item?.needs_review ?? true),
          };
        })
      : [];

    return res.status(200).json({
      ok: true,
      mode: "japan_pilot_structured",
      rawText: text,
      items,
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
