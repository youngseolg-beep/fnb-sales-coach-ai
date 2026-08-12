import { supabase } from "./supabaseClient";

export type CoachReportType = "operating_coaching" | "menu_engineering" | "boost_plan";
export type CoachReportStatus = "generating" | "completed" | "failed";

export type CoachStoredReport = {
  storeId: number;
  reportType: CoachReportType;
  periodStart: string;
  periodEnd: string;
  periodPreset?: string;
  status: CoachReportStatus;
  result: unknown | null;
  inputSnapshot?: Record<string, unknown>;
  model?: string | null;
  errorMessage?: string | null;
};

const TABLE = "coach_reports";
const storageKey = (report: Pick<CoachStoredReport, "storeId" | "reportType" | "periodStart" | "periodEnd">) =>
  `coach_report:${report.storeId}:${report.reportType}:${report.periodStart}:${report.periodEnd}`;

const toStoredReport = (row: any): CoachStoredReport | null => {
  if (!row) return null;
  return {
    storeId: Number(row.store_id), reportType: row.report_type,
    periodStart: String(row.period_start), periodEnd: String(row.period_end),
    periodPreset: row.period_preset || undefined, status: row.status,
    result: row.result ?? null, inputSnapshot: row.input_snapshot ?? undefined,
    model: row.model || null, errorMessage: row.error_message || null,
  } as CoachStoredReport;
};

export async function loadCoachReport(scope: Pick<CoachStoredReport, "storeId" | "reportType" | "periodStart" | "periodEnd">) {
  if (!supabase) {
    const raw = localStorage.getItem(storageKey(scope));
    return raw ? toStoredReport(JSON.parse(raw)) : null;
  }
  const { data, error } = await supabase.from(TABLE).select("*")
    .eq("store_id", scope.storeId).eq("report_type", scope.reportType)
    .eq("period_start", scope.periodStart).eq("period_end", scope.periodEnd).maybeSingle();
  if (error) throw error;
  return toStoredReport(data);
}

export async function saveCoachReport(report: CoachStoredReport) {
  if (!supabase) {
    localStorage.setItem(storageKey(report), JSON.stringify({
      store_id: report.storeId, report_type: report.reportType, period_start: report.periodStart, period_end: report.periodEnd,
      period_preset: report.periodPreset, status: report.status, result: report.result, input_snapshot: report.inputSnapshot,
      model: report.model ?? null, error_message: report.errorMessage ?? null,
    }));
    return;
  }
  const { error } = await supabase.from(TABLE).upsert({
    store_id: report.storeId, report_type: report.reportType, period_start: report.periodStart, period_end: report.periodEnd,
    period_preset: report.periodPreset || null, status: report.status, result: report.result,
    input_snapshot: report.inputSnapshot || {}, model: report.model || null, error_message: report.errorMessage || null,
  }, { onConflict: "store_id,report_type,period_start,period_end" });
  if (error) throw error;
}
