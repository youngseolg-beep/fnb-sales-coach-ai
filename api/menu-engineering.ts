import { GoogleGenAI } from "@google/genai";

const extractJsonObject = (text: string): unknown => {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

const isStructuredStrategy = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const result = value as { summary?: unknown; priorities?: unknown; categoryStrategies?: unknown };
  const strategies = result.categoryStrategies as Record<string, unknown> | undefined;
  return (
    typeof result.summary === "string" &&
    Array.isArray(result.priorities) &&
    !!strategies &&
    ["stars", "cashCows", "puzzles", "dogs"].every((key) => typeof strategies[key] === "string")
  );
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const apiKey = process.env.GEMINI_API_KEY_COACH;
    if (!apiKey) return res.status(500).json({ ok: false, error: "GEMINI_API_KEY_COACH is not configured" });

    const context = req.body?.context;
    if (!context || !Array.isArray(context.menus) || context.menus.length === 0) {
      return res.status(400).json({ ok: false, error: "A non-empty Menu Engineering context is required" });
    }

    const model = process.env.GEMINI_MODEL_COACH || "gemini-2.5-flash";
    const prompt = `You are an F&B menu strategy coach. Interpret the deterministic menu-engineering data below; do not recalculate or change its classifications.

Return exactly one JSON object and no markdown:
{
  "summary": "concise overall menu strategy summary",
  "priorities": [
    {
      "menuId": "input menu id",
      "menuName": "input menu name",
      "classification": "STAR | CASH_COW | PUZZLE | DOG",
      "diagnosis": "why this item matters",
      "recommendedAction": "specific operator action",
      "rationale": "data-grounded reason",
      "priority": "HIGH | MEDIUM | LOW"
    }
  ],
  "categoryStrategies": {
    "stars": "concise strategy",
    "cashCows": "concise strategy",
    "puzzles": "concise strategy",
    "dogs": "concise strategy"
  }
}

Use only menu IDs and names supplied in the input. Return at most five priorities. Do not invent missing costs, prices, quantities, sales, or operational facts. Write all strategy text in Korean.

INPUT:
${JSON.stringify(context)}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const result = extractJsonObject(response?.text || "");
    if (!isStructuredStrategy(result)) {
      return res.status(502).json({ ok: false, error: "INVALID_MODEL_RESPONSE", message: "Gemini returned an invalid Menu Engineering strategy response" });
    }

    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: error?.message || String(error) });
  }
}
