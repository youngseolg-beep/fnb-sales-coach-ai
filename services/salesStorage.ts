// services/salesStorage.ts
import type { SalesReportData } from "../types";
import { supabase, isSupabaseReady } from "./supabaseClient";

const TABLE = "sales_daily";

type SaveResult =
  | { ok: true }
  | { ok: false; error: string; code?: string; detail?: any };

export async function saveDailyData(date: string, payload: SalesReportData): Promise<SaveResult> {
  try {
    if (!isSupabaseReady || !supabase) {
      console.error("[Supabase] NOT READY", (window as any).__SUPABASE_ENV__);
      return { ok: false, code: "SUPABASE_NOT_READY", error: "Supabase env not loaded" };
    }

    console.log("[Supabase] upsert start", { table: TABLE, date });

    const { error } = await supabase
      .from(TABLE)
      .upsert({ date, payload }, { onConflict: "date" });

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
