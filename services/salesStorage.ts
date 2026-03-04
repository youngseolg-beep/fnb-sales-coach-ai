// src/services/salesStorage.ts
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ ENV (Vite)
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // 런타임에서 바로 원인 보이게
  console.error(
    "[salesStorage] Missing env: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLE = "sales_daily";

/** -----------------------------
 * Types (앱 payload 기준)
 * ----------------------------- */
export type MenuItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  unitCost?: number;
};

export type MenuCategory = {
  name: string;
  items: MenuItem[];
};

export type DailyPayload = {
  date: string; // "YYYY-MM-DD"
  orders: number;
  visitCount: number;
  totalSales: number;
  monthlyTarget?: number;
  categories: MenuCategory[];
};

export type SoldItemRow = {
  id: string;
  name: string;
  qty: number;
  price: number;
  revenue: number;
};

/** -----------------------------
 * Helpers
 * ----------------------------- */
const clampNumber = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function buildSoldItems(payload: DailyPayload): SoldItemRow[] {
  const categories = Array.isArray(payload?.categories) ? payload.categories : [];

  const out: SoldItemRow[] = [];
  for (const cat of categories) {
    const items = Array.isArray(cat?.items) ? cat.items : [];
    for (const it of items) {
      const qty = safeNum(it?.qty, 0);
      if (qty > 0) {
        const price = safeNum(it?.price, 0);
        out.push({
          id: String(it?.id ?? ""),
          name: String(it?.name ?? ""),
          qty,
          price,
          revenue: qty * price,
        });
      }
    }
  }

  // id 없거나 name 없는 이상치 제거
  return out.filter((x) => x.name && x.qty > 0);
}

function buildSoldItemsSummary(soldItems: SoldItemRow[], currencySymbol = "$") {
  if (!soldItems.length) return "";
  // 예: 짜장면 x1 ($7), 짬뽕 x2 ($14)
  return soldItems
    .map((s) => `${s.name} x${s.qty} (${currencySymbol}${s.revenue})`)
    .join(", ");
}

/**
 * loadDaily에서 UI categories 템플릿(전체 메뉴 리스트)이 있을 경우
 * sold_items의 qty를 categories.items에 반영해주는 유틸
 */
function applySoldItemsToCategories(
  templateCategories: MenuCategory[],
  soldItems: SoldItemRow[]
): MenuCategory[] {
  const mapById = new Map<string, SoldItemRow>();
  const mapByName = new Map<string, SoldItemRow>();

  for (const s of soldItems) {
    if (s.id) mapById.set(String(s.id), s);
    if (s.name) mapByName.set(String(s.name), s);
  }

  return templateCategories.map((cat) => ({
    ...cat,
    items: (cat.items || []).map((it) => {
      const hit =
        (it.id && mapById.get(String(it.id))) ||
        (it.name && mapByName.get(String(it.name)));
      const qty = hit ? safeNum(hit.qty, 0) : 0;
      return { ...it, qty };
    }),
  }));
}

/** -----------------------------
 * ✅ A1 핵심: 저장 (sold_items / summary 생성 포함)
 * ----------------------------- */
export async function saveDailyData(dateOrPayload: any, maybeData?: any) {
  const payload =
    typeof dateOrPayload === "string"
      ? { ...(maybeData ?? {}), date: dateOrPayload }
      : dateOrPayload;

  if (!payload?.date) {
    console.error("date missing");
    return { ok: false, error: "DATE_MISSING" };
  }

  const soldItems = buildSoldItems(payload);
  const soldItemsSummary = buildSoldItemsSummary(soldItems, "$");

  const rowToUpsert = {
    date: payload.date,
    total_sales: Number(payload.totalSales ?? 0),
    orders: Number(payload.orders ?? 0),
    visit_count: Number(payload.visitCount ?? 0),
    sold_items: soldItems,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rowToUpsert, { onConflict: "date" })
    .select()
    .single();

if (error) {
  console.error("[saveDailyData] supabase error:", error);
  return { ok: false, error: JSON.stringify(error) };
}

  return { ok: true, data };
}

/** -----------------------------
 * 불러오기 (UI 자동 채움)
 * - template(현재 화면의 categories)를 넣어주면 qty 반영해서 반환
 * ----------------------------- */
export async function loadDaily(dateStr: string, template?: DailyPayload) {
  if (!dateStr) throw new Error("loadDaily: dateStr is required");

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,total_sales,orders,visit_count,sold_items,sold_items_summary")
    .eq("date", dateStr)
    .maybeSingle();

  if (error) {
    console.error("[loadDaily] supabase error:", error);
    throw error;
  }

  // 데이터 없으면 template(또는 기본값) 반환
  if (!data) {
    if (template) {
      return {
        ...template,
        date: dateStr,
        orders: 0,
        visitCount: 0,
        totalSales: 0,
        categories: applySoldItemsToCategories(template.categories || [], []),
      } as DailyPayload;
    }
    return null;
  }

  const soldItems: SoldItemRow[] = Array.isArray(data.sold_items)
    ? (data.sold_items as SoldItemRow[])
    : [];

  const base: DailyPayload = {
    date: data.date,
    orders: safeNum(data.orders, 0),
    visitCount: safeNum(data.visit_count, 0),
    totalSales: safeNum(data.total_sales, 0),
    monthlyTarget: template?.monthlyTarget,
    categories: template?.categories
      ? applySoldItemsToCategories(template.categories, soldItems)
      : [],
  };

  return base;
}

/** -----------------------------
 * 날짜 점마킹용: 데이터 있는 날짜 리스트
 * (캘린더 datesWithData)
 * ----------------------------- */
export async function getDatesWithData(
  startDate: string,
  endDate: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("[getDatesWithData] supabase error:", error);
    throw error;
  }

  return (data || []).map((r: any) => r.date).filter(Boolean);
}

/** -----------------------------
 * A3 리셋용(나중 트랙): 해당 날짜 row 삭제
 * ----------------------------- */
export async function deleteDaily(dateStr: string) {
  const { error } = await supabase.from(TABLE).delete().eq("date", dateStr);
  if (error) {
    console.error("[deleteDaily] supabase error:", error);
    throw error;
  }
  return true;
}

/** -----------------------------
 * A2 월 누적(나중 트랙): 합계
 * - SQL SUM을 쓰는 버전(가장 안정)
 * ----------------------------- */
export async function getMonthlyTotal(year: number, month1to12: number) {
  const m = clampNumber(month1to12, 1, 12);
  const start = `${year}-${String(m).padStart(2, "0")}-01`;
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  // PostgREST aggregate: select with sum()
  const { data, error } = await supabase
    .from(TABLE)
    .select("total_sales.sum()")
    .gte("date", start)
    .lt("date", end)
    .single();

  if (error) {
    console.error("[getMonthlyTotal] supabase error:", error);
    throw error;
  }

  // 형태: { sum: number } 또는 { sum: null }
  const sumVal = (data as any)?.sum ?? 0;
  return safeNum(sumVal, 0);
}

/** -----------------------------
 * A4 히스토리(나중 트랙): 최근 N일
 * ----------------------------- */
export async function fetchPastData(limit = 30) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date,total_sales,orders,visit_count,sold_items,sold_items_summary")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchPastData] supabase error:", error);
    throw error;
  }

  return data || [];
}
// ✅ 날짜 유틸: YYYY-MM-DD 문자열 생성
const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * listDatesInRange
 * - startDateStr ~ endDateStr (둘 다 포함)
 * - "YYYY-MM-DD" 배열 반환
 */
export function listDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const out: string[] = [];
  const cur = new Date(start);

  while (cur.getTime() <= end.getTime()) {
    out.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * listDatesInMonth
 * - year, month1to12 입력하면 해당 월의 모든 날짜 "YYYY-MM-DD" 반환
 */
export function listDatesInMonth(year: number, month1to12: number): string[] {
  const m = Math.max(1, Math.min(12, month1to12));
  const first = new Date(year, m - 1, 1);
  const last = new Date(year, m, 0); // 해당 월 마지막 날
  return listDatesInRange(toDateStr(first), toDateStr(last));
}
