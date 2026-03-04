// ✅ services/salesStorage.ts (이 파일 "전체를" 아래 코드로 통째로 교체해서 복붙)
//
// 목적:
// 1) 콘솔 에러 "payload is not defined" 제거
// 2) Supabase 400 에러 "Use of aggregate functions is not allowed" 제거 (sum() 같은 aggregate 안 씀)
// 3) 저장/불러오기/월합계/점표시(listDatesInMonth) 정상화
//
// ✅ Supabase 환경변수는 Vercel/로컬 둘 다 아래 이름으로 있어야 함
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY

import { createClient } from "@supabase/supabase-js";
import type { MenuCategory } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "sales_daily";
const STORE_ID = "hongkongbanjeom-cambodia";

type DailyRow = {
  store_id: string;
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
  // ✅ payload 변수를 "반드시 여기서 정의" (ReferenceError 방지)
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
    store_id: STORE_ID,
    date: input.date,
    total_sales: Number(input.totalSales ?? input.posSales ?? 0),
    orders: Number(input.orders ?? 0),
    visit_count: Number(input.visitCount ?? 0),
    sold_items: input.categories ?? null,
    sold_items_summary: "",
    payload,
  };

  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "store_id,date" });

  if (error) {
    return { ok: false, error: error.message, raw: error };
  }
  return { ok: true };
}

export async function loadDaily(dateStr: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("store_id,date,total_sales,orders,visit_count,sold_items,sold_items_summary,payload")
    .eq("store_id", STORE_ID)
    .eq("date", dateStr)
    .maybeSingle();

  if (error) {
    console.error("[loadDaily] supabase error:", error);
    return null;
  }
  if (!data) return null;

  const row = data as DailyRow;

  const p = (row.payload ?? {}) as any;

  return {
    date: row.date,
    posSales: Number(p.posSales ?? row.total_sales ?? 0),
    orders: Number(p.orders ?? row.orders ?? 0),
    visitCount: Number(p.visitCount ?? row.visit_count ?? 0),
    note: String(p.note ?? ""),
    monthlyTarget: p.monthlyTarget ?? "",
    categories: (p.categories ?? null) as MenuCategory[] | null,
  };
}

export async function deleteDaily(dateStr: string) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("store_id", STORE_ID)
    .eq("date", dateStr);

  if (error) throw error;
  return true;
}

// ✅ 캘린더 점 표시용: 해당 월에 데이터 있는 날짜 리스트
export async function listDatesInMonth(yearMonth: string) {
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;

  const { data, error } = await supabase
    .from(TABLE)
    .select("date")
    .eq("store_id", STORE_ID)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInMonth] supabase error:", error);
    return [];
  }
  return (data ?? []).map((r: any) => r.date as string);
}

// ✅ 월합계: aggregate(sum) 금지라서 "row들을 가져와서 JS로 합산"
export async function getMonthlyTotal(yearMonth: string) {
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;

  const { data, error } = await supabase
    .from(TABLE)
    .select("total_sales")
    .eq("store_id", STORE_ID)
    .gte("date", start)
    .lte("date", end);

  if (error) {
    console.error("[getMonthlyTotal] supabase error:", error);
    return 0;
  }

  const rows = data ?? [];
  let sum = 0;
  for (const r of rows as any[]) {
    sum += Number(r.total_sales ?? 0);
  }
  return sum;
}
