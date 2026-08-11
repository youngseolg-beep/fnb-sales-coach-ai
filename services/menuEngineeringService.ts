import { MenuCategory, MenuItem, MenuEngineeringItem, MenuEngineeringResult } from "../types";
import { listDatesInMonth, loadDaily, listDatesInRange } from "./salesStorage";
import type { CoachDemoDailyRow } from "./coachDemoData";

const normalizeName = (name: string): string => {
  return (name || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
};

const DEFAULT_EXCLUDED_MENU_NAMES = [
  "참이슬 프레쉬 360ml",
  "처음처럼 360ml",
  "진로이즈백 360ml",
  "막걸리",
  "앙코르 맥주 S 330ml",
  "앙코르 맥주 L 640ml",
  "앙코르 생맥주 250ml",
  "앙코르 생맥주 500ml",
  "하이네켄 생맥주 250ml",
  "콜라 330ml",
  "스프라이트 330ml",
  "소다 330ml",
  "봉봉 238ml",
  "쌕쌕 238ml",
  "쿨피스 250ml",
  "밀키스 250ml",
  "이과두주 100ml",
  "이과두주 500ml",
  "보건주 125ml",
  "보건주 520ml",
  "노주교 500ml",
];

const pickPositiveNumber = (...values: any[]): number => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
};

const pickNullableNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const sortByRevenueDesc = (a: MenuEngineeringItem, b: MenuEngineeringItem) =>
  Number(b.revenue_month || 0) - Number(a.revenue_month || 0);

const sortByQtyDesc = (a: MenuEngineeringItem, b: MenuEngineeringItem) =>
  Number(b.qty_month || 0) - Number(a.qty_month || 0);

const sortByCmDesc = (a: MenuEngineeringItem, b: MenuEngineeringItem) =>
  Number(b.cm ?? 0) - Number(a.cm ?? 0);

const sortByRevenueAsc = (a: MenuEngineeringItem, b: MenuEngineeringItem) =>
  Number(a.revenue_month || 0) - Number(b.revenue_month || 0);

export const calculateMenuEngineering = async (
  yearMonth: string,
  initialCategories: MenuCategory[]
): Promise<MenuEngineeringResult | null> => {
  const dates = await listDatesInMonth(yearMonth);
  return internalCalculate(dates, initialCategories);
};

export const calculateMenuEngineeringForRange = async (
  startDate: string,
  endDate: string,
  initialCategories: MenuCategory[],
  options?: { maxDays?: number; excludedMenuNames?: string[]; storeId?: number; demoRows?: CoachDemoDailyRow[] }
): Promise<MenuEngineeringResult | null> => {
  const mergedExcluded = [
    ...DEFAULT_EXCLUDED_MENU_NAMES,
    ...(options?.excludedMenuNames ?? []),
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean);

  const excluded = new Set(mergedExcluded);

  const storeId = options?.storeId ?? 1;
  let dates = await listDatesInRange(startDate, endDate, storeId);
  const suppliedRows = new Map((options?.demoRows ?? []).map((row) => [row.date, row]));
  if (dates.length === 0 && suppliedRows.size > 0) dates = Array.from(suppliedRows.keys()).sort();

  const maxDays = options?.maxDays ?? 7;
  if (maxDays > 0 && dates.length > maxDays) {
    dates = dates.slice(-maxDays);
  }

  return internalCalculate(dates, initialCategories, excluded, storeId, suppliedRows);
};

const internalCalculate = async (
  dates: string[],
  initialCategories: MenuCategory[],
  excludedMenuNames?: Set<string>,
  storeId: number = 1,
  suppliedRows: Map<string, CoachDemoDailyRow> = new Map()
): Promise<MenuEngineeringResult | null> => {
  const datesCount = Array.isArray(dates) ? dates.length : 0;

  if (datesCount < 7) {
    return {
      items: [],
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      stars: [],
      cashCows: [],
      puzzles: [],
      dogs: [],
      noCostItems: [],
      analyzedDatesCount: datesCount,
      debugStats: {
        datesCount,
        loadedCount: 0,
        categoriesCountTotal: 0,
        itemsCountTotal: 0,
        qtyPositiveItemsCount: 0,
        aggregatedIdsCount: 0,
      },
    };
  }

  let loadedCount = 0;
  let categoriesCountTotal = 0;
  let itemsCountTotal = 0;
  let qtyPositiveItemsCount = 0;

  const aggregatedQuantities: Record<string, number> = {};
  const observedItemsById: Record<string, Partial<MenuItem>> = {};
  const observedItemsByName: Record<string, Partial<MenuItem>> = {};

  for (const date of dates) {
    const demoRow = suppliedRows.get(date);
    const dailyData = demoRow
      ? { date: demoRow.date, posSales: demoRow.sales, orders: demoRow.orders, visitCount: demoRow.visitors, categories: demoRow.categories }
      : await loadDaily(date, storeId);
    if (!dailyData) continue;

    const cats = dailyData.categories;
    if (!Array.isArray(cats)) continue;

    loadedCount++;
    categoriesCountTotal += cats.length;

    for (const cat of cats) {
      if (!cat?.items || !Array.isArray(cat.items)) continue;

      itemsCountTotal += cat.items.length;

      for (const item of cat.items) {
        if (!item) continue;

        const itemName = String(item.name || "").trim();
        if (excludedMenuNames && excludedMenuNames.has(itemName)) continue;

        const normalizedName = normalizeName(itemName);
        const observedPrice = pickNullableNumber(item.price);
        const observedUnitCost = pickNullableNumber(item.unitCost);

        if (item.id) {
          const prev = observedItemsById[item.id] || {};
          observedItemsById[item.id] = {
            ...prev,
            id: item.id,
            name: itemName || prev.name,
            price: observedPrice ?? prev.price,
            unitCost: observedUnitCost ?? prev.unitCost,
          };
        }

        if (normalizedName) {
          const prevByName = observedItemsByName[normalizedName] || {};
          observedItemsByName[normalizedName] = {
            ...prevByName,
            id: item.id || prevByName.id,
            name: itemName || prevByName.name,
            price: observedPrice ?? prevByName.price,
            unitCost: observedUnitCost ?? prevByName.unitCost,
          };
        }

        const q = Number(item.qty || 0);
        if (q > 0) {
          qtyPositiveItemsCount++;
          aggregatedQuantities[item.id] = (aggregatedQuantities[item.id] || 0) + q;
        }
      }
    }
  }

  const aggregatedIdsCount = Object.keys(aggregatedQuantities).length;

  const allMenuItemsById: Record<string, MenuItem> = {};
  const allMenuItemsByName: Record<string, MenuItem> = {};

  for (const cat of initialCategories) {
    for (const item of cat.items) {
      allMenuItemsById[item.id] = item;
      const normalizedName = normalizeName(item.name);
      if (normalizedName && !allMenuItemsByName[normalizedName]) {
        allMenuItemsByName[normalizedName] = item;
      }
    }
  }

  const menuEngineeringItems: MenuEngineeringItem[] = [];

  for (const itemId of Object.keys(aggregatedQuantities)) {
    const masterItem = allMenuItemsById[itemId];
    const observedItem = observedItemsById[itemId];

    const resolvedName =
      String(observedItem?.name || masterItem?.name || "").trim();

    const normalizedResolvedName = normalizeName(resolvedName);
    const fallbackByName =
      observedItemsByName[normalizedResolvedName] ||
      allMenuItemsByName[normalizedResolvedName];

    const price = pickPositiveNumber(
      observedItem?.price,
      masterItem?.price,
      fallbackByName?.price
    );

    const unitCost = pickNullableNumber(
      observedItem?.unitCost,
      masterItem?.unitCost,
      fallbackByName?.unitCost
    );

    const qty_month = Number(aggregatedQuantities[itemId] || 0);
    const revenue_month = price * qty_month;
    const cogs_month = unitCost !== null ? unitCost * qty_month : null;
    const cm = unitCost !== null ? price - unitCost : null;
    const gp_month = cogs_month !== null ? revenue_month - cogs_month : null;

    menuEngineeringItems.push({
      id: itemId,
      name: resolvedName || masterItem?.name || observedItem?.name || itemId,
      price,
      qty: 0,
      unitCost,
      qty_month,
      revenue_month,
      cogs_month,
      cm,
      gp_month,
      popularity: "Low",
      profitability: "Low",
      category: "Dogs",
    });
  }

  if (menuEngineeringItems.length === 0) {
    return {
      items: [],
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      stars: [],
      cashCows: [],
      puzzles: [],
      dogs: [],
      noCostItems: [],
      analyzedDatesCount: datesCount,
      debugStats: {
        datesCount,
        loadedCount,
        categoriesCountTotal,
        itemsCountTotal,
        qtyPositiveItemsCount,
        aggregatedIdsCount,
      },
    };
  }

  const qtyList = menuEngineeringItems
    .map((it) => Number(it.qty_month || 0))
    .filter((v) => Number.isFinite(v));

  const cmList = menuEngineeringItems
    .map((it) => Number(it.cm ?? 0))
    .filter((v) => Number.isFinite(v));

  const popularityThreshold =
    qtyList.length > 0 ? qtyList.reduce((a, b) => a + b, 0) / qtyList.length : 0;

  const profitabilityThreshold =
    cmList.length > 0 ? cmList.reduce((a, b) => a + b, 0) / cmList.length : 0;

  const totalRevenueForShare = menuEngineeringItems.reduce(
    (sum, it) => sum + Number(it.revenue_month || 0),
    0
  );

  const starsRaw: MenuEngineeringItem[] = [];
  const cashCowsRaw: MenuEngineeringItem[] = [];
  const puzzlesRaw: MenuEngineeringItem[] = [];
  const dogsRaw: MenuEngineeringItem[] = [];
  const noCostItems: MenuEngineeringItem[] = [];

  for (const item of menuEngineeringItems) {
    const qty = Number(item.qty_month || 0);
    const cm = Number(item.cm ?? 0);

    const isPopular = qty >= popularityThreshold;
    const isProfitable = cm >= profitabilityThreshold;

    item.popularity = isPopular ? "High" : "Low";
    item.profitability = isProfitable ? "High" : "Low";
    (item as any).revenueShare =
      totalRevenueForShare > 0 ? (Number(item.revenue_month || 0) / totalRevenueForShare) * 100 : 0;

    if (item.unitCost === undefined || item.unitCost === null) {
      item.category = "Dogs";
      dogsRaw.push(item);
      noCostItems.push(item);
      continue;
    }

    if (isPopular && isProfitable) {
      item.category = "Stars";
      starsRaw.push(item);
    } else if (isPopular && !isProfitable) {
      item.category = "Cash Cows";
      cashCowsRaw.push(item);
    } else if (!isPopular && isProfitable) {
      item.category = "Puzzles";
      puzzlesRaw.push(item);
    } else {
      item.category = "Dogs";
      dogsRaw.push(item);
    }
  }

  const starsTop3 = [...starsRaw].sort(sortByRevenueDesc).slice(0, 3);
  const cashCowsTop3 = [...cashCowsRaw].sort(sortByQtyDesc).slice(0, 3);
  const puzzlesTop3 = [...puzzlesRaw].sort(sortByCmDesc).slice(0, 3);
  const dogsTop3 = [...dogsRaw].sort(sortByRevenueAsc).slice(0, 3);

  return {
    items: menuEngineeringItems,
    popularityThreshold,
    profitabilityThreshold,
    stars: starsTop3,
    cashCows: cashCowsTop3,
    puzzles: puzzlesTop3,
    dogs: dogsTop3,
    noCostItems,
    analyzedDatesCount: datesCount,
    debugStats: {
      datesCount,
      loadedCount,
      categoriesCountTotal,
      itemsCountTotal,
      qtyPositiveItemsCount,
      aggregatedIdsCount,
    },
  };
};
