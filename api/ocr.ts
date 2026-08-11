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

const SUPPORTED_RECEIPT_CURRENCIES = new Set([
  "USD",
  "IDR",
  "PHP",
  "TWD",
  "SGD",
  "MYR",
  "MNT",
  "EUR",
  "AUD",
  "THB",
  "JPY",
  "CNY",
  "KRW",
]);

function normalizeReceiptCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase();
  return SUPPORTED_RECEIPT_CURRENCIES.has(currency) ? currency : null;
}

function normalizeAmount(value: unknown): number | null {
  const amount = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value.replace(/,/g, "").trim())
      : Number.NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
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

    const apiKey = process.env.GEMINI_API_KEY_OCR;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "GEMINI_API_KEY_OCR is not configured" });
    }

    const {
      imageBase64,
      mimeType,
      images,
      userEmail,
      country,
      brand,
      menuCandidates,
    } = req.body || {};

    const receiptImages = Array.isArray(images) && images.length > 0
      ? images
          .filter((image: any) => typeof image?.imageBase64 === "string" && image.imageBase64.trim())
          .map((image: any) => ({
            data: image.imageBase64,
            mimeType: typeof image.mimeType === "string" && image.mimeType ? image.mimeType : "image/jpeg",
          }))
      : typeof imageBase64 === "string" && imageBase64
        ? [{ data: imageBase64, mimeType: mimeType || "image/jpeg" }]
        : [];

    if (receiptImages.length === 0) {
      return res.status(400).json({ ok: false, error: "At least one receipt image is required" });
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
              ...receiptImages.map((image) => ({ inlineData: image })),
              {
                text:
                  "Treat all supplied images as sequential parts of ONE receipt document, in upload order. Extract the receipt into one JSON object only.\n" +
                  "Return this exact shape:\n" +
                  '{"raw_text":"all visible receipt text with line breaks preserved","receipt_store_name":"printed store or branch name, or null","receipt_currency":"uppercase ISO currency code, or null","receipt_subtotal":null,"service_charge":null,"tax":null,"receipt_total":null}\n' +
                  "raw_text must contain all visible receipt text exactly as it appears, including line breaks.\n" +
                  "receipt_store_name must be the largest business, store, outlet, branch, or restaurant title printed near the top of the receipt.\n" +
                  "Ignore address, phone, tax ID, cashier, table, transaction number, and receipt number.\n" +
                  "Use null when the business name cannot be identified confidently.\n" +
                  "receipt_currency must be an uppercase ISO currency code using visible receipt evidence only. Rp, Rupiah, or IDR means IDR; USD or US$ means USD; $ means USD only when the receipt context clearly indicates USD; SGD or S$ means SGD; THB or ฿ means THB; KRW or ₩ means KRW; ¥ means JPY only when the receipt context clearly indicates Japan.\n" +
                  "Do not infer receipt_currency from number formatting alone. If multiple currencies appear, use the currency for the final payable total; use null if it cannot be determined confidently.\n" +
                  "receipt_subtotal is the menu/item subtotal before service charge and tax. receipt_total is the final paid amount. Keep service_charge and tax separate. Use null when a value is absent or uncertain.\n" +
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
      const receiptCurrency = normalizeReceiptCurrency(
        structuredResponse?.receipt_currency
      );

      return res.status(200).json({
        ok: true,
        mode: "raw_text",
        rawText,
        items: [],
        totals: {
          receipt_subtotal: normalizeAmount(structuredResponse?.receipt_subtotal),
          service_charge: normalizeAmount(structuredResponse?.service_charge),
          tax: normalizeAmount(structuredResponse?.tax),
          receipt_total: normalizeAmount(structuredResponse?.receipt_total),
        },
        model_used: model,
        receipt_store_name: receiptStoreName,
        receipt_currency: receiptCurrency,
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
Analyze these Japanese restaurant receipt images as one receipt document in the supplied upload order.

Context:
- Pilot account: JP_PN@THEBORN.CO.KR
- Country: ${country || "Japan"}
- Brand: ${brand || "Hong Kong Banjeom"}

Task:
Extract sold menu items and map each one to the closest Korean canonical menu name from the allowed list below.

Allowed menu list:
${menuListText}

Rules:
- The supplied images are consecutive sections of ONE long receipt. Extract every sold menu row across all sections before reading the financial summary.
- Adjacent photos can overlap. Remove an item only when it is clearly the same printed boundary row repeated in adjacent image context; never globally deduplicate identical menu names because separate purchases can be legitimate.
- Use Japanese reference names as strong hints.
- If item starts with "※" or "★", order_type = "DELIVERY"
- Otherwise, order_type = "POS"
- Keep original text in receipt_name
- matched_name must be exactly one name from the allowed menu list when confidence is high enough; otherwise return an empty string and needs_review = true
- Do not invent new menu names or force an uncertain item to an allowed menu
- Ignore subtotal, service charge, tax, payment, change, address, phone, time, table, and staff info when extracting menu items
- Extract receipt_store_name as the largest business, store, outlet, branch, or restaurant title printed near the top of the receipt
- Ignore address, phone, tax ID, cashier, table, transaction number, and receipt number when extracting receipt_store_name
- Use null for receipt_store_name if the business name cannot be identified confidently
- Extract receipt_currency as an uppercase ISO currency code using visible receipt evidence only
- Rp, Rupiah, or IDR means IDR; USD or US$ means USD; $ means USD only when the receipt context clearly indicates USD; SGD or S$ means SGD; THB or ฿ means THB; KRW or ₩ means KRW; ¥ means JPY only when the receipt context clearly indicates Japan
- Do not infer receipt_currency from number formatting alone. If multiple currencies appear, use the currency for the final payable total; use null if it cannot be determined confidently
- qty must be a number
- price is always the unit price, never the line total; use 0 if unknown
- line_total is the printed line amount when visible, otherwise null
- confidence must be 0 to 1
- needs_review must be boolean
- receipt_subtotal is the menu/item subtotal before service charge and tax; service_charge and tax are separate optional amounts; receipt_total is the final charged/payment total

Return JSON only in this shape:
{
  "receipt_store_name": "printed store or branch name, or null",
  "receipt_currency": "uppercase ISO currency code, or null",
  "receipt_subtotal": null,
  "service_charge": null,
  "tax": null,
  "receipt_total": null,
  "items": [
    {
      "receipt_name": "original text",
      "matched_name": "allowed Korean menu name",
      "qty": 1,
      "price": 0,
      "line_total": null,
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
            ...receiptImages.map((image) => ({ inlineData: image })),
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
    const receiptCurrency = normalizeReceiptCurrency(
      !Array.isArray(parsed) ? parsed?.receipt_currency : null
    );

    const items = parsedItems.map((item: any) => {
      const matchedName = String(item?.matched_name || "").trim();
      const safeMatchedName = finalMenuNames.includes(matchedName) ? matchedName : "";

      const qty = Number(item?.qty || 0);
      const price = Number(item?.price || 0);
      const confidenceRaw = Number(item?.confidence || 0);
      const confidence =
        Number.isFinite(confidenceRaw) && confidenceRaw >= 0
          ? Math.min(1, confidenceRaw)
          : 0;
      const lineTotal = normalizeAmount(item?.line_total);

      const rawOrderType = String(item?.order_type || "POS").trim().toUpperCase();
      const orderType = rawOrderType === "DELIVERY" ? "DELIVERY" : "POS";

      return {
        receipt_name: String(item?.receipt_name || "").trim(),
        matched_name: safeMatchedName,
        qty: Number.isFinite(qty) ? qty : 0,
        price: Number.isFinite(price) ? price : 0,
        line_total: lineTotal,
        order_type: orderType,
        confidence,
        needs_review: Boolean(item?.needs_review) || !safeMatchedName || confidence < 0.88 || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0,
      };
    });

    return res.status(200).json({
      ok: true,
      mode: "japan_pilot_structured",
      rawText: text,
      items,
      totals: {
        receipt_subtotal: normalizeAmount(!Array.isArray(parsed) ? parsed?.receipt_subtotal : null),
        service_charge: normalizeAmount(!Array.isArray(parsed) ? parsed?.service_charge : null),
        tax: normalizeAmount(!Array.isArray(parsed) ? parsed?.tax : null),
        receipt_total: normalizeAmount(!Array.isArray(parsed) ? parsed?.receipt_total : null),
      },
      model_used: model,
      receipt_store_name: receiptStoreName,
      receipt_currency: receiptCurrency,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: error?.message || String(error),
    });
  }
}
