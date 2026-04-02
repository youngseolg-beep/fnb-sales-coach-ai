import { useState } from "react";
import { useCallback, useState } from "react";
import { formatLocalDate } from "../utils2/date";
import { loadDaily } from "../services/salesStorage";
import { getMenuPricesForDate } from "../services/menuPriceService";
import { loadMonthlyTarget } from "../services/monthlyTargetService";
import type { MenuCategory, SalesReportData } from "../types";

const INITIAL_CATEGORIES: MenuCategory[] = [
@@ -83,7 +86,137 @@ const cloneCategories = (categories: MenuCategory[]): MenuCategory[] =>
items: category.items.map((item) => ({ ...item })),
}));

export const useSalesData = () => {
const toSafeNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeMenuMasterCategories = (categories?: MenuCategory[] | null): MenuCategory[] => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return cloneCategories(INITIAL_CATEGORIES);
  }

  return categories.map((category) => ({
    name: String(category.name),
    items: Array.isArray(category.items)
      ? category.items.map((item: any) => ({
          id: String(item.id),
          name: String(item.name),
          price:
            item.price === undefined || item.price === null || item.price === ""
              ? 0
              : toSafeNumber(item.price, 0),
          qty: 0,
          unitCost:
            item.unitCost === undefined || item.unitCost === null || item.unitCost === ""
              ? undefined
              : toSafeNumber(item.unitCost, 0),
        }))
      : [],
  }));
};

const createEmptyCategoriesFromBase = (baseCategories: MenuCategory[]): MenuCategory[] =>
  baseCategories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      qty: 0,
    })),
  }));

const mergeCategoriesWithBase = (
  baseCategories: MenuCategory[],
  loaded?: MenuCategory[] | null
): MenuCategory[] => {
  const base = cloneCategories(baseCategories);

  if (!Array.isArray(loaded) || loaded.length === 0) {
    return base;
  }

  const loadedCategoryMap = new Map(loaded.map((category) => [String(category.name), category]));

  const mergedBase = base.map((baseCategory) => {
    const loadedCategory = loadedCategoryMap.get(baseCategory.name);

    if (!loadedCategory || !Array.isArray(loadedCategory.items)) {
      return {
        ...baseCategory,
        items: baseCategory.items.map((item) => ({ ...item })),
      };
    }

    const loadedItemMap = new Map(loadedCategory.items.map((item: any) => [String(item.id), item]));

    return {
      ...baseCategory,
      items: baseCategory.items.map((baseItem) => {
        const loadedItem: any = loadedItemMap.get(baseItem.id);

        if (!loadedItem) {
          return { ...baseItem };
        }

        return {
          ...baseItem,
          name: String(loadedItem.name ?? baseItem.name),
          price: toSafeNumber(loadedItem.price, toSafeNumber(baseItem.price, 0)),
          qty: toSafeNumber(loadedItem.qty, 0),
          unitCost:
            loadedItem.unitCost === undefined ||
            loadedItem.unitCost === null ||
            loadedItem.unitCost === ""
              ? baseItem.unitCost
              : toSafeNumber(loadedItem.unitCost, toSafeNumber(baseItem.unitCost, 0)),
        };
      }),
    };
  });

  const baseCategoryNames = new Set(base.map((category) => category.name));

  const extraCategories = loaded
    .filter(
      (category) =>
        category &&
        typeof category === "object" &&
        typeof category.name === "string" &&
        Array.isArray(category.items) &&
        !baseCategoryNames.has(category.name)
    )
    .map((category) => ({
      name: String(category.name),
      items: category.items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: toSafeNumber(item.price, 0),
        qty: toSafeNumber(item.qty, 0),
        unitCost:
          item.unitCost === undefined || item.unitCost === null || item.unitCost === ""
            ? undefined
            : toSafeNumber(item.unitCost, 0),
      })),
    }));

  return [...mergedBase, ...extraCategories];
};

type UseSalesDataParams = {
  storeId?: number | null;
  menuMasterCategories?: MenuCategory[];
  setMonthlyTarget?: (value: number) => void;
  refreshMonthlyStats?: (yearMonth: string) => Promise<void>;
  refreshMonthlyTarget?: (yearMonth: string) => Promise<void>;
};

export const useSalesData = (params?: UseSalesDataParams) => {
  const storeId = params?.storeId ?? null;
  const menuMasterCategories = params?.menuMasterCategories ?? cloneCategories(INITIAL_CATEGORIES);
  const setMonthlyTarget = params?.setMonthlyTarget;
  const refreshMonthlyStats = params?.refreshMonthlyStats;
  const refreshMonthlyTarget = params?.refreshMonthlyTarget;

const [selectedDate, setSelectedDate] = useState<string>(() => {
return formatLocalDate(new Date());
});
@@ -107,6 +240,98 @@ export const useSalesData = () => {
const [originalCategories, setOriginalCategories] = useState<MenuCategory[]>(() =>
cloneCategories(INITIAL_CATEGORIES)
);
  const [dbLoading, setDbLoading] = useState(false);

  const fetchData = useCallback(
    async (dateStr: string, nextMenuMasterCategories?: MenuCategory[]) => {
      if (storeId == null) return;

      setDbLoading(true);

      try {
        const dbData = await loadDaily(dateStr, storeId);
        const yearMonth = dateStr.substring(0, 7);
        const priceMap = await getMenuPricesForDate(dateStr, storeId);

        const activeBaseCategories = normalizeMenuMasterCategories(
          nextMenuMasterCategories ?? menuMasterCategories
        );

        let nextCategories: MenuCategory[];
        let nextPosSales = 0;
        let nextDeliverySales = 0;
        let nextOrders = 0;
        let nextVisitCount = 0;
        let nextNote = "";

        if (dbData) {
          nextCategories = mergeCategoriesWithBase(activeBaseCategories, (dbData as any).categories);
          nextPosSales = toSafeNumber((dbData as any).posSales, 0);
          nextDeliverySales = toSafeNumber((dbData as any).deliverySales, 0);
          nextOrders = toSafeNumber((dbData as any).orders, 0);
          nextVisitCount = toSafeNumber((dbData as any).visitCount, 0);
          nextNote = String((dbData as any).note ?? "");
        } else {
          nextCategories = createEmptyCategoriesFromBase(activeBaseCategories);
        }

        nextCategories = nextCategories.map((cat) => ({
          ...cat,
          items: cat.items.map((item) => {
            const history = priceMap.get(item.id);

            if (!history) return { ...item };

            return {
              ...item,
              price: history.price != null ? Number(history.price) : Number(item.price ?? 0),
              unitCost: history.unit_cost != null ? Number(history.unit_cost) : item.unitCost,
            };
          }),
        }));

        let monthTargetFromDb = 0;

        if (setMonthlyTarget) {
          monthTargetFromDb = await loadMonthlyTarget(yearMonth, storeId);
          setMonthlyTarget(monthTargetFromDb);
        }

        setData((prev: any) => ({
          ...prev,
          date: dateStr,
          posSales: nextPosSales,
          deliverySales: nextDeliverySales,
          orders: nextOrders,
          visitCount: nextVisitCount,
          note: nextNote,
          monthlyTarget: monthTargetFromDb,
          categories: cloneCategories(nextCategories),
        }));

        setOriginalCategories(cloneCategories(nextCategories));

        if (refreshMonthlyStats) {
          await refreshMonthlyStats(yearMonth);
        }

        if (refreshMonthlyTarget) {
          await refreshMonthlyTarget(yearMonth);
        }
      } catch (error) {
        console.error("fetchData error:", error);
      } finally {
        setDbLoading(false);
      }
    },
    [
      storeId,
      menuMasterCategories,
      setMonthlyTarget,
      refreshMonthlyStats,
      refreshMonthlyTarget,
    ]
  );

return {
selectedDate,
@@ -117,5 +342,9 @@ export const useSalesData = () => {
setOriginalCategories,
initialCategories: INITIAL_CATEGORIES,
cloneCategories,
    normalizeMenuMasterCategories,
    createEmptyCategoriesFromBase,
    dbLoading,
    fetchData,
};
};
