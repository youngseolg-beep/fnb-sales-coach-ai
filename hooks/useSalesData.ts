import { useCallback, useEffect, useRef, useState } from "react";
import { formatLocalDate } from "../utils2/date";
import { loadDaily, listDatesInMonth } from "../services/salesStorage";
import { getMenuPricesForDate } from "../services/menuPriceService";
import type { MenuCategory, SalesReportData } from "../types";

const INITIAL_CATEGORIES: MenuCategory[] = [
  {
    name: "음식 메뉴 (Main Dishes)",
    items: [
      { id: "f1", name: "짜장면", price: 7, qty: 0, unitCost: 1.42 },
      { id: "f2", name: "짬뽕", price: 7, qty: 0, unitCost: 2.24 },
      { id: "f3", name: "짬뽕밥", price: 8, qty: 0, unitCost: 2.34 },
      { id: "f4", name: "백짬뽕", price: 7, qty: 0, unitCost: 2.13 },
      { id: "f5", name: "백짬뽕밥", price: 8, qty: 0, unitCost: 2.08 },
      { id: "f6", name: "볶음짬뽕", price: 9, qty: 0, unitCost: 2.94 },
      { id: "f7", name: "고추짜장", price: 9, qty: 0, unitCost: 1.57 },
      { id: "f8", name: "고추짬뽕", price: 10, qty: 0, unitCost: 2.51 },
      { id: "f9", name: "고추짬뽕밥", price: 12, qty: 0, unitCost: 2.61 },
      { id: "f10", name: "짜장밥", price: 5, qty: 0, unitCost: 1.67 },
      { id: "f11", name: "잡채밥", price: 10, qty: 0, unitCost: 3.35 },
      { id: "f12", name: "야채볶음밥", price: 5, qty: 0, unitCost: 1.69 },
      { id: "f13", name: "소고기볶음밥", price: 7, qty: 0, unitCost: 2.36 },
      { id: "f14", name: "마파두부", price: 12, qty: 0, unitCost: 2.24 },
      { id: "f15", name: "마파두부덮밥", price: 9, qty: 0, unitCost: 1.72 },
      { id: "f16", name: "깐풍기", price: 15, qty: 0, unitCost: 2.97 },
      { id: "f17", name: "고추유린기", price: 15, qty: 0, unitCost: 3.71 },
      { id: "f18", name: "쟁반짜장", price: 18, qty: 0, unitCost: 4.38 },
      { id: "f19", name: "돌짜장", price: 18, qty: 0, unitCost: 5.32 },
      { id: "f20", name: "해물육교자", price: 5.5, qty: 0, unitCost: 2.42 },
    ],
  },
  {
    name: "탕수육 (Tangsuyuk)",
    items: [
      { id: "t1", name: "탕수육 S", price: 12, qty: 0, unitCost: 2.7 },
      { id: "t2", name: "탕수육 M", price: 15, qty: 0, unitCost: 3.23 },
      { id: "t3", name: "탕수육 L", price: 18, qty: 0, unitCost: 4.5 },
    ],
  },
  {
    name: "토핑 (Add-ons)",
    items: [
      { id: "a1", name: "토핑 해시브라운", price: 2, qty: 0, unitCost: 0.28 },
      { id: "a2", name: "토핑 계란프라이", price: 1, qty: 0, unitCost: 0.141 },
      { id: "a3", name: "토핑 슬라이스치즈", price: 1, qty: 0, unitCost: 0.29 },
    ],
  },
  {
    name: "음료 및 주류 (Beverages)",
    items: [
      { id: "b1", name: "참이슬 프레쉬 360ml", price: 5, qty: 0 },
      { id: "b2", name: "처음처럼 360ml", price: 5, qty: 0 },
      { id: "b3", name: "진로이즈백 360ml", price: 5, qty: 0 },
      { id: "b4", name: "막걸리", price: 6, qty: 0 },
      { id: "b5", name: "앙코르 맥주 S 330ml", price: 2.5, qty: 0 },
      { id: "b6", name: "앙코르 맥주 L 640ml", price: 4.5, qty: 0 },
      { id: "b7", name: "앙코르 생맥주 250ml", price: 2, qty: 0 },
      { id: "b8", name: "앙코르 생맥주 500ml", price: 3, qty: 0 },
      { id: "b9", name: "하이네켄 생맥주 250ml", price: 2.5, qty: 0 },
      { id: "b10", name: "콜라 330ml", price: 1, qty: 0 },
      { id: "b11", name: "스프라이트 330ml", price: 1, qty: 0 },
      { id: "b12", name: "소다 330ml", price: 1, qty: 0 },
      { id: "b13", name: "봉봉 238ml", price: 2, qty: 0 },
      { id: "b14", name: "쌕쌕 238ml", price: 2, qty: 0 },
      { id: "b15", name: "쿨피스 250ml", price: 2, qty: 0 },
      { id: "b16", name: "밀키스 250ml", price: 2, qty: 0 },
    ],
  },
  {
    name: "고량주 (Liquors)",
    items: [
      { id: "l1", name: "이과두주 100ml", price: 4, qty: 0 },
      { id: "l2", name: "이과두주 500ml", price: 8, qty: 0 },
      { id: "l3", name: "보건주 125ml", price: 6, qty: 0 },
      { id: "l4", name: "보건주 520ml", price: 18, qty: 0 },
      { id: "l5", name: "노주교 500ml", price: 60, qty: 0 },
    ],
  },
];

const cloneCategories = (categories: MenuCategory[]): MenuCategory[] =>
  categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }));

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
              ? undefined
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
          price:
            loadedItem.price === undefined || loadedItem.price === null || loadedItem.price === ""
              ? baseItem.price
              : toSafeNumber(loadedItem.price, toSafeNumber(baseItem.price, 0)),
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
        price:
          item.price === undefined || item.price === null || item.price === ""
            ? undefined
            : toSafeNumber(item.price, 0),
        qty: toSafeNumber(item.qty, 0),
        unitCost:
          item.unitCost === undefined || item.unitCost === null || item.unitCost === ""
            ? undefined
            : toSafeNumber(item.unitCost, 0),
      })),
    }));

  return [...mergedBase, ...extraCategories];
};

const getMonthKey = (dateStr: string) => String(dateStr).slice(0, 7);

type UseSalesDataParams = {
  storeId?: number | null;
  menuMasterCategories?: MenuCategory[];
};

export const useSalesData = (params?: UseSalesDataParams) => {
  const storeId = params?.storeId ?? null;
  const menuMasterCategories = params?.menuMasterCategories ?? cloneCategories(INITIAL_CATEGORIES);

  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));

  const [data, setData] = useState<SalesReportData>(() => {
    const today = formatLocalDate(new Date());

    return {
      date: today,
      posSales: 0,
      deliverySales: 0,
      orders: 0,
      visitCount: 0,
      toppingQty: 0,
      monthlyTarget: 0,
      menuSales: {},
      categories: cloneCategories(INITIAL_CATEGORIES),
    };
  });

  const [originalCategories, setOriginalCategories] = useState<MenuCategory[]>(
    cloneCategories(INITIAL_CATEGORIES)
  );

  const [datesWithData, setDatesWithData] = useState<string[]>([]);
  const monthDotsCacheRef = useRef<Record<string, string[]>>({});

  const loadDatesInMonthWithCache = useCallback(
    async (dateStr: string, forceRefresh = false) => {
      if (storeId == null) return [];

      const monthKey = getMonthKey(dateStr);
      const cached = monthDotsCacheRef.current[monthKey];

      if (!forceRefresh && cached) {
        setDatesWithData(cached);
        return cached;
      }

      try {
        const nextDates = await listDatesInMonth(monthKey, storeId);
        const safeDates = Array.isArray(nextDates) ? nextDates : [];

        monthDotsCacheRef.current[monthKey] = safeDates;
        setDatesWithData(safeDates);

        return safeDates;
      } catch (error) {
        const fallbackDates = monthDotsCacheRef.current[monthKey] ?? [];
        if (fallbackDates.length > 0) {
          setDatesWithData(fallbackDates);
        }
        console.error("loadDatesInMonthWithCache error:", error);
        return fallbackDates;
      }
    },
    [storeId]
  );

  const refreshDatesInMonth = useCallback(
    async (dateStr?: string) => {
      const targetDate = dateStr ?? selectedDate;
      return await loadDatesInMonthWithCache(targetDate, true);
    },
    [selectedDate, loadDatesInMonthWithCache]
  );

  const handleMonthChange = useCallback(
    async (dateStr: string) => {
      return await loadDatesInMonthWithCache(dateStr, false);
    },
    [loadDatesInMonthWithCache]
  );

  useEffect(() => {
    monthDotsCacheRef.current = {};
    setDatesWithData([]);
  }, [storeId]);

  useEffect(() => {
    if (storeId == null) return;
    loadDatesInMonthWithCache(selectedDate, false);
  }, [storeId, selectedDate, loadDatesInMonthWithCache]);

  const fetchData = useCallback(
    async (dateStr: string, nextMenuMasterCategories?: MenuCategory[]) => {
      if (storeId == null) return;

      try {
        const dbData = await loadDaily(dateStr, storeId);
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

            if (history) {
              return {
                ...item,
                price:
                  history.price !== null && history.price !== undefined
                    ? Number(history.price)
                    : item.price,
                unitCost:
                  history.unit_cost !== null && history.unit_cost !== undefined
                    ? Number(history.unit_cost)
                    : item.unitCost,
              };
            }

            return {
              ...item,
              price:
                item.price === undefined || item.price === null || item.price === ""
                  ? 0
                  : Number(item.price),
              unitCost:
                item.unitCost === undefined || item.unitCost === null || item.unitCost === ""
                  ? undefined
                  : Number(item.unitCost),
            };
          }),
        }));

        setData((prev: any) => ({
          ...prev,
          date: dateStr,
          posSales: nextPosSales,
          deliverySales: nextDeliverySales,
          orders: nextOrders,
          visitCount: nextVisitCount,
          note: nextNote,
          categories: cloneCategories(nextCategories),
        }));

        setOriginalCategories(cloneCategories(nextCategories));
      } catch (error) {
        console.error("fetchData error:", error);
      }
    },
    [storeId, menuMasterCategories]
  );

  return {
    selectedDate,
    setSelectedDate,
    data,
    setData,
    originalCategories,
    setOriginalCategories,
    datesWithData,
    refreshDatesInMonth,
    handleMonthChange,
    initialCategories: INITIAL_CATEGORIES,
    cloneCategories,
    normalizeMenuMasterCategories,
    createEmptyCategoriesFromBase,
    fetchData,
  };
};
