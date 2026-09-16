import { GoogleGenAI } from "@google/genai";
import { requireStoreUserAuthorization } from "./_serverAuth.js";

const extractJsonObject = (text: string): unknown => {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  }
};

const isStructuredBoostPlan = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const plan = value as { summary?: unknown; target?: unknown; actions?: unknown; watchouts?: unknown; successMetrics?: unknown };
  const target = plan.target as Record<string, unknown> | undefined;
  return (
    typeof plan.summary === "string" && !!target && typeof target.objective === "string" &&
    typeof target.timeHorizon === "string" && Array.isArray(plan.actions) && plan.actions.length <= 3 &&
    Array.isArray(plan.watchouts) && Array.isArray(plan.successMetrics)
  );
};

const commercialTextValues = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(commercialTextValues);
  if (!value || typeof value !== "object") return [];
  return Object.values(value as Record<string, unknown>).flatMap(commercialTextValues);
};

const commercialNumericFieldNames = new Set([
  "discount",
  "discountpercent",
  "discountpercentage",
  "discountamount",
  "coupon",
  "couponvalue",
  "voucher",
  "vouchervalue",
  "giveaway",
  "freeitem",
  "freedrink",
  "bundleprice",
  "setprice",
  "promotionalprice",
  "promoprice",
  "pricereduction",
  "pricediscount",
]);

const hasConcreteNumericValue = (value: unknown) =>
  typeof value === "number" || (typeof value === "string" && /\d[\d,]*(?:\.\d+)?/.test(value));

const hasNumericCommercialField = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasNumericCommercialField);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, fieldValue]) => {
    const normalizedKey = key.replace(/[\s_-]/g, "").toLowerCase();
    return (commercialNumericFieldNames.has(normalizedKey) && hasConcreteNumericValue(fieldValue)) ||
      hasNumericCommercialField(fieldValue);
  });
};

const hasEconomicValidation = (value: unknown) => {
  const text = String(value || "");
  return /(원가|공헌이익|마진)/.test(text) && /(확인|검증|승인)/.test(text);
};

const hasFinalizedGiveawayInstruction = (text: string) => {
  const hasGiveawayConcept = /(?:무료|공짜|free|complimentary|giveaway|증정)/i.test(text);
  if (!hasGiveawayConcept) return false;

  const directFulfillment = /(?:무료\s*(?:음료\s*)?(?:제공|증정)|공짜\s*제공|\bfree\s+(?:drink|item)\b|\bcomplimentary\s+item\b|\bgiveaway\b)/i;
  if (directFulfillment.test(text)) return true;

  const unresolvedPromotionConcept = /증정\s*프로모션/.test(text) &&
    /(?:검토|테스트\s*여부|미확정|결정\s*전|승인\s*전)/.test(text);
  return !unresolvedPromotionConcept;
};

const hasUnsafeCommercialTerm = (text: string) => {
  const amount = "\\d[\\d,]*(?:\\.\\d+)?";
  const currency = "(?:[$€£¥₩₹฿₱]|원|엔)";
  const currencyAmount = `(?:(?:${currency}\\s*${amount})|(?:${amount}\\s*${currency})|(?:\\b[A-Za-z]{3}\\b\\s*${amount})|(?:${amount}\\s*\\b[A-Za-z]{3}\\b))`;
  const numericDiscount = /(?:\d+(?:\.\d+)?\s*%\s*(?:할인|off|discount|인하|적용)|(?:discount|off)\s*\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*percent\s*discount)/i;
  const monetaryDiscount = new RegExp(`${currencyAmount}\\s*(?:할인|[Oo][Ff]|[Dd]iscount|인하|낮춤|낮추)`);
  const numericCoupon = new RegExp(`(?:${currencyAmount}\\s*(?:쿠폰|[Cc]oupon|[Vv]oucher)|(?:쿠폰|[Cc]oupon|[Vv]oucher)(?:\\s*[Vv]alue)?\\s*[:：]?\\s*${currencyAmount})`);
  const bogo = /(?:\b(?:bogo|buy\s+one\s+get\s+one)\b|\b\d+\s*\+\s*\d+\b)/i;
  const setPrice = new RegExp(`(?:(?:세트|[Bb]undle|[Ss]et)\\s*(?:가격|[Pp]rice)\\s*[:：]?\\s*${currencyAmount}|${currencyAmount}\\s*(?:세트|[Bb]undle|[Ss]et)\\s*(?:가격|[Pp]rice)?)`);
  return numericDiscount.test(text) || monetaryDiscount.test(text) || numericCoupon.test(text) || bogo.test(text) || setPrice.test(text) ||
    hasFinalizedGiveawayInstruction(text);
};

const hasImplementationFirstStep = (text: string) =>
  /(?:가격\s*변경\s*(?:적용|실행|시작)|프로모션\s*적용(?!\s*여부)|즉시\s*적용|실행\s*시작|판매\s*시작|할인\s*적용)/.test(text);

const passesCommercialSafety = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  if (hasNumericCommercialField(value)) return false;
  if (commercialTextValues(value).some(hasUnsafeCommercialTerm)) return false;
  const actions = (value as { actions?: unknown }).actions;
  if (!Array.isArray(actions)) return false;
  return actions.every((action) => {
    if (!action || typeof action !== "object") return false;
    const item = action as { type?: unknown; guardrail?: unknown; executionSteps?: unknown };
    if (item.type !== "PRICE" && item.type !== "SET_PROMOTION") return true;
    const steps = Array.isArray(item.executionSteps) ? item.executionSteps : [];
    return hasEconomicValidation(item.guardrail) && steps.length > 0 &&
      hasEconomicValidation(steps[0]) && !hasImplementationFirstStep(String(steps[0] || ""));
  });
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    const context = req.body?.context;
    const authorization = await requireStoreUserAuthorization(req, context?.store?.storeId);
    if (authorization.ok === false) {
      return res.status(authorization.status).json({ ok: false, error: authorization.error });
    }

    const apiKey = process.env.GEMINI_API_KEY_COACH;
    if (!apiKey) return res.status(500).json({ ok: false, error: "GEMINI_API_KEY_COACH is not configured" });

    if (!context?.store || !context?.period?.current || !Array.isArray(context?.deterministicCandidates)) {
      return res.status(400).json({ ok: false, error: "A structured Boost Plan context is required" });
    }

    const prompt = `You are an F&B operating coach creating a concrete next-action Boost Plan. Use the deterministic candidate and margin guardrails supplied in the input. Do not invent menu economics or recommend loss-making discounts. AI Menu Engineering may be absent; do not require it. Expected effects must be estimates, never guarantees.

Commercial-term safety rules (mandatory):
- Deterministic candidates are operational and economic suggestions only; they are NOT proof of promotion or price approval.
- No current input authorizes a finalized discount percentage/amount, free item, giveaway, coupon value, bundle/set price, price reduction, or BOGO/1+1 condition. NEVER invent or finalize one.
- For unsupported SET_PROMOTION or PRICE ideas, use controlled-test wording: "세트 구성을 테스트", "가격 변경 전 공헌이익 확인", "프로모션 적용 여부 검토", "원가와 공헌이익 확인 후 조건 확정", or "본사/매장 승인 후 테스트 운영".
- A giveaway may only be described as a controlled test: "증정 프로모션은 원가와 공헌이익을 확인한 뒤 테스트 여부를 결정".
- Every PRICE or SET_PROMOTION action must set guardrail to a concrete economic validation statement containing 원가, 공헌이익, or 마진 and 확인, 검증, or 승인. Its first execution step must perform that validation or approval before implementation.
- Prefer action types in this order when candidates allow: MENU_EXPOSURE, UPSELL, OPERATIONS, SET_PROMOTION, PRICE. Do not make price discounting the default solution.
- Expected effects must be estimates such as "판매 전환 개선 가능성", "객단가 개선 가능성", "추가 주문 유도 기대", or "테스트 후 효과 확인". Never claim guaranteed sales, profit, or unit results.

Return exactly one JSON object and no markdown:
{
  "summary": "concise Korean summary",
  "target": { "objective": "string", "targetGrowthPercent": number or null, "timeHorizon": "string" },
  "actions": [{
    "priority": 1,
    "title": "string",
    "type": "MENU_EXPOSURE | UPSELL | SET_PROMOTION | PRICE | OPERATIONS | OTHER",
    "targetMenuIds": ["input menu ids only"],
    "targetMenuNames": ["input menu names only"],
    "rationale": "string",
    "executionSteps": ["step 1", "step 2"],
    "owner": "string",
    "timing": "string",
    "expectedEffect": "estimated effect only",
    "guardrail": "PRICE 또는 SET_PROMOTION은 원가와 공헌이익 확인 후 조건 확정; 그 외 액션은 후보 제약 준수"
  }],
  "watchouts": ["string"],
  "successMetrics": ["string"]
}

Use at most three actions. Write all response text in Korean. Do not create actions that contradict the deterministic candidates or their margin constraints.

INPUT:
${JSON.stringify(context)}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_COACH || "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const result = extractJsonObject(response?.text || "");
    if (!isStructuredBoostPlan(result)) {
      return res.status(502).json({ ok: false, error: "INVALID_MODEL_RESPONSE", message: "Gemini returned an invalid Boost Plan response" });
    }
    if (!passesCommercialSafety(result)) {
      return res.status(502).json({ ok: false, error: "UNSAFE_COMMERCIAL_TERM", message: "Gemini returned an unsupported commercial condition" });
    }
    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: error?.message || String(error) });
  }
}
