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

const buildStorageKey = (storeId: number, dateStr: string) => `${storeId}:${dateStr}`;

const buildDbRow = (payload: DailyPayload, storeId: number) => {
  const safeDate = String(payload.date).slice(0, 10);
  const safeCategories = Array.isArray(payload.categories) ? payload.categories : [];
  const posSales = toNumber(payload.posSales, 0);
  const deliverySales = toNumber(payload.deliverySales, 0);
  const orders = toNumber(payload.orders, 0);
  const visitCount = toNumber(payload.visitCount, 0);
  const toppingQty = toNumber(payload.toppingQty, 0);
  const note = String(payload.note ?? "");
  const totalSales =
    payload.totalSales !== undefined
      ? toNumber(payload.totalSales, 0)
      : posSales + deliverySales;

  return {
    date: safeDate,
    store_id: storeId,
    total_sales: totalSales,
    orders,
    visit_count: visitCount,
    sold_items: safeCategories,
    sold_items_summary: "",
    payload: {
      date: safeDate,
      posSales,
      deliverySales,
      orders,
      visitCount,
      toppingQty,
      note,
      categories: safeCategories,
      totalSales,
      storeId,
      updatedAt: new Date().toISOString(),
    },
  };
};

const mapRowToDaily = (row: any) => {
  const payload = row?.payload ?? {};

  return {
    date: String(row?.date ?? payload?.date ?? ""),
    posSales: toNumber(payload?.posSales, 0),
    deliverySales: toNumber(payload?.deliverySales, 0),
    orders: toNumber(payload?.orders ?? row?.orders, 0),
    visitCount: toNumber(payload?.visitCount ?? row?.visit_count, 0),
    toppingQty: toNumber(payload?.toppingQty, 0),
    note: String(payload?.note ?? ""),
    categories: normalizeCategories(payload?.categories ?? row?.sold_items),
    menuSales: payload?.menuSales ?? {},
  };
};

export async function saveDaily(payload: DailyPayload, storeId: number = 1) {
  const row = buildDbRow(payload, storeId);
  const key = buildStorageKey(storeId, row.date);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[key] = {
      ...row,
      store_id: storeId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return {
      ok: true,
      success: true,
      data: row,
    };
  }

  const { data: existingRow, error: existingError } = await supabase
    .from(TABLE)
    .select("id,date,store_id")
    .eq("date", row.date)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existingError) {
    console.error("SUPABASE EXISTING CHECK ERROR:", existingError);
    return {
      ok: false,
      success: false,
      error: existingError,
    };
  }

  if (existingRow?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        total_sales: row.total_sales,
        orders: row.orders,
        visit_count: row.visit_count,
        sold_items: row.sold_items,
        sold_items_summary: row.sold_items_summary,
        payload: row.payload,
      })
      .eq("id", existingRow.id)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error) {
      console.error("SUPABASE UPDATE ERROR:", error);
      return {
        ok: false,
        success: false,
        error,
      };
    }

    return {
      ok: true,
      success: true,
      data,
    };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error);
    return {
      ok: false,
      success: false,
      error,
    };
  }

  return {
    ok: true,
    success: true,
    data,
  };
}

export async function saveDailyData(payload: DailyPayload, storeId: number = 1) {
  return await saveDaily(payload, storeId);
}

export async function loadDaily(dateStr: string, storeId: number = 1) {
  const safeDate = String(dateStr).slice(0, 10);
  const key = buildStorageKey(storeId, safeDate);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const all = JSON.parse(raw);
    const row = all[key];
    if (!row) return null;

    return mapRowToDaily(row);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("date", safeDate)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) {
    console.error("SUPABASE LOAD ERROR:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRowToDaily(data);
}

export async function deleteDaily(dateStr: string, storeId: number = 1) {
  const safeDate = String(dateStr).slice(0, 10);
  const key = buildStorageKey(storeId, safeDate);

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    delete all[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return;
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("date", safeDate)
    .eq("store_id", storeId);

  if (error) {
    console.error("SUPABASE DELETE ERROR:", error);
    throw error;
  }
}

export async function listDatesInMonth(yearMonth: string, storeId: number = 1) {
  const { start, nextMonthStart } = getMonthRange(yearMonth);

  const hasMeaningfulPayload = (payload: any) => {
    if (!payload) return false;

    const hasBase =
      toNumber(payload.posSales, 0) > 0 ||
      toNumber(payload.deliverySales, 0) > 0 ||
      toNumber(payload.orders, 0) > 0 ||
      toNumber(payload.visitCount, 0) > 0 ||
      toNumber(payload.toppingQty, 0) > 0 ||
      String(payload.note ?? "").trim().length > 0;

    const categories = Array.isArray(payload.categories) ? payload.categories : [];
    const hasMenu = categories.some((cat: any) =>
      Array.isArray(cat?.items) && cat.items.some((item: any) => toNumber(item?.qty, 0) > 0)
    );

    return hasBase || hasMenu;
  };

  if (!supabase) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);

    return Object.values(all)
      .filter((row: any) => {
        const sameStore = Number(row.store_id ?? row.payload?.storeId ?? 1) === storeId;
        const rowDate = String(row.date);
        const inMonth = rowDate >= start && rowDate < nextMonthStart;
        return sameStore && inMonth && hasMeaningfulPayload(row.payload);
      })
      .map((row: any) => String(row.date))
      .sort();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,payload")
    .eq("store_id", storeId)
    .gte("date", start)
    .lt("date", nextMonthStart)
    .order("date", { ascending: true });

  if (error) {
    console.error("[listDatesInMonth] supabase error:", error);
    return [];
  }

  return ((data ?? []) as any[])
    .filter((row) => hasMeaningfulPayload(row.payload))
    .map((row) => String(row.date));
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
      .filter(
        (row: any) =>
          Number(row.store_id ?? row.payload?.storeId ?? 1) === storeId &&
          String(row.date) >= startDate &&
          String(row.date) <= endDate
      )
      .map((row: any) => String(row.date))
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
      const sameStore =
        Number(row.store_id ?? row.payload?.storeId ?? 1) === storeId;
      const rowDate = String(row.date);

      if (!sameStore) continue;
      if (rowDate < start || rowDate >= nextMonthStart) continue;

      sum += toNumber(row.total_sales ?? row.payload?.totalSales, 0);
    }

    return sum;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("total_sales")
    .eq("store_id", storeId)
    .gte("date", start)
    .lt("date", nextMonthStart);

  if (error) {
    console.error("[getMonthlyTotal] supabase error:", error);
    return 0;
  }

  let sum = 0;
  for (const row of (data ?? []) as any[]) {
    sum += toNumber(row.total_sales, 0);
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
      .filter(
        (row: any) =>
          Number(row.store_id ?? row.payload?.storeId ?? 1) === storeId &&
          String(row.date) >= start &&
          String(row.date) <= end
      )
      .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)))
      .map((row: any) => {
        const payload = row.payload ?? {};

        return {
          date: String(row.date),
          sales: toNumber(row.total_sales ?? payload.totalSales, 0),
          orders: toNumber(payload.orders ?? row.orders, 0),
          visitors: toNumber(payload.visitCount ?? row.visit_count, 0),
          categories: normalizeCategories(payload.categories ?? row.sold_items),
        };
      });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,total_sales,orders,visit_count,sold_items,payload")
    .eq("store_id", storeId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) {
    console.error("SUPABASE RANGE LOAD ERROR:", error);
    throw error;
  }

  const rows = (data ?? []) as any[];

  return rows.map((row) => {
    const payload = row.payload ?? {};

    return {
      date: String(row.date),
      sales: toNumber(row.total_sales ?? payload.totalSales, 0),
      orders: toNumber(payload.orders ?? row.orders, 0),
      visitors: toNumber(payload.visitCount ?? row.visit_count, 0),
      categories: normalizeCategories(payload.categories ?? row.sold_items),
    };
  });
}
