import type { SalesReportData } from "../types";
import { supabase, isSupabaseReady } from "./supabaseClient";

const TABLE = "sales_daily";

// ✅ 저장 (같은 date면 업데이트 / 없으면 insert)
export async function saveDailyData(date: string, payload: SalesReportData) {
  if (!isSupabaseReady || !supabase) {
    console.error("[Supabase] not ready. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    return { ok: false, error: "SUPABASE_NOT_READY" as const };
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert({ date, payload }, { onConflict: "date" });

  if (error) {
    console.error("[Supabase] save error:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true as const };
}

// ✅ 불러오기
export async function loadDailyData(date: string) {
  if (!isSupabaseReady || !supabase) {
    console.error("[Supabase] not ready. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    return { ok: false, data: null as SalesReportData | null, error: "SUPABASE_NOT_READY" as const };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("payload")
    .eq("date", date)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] load error:", error);
    return { ok: false, data: null, error: error.message };
  }

  return { ok: true as const, data: (data?.payload ?? null) as SalesReportData | null };
}

// ✅ (선택) 삭제: 해당 날짜 데이터 삭제하고 싶을 때
export async function deleteDailyData(date: string) {
  if (!isSupabaseReady || !supabase) {
    return { ok: false, error: "SUPABASE_NOT_READY" as const };
  }

  const { error } = await supabase.from(TABLE).delete().eq("date", date);
  if (error) return { ok: false, error: error.message };
  return { ok: true as const };
}
