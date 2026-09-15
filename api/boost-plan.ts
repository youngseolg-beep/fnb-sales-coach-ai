import { GoogleGenAI } from "@google/genai";

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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    const apiKey = process.env.GEMINI_API_KEY_COACH;
    if (!apiKey) return res.status(500).json({ ok: false, error: "GEMINI_API_KEY_COACH is not configured" });

    const context = req.body?.context;
    if (!context?.store || !context?.period?.current || !Array.isArray(context?.deterministicCandidates)) {
      return res.status(400).json({ ok: false, error: "A structured Boost Plan context is required" });
    }

    const prompt = `You are an F&B operating coach creating a concrete next-action Boost Plan. Use the deterministic candidate and margin guardrails supplied in the input. Do not invent menu economics or recommend loss-making discounts. AI Menu Engineering may be absent; do not require it. Expected effects must be estimates, never guarantees.

Commercial-term safety rules (mandatory):
- Treat a discount percentage/amount, free item or giveaway, coupon value, bundle/set price, price reduction, or BOGO/1+1 condition as approved only when that exact term and numeric value are explicitly present in the supplied structured input or deterministic candidate.
- If no exact verified commercial term is supplied, NEVER invent or finalize one. Do not write examples such as "15% 할인", "무료 음료 제공", "1+1", "$2 할인", "세트 가격", or a price reduction as an approved action.
- For unsupported SET_PROMOTION or PRICE ideas, use controlled-test wording: "세트 구성을 테스트", "가격 변경 전 공헌이익 확인", "프로모션 적용 여부 검토", "원가와 공헌이익 확인 후 조건 확정", or "본사/매장 승인 후 테스트 운영".
- A giveaway may only be described as a controlled test unless explicitly authorized: "증정 프로모션은 원가와 공헌이익을 확인한 뒤 테스트 여부를 결정".
- Every PRICE or SET_PROMOTION action must set guardrail to a concrete validation statement such as "원가와 공헌이익 확인 후 프로모션 조건 확정" or "마진 검증 및 운영 승인 후 가격 테스트". Never use vague text such as "deterministic guardrail respected".
- When PRICE or SET_PROMOTION has no verified commercial condition, executionSteps must include margin/economic validation before any implementation step.
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
    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: error?.message || String(error) });
  }
}
