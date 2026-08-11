export type AiBoostPlan = {
  summary: string;
  target: { objective: string; targetGrowthPercent: number | null; timeHorizon: string };
  actions: Array<{
    priority: number;
    title: string;
    type: "MENU_EXPOSURE" | "UPSELL" | "SET_PROMOTION" | "PRICE" | "OPERATIONS" | "OTHER";
    targetMenuIds: string[];
    targetMenuNames: string[];
    rationale: string;
    executionSteps: string[];
    owner: string;
    timing: string;
    expectedEffect: string;
    guardrail: string;
  }>;
  watchouts: string[];
  successMetrics: string[];
};

export type AiBoostPlanContext = {
  store: { storeId: number; brand?: string; country?: string; currency: string };
  period: { current: { start: string; end: string }; comparison: { start: string; end: string } | null };
  performance: {
    totalSales: number; salesDelta: number; orders: number; ordersDelta: number;
    visitors: number; visitorsDelta: number; averageTicket: number; aovDelta: number;
    conversion: number; conversionDelta: number; monthlyTarget: number | null; targetGap: number | null;
  };
  menuEngineering: { popularityThreshold: number; profitabilityThreshold: number; analyzedDayCount: number; menus: unknown[] };
  aiMenuEngineering: unknown | null;
  deterministicCandidates: unknown[];
};

const parsePlan = (value: unknown): AiBoostPlan | null => {
  if (!value || typeof value !== "object") return null;
  const plan = value as Partial<AiBoostPlan>;
  if (
    typeof plan.summary !== "string" ||
    !plan.target || typeof plan.target.objective !== "string" || typeof plan.target.timeHorizon !== "string" ||
    !Array.isArray(plan.actions) || plan.actions.length > 3 ||
    !Array.isArray(plan.watchouts) || !Array.isArray(plan.successMetrics)
  ) return null;

  const valid = plan.actions.every((action) => {
    if (!action || typeof action !== "object") return false;
    const item = action as AiBoostPlan["actions"][number];
    return (
      Number.isInteger(item.priority) &&
      typeof item.title === "string" &&
      ["MENU_EXPOSURE", "UPSELL", "SET_PROMOTION", "PRICE", "OPERATIONS", "OTHER"].includes(item.type) &&
      Array.isArray(item.targetMenuIds) && Array.isArray(item.targetMenuNames) &&
      typeof item.rationale === "string" && Array.isArray(item.executionSteps) &&
      typeof item.owner === "string" && typeof item.timing === "string" &&
      typeof item.expectedEffect === "string" && typeof item.guardrail === "string"
    );
  });

  return valid ? plan as AiBoostPlan : null;
};

export const generateAiBoostPlan = async (context: AiBoostPlanContext): Promise<AiBoostPlan> => {
  const response = await fetch("/api/boost-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  const body = await response.text();
  let payload: unknown = null;
  if (body.trim()) {
    try { payload = JSON.parse(body); } catch { payload = null; }
  }
  const envelope = payload as { ok?: boolean; result?: unknown; message?: unknown; error?: unknown } | null;
  if (!response.ok || !envelope?.ok) {
    throw new Error(`Boost Plan API ${response.status}: ${String(envelope?.message || envelope?.error || body || "request failed")}`);
  }
  const plan = parsePlan(envelope.result);
  if (!plan) throw new Error("Boost Plan API returned an invalid structured plan");
  return plan;
};
