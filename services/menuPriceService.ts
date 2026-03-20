import { supabase } from "./supabaseClient";

export type MenuPriceHistoryRow = {
  menu_id: string;
  effective_date: string;
  price: number | null;
  unit_cost: number | null;
  created_at?: string;
};

export const getMenuPricesForDate = async (date: string, storeId: number) => {
 const { data, error } = await supabase
  .from("menu_price_history")
  .select("menu_id, effective_date, price, unit_cost, created_at")
  .eq("store_id", 1)
  .lte("effective_date", date)
  .order("effective_date", { ascending: false })
  .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const latestMap = new Map<
    string,
    {
      menu_id: string;
      effective_date: string;
      price: number | null;
      unit_cost: number | null;
    }
  >();

  for (const row of data || []) {
    if (!latestMap.has(row.menu_id)) {
      latestMap.set(row.menu_id, row);
    }
  }

  return latestMap;
};

export const saveMenuPriceHistory = async (
  menuId: string,
  effectiveDate: string,
  price: number,
  unitCost: number | undefined,
  storeId: number
) => {
  
 const payload = {
  menu_id: menuId,
  store_id: 1,
  effective_date: effectiveDate,
  price,
  unit_cost: unitCost ?? null,
};

 const { data, error } = await supabase
  .from("menu_price_history")
  .insert(payload)
  .select();

  if (error) {
    throw error;
  }

  return data;
};

export const getMenuPriceHistory = async (
  menuId: string,
  storeId: number
): Promise<MenuPriceHistoryRow[]> => {
  const { data, error } = await supabase
    .from("menu_price_history")
    .select("menu_id, effective_date, price, unit_cost, created_at")
    .eq("menu_id", menuId)
    .eq("store_id", 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as MenuPriceHistoryRow[];
};
