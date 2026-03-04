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

export async function saveDailyData(input: DailyPayload) {
  const payload = {
    date: input.date,
    posSales: Number(input.posSales || 0),
    orders: Number(input.orders || 0),
    visitCount: Number(input.visitCount || 0),
    note: input.note ?? "",
    monthlyTarget: input.monthlyTarget ?? "",
    categories: input.categories ?? null,
    totalSales: Number(input.totalSales || 0),
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

  // ✅ onConflict/unique 제약에 의존하지 않고 "update → 없으면 insert"로 처리
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

  // ✅ payload가 string으로 저장된 케이스(옛날 데이터)까지 방어
  let p: any = row.payload ?? {};
  if (typeof p === "string") {
    try {
      p = JSON.parse(p);
    } catch {
      p = {};
    }
  }

  // ✅ categories가 깨졌거나(객체/문자열/null) items가 없으면 무조건 null로
  const rawCats = p?.categories ?? row.sold_items ?? null;
  const catsOk =
    Array.isArray(rawCats) &&
    rawCats.length > 0 &&
    rawCats.every(
      (c: any) => c && typeof c === "object" && typeof c.name === "string" && Array.isArray(c.items)
    );

  const safeCategories = catsOk ? (rawCats as MenuCategory[]) : null;

  return {
    date: row.date,
    posSales: Number(p.posSales ?? row.total_sales ?? 0),
    orders: Number(p.orders ?? row.orders ?? 0),
    visitCount: Number(p.visitCount ?? row.visit_count ?? 0),
    note: String(p.note ?? ""),
    monthlyTarget: p.monthlyTarget ?? "",
    categories: safeCategories, // ✅ 깨진 날은 null로 보내서 App.tsx가 INITIAL_CATEGORIES로 대체함
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
    .select("date")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInMonth] supabase error:", error);
    return [];
  }
  return (data ?? []).map((r: any) => r.date as string);
}

export async function listDatesInRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInRange] supabase error:", error);
    return [];
  }
  return (data ?? []).map((r: any) => r.date as string);
}

export async function getMonthlyTotal(yearMonth: string) {
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;

  const { data, error } = await supabase
    .from(TABLE)
    .select("total_sales")
    .gte("date", start)
    .lte("date", end);

  if (error) {
    console.error("[getMonthlyTotal] supabase error:", error);
    return 0;
  }

  let sum = 0;
  for (const r of (data ?? []) as any[]) sum += Number(r.total_sales ?? 0);
  return sum;
}
