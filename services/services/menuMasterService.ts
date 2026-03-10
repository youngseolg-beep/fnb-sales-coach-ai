import { supabase } from "../supabaseClient";

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
    .order("category", { ascending: true })
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

  return Object.keys(categoryMap).map((category) => ({
    name: category,
    items: categoryMap[category],
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
