import { supabase } from "./supabaseClient";

export async function loadMonthlyTarget(
  targetMonth: string,
  storeId: number = 1
): Promise<number> {
  const { data, error } = await supabase
    .from("monthly_targets")
    .select("target_amount")
    .eq("store_id", storeId)
    .eq("target_month", targetMonth)
    .maybeSingle();

  if (error) {
    console.error("loadMonthlyTarget error:", error);
    return 0;
  }

  return Number(data?.target_amount ?? 0);
}

export async function saveMonthlyTarget(
  targetMonth: string,
  targetAmount: number,
  storeId: number = 1
): Promise<void> {
  const { error } = await supabase
    .from("monthly_targets")
    .upsert(
      {
        store_id: storeId,
        target_month: targetMonth,
        target_amount: Number(targetAmount || 0),
      },
      { onConflict: "store_id,target_month" }
    );

  if (error) {
    console.error("saveMonthlyTarget error:", error);
    throw error;
  }
}
