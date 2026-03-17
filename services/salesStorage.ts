import { createClient } from "@supabase/supabase-js";
import type { MenuCategory } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "sales_daily";

type DailyRow = {
  date: string;
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
  deliverySales?: number;
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

const getMonthRange = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;

  const nextMonthDate = new Date(year, month, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
  const nextMonthStart = `${nextYear}-${nextMonth}-01`;

  return { start, nextMonthStart };
};

export async function saveDaily(payload: any, storeId: number) {
  const safeDate = String(payload.date).slice(0, 10);

  const row = {
    date: safeDate,
    store_id: storeId,
    pos_sales: Number(payload.posSales ?? 0),
    delivery_sales: Number(payload.deliverySales ?? 0),
    orders: Number(payload.orders ?? 0),
    visit_count: Number(payload.visitCount ?? 0),
    topping_qty: Number(payload.toppingQty ?? 0),
    note: String(payload.note ?? ""),
    categories: Array.isArray(payload.categories) ? payload.categories : [],
    updated_at: new Date().toISOString(),
  };

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[safeDate] = {
      date: safeDate,
      posSales: row.pos_sales,
      deliverySales: row.delivery_sales,
      orders: row.orders,
      visitCount: row.visit_count,
      toppingQty: row.topping_qty,
      note: row.note,
      categories: row.categories,
      store_id: row.store_id,
      updated_at: row.updated_at,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return;
  }

  const { error } = await supabase
    .from("sales_daily")
    .upsert(row, { onConflict: "date,store_id" });

  if (error) {
    throw error;
  }
}

export async function saveDailyData(payload: any, storeId: number) {
  return saveDaily(payload, storeId);
}

export async function loadDaily(dateStr: string, storeId: number) {
  const safeDate = String(dateStr).slice(0, 10);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const all = JSON.parse(raw);
    const row = all[safeDate];
    if (!row) return null;

    const safeCategories = Array.isArray(row.categories)
      ? row.categories.map((cat: any) => ({
          ...cat,
          items: Array.isArray(cat.items)
            ? cat.items.map((item: any) => ({ ...item }))
            : [],
        }))
      : [];

    return {
      date: safeDate,
      posSales: Number(row.posSales ?? 0),
      deliverySales: Number(row.deliverySales ?? 0),
      orders: Number(row.orders ?? 0),
      visitCount: Number(row.visitCount ?? 0),
      toppingQty: Number(row.toppingQty ?? 0),
      note: String(row.note ?? ""),
      categories: safeCategories,
    };
  }

  const { data, error } = await supabase
    .from("sales_daily")
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

  const safeCategories = Array.isArray((data as any).categories)
    ? (data as any).categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.items)
          ? cat.items.map((item: any) => ({ ...item }))
          : [],
      }))
    : [];

  return {
    date: safeDate,
    posSales: Number((data as any).pos_sales ?? (data as any).posSales ?? 0),
    deliverySales: Number((data as any).delivery_sales ?? (data as any).deliverySales ?? 0),
    orders: Number((data as any).orders ?? 0),
    visitCount: Number((data as any).visit_count ?? (data as any).visitCount ?? 0),
    toppingQty: Number((data as any).topping_qty ?? (data as any).toppingQty ?? 0),
    note: String((data as any).note ?? ""),
    categories: safeCategories,
  };
}

export async function deleteDaily(dateStr: string, storeId: number) {
  const safeDate = String(dateStr).slice(0, 10);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    delete all[safeDate];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return;
  }

  const { error } = await supabase
    .from("sales_daily")
    .delete()
    .eq("date", safeDate)
    .eq("store_id", storeId);

  if (error) {
    throw error;
  }
}

export async function listDatesInMonth(yearMonth: string) {
  const { start, nextMonthStart } = getMonthRange(yearMonth);

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,payload")
    .gte("date", start)
    .lt("date", nextMonthStart)
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
  const { start, nextMonthStart } = getMonthRange(yearMonth);

  const { data, error } = await supabase
    .from(TABLE)
    .select("total_sales,payload")
    .gte("date", start)
    .lt("date", nextMonthStart);

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

export async function loadDailyRange(start: string, end: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("date,total_sales,orders,visit_count,sold_items,payload")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as any[];

  return rows
    .filter((r) => !isDeletedPayload(r.payload))
    .map((row) => {
      const p: any = safeParsePayload(row.payload);
      const rawCategories = p?.categories ?? row.sold_items ?? null;
      const safeCategories = normalizeCategories(rawCategories) ?? [];

      return {
        date: row.date,
        sales: toNumber(p?.posSales ?? row.total_sales, 0),
        deliverySales: toNumber(p?.deliverySales ?? 0, 0),
        orders: toNumber(p?.orders ?? row.orders, 0),
        visitors: toNumber(p?.visitCount ?? row.visit_count, 0),
        categories: safeCategories,
      };
    });
}
