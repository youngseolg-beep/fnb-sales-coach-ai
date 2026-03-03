// services/salesStorage.ts
import type { SalesReportData } from "../types";
import { supabase, isSupabaseReady } from "./supabaseClient";

const TABLE = "sales_daily";

type SaveResult =
  | { ok: true }
  | { ok: false; error: string; code?: string; detail?: any };

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replaceAll(",", "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function saveDailyData(
  date: string,
  payload: SalesReportData | any
): Promise<SaveResult> {
  try {
    if (!isSupabaseReady || !supabase) {
      console.error("[Supabase] NOT READY", (window as any).__SUPABASE_ENV__);
      return { ok: false, code: "SUPABASE_NOT_READY", error: "Supabase env not loaded" };
    }

    // ✅ 1) total_sales: 여러 후보 키에서 최대한 찾아서 숫자로 저장
    const totalSales =
      toNumber(payload?.totalSales) ??
      toNumber(payload?.total_sales) ??
      toNumber(payload?.results?.calcSales) ??
      toNumber(payload?.calcSales) ??
      toNumber(payload?.summary?.totalSales) ??
      null;

    // ✅ 2) orders
    const orders =
      toNumber(payload?.orders) ??
      toNumber(payload?.orderCount) ??
      toNumber(payload?.totalOrders) ??
      toNumber(payload?.summary?.orders) ??
      null;

    // ✅ 3) visit_count
    const visitCount =
      toNumber(payload?.visitCount) ??
      toNumber(payload?.visitors) ??
      toNumber(payload?.visitorCount) ??
      toNumber(payload?.customerCount) ??
      toNumber(payload?.summary?.visitCount) ??
      null;

    // ✅ 4) sold_items: 메뉴/수량 묶음 (객체/배열 둘 다 저장 가능)
    // - menuCounts: { "짜장면": 3, "짬뽕": 2 } 같은 형태
    // - items/menus: [{ name:"짜장면", qty:3 }, ...] 같은 형태
    const soldItems =
      payload?.soldItems ??
      payload?.sold_items ??
      payload?.menuCounts ??
      payload?.menu_counts ??
      payload?.menus ??
      payload?.items ??
      payload?.menuItems ??
      null;

    const rowToUpsert = {
      date,
      payload,                 // ✅ 원본 payload 그대로 저장
      total_sales: totalSales, // ✅ 컬럼 채움
      orders: orders,          // ✅ 컬럼 채움
      visit_count: visitCount, // ✅ 컬럼 채움
      sold_items: soldItems,   // ✅ 컬럼 채움
    };

    console.log("[Supabase] upsert start", {
      table: TABLE,
      date,
      total_sales: rowToUpsert.total_sales,
      orders: rowToUpsert.orders,
      visit_count: rowToUpsert.visit_count,
      sold_items_type: Array.isArray(soldItems) ? "array" : typeof soldItems,
    });

    const { error } = await supabase
      .from(TABLE)
      .upsert(rowToUpsert, { onConflict: "date" });

    if (error) {
      console.error("[Supabase] upsert error", error);
      return { ok: false, code: error.code ?? "SUPABASE_ERROR", error: error.message, detail: error };
    }

    console.log("[Supabase] upsert success", { date });
    return { ok: true };
  } catch (e: any) {
    console.error("[Supabase] exception", e);
    return { ok: false, code: "EXCEPTION", error: e?.message ?? "Unknown error", detail: e };
  }
}

// (나머지는 아직 미구현이면 그대로 둬도 됨)
export const listDatesInMonth = async (_month: string): Promise<string[]> => {
  return [];
};

export const loadDaily = async (_date: string): Promise<any> => {
  return null;
};

export const listDatesInRange = async (_start: string, _end: string): Promise<string[]> => {
  return [];
};

export const getMonthlyTotal = async (_month: string): Promise<number> => {
  return 0;
};

export const deleteDaily = async (_date: string): Promise<void> => {
  return;
};
