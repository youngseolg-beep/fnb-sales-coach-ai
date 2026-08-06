import { GoogleGenAI } from "@google/genai";

function extractJsonBlock(text: string) {
  if (!text) return null;

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }

  const firstArrayStart = text.indexOf("[");
  const lastArrayEnd = text.lastIndexOf("]");
  if (firstArrayStart !== -1 && lastArrayEnd !== -1 && lastArrayEnd > firstArrayStart) {
    const raw = text.slice(firstArrayStart, lastArrayEnd + 1);
    try {
      return JSON.parse(raw);
    } catch {}
  }

  const firstObjectStart = text.indexOf("{");
  const lastObjectEnd = text.lastIndexOf("}");
  if (firstObjectStart !== -1 && lastObjectEnd !== -1 && lastObjectEnd > firstObjectStart) {
    const raw = text.slice(firstObjectStart, lastObjectEnd + 1);
    try {
      return JSON.parse(raw);
    } catch {}
  }

  return null;
}

function normalizeReceiptStoreName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const storeName = value.trim();
  return storeName || null;
}

type MenuCandidateInput =
  | string
  | {
      name?: string;
      jp_name?: string | null;
    };

type NormalizedMenuCandidate = {
  name: string;
  jp_name: string | null;
};

function normalizeMenuCandidates(menuCandidates: any): NormalizedMenuCandidate[] {
  if (!Array.isArray(menuCandidates)) return [];

  return (menuCandidates as MenuCandidateInput[])
    .map((v) => {
      if (typeof v === "string") {
        const name = v.trim();
        return name ? { name, jp_name: null } : null;
      }

      if (v && typeof v === "object") {
        const name = String(v.name || "").trim();
        const jp_name = String(v.jp_name || "").trim();

        if (!name) return null;

        return {
          name,
          jp_name: jp_name || null,
        };
      }

      return null;
    })
    .filter(Boolean) as NormalizedMenuCandidate[];
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

    const normalizedEmail = String(userEmail || "").trim().toUpperCase();
    const isJapanPilot = normalizedEmail === "JP_PN@THEBORN.CO.KR";

    const defaultModel = process.env.GEMINI_MODEL_OCR || "gemini-2.5-flash";
    const japanPilotModel =
      process.env.GEMINI_MODEL_OCR_JAPAN ||
      process.env.GEMINI_MODEL_OCR_FAST ||
      defaultModel;

    const model = isJapanPilot ? japanPilotModel : defaultModel;

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
                  "Extract the receipt into one JSON object only.\n" +
                  "Return this exact shape:\n" +
                  '{"raw_text":"all visible receipt text with line breaks preserved","receipt_store_name":"printed store or branch name, or null"}\n' +
                  "raw_text must contain all visible receipt text exactly as it appears, including line breaks.\n" +
                  "receipt_store_name must be the largest business, store, outlet, branch, or restaurant title printed near the top of the receipt.\n" +
                  "Ignore address, phone, tax ID, cashier, table, transaction number, and receipt number.\n" +
                  "Use null when the business name cannot be identified confidently.\n" +
                  "Do not add markdown fences, explanations, or other fields.",
              },
            ],
          },
        ],
      });

      const text = response?.text || "";
      const parsed = extractJsonBlock(text);
      const structuredResponse = parsed && !Array.isArray(parsed) ? parsed : null;
      const rawText =
        typeof structuredResponse?.raw_text === "string" && structuredResponse.raw_text.trim()
          ? structuredResponse.raw_text
          : text;
      const receiptStoreName = normalizeReceiptStoreName(
        structuredResponse?.receipt_store_name
      );

      return res.status(200).json({
        ok: true,
        mode: "raw_text",
        rawText,
        items: [],
        totals: {},
        model_used: model,
        receipt_store_name: receiptStoreName,
      });
    }

    const allowedMenus = normalizeMenuCandidates(menuCandidates);

    const defaultJapanHongkongBanjeomMenus: NormalizedMenuCandidate[] = [
      { name: "짬뽕", jp_name: "ちゃんぽん" },
      { name: "짬뽕 곱빼기", jp_name: "ちゃんぽん大盛" },
      { name: "짬뽕밥", jp_name: "ちゃんぽんバプ" },
      { name: "고추짬뽕", jp_name: "コチュチャンポン" },
      { name: "고추짬뽕 곱빼기", jp_name: "コチュチャンポン大盛" },
      { name: "고추짬뽕밥", jp_name: "コチュチャンポンバプ" },
      { name: "짜장", jp_name: "チャジャン麺" },
      { name: "짜장 곱빼기", jp_name: "チャジャン麺大盛" },
      { name: "짜장밥", jp_name: "チャジャンバプ" },
      { name: "볶음짬뽕", jp_name: null },
      { name: "쟁반짜장", jp_name: null },
      { name: "탕수육 소", jp_name: "タンスユク(小)" },
      { name: "탕수육 대", jp_name: "タンスユク(大)" },
      { name: "탕수육 하프", jp_name: "タンスユクハーフ" },
      { name: "깐풍기", jp_name: null },
      { name: "고기짜장", jp_name: null },
      { name: "고기짜장 곱빼기", jp_name: null },
      { name: "고기짬뽕", jp_name: null },
      { name: "고기짬뽕 곱빼기", jp_name: null },
      { name: "고기짬뽕밥", jp_name: null },
      { name: "콩국수", jp_name: null },
      { name: "모야시짬뽕", jp_name: null },
      { name: "중화냉면", jp_name: null },
      { name: "생맥주", jp_name: "生ビール" },
      { name: "병맥주", jp_name: "瓶ビール" },
      { name: "논알콜", jp_name: "ノンアルコール" },
      { name: "참이슬", jp_name: "チャミスル" },
      { name: "참이슬 머스캣", jp_name: "チャミスルマスカット" },
      { name: "참이슬 자두", jp_name: "チャミスルすもも" },
      { name: "처음처럼", jp_name: "チョウムチョロム" },
      { name: "좋은데이", jp_name: "ジョウンデー" },
      { name: "하이볼", jp_name: "ハイボール" },
      { name: "레몬사와", jp_name: "レモンサワー" },
      { name: "우롱하이", jp_name: "ウーロンハイ" },
      { name: "콜라", jp_name: "コカ・コーラ" },
      { name: "제로콜라", jp_name: "コカ・コーラゼロ" },
      { name: "사이다", jp_name: "サイダー" },
      { name: "오렌지주스", jp_name: "オレンジジュース" },
      { name: "칼피스", jp_name: "カルピス" },
      { name: "우롱차", jp_name: "ウーロン茶" },
      { name: "옥수수차", jp_name: "とうもろこし茶" },
      { name: "배주스", jp_name: "梨ジュース" },
      { name: "포도봉봉", jp_name: "ぶどうボンボン" },
      { name: "복숭아주스", jp_name: "桃ジュース" },
      { name: "IGIN하이볼", jp_name: "IGINハイボール" },
      { name: "콘차하이", jp_name: "コーン茶ハイ" },
    ];

    const finalMenuCandidates =
      allowedMenus.length > 0 ? allowedMenus : defaultJapanHongkongBanjeomMenus;

    const finalMenuNames = finalMenuCandidates.map((menu) => menu.name);

    const menuListText = finalMenuCandidates
      .map((menu) =>
        menu.jp_name
          ? `- ${menu.name} (Japanese reference: ${menu.jp_name})`
          : `- ${menu.name}`
      )
      .join("\n");

    const prompt = `
Analyze this Japanese restaurant receipt or admin sales image.

Context:
- Pilot account: JP_PN@THEBORN.CO.KR
- Country: ${country || "Japan"}
- Brand: ${brand || "Hong Kong Banjeom"}

Task:
Extract sold menu items and map each one to the closest Korean canonical menu name from the allowed list below.

Allowed menu list:
${menuListText}

Rules:
- Use Japanese reference names as strong hints.
- If item starts with "※" or "★", order_type = "DELIVERY"
- Otherwise, order_type = "POS"
- Keep original text in receipt_name
- matched_name must be exactly one name from the allowed menu list
- Do not invent new menu names
- Ignore subtotal, total, tax, address, phone, time, table, and staff info
- Extract receipt_store_name as the largest business, store, outlet, branch, or restaurant title printed near the top of the receipt
- Ignore address, phone, tax ID, cashier, table, transaction number, and receipt number when extracting receipt_store_name
- Use null for receipt_store_name if the business name cannot be identified confidently
- qty must be a number
- price must be a number, use 0 if unknown
- confidence must be 0 to 1
- needs_review must be boolean

Return JSON only in this shape:
{
  "receipt_store_name": "printed store or branch name, or null",
  "items": [
    {
      "receipt_name": "original text",
      "matched_name": "allowed Korean menu name",
      "qty": 1,
      "price": 0,
      "order_type": "POS",
      "confidence": 0.0,
      "needs_review": false
    }
  ]
}
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
    const parsedItems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
      ? parsed.items
      : [];
    const receiptStoreName = normalizeReceiptStoreName(
      !Array.isArray(parsed) ? parsed?.receipt_store_name : null
    );

    const items = parsedItems.map((item: any) => {
      const matchedName = String(item?.matched_name || "").trim();
      const safeMatchedName = finalMenuNames.includes(matchedName)
        ? matchedName
        : finalMenuNames[0] || "";

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
    });

    return res.status(200).json({
      ok: true,
      mode: "japan_pilot_structured",
      rawText: text,
      items,
      totals: {},
      model_used: model,
      receipt_store_name: receiptStoreName,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: error?.message || String(error),
    });
  }
}
