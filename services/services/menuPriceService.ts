import { supabase } from "./salesStorage";

export type MenuPriceRow = {
  menu_id: string;
  effective_date: string;
  price: number | null;
  unit_cost: number | null;
};

export async function getMenuPricesForDate(date: string) {
  const { data, error } = await supabase
    .from("menu_price_history")
    .select("menu_id,effective_date,price,unit_cost")
    .lte("effective_date", date)
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("price history error", error);
    return new Map();
  }

  const map = new Map<string, MenuPriceRow>();

  for (const row of data as MenuPriceRow[]) {
    if (!map.has(row.menu_id)) {
      map.set(row.menu_id, row);
    }
  }

  return map;
}

export async function saveMenuPriceHistory(
  menuId: string,
  effectiveDate: string,
  price: number,
  unitCost?: number
) {
  const { error } = await supabase.from("menu_price_history").insert({
    menu_id: menuId,
    effective_date: effectiveDate,
    price,
    unit_cost: unitCost ?? null,
  });

  if (error) {
    console.error("save price history error", error);
  }
}
