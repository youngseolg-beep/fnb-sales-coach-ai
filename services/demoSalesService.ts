import type { MenuCategory } from "../types";
import { formatLocalDate, parseLocalDate } from "../utils2/date";
import { loadMenuMaster } from "./menuMasterService";
import { insertDailyIfMissing, listDatesInRange, type DailyPayload } from "./salesStorage";
import { supabase } from "./supabaseClient";

const DEMO_STORE_ID = 5;
const INDONESIA_PILOT_STORE_ID = 1789955524607;
const EXCLUDED_MENU_NAMES = new Set(["테스트메뉴1", "테스트2", "테스트메뉴2", "테스트세트", "테스트토핑"]);

type SyntheticSalesProfile = "demo" | "indonesiaPilot";

const INDONESIA_MONTHLY_QUANTITY_BASELINES: Record<string, number> = {
  "열탄불고기(매운맛)": 1261,
  "열탄불고기(간장맛)": 862,
  "오겹살": 516,
  "삼겹살": 1299,
  "목살": 268,
  "양념돼지구이": 600,
  "항정살": 359,
  "돼지껍데기": 46,
  "바싹불고기": 487,
  "매운제육볶음": 48,
  "해물부추전": 341,
  "잡채": 630,
  "7분 돼지김치": 750,
  "순두부찌개": 856,
  "된장찌개": 89,
  "열탄비빔밥(매운맛)": 145,
  "열탄비빔밥(간장맛)": 80,
  "멸치국수": 69,
  "냉국수": 131,
  "떡라면": 231,
  "빽밥 (매운맛)": 114,
  "빽밥 (간장맛)": 119,
  "닭볶음탕": 6,
  "열탄부대찌개": 4,
  "열탄볶음밥": 68,
  "옛날도시락": 226,
  "치즈계란찜": 383,
  "사발주먹밥": 383,
  "공기밥": 2092,
  "계란후라이": 19,
  "냄비떡볶이": 237,
  "콘치즈": 290,
};

type DemoMenu = { id: string; name: string; category: string; displayOrder: number; price: number; unitCost?: number };
type PriceHistoryRow = { menu_id: string; price: number | null; unit_cost: number | null; effective_date: string; created_at?: string | null };

const getSyntheticSalesProfile = (input: { storeId: number; country?: string; brand?: string }): SyntheticSalesProfile | null => {
  if (input.storeId === DEMO_STORE_ID && input.country === "DEMO" && input.brand === "DEMO") return "demo";
  if (input.storeId === INDONESIA_PILOT_STORE_ID && input.country === "ID" && input.brand === "SAEMAEUL") return "indonesiaPilot";
  return null;
};

export const isSyntheticSalesContinuityStore = (input: { storeId: number; country?: string; brand?: string }) => {
  return getSyntheticSalesProfile(input) !== null;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const hashDate = (date: string, salt = 0) => {
  let hash = 2166136261 + salt;
  for (let index = 0; index < date.length; index += 1) {
    hash ^= date.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const selectRotatingMenus = <T,>(menus: T[], count: number, offset: number): T[] => {
  if (menus.length === 0 || count <= 0) return [];
  const selectedCount = Math.min(count, menus.length);
  const start = offset % menus.length;
  return Array.from({ length: selectedCount }, (_, index) => menus[(start + index) % menus.length]);
};

const listLocalDates = (start: string, end: string) => {
  const dates: string[] = [];
  const current = parseLocalDate(start);
  const last = parseLocalDate(end);
  while (current <= last) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const isWeekend = (date: string) => {
  const day = parseLocalDate(date).getDay();
  return day === 0 || day === 6;
};

const resolveDemoMenus = async (endDate: string): Promise<DemoMenu[]> => {
  const [menuCategories, priceResult] = await Promise.all([
    loadMenuMaster(DEMO_STORE_ID),
    supabase
      .from("menu_price_history")
      .select("menu_id,price,unit_cost,effective_date,created_at")
      .eq("store_id", DEMO_STORE_ID)
      .lte("effective_date", endDate),
  ]);

  if (priceResult.error) throw priceResult.error;

  const histories = new Map<string, PriceHistoryRow[]>();
  for (const row of (priceResult.data ?? []) as PriceHistoryRow[]) {
    const existing = histories.get(row.menu_id) ?? [];
    existing.push(row);
    histories.set(row.menu_id, existing);
  }
  for (const rows of histories.values()) {
    rows.sort((a, b) => b.effective_date.localeCompare(a.effective_date) || String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  }

  const menus: DemoMenu[] = [];
  menuCategories.forEach((category) => category.items.forEach((item) => {
    if (EXCLUDED_MENU_NAMES.has(item.name)) return;
    const history = histories.get(item.id)?.[0];
    const price = Number(history?.price);
    if (!Number.isFinite(price) || price <= 0) return;
    menus.push({
      id: item.id,
      name: item.name,
      category: category.name,
      displayOrder: Number(item.display_order || 0),
      price,
      unitCost: history?.unit_cost === null || history?.unit_cost === undefined ? undefined : Number(history.unit_cost),
    });
  }));

  return menus.sort((a, b) => a.category.localeCompare(b.category) || a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
};

const resolveIndonesiaPilotMenus = async (date: string): Promise<DemoMenu[]> => {
  const [menuCategories, priceResult] = await Promise.all([
    loadMenuMaster(INDONESIA_PILOT_STORE_ID),
    supabase
      .from("menu_price_history")
      .select("menu_id,price,unit_cost,effective_date,created_at")
      .eq("store_id", INDONESIA_PILOT_STORE_ID),
  ]);

  if (priceResult.error) throw priceResult.error;

  const histories = new Map<string, PriceHistoryRow[]>();
  for (const row of (priceResult.data ?? []) as PriceHistoryRow[]) {
    const existing = histories.get(row.menu_id) ?? [];
    existing.push(row);
    histories.set(row.menu_id, existing);
  }
  for (const rows of histories.values()) {
    rows.sort((a, b) => b.effective_date.localeCompare(a.effective_date) || String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  }

  const menus: DemoMenu[] = [];
  menuCategories.forEach((category) => category.items.forEach((item) => {
    const rows = histories.get(item.id) ?? [];
    // The pilot price seed began after some backfill dates. This fallback is
    // intentionally limited to synthetic row generation for this pilot.
    const history = rows.find((row) => row.effective_date <= date) ?? rows[0];
    const price = Number(history?.price);
    if (!Number.isFinite(price) || price <= 0) return;
    menus.push({
      id: item.id,
      name: item.name,
      category: category.name,
      displayOrder: Number(item.display_order || 0),
      price,
      unitCost: history?.unit_cost === null || history?.unit_cost === undefined ? undefined : Number(history.unit_cost),
    });
  }));

  return menus.sort((a, b) => a.category.localeCompare(b.category) || a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
};

const buildCategories = (menus: DemoMenu[], quantities: Map<string, number>): MenuCategory[] => {
  const categoryMap = new Map<string, DemoMenu[]>();
  menus.forEach((menu) => categoryMap.set(menu.category, [...(categoryMap.get(menu.category) ?? []), menu]));
  return Array.from(categoryMap.entries()).map(([name, categoryMenus]) => ({
    name,
    items: categoryMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      qty: quantities.get(menu.id) ?? 0,
      ...(menu.unitCost === undefined ? {} : { unitCost: menu.unitCost }),
    })),
  }));
};

const daysInMonth = (date: string) => {
  const current = parseLocalDate(date);
  return new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
};

const deterministicQuantity = (value: number, date: string, salt: number) => {
  const whole = Math.floor(Math.max(value, 0));
  const fraction = Math.max(value, 0) - whole;
  return whole + (hashDate(date, salt) % 1000 < Math.round(fraction * 1000) ? 1 : 0);
};

const buildDemoPayload = (date: string, menus: DemoMenu[]): DailyPayload => {
  const dayHash = hashDate(date);
  const targetSales = isWeekend(date) ? 1000 + (dayHash % 501) : 700 + (dayHash % 401);
  const rotationOffset = Math.floor(parseLocalDate(date).getTime() / 86400000);
  const costedMenus = menus.filter((menu) => menu.unitCost !== undefined);
  const uncostedMenus = menus.filter((menu) => menu.unitCost === undefined);
  const activeMenus = [
    ...selectRotatingMenus(costedMenus, 14, rotationOffset),
    ...selectRotatingMenus(uncostedMenus, 4, rotationOffset + hashDate(date, 503)),
  ];
  const baseQuantities = activeMenus.map((menu, index) => ({
    menu,
    quantity: 1 + ((hashDate(date, index + 1) + index) % 5),
  }));
  const baseSales = baseQuantities.reduce((sum, entry) => sum + entry.menu.price * entry.quantity, 0);
  const multiplier = baseSales > 0 ? targetSales / baseSales : 1;
  const quantities = new Map(baseQuantities.map((entry) => [entry.menu.id, Math.max(1, Math.round(entry.quantity * multiplier))]));

  const categoryMap = new Map<string, DemoMenu[]>();
  menus.forEach((menu) => categoryMap.set(menu.category, [...(categoryMap.get(menu.category) ?? []), menu]));
  const categories: MenuCategory[] = Array.from(categoryMap.entries()).map(([name, categoryMenus]) => ({
    name,
    items: categoryMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      qty: quantities.get(menu.id) ?? 0,
      ...(menu.unitCost === undefined ? {} : { unitCost: menu.unitCost }),
    })),
  }));
  const totalSales = round2(categories.reduce((sum, category) => sum + category.items.reduce((itemSum, item) => itemSum + item.price * item.qty, 0), 0));
  const targetTicket = 12 + (hashDate(date, 97) % 7);
  const orders = Math.max(1, Math.round(totalSales / targetTicket));
  const visitCount = orders + 4 + (hashDate(date, 131) % 8);
  const posRatio = 0.72 + ((hashDate(date, 211) % 5) * 0.02);
  const posSales = round2(totalSales * posRatio);

  return {
    date,
    posSales,
    deliverySales: round2(totalSales - posSales),
    orders,
    visitCount,
    toppingQty: 0,
    sharedSideDishCount: 0,
    note: "",
    categories,
    totalSales,
  };
};

const buildIndonesiaPilotPayload = (date: string, menus: DemoMenu[]): DailyPayload => {
  const dayHash = hashDate(date);
  const weekdayFactor = isWeekend(date) ? 1.07 : 0.96;
  const dailyVariation = 0.94 + ((dayHash % 13) * 0.01);
  const baseQuantities = menus.map((menu, index) => ({
    menu,
    quantity: deterministicQuantity(
      ((INDONESIA_MONTHLY_QUANTITY_BASELINES[menu.name] ?? 0) / daysInMonth(date)) * weekdayFactor * dailyVariation,
      date,
      index + 701,
    ),
  }));
  const baseSales = baseQuantities.reduce((sum, entry) => sum + entry.menu.price * entry.quantity, 0);
  if (baseSales <= 0) throw new Error("Indonesia Pilot has no menu quantity baselines with prices");

  const targetSales = isWeekend(date)
    ? 41_000_000 + (hashDate(date, 809) % 4_000_001)
    : 37_000_000 + (hashDate(date, 809) % 4_000_001);
  const multiplier = targetSales / baseSales;
  const quantities = new Map(baseQuantities.map((entry) => [
    entry.menu.id,
    deterministicQuantity(entry.quantity * multiplier, date, hashDate(entry.menu.id, 907)),
  ]));
  const categories = buildCategories(menus, quantities);
  const totalSales = round2(categories.reduce((sum, category) => sum + category.items.reduce((itemSum, item) => itemSum + item.price * item.qty, 0), 0));
  const targetTicket = 160_000 + (hashDate(date, 1013) % 4_001);
  const orders = Math.max(1, Math.round(totalSales / targetTicket));
  const visitCount = orders + 10 + (hashDate(date, 1109) % 16);
  const posRatio = 0.76 + ((hashDate(date, 1201) % 7) * 0.01);
  const posSales = round2(totalSales * posRatio);
  const sharedSideDishCount = 60 + (hashDate(date, 1301) % 15) + (isWeekend(date) ? 6 : 0);

  return {
    date,
    posSales,
    deliverySales: round2(totalSales - posSales),
    orders,
    visitCount,
    toppingQty: 0,
    sharedSideDishCount,
    note: "",
    categories,
    totalSales,
  };
};

export async function ensureDemoSalesContinuity(input: { storeId: number; country?: string; brand?: string; today?: Date }) {
  const profile = getSyntheticSalesProfile(input);
  if (!profile || !supabase) {
    return { createdDates: [] as string[], skipped: true };
  }

  const today = input.today ?? new Date();
  const endDate = formatLocalDate(today);
  const startDateObject = new Date(today);
  startDateObject.setDate(startDateObject.getDate() - 59);
  const startDate = formatLocalDate(startDateObject);
  const existingDates = new Set(await listDatesInRange(startDate, endDate, input.storeId));
  const missingDates = listLocalDates(startDate, endDate).filter((date) => !existingDates.has(date));
  if (missingDates.length === 0) return { createdDates: [] as string[], skipped: false };

  const createdDates: string[] = [];
  for (const date of missingDates) {
    const menus = profile === "demo" ? await resolveDemoMenus(date) : await resolveIndonesiaPilotMenus(date);
    if (menus.length === 0) throw new Error("Synthetic Sales Store has no active priced menus");
    const payload = profile === "demo" ? buildDemoPayload(date, menus) : buildIndonesiaPilotPayload(date, menus);
    const result = await insertDailyIfMissing(payload, input.storeId);
    if (!result.ok) throw result.error;
    if (result.inserted) createdDates.push(date);
  }
  return { createdDates, skipped: false };
}
