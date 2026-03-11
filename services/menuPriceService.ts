import { supabase } from "../supabaseClient";

export type MenuPriceHistoryRow = {
  menu_id: string;
  effective_date: string;
  price: number | null;
  unit_cost: number | null;
  created_at?: string;
};

export const getMenuPricesForDate = async (date: string) => {
  const { data, error } = await supabase
    .from("menu_price_history")
    .select("menu_id, effective_date, price, unit_cost")
    .lte("effective_date", date)
    .order("effective_date", { ascending: false });

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
  unitCost?: number
) => {
  const payload = {
    menu_id: menuId,
    effective_date: effectiveDate,
    price,
    unit_cost: unitCost ?? null,
  };

  const { data, error } = await supabase
    .from("menu_price_history")
    .upsert(payload, {
      onConflict: "menu_id,effective_date",
    })
    .select();

  if (error) {
    throw error;
  }

  return data;
};

export const getMenuPriceHistory = async (
  menuId: string
): Promise<MenuPriceHistoryRow[]> => {
  const { data, error } = await supabase
    .from("menu_price_history")
    .select("menu_id, effective_date, price, unit_cost, created_at")
    .eq("menu_id", menuId)
    .order("effective_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as MenuPriceHistoryRow[];
};
