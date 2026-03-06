import { createClient } from "@supabase/supabase-js";
import type { MenuCategory } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "sales_daily";

type DailyRow = {
  date: string; // yyyy-mm-dd
  total_sales: number | null;
  orders: number | null;
  visit_count: number | null;
  sold_items: any | null;
  sold_items_summary: string | null;
  payload: any | null;
};

export type DailyPayload = {
  date: string;
  posSales: number;
  orders: number;
  visitCount: number;
  note?: string;
  monthlyTarget?: number | string;
  categories?: MenuCategory[];
  totalSales?: number;
};

const safeParsePayload = (payload: any) => {
  if (!payload) return {};
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return {};
    }
  }
  if (typeof payload === "object") return payload;
  return {};
};

const isDeletedPayload = (payload: any) => {
  const p = safeParsePayload(payload);
  return p && typeof p === "object" && p.deleted === true;
};

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeCategories = (raw: any): MenuCategory[] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const normalized: MenuCategory[] = raw
    .filter(
      (category: any) =>
        category &&
        typeof category === "object" &&
        typeof category.name === "string" &&
        Array.isArray(category.items)
    )
    .map((category: any) => ({
      name: String(category.name),
      items: (category.items ?? [])
        .filter(
          (item: any) =>
            item &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.name === "string"
        )
        .map((item: any) => ({
          id: String(item.id),
          name: String(item.name),
          price: toNumber(item.price, 0),
          qty: toNumber(item.qty, 0),
          unitCost:
            item.unitCost === undefined || item.unitCost === null || item.unitCost === ""
              ? undefined
              : toNumber(item.unitCost, 0),
        })),
    }))
    .filter((category) => Array.isArray(category.items));

  return normalized.length > 0 ? normalized : null;
};

const calcTotalSalesFromCategories = (categories?: MenuCategory[] | null) => {
  if (!Array.isArray(categories)) return 0;

  return categories.reduce((sum, category) => {
    const categorySum = (category.items ?? []).reduce((itemSum, item) => {
      return itemSum + toNumber(item.price, 0) * toNumber(item.qty, 0);
    }, 0);

    return sum + categorySum;
  }, 0);
};

export async function saveDailyData(input: DailyPayload & { deleted?: boolean }) {
  const normalizedCategories = normalizeCategories(input.categories ?? null);

  const computedTotalSales =
    input.totalSales !== undefined && input.totalSales !== null
      ? toNumber(input.totalSales, 0)
      : calcTotalSalesFromCategories(normalizedCategories);

  const payload = {
    date: input.date,
    posSales: toNumber(input.posSales, 0),
    orders: toNumber(input.orders, 0),
    visitCount: toNumber(input.visitCount, 0),
    note: input.note ?? "",
    monthlyTarget: input.monthlyTarget ?? "",
    categories: normalizedCategories,
    totalSales: computedTotalSales,
    deleted: input.deleted === true,
  };

  const row: DailyRow = {
    date: input.date,
    total_sales: computedTotalSales,
    orders: toNumber(input.orders, 0),
    visit_count: toNumber(input.visitCount, 0),
    sold_items: normalizedCategories,
    sold_items_summary: "",
    payload,
  };

  const { data: updated, error: updateErr } = await supabase
    .from(TABLE)
    .update(row)
    .eq("date", input.date)
    .select("date");

  if (updateErr) {
    return { ok: false, error: updateErr.message, raw: updateErr };
  }

  if (updated && updated.length > 0) {
    return { ok: true };
  }

  const { error: insertErr } = await supabase.from(TABLE).insert(row);

  if (insertErr) {
    return { ok: false, error: insertErr.message, raw: insertErr };
  }

  return { ok: true };
}

export async function loadDaily(dateStr: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date,total_sales,orders,visit_count,sold_items,sold_items_summary,payload")
    .eq("date", dateStr)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[loadDaily] supabase error:", error);
    return null;
  }

  if (!data) return null;

  const row = data as DailyRow;
  const p: any = safeParsePayload(row.payload);

  if (p?.deleted === true) return null;

  const rawCategories = p?.categories ?? row.sold_items ?? null;
  const safeCategories = normalizeCategories(rawCategories);

  return {
    date: row.date,
    posSales: toNumber(p?.posSales ?? row.total_sales ?? 0, 0),
    orders: toNumber(p?.orders ?? row.orders ?? 0, 0),
    visitCount: toNumber(p?.visitCount ?? row.visit_count ?? 0, 0),
    note: String(p?.note ?? ""),
    monthlyTarget: p?.monthlyTarget ?? "",
    categories: safeCategories,
  };
}

export async function deleteDaily(dateStr: string) {
  const existing = await loadDaily(dateStr);

  if (!existing) {
    return true;
  }

  const result = await saveDailyData({
    ...existing,
    totalSales: calcTotalSalesFromCategories(existing.categories ?? null),
    deleted: true,
  });

  if (!result.ok) {
    throw result.raw ?? new Error(result.error || "Failed to delete daily data");
  }

  return true;
}

export async function listDatesInMonth(yearMonth: string) {
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,payload")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInMonth] supabase error:", error);
    return [];
  }

  const rows = (data ?? []) as any[];
  const filtered = rows.filter((r) => !isDeletedPayload(r.payload));

  return filtered.map((r) => r.date as string);
}

export async function listDatesInRange(startDate: string, endDate: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date,payload")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInRange] supabase error:", error);
    return [];
  }

  const rows = (data ?? []) as any[];
  const filtered = rows.filter((r) => !isDeletedPayload(r.payload));

  return filtered.map((r) => r.date as string);
}

export async function getMonthlyTotal(yearMonth: string) {
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;

  const { data, error } = await supabase
    .from(TABLE)
    .select("total_sales,payload")
    .gte("date", start)
    .lte("date", end);

  if (error) {
    console.error("[getMonthlyTotal] supabase error:", error);
    return 0;
  }

  let sum = 0;

  for (const r of (data ?? []) as any[]) {
    if (isDeletedPayload(r.payload)) continue;
    sum += toNumber(r.total_sales, 0);
  }

  return sum;
}
