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
    "guardrail": "deterministic guardrail respected"
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
