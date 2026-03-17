import { createClient } from "@supabase/supabase-js";
import type { MenuCategory } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "sales_daily";
const STORAGE_KEY = "sales_daily_local";

export type DailyPayload = {
  date: string;
  posSales: number;
  deliverySales?: number;
  orders: number;
  visitCount: number;
  toppingQty?: number;
  note?: string;
  monthlyTarget?: number | string;
  categories?: MenuCategory[];
  totalSales?: number;
};

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeCategories = (raw: any): MenuCategory[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw
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
    }));
};

const getMonthRange = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;

  const nextMonthDate = new Date(year, month, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
  const nextMonthStart = `${nextYear}-${nextMonth}-01`;

  return { start, nextMonthStart };
};

export async function saveDaily(payload: DailyPayload, storeId: number) {
  const safeDate = String(payload.date).slice(0, 10);

  const row = {
    date: safeDate,
    store_id: storeId,
    pos_sales: toNumber(payload.posSales, 0),
    delivery_sales: toNumber(payload.deliverySales, 0),
    orders: toNumber(payload.orders, 0),
    visit_count: toNumber(payload.visitCount, 0),
    topping_qty: toNumber((payload as any).toppingQty, 0),
    note: String(payload.note ?? ""),
    categories: Array.isArray(payload.categories) ? payload.categories : [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "date,store_id" })
    .select();

  if (error) {
    console.error("SUPABASE SAVE ERROR:", error);
    throw error;
  }

  return data;
}

export async function saveDailyData(payload: DailyPayload, storeId: number) {
  return saveDaily(payload, storeId);
}

export async function loadDaily(dateStr: string, storeId: number) {
  const safeDate = String(dateStr).slice(0, 10);

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("date", safeDate)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const safeCategories = normalizeCategories((data as any).categories);

  return {
    date: safeDate,
    posSales: toNumber((data as any).pos_sales ?? (data as any).posSales, 0),
    deliverySales: toNumber((data as any).delivery_sales ?? (data as any).deliverySales, 0),
    orders: toNumber((data as any).orders, 0),
    visitCount: toNumber((data as any).visit_count ?? (data as any).visitCount, 0),
    toppingQty: toNumber((data as any).topping_qty ?? (data as any).toppingQty, 0),
    note: String((data as any).note ?? ""),
    categories: safeCategories,
  };
}

export async function deleteDaily(dateStr: string, storeId: number) {
  const safeDate = String(dateStr).slice(0, 10);

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("date", safeDate)
    .eq("store_id", storeId);

  if (error) {
    throw error;
  }
}

export async function listDatesInMonth(yearMonth: string, storeId: number = 1) {
  const { start, nextMonthStart } = getMonthRange(yearMonth);

  const { data, error } = await supabase
    .from(TABLE)
    .select("date")
    .eq("store_id", storeId)
    .gte("date", start)
    .lt("date", nextMonthStart)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInMonth] supabase error:", error);
    return [];
  }

  return ((data ?? []) as any[]).map((r) => String(r.date));
}

export async function listDatesInRange(
  startDate: string,
  endDate: string,
  storeId: number = 1
): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date")
    .eq("store_id", storeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInRange] supabase error:", error);
    return [];
  }

  return ((data ?? []) as any[]).map((r) => String(r.date));
}

export async function getMonthlyTotal(yearMonth: string, storeId: number = 1) {
  const { start, nextMonthStart } = getMonthRange(yearMonth);

  const { data, error } = await supabase
    .from(TABLE)
    .select("pos_sales,delivery_sales")
    .eq("store_id", storeId)
    .gte("date", start)
    .lt("date", nextMonthStart);

  if (error) {
    console.error("[getMonthlyTotal] supabase error:", error);
    return 0;
  }

  let sum = 0;

  for (const row of (data ?? []) as any[]) {
    sum += toNumber(row.pos_sales, 0) + toNumber(row.delivery_sales, 0);
  }

  return sum;
}

export async function loadDailyRange(
  start: string,
  end: string,
  storeId: number = 1
) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date,pos_sales,delivery_sales,orders,visit_count,categories")
    .eq("store_id", storeId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as any[];

  return rows.map((row) => {
    const safeCategories = normalizeCategories(row.categories);

    return {
      date: String(row.date),
      sales: toNumber(row.pos_sales, 0),
      deliverySales: toNumber(row.delivery_sales, 0),
      orders: toNumber(row.orders, 0),
      visitors: toNumber(row.visit_count, 0),
      categories: safeCategories,
    };
  });
}
