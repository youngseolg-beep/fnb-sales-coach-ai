import { formatLocalDate } from "../utils2/date";
import { supabase } from "./supabaseClient";

export type SharedSideDishItem = { id: string; name: string; unitCost: number; displayOrder: number };
export type SharedSideDishConfig = { id: number; storeId: number; effectiveDate: string; items: SharedSideDishItem[]; createdAt: string; updatedAt: string };
const table = "shared_side_dish_configs";

const normalizeItems = (items: SharedSideDishItem[]) => {
  const names = new Set<string>();
  return items.map((item, index) => {
    const name = String(item.name || "").trim(); const unitCost = Number(item.unitCost);
    if (!name) throw new Error("기본 제공 찬 이름을 입력해주세요.");
    if (!Number.isFinite(unitCost) || unitCost < 0) throw new Error("기본 제공 찬 원가는 0 이상의 숫자여야 합니다.");
    const key = name.toLocaleLowerCase(); if (names.has(key)) throw new Error("기본 제공 찬 이름은 중복될 수 없습니다."); names.add(key);
    return { id: String(item.id || crypto.randomUUID()), name, unitCost, displayOrder: index + 1 };
  });
};
const toConfig = (row: any): SharedSideDishConfig => ({ id: Number(row.id), storeId: Number(row.store_id), effectiveDate: String(row.effective_date), items: Array.isArray(row.items) ? row.items : [], createdAt: String(row.created_at), updatedAt: String(row.updated_at) });
export const deriveSharedSideDishTotal = (items: SharedSideDishItem[]) => items.reduce((sum, item) => sum + (Number.isFinite(Number(item.unitCost)) ? Number(item.unitCost) : 0), 0);
export async function loadSharedSideDishConfigForDate(storeId: number, date: string) { if (!supabase) throw new Error("Supabase is unavailable"); const { data, error } = await supabase.from(table).select("*").eq("store_id", storeId).lte("effective_date", date).order("effective_date", { ascending: false }).limit(1).maybeSingle(); if (error) throw error; return data ? toConfig(data) : null; }
export async function loadSharedSideDishHistory(storeId: number) { if (!supabase) throw new Error("Supabase is unavailable"); const { data, error } = await supabase.from(table).select("*").eq("store_id", storeId).order("effective_date", { ascending: false }); if (error) throw error; return (data || []).map(toConfig); }
export async function saveSharedSideDishConfig(storeId: number, items: SharedSideDishItem[]) { if (!supabase) throw new Error("Supabase is unavailable"); const effectiveDate = formatLocalDate(new Date()); const normalized = normalizeItems(items); const { data, error } = await supabase.from(table).upsert({ store_id: storeId, effective_date: effectiveDate, items: normalized, updated_at: new Date().toISOString() }, { onConflict: "store_id,effective_date" }).select("*").single(); if (error) throw error; return toConfig(data); }
