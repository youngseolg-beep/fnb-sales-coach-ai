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

export async function saveDailyData(input: DailyPayload & { deleted?: boolean }) {
  const payload = {
    date: input.date,
    posSales: Number(input.posSales || 0),
    orders: Number(input.orders || 0),
    visitCount: Number(input.visitCount || 0),
    note: input.note ?? "",
    monthlyTarget: input.monthlyTarget ?? "",
    categories: input.categories ?? null,
    totalSales: Number(input.totalSales || 0),
    deleted: input.deleted === true, // ✅ soft delete flag
  };

  const row: DailyRow = {
    date: input.date,
    total_sales: Number(input.totalSales ?? input.posSales ?? 0),
    orders: Number(input.orders ?? 0),
    visit_count: Number(input.visitCount ?? 0),
    sold_items: input.categories ?? null,
    sold_items_summary: "",
    payload,
  };

  // update → 없으면 insert
  const { data: updated, error: updateErr } = await supabase
    .from(TABLE)
    .update(row)
    .eq("date", input.date)
    .select("date");

  if (updateErr) return { ok: false, error: updateErr.message, raw: updateErr };
  if (updated && updated.length > 0) return { ok: true };

  const { error: insertErr } = await supabase.from(TABLE).insert(row);
  if (insertErr) return { ok: false, error: insertErr.message, raw: insertErr };

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

  // ✅ deleted=true면 “없는 날”로 처리
  if (p?.deleted === true) return null;

  // ✅ categories가 깨졌으면 null로 내려서 App.tsx에서 INITIAL_CATEGORIES로 대체하게
  const rawCats = p?.categories ?? row.sold_items ?? null;

  const catsOk =
    Array.isArray(rawCats) &&
    rawCats.length > 0 &&
    rawCats.every(
      (c: any) =>
        c &&
        typeof c === "object" &&
        typeof c.name === "string" &&
        Array.isArray(c.items)
    );

  const safeCategories = catsOk ? (rawCats as MenuCategory[]) : null;

  return {
    date: row.date,
    posSales: Number(p.posSales ?? row.total_sales ?? 0),
    orders: Number(p.orders ?? row.orders ?? 0),
    visitCount: Number(p.visitCount ?? row.visit_count ?? 0),
    note: String(p.note ?? ""),
    monthlyTarget: p.monthlyTarget ?? "",
    categories: safeCategories,
  };
}

export async function deleteDaily(dateStr: string) {
  const { error } = await supabase.from(TABLE).delete().eq("date", dateStr);
  if (error) throw error;
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

  // ✅ deleted=true 인 날은 점에서 제외
  const filtered = rows.filter((r) => !isDeletedPayload(r.payload));

  return filtered.map((r) => r.date as string);
}

/**
 * ✅ SaaS 기준: “DB에 존재하는 날짜만” 리턴
 * - deleted=true 제외
 * - (중요) 이 함수는 이 파일에 "딱 1번만" 존재해야 함
 */
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

  // ✅ deleted=true 제외하고 합산
  let sum = 0;
  for (const r of (data ?? []) as any[]) {
    if (isDeletedPayload(r.payload)) continue;
    sum += Number(r.total_sales ?? 0);
  }
  return sum;
}
