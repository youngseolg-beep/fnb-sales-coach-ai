import { getAuthenticatedApiHeaders } from "./apiAuth";
import { AiFeatureError, type AiFeatureErrorCode } from "./aiFeatureError";

export type AiMenuPriority = {
  menuId: string;
  menuName: string;
  classification: "STAR" | "CASH_COW" | "PUZZLE" | "DOG";
  diagnosis: string;
  recommendedAction: string;
  rationale: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type AiMenuEngineeringResult = {
  summary: string;
  priorities: AiMenuPriority[];
  categoryStrategies: {
    stars: string;
    cashCows: string;
    puzzles: string;
    dogs: string;
  };
};

export type AiMenuEngineeringContext = {
  store: { storeId: number; brand?: string; country?: string; currency: string };
  period: { start: string; end: string };
  overall: { totalSales: number; orders: number; visitors: number; averageTicket: number };
  summary: { popularityThreshold: number; profitabilityThreshold: number; analyzedDayCount: number };
  menus: Array<{
    id: string;
    name: string;
    classification: "STAR" | "CASH_COW" | "PUZZLE" | "DOG";
    quantity: number;
    price: number;
    unitCost: number | null;
    revenue: number;
    contributionMargin: number | null;
    popularity: "High" | "Low";
    profitability: "High" | "Low";
  }>;
};

const parseResult = (value: unknown): AiMenuEngineeringResult | null => {
  if (!value || typeof value !== "object") return null;
  const result = value as Partial<AiMenuEngineeringResult>;
  const strategies = result.categoryStrategies;
  if (
    typeof result.summary !== "string" ||
    !Array.isArray(result.priorities) ||
    !strategies ||
    typeof strategies.stars !== "string" ||
    typeof strategies.cashCows !== "string" ||
    typeof strategies.puzzles !== "string" ||
    typeof strategies.dogs !== "string"
  ) return null;

  const priorities = result.priorities;
  const hasValidPriority = (item: unknown): item is AiMenuPriority => {
    if (!item || typeof item !== "object") return false;
    const priority = item as AiMenuPriority;
    return (
      typeof priority.menuId === "string" &&
      typeof priority.menuName === "string" &&
      ["STAR", "CASH_COW", "PUZZLE", "DOG"].includes(priority.classification) &&
      typeof priority.diagnosis === "string" &&
      typeof priority.recommendedAction === "string" &&
      typeof priority.rationale === "string" &&
      ["HIGH", "MEDIUM", "LOW"].includes(priority.priority)
    );
  };

  if (!priorities.every(hasValidPriority)) return null;

  return { summary: result.summary, priorities, categoryStrategies: strategies };
};

export const generateAiMenuEngineering = async (
  context: AiMenuEngineeringContext
): Promise<AiMenuEngineeringResult> => {
  const headers = await getAuthenticatedApiHeaders();
  const response = await fetch("/api/menu-engineering", {
    method: "POST",
    headers,
    body: JSON.stringify({ context }),
  });
  const body = await response.text();
  let payload: unknown = null;
  if (body.trim()) {
    try {
      payload = JSON.parse(body);
    } catch {
      payload = null;
    }
  }

  const envelope = payload as { ok?: boolean; result?: unknown; message?: unknown; error?: unknown } | null;
  if (!response.ok || !envelope?.ok) {
    const code = String(envelope?.error || "MODEL_REQUEST_FAILED") as AiFeatureErrorCode;
    throw new AiFeatureError("menu_engineering", code, response.status, String(envelope?.message || "AI 서비스 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."), body);
  }

  const result = parseResult(envelope.result);
  if (!result) throw new AiFeatureError("menu_engineering", "INVALID_MODEL_RESPONSE", response.status);
  return result;
};
