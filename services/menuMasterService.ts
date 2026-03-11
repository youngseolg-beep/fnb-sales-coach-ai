import { supabase } from "./supabaseClient";

export interface MenuMasterRow {
  id: string;
  name: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuMasterRow[];
}

export async function loadMenuMaster(): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from("menu_master")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("menu_master load error", error);
    throw error;
  }

  const categoryMap: Record<string, MenuMasterRow[]> = {};

  data?.forEach((menu) => {
    if (!categoryMap[menu.category]) {
      categoryMap[menu.category] = [];
    }
    categoryMap[menu.category].push(menu);
  });

  const categoryOrder = [
    "음식 메뉴 (Main Dishes)",
    "탕수육 (Tangsuyuk)",
    "토핑 (Add-ons)",
    "음료 및 주류 (Beverages)",
    "고량주 (Liquors)",
  ];

  const sortedCategoryNames = Object.keys(categoryMap).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);

    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;

    return safeA - safeB;
  });

  return sortedCategoryNames.map((category) => ({
    name: category,
    items: categoryMap[category].sort(
      (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
    ),
  }));
}

export async function createMenu(
  id: string,
  name: string,
  category: string,
  displayOrder: number
) {
  const { error } = await supabase.from("menu_master").insert([
    {
      id,
      name,
      category,
      display_order: displayOrder,
      is_active: true,
    },
  ]);

  if (error) {
    console.error("createMenu error", error);
    throw error;
  }
}

export async function updateMenuOrder(id: string, displayOrder: number) {
  const { error } = await supabase
    .from("menu_master")
    .update({ display_order: displayOrder })
    .eq("id", id);

  if (error) {
    console.error("updateMenuOrder error", error);
    throw error;
  }
}

export async function deactivateMenu(id: string) {
  const { error } = await supabase
    .from("menu_master")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("deactivateMenu error", error);
    throw error;
  }
}
