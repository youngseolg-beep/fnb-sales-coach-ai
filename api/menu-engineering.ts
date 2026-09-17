import { GoogleGenAI } from "@google/genai";
import { requireStoreUserAuthorization } from "./_serverAuth.js";

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

const strategyInvalidFields = (value: unknown): string[] => {
  const invalid: string[] = [];
  if (!value || typeof value !== "object") return ["root"];
  const result = value as { summary?: unknown; priorities?: unknown; categoryStrategies?: unknown };
  const strategies = result.categoryStrategies as Record<string, unknown> | undefined;
  if (typeof result.summary !== "string") invalid.push("summary");
  if (!Array.isArray(result.priorities) || result.priorities.length > 5) invalid.push("priorities");
  else result.priorities.forEach((item, index) => {
    const priority = item as Record<string, unknown> | null;
    if (!priority || typeof priority !== "object" || typeof priority.menuId !== "string" || typeof priority.menuName !== "string" || !["STAR", "CASH_COW", "PUZZLE", "DOG"].includes(String(priority.classification)) || typeof priority.diagnosis !== "string" || typeof priority.recommendedAction !== "string" || typeof priority.rationale !== "string" || !["HIGH", "MEDIUM", "LOW"].includes(String(priority.priority))) invalid.push(`priorities[${index}]`);
  });
  if (!strategies || ["stars", "cashCows", "puzzles", "dogs"].some((key) => typeof strategies[key] !== "string")) invalid.push("categoryStrategies");
  return invalid;
};

const isStructuredStrategy = (value: unknown) => strategyInvalidFields(value).length === 0;

const strategySchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "priorities", "categoryStrategies"],
  properties: {
    summary: { type: "string" },
    priorities: { type: "array", maxItems: 5, items: { type: "object", additionalProperties: false, required: ["menuId", "menuName", "classification", "diagnosis", "recommendedAction", "rationale", "priority"], properties: { menuId: { type: "string" }, menuName: { type: "string" }, classification: { type: "string", enum: ["STAR", "CASH_COW", "PUZZLE", "DOG"] }, diagnosis: { type: "string" }, recommendedAction: { type: "string" }, rationale: { type: "string" }, priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] } } } },
    categoryStrategies: { type: "object", additionalProperties: false, required: ["stars", "cashCows", "puzzles", "dogs"], properties: { stars: { type: "string" }, cashCows: { type: "string" }, puzzles: { type: "string" }, dogs: { type: "string" } } },
  },
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const context = req.body?.context;
    const authorization = await requireStoreUserAuthorization(req, context?.store?.storeId);
    if (authorization.ok === false) {
      return res.status(authorization.status).json({ ok: false, error: "AUTH_ERROR", message: "로그인 권한을 다시 확인해 주세요." });
    }

    const apiKey = process.env.GEMINI_API_KEY_COACH;
    if (!apiKey) return res.status(500).json({ ok: false, error: "CONFIG_ERROR", message: "AI 서비스 설정을 확인할 수 없습니다." });

    if (!context || !Array.isArray(context.menus) || context.menus.length === 0) {
      return res.status(400).json({ ok: false, error: "NO_MENU_DATA", message: "분석할 메뉴 판매 데이터가 없습니다." });
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
    const generate = (text: string) => ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text }] }],
      config: { responseMimeType: "application/json", responseJsonSchema: strategySchema },
    });
    let response = await generate(prompt);
    let result = extractJsonObject(response?.text || "");
    if (!isStructuredStrategy(result)) {
      console.error("Menu Engineering invalid structured response", { attempt: 1, responseLength: (response?.text || "").length, parsedKeys: result && typeof result === "object" ? Object.keys(result as object) : [], invalidFields: strategyInvalidFields(result) });
      response = await generate(`${prompt}\n\nREPAIR: The previous response did not match the required JSON schema. Return only the exact required JSON object, no markdown. Do not recalculate deterministic classifications; use only supplied menu IDs and names.`);
      result = extractJsonObject(response?.text || "");
    }
    if (!isStructuredStrategy(result)) {
      console.error("Menu Engineering invalid structured response", { attempt: 2, responseLength: (response?.text || "").length, parsedKeys: result && typeof result === "object" ? Object.keys(result as object) : [], invalidFields: strategyInvalidFields(result) });
      return res.status(502).json({ ok: false, error: "INVALID_MODEL_RESPONSE", message: "AI 응답 형식을 확인하지 못했습니다. 다시 시도해 주세요." });
    }

    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    console.error("Menu Engineering generation failed", error);
    return res.status(502).json({ ok: false, error: "MODEL_REQUEST_FAILED", message: "AI 서비스 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
}
