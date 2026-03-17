import type { MenuCategory } from "../types";
import { supabase } from "./supabaseClient";

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

export async function saveDaily(payload: DailyPayload, storeId: number = 1) {
  const safeDate = String(payload.date).slice(0, 10);

  const row = {
    date: safeDate,
    store_id: storeId,
    pos_sales: toNumber(payload.posSales, 0),
    delivery_sales: toNumber(payload.deliverySales, 0),
    orders: toNumber(payload.orders, 0),
    visit_count: toNumber(payload.visitCount, 0),
    topping_qty: toNumber(payload.toppingQty, 0),
    note: String(payload.note ?? ""),
    categories: Array.isArray(payload.categories) ? payload.categories : [],
    updated_at: new Date().toISOString(),
  };

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[`${storeId}:${safeDate}`] = row;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return row;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "date,store_id" })
    .select()
    .single();

  if (error) {
    console.error("SUPABASE SAVE ERROR:", error);
    throw error;
  }

  return data;
}

export async function saveDailyData(payload: DailyPayload, storeId: number = 1) {
  return saveDaily(payload, storeId);
}

export async function loadDaily(dateStr: string, storeId: number = 1) {
  const safeDate = String(dateStr).slice(0, 10);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const all = JSON.parse(raw);
    const row = all[`${storeId}:${safeDate}`];
    if (!row) return null;

    return {
      date: safeDate,
      posSales: toNumber(row.pos_sales ?? row.posSales, 0),
      deliverySales: toNumber(row.delivery_sales ?? row.deliverySales, 0),
      orders: toNumber(row.orders, 0),
      visitCount: toNumber(row.visit_count ?? row.visitCount, 0),
      toppingQty: toNumber(row.topping_qty ?? row.toppingQty, 0),
      note: String(row.note ?? ""),
      categories: normalizeCategories(row.categories),
    };
  }

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

  return {
    date: safeDate,
    posSales: toNumber((data as any).pos_sales ?? (data as any).posSales, 0),
    deliverySales: toNumber((data as any).delivery_sales ?? (data as any).deliverySales, 0),
    orders: toNumber((data as any).orders, 0),
    visitCount: toNumber((data as any).visit_count ?? (data as any).visitCount, 0),
    toppingQty: toNumber((data as any).topping_qty ?? (data as any).toppingQty, 0),
    note: String((data as any).note ?? ""),
    categories: normalizeCategories((data as any).categories),
  };
}

export async function deleteDaily(dateStr: string, storeId: number = 1) {
  const safeDate = String(dateStr).slice(0, 10);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    delete all[`${storeId}:${safeDate}`];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return;
  }

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

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);

    return Object.values(all)
      .filter((row: any) => row.store_id === storeId && row.date >= start && row.date < nextMonthStart)
      .map((row: any) => String(row.date))
      .sort();
  }

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
  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);

    return Object.values(all)
      .filter((row: any) => row.store_id === storeId && row.date >= startDate && row.date <= endDate)
      .map((row: any) => String((row as any).date))
      .sort();
  }

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

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const all = JSON.parse(raw);

    let sum = 0;
    for (const row of Object.values(all) as any[]) {
      if (row.store_id !== storeId) continue;
      if (row.date < start || row.date >= nextMonthStart) continue;
      sum += toNumber(row.pos_sales ?? row.posSales, 0) + toNumber(row.delivery_sales ?? row.deliverySales, 0);
    }
    return sum;
  }

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
  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);

    return Object.values(all)
      .filter((row: any) => row.store_id === storeId && row.date >= start && row.date <= end)
      .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)))
      .map((row: any) => ({
        date: String(row.date),
        sales: toNumber(row.pos_sales ?? row.posSales, 0),
        deliverySales: toNumber(row.delivery_sales ?? row.deliverySales, 0),
        orders: toNumber(row.orders, 0),
        visitors: toNumber(row.visit_count ?? row.visitCount, 0),
        categories: normalizeCategories(row.categories),
      }));
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,pos_sales,delivery_sales,orders,visit_count,categories")
    .eq("store_id", storeId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as any[];

  return rows.map((row) => ({
    date: String(row.date),
    sales: toNumber(row.pos_sales, 0),
    deliverySales: toNumber(row.delivery_sales, 0),
    orders: toNumber(row.orders, 0),
    visitors: toNumber(row.visit_count, 0),
    categories: normalizeCategories(row.categories),
  }));
}
