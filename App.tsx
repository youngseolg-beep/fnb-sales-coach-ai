import { loadMonthlyTarget, saveMonthlyTarget } from "./services/monthlyTargetService";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  loadDaily,
  getMonthlyTotal,
  listDatesInMonth,
  deleteDaily,
} from "./services/salesStorage";

import {
  getMenuPricesForDate,
  saveMenuPriceHistory,
} from "./services/menuPriceService";
import { loadMenuMaster } from "./services/menuMasterService";
import { formatLocalDate } from "./utils2/date";

import type { SalesReportData, MenuCategory } from "./types";

import MenuSettingsPage from "./components/MenuSettingsPage";
import DailySalesPage from "./components/DailySalesPage";
import { supabase } from "./services/supabaseClient";

const getMonthKey = (dateStr: string) => dateStr.substring(0, 7);

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

  const loadedCategoryMap = new Map(
    loaded.map((category) => [String(category.name), category])
  );

  const mergedBase = base.map((baseCategory) => {
    const loadedCategory = loadedCategoryMap.get(baseCategory.name);

    if (!loadedCategory || !Array.isArray(loadedCategory.items)) {
      return {
        ...baseCategory,
        items: baseCategory.items.map((item) => ({ ...item })),
      };
    }

    const loadedItemMap = new Map(
      loadedCategory.items.map((item: any) => [String(item.id), item])
    );

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

const persistMenuPriceHistory = async (
  categories: MenuCategory[],
  effectiveDate: string,
  storeId: number
) => {
  const jobs: Promise<any>[] = [];

  for (const cat of categories) {
    for (const item of cat.items) {
      if (!item.id) continue;

      jobs.push(
       saveMenuPriceHistory(
  item.id,
  effectiveDate,
  Number(item.price ?? 0),
  item.unitCost !== null && item.unitCost !== undefined
    ? Number(item.unitCost)
    : undefined,
  storeId
)
      );
    }
  }

  await Promise.all(jobs);
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [currentPage, setCurrentPage] = useState<"daily-sales" | "menu-settings">("daily-sales");
  const [priceSaving, setPriceSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return formatLocalDate(new Date());
  });

  const targetMonthKey =
  selectedDate?.slice(0, 7) || formatLocalDate(new Date()).slice(0, 7);

  const [monthlyTarget, setMonthlyTarget] = useState<number>(0);
  const [monthlyTargetLoading, setMonthlyTargetLoading] = useState(false);

  const [menuMasterCategories, setMenuMasterCategories] = useState<MenuCategory[]>(() =>
    cloneCategories(INITIAL_CATEGORIES)
  );
  const [menuMasterLoading, setMenuMasterLoading] = useState(true);

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

  const [originalCategories, setOriginalCategories] = useState<MenuCategory[]>(() =>
    cloneCategories(INITIAL_CATEGORIES)
  );

  const [dbLoading, setDbLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeq, setToastSeq] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({ total: 0, avg: 0, rate: 0 });
  const [datesWithData, setDatesWithData] = useState<string[]>([]);

  const datesWithDataCacheRef = useRef<Record<string, string[]>>({});
  const monthlyStatsRequestRef = useRef("");

  const buildMonthCacheKey = useCallback((yearMonth: string, targetStoreId: number | null) => {
    return `${targetStoreId ?? "no-store"}_${yearMonth}`;
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastSeq((s) => s + 1);
  };

 async function refreshMonthlyTarget(monthKey: string) {
  if (storeId == null) return;

  try {
    setMonthlyTargetLoading(true);
    const value = await loadMonthlyTarget(monthKey, storeId);
    setMonthlyTarget(value);
    setData((prev) => ({ ...prev, monthlyTarget: value }));
  } catch (error) {
    console.error("refreshMonthlyTarget error:", error);
    setMonthlyTarget(0);
    setData((prev) => ({ ...prev, monthlyTarget: 0 }));
  } finally {
    setMonthlyTargetLoading(false);
  }
}

async function handleSaveMonthlyTarget(nextValue: number) {
  if (storeId == null) return;

  try {
    setMonthlyTarget(nextValue);
    await saveMonthlyTarget(targetMonthKey, nextValue, storeId);
  } catch (error) {
    console.error("handleSaveMonthlyTarget error:", error);
    alert("월 목표 저장 중 오류가 발생했습니다.");
  }
}

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!supabase) {
    setAuthError("Supabase 연결이 설정되지 않았습니다.");
    return;
  }

  setAuthError("");

  const loginEmail = email.includes("@") ? email : `${email}@tbk.com`;

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (error) {
    setAuthError(error.message);
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData.session) {
    setIsLoggedIn(true);

    const userId = sessionData.session.user.id;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, store_id")
      .eq("id", userId)
      .single();

    if (!userError && userData) {
      setUserRole(userData.role);
      setStoreId(userData.store_id);
      console.log("USER INFO:", userData);
    }
  }
};

const handleLogout = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  setIsLoggedIn(false);
  setUserRole(null);
  setStoreId(null);
  setEmail("");
  setPassword("");
  setAuthError("");
  setDatesWithData([]);
  datesWithDataCacheRef.current = {};
  monthlyStatsRequestRef.current = "";
};

const refreshMonthlyStats = useCallback(
  async (yearMonth: string) => {
    if (storeId == null) return;

    const targetStoreId = storeId;
    const cacheKey = buildMonthCacheKey(yearMonth, targetStoreId);
    const requestKey = `${cacheKey}_${Date.now()}`;
    monthlyStatsRequestRef.current = requestKey;

    const cachedDates = datesWithDataCacheRef.current[cacheKey];
    if (cachedDates) {
      setDatesWithData(cachedDates);
    }

    try {
      const [dates, total, target] = await Promise.all([
        listDatesInMonth(yearMonth, targetStoreId),
        getMonthlyTotal(yearMonth, targetStoreId),
        loadMonthlyTarget(yearMonth, targetStoreId),
      ]);

      if (monthlyStatsRequestRef.current !== requestKey) return;

      datesWithDataCacheRef.current[cacheKey] = dates;
      setDatesWithData(dates);

      setMonthlyStats({
        total,
        avg: dates.length > 0 ? total / dates.length : 0,
        rate: target > 0 ? (total / target) * 100 : 0,
      });

      setMonthlyTarget(target);

      setData((prev: any) => {
        if (getMonthKey(prev.date) === yearMonth) {
          return { ...prev, mtdSales: total, monthlyTarget: target };
        }
        return { ...prev, mtdSales: total };
      });
    } catch (error) {
      if (monthlyStatsRequestRef.current !== requestKey) return;
      console.error("refreshMonthlyStats error:", error);

      if (!cachedDates) {
        setDatesWithData([]);
      }

      setMonthlyStats((prev) => ({
        ...prev,
        total: 0,
        avg: 0,
      }));
    }
  },
  [buildMonthCacheKey, storeId]
);

const fetchData = async (dateStr: string, nextMenuMasterCategories?: MenuCategory[]) => {
  if (storeId == null) return;

  setDbLoading(true);

  try {
    const dbData = await loadDaily(dateStr, storeId);
    const yearMonth = getMonthKey(dateStr);
    const priceMap = await getMenuPricesForDate(dateStr, storeId);

    console.error("DEBUG fetchData storeId:", storeId);
    console.error("DEBUG fetchData selectedDate:", selectedDate);
    console.error("DEBUG fetchData dateStr:", dateStr);
    console.error("DEBUG fetchData dbData:", dbData);

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
      nextPosSales = 0;
      nextDeliverySales = 0;
      nextOrders = 0;
      nextVisitCount = 0;
      nextNote = "";
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

    const monthTargetFromDb = await loadMonthlyTarget(yearMonth, storeId);

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
    await refreshMonthlyStats(yearMonth);
  } catch (err) {
    console.error("DEBUG fetchData ERROR:", err);
  } finally {
    setDbLoading(false);
  }
};

const reloadMenuMaster = async () => {
  if (storeId == null) return;

  try {
    setMenuMasterLoading(true);

    const loadedMenuCategories = await loadMenuMaster(storeId);
    const normalized = normalizeMenuMasterCategories(loadedMenuCategories);
    const nextMenuCategories =
      normalized.length > 0 ? normalized : cloneCategories(INITIAL_CATEGORIES);

    setMenuMasterCategories(nextMenuCategories);
    await fetchData(data.date, nextMenuCategories);
  } catch (error) {
    console.error("reloadMenuMaster error:", error);
    showToast("메뉴 목록 새로고침 중 오류가 발생했습니다.");
  } finally {
    setMenuMasterLoading(false);
  }
};

const handleMonthChange = async (month: Date) => {
  if (storeId == null) return;

  const yearMonth = formatLocalDate(month).substring(0, 7);
  const cacheKey = buildMonthCacheKey(yearMonth, storeId);
  const cachedDates = datesWithDataCacheRef.current[cacheKey];

  if (cachedDates) {
    setDatesWithData(cachedDates);
  }

  await refreshMonthlyStats(yearMonth);
};

  const handleMenuSettingsCategoriesChange = (nextCategories: MenuCategory[]) => {
    setData((prev) => ({
      ...prev,
      categories: cloneCategories(nextCategories),
    }));
  };

  const handleSaveMenuPrices = async () => {
  if (storeId == null) return;

  try {
    setPriceSaving(true);

    await persistMenuPriceHistory(data.categories, data.date, storeId);

    const freshPriceMap = await getMenuPricesForDate(data.date, storeId);

    const refreshedCategories = data.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => {
        const latest = freshPriceMap.get(item.id);

        if (!latest) return { ...item };

        return {
          ...item,
          price:
            latest.price !== null && latest.price !== undefined
              ? Number(latest.price)
              : Number(item.price ?? 0),
          unitCost:
            latest.unit_cost !== null && latest.unit_cost !== undefined
              ? Number(latest.unit_cost)
              : item.unitCost,
        };
      }),
    }));

    setData((prev) => ({
      ...prev,
      categories: cloneCategories(refreshedCategories),
    }));
    setOriginalCategories(cloneCategories(refreshedCategories));

    showToast("메뉴 가격 / 원가가 저장되었습니다.");
  } catch (error: any) {
    console.error("Price Save Error:", error);
    showToast("메뉴 가격 저장 중 오류가 발생했습니다.");
  } finally {
    setPriceSaving(false);
  }
};

const handleDelete = async () => {
  if (storeId == null) return;

  const targetDate = data.date;

  try {
    setDbLoading(true);
    await deleteDaily(targetDate, storeId);

    const resetCats = createEmptyCategoriesFromBase(normalizeMenuMasterCategories(menuMasterCategories));

    setData((prev) => ({
      ...prev,
      posSales: 0,
      deliverySales: 0,
      orders: 0,
      visitCount: 0,
      note: "",
      categories: resetCats,
    }));
    setOriginalCategories(cloneCategories(resetCats));

    const yearMonth = targetDate.substring(0, 7);
    const cacheKey = buildMonthCacheKey(yearMonth, storeId);
    const prevDates = datesWithDataCacheRef.current[cacheKey] ?? [];
    const nextDates = prevDates.filter((date) => date !== targetDate);
    datesWithDataCacheRef.current[cacheKey] = nextDates;
    setDatesWithData(nextDates);

    await refreshMonthlyStats(yearMonth);
    showToast("데이터가 삭제되었습니다.");
  } catch (error: any) {
    console.error("Delete Error:", error);
    showToast("삭제 중 오류가 발생했습니다.");
  } finally {
    setDbLoading(false);
  }
};

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setSessionChecked(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session) {
        setIsLoggedIn(true);

        const userId = sessionData.session.user.id;

        const { data: userData, error } = await supabase
          .from("users")
          .select("role, store_id")
          .eq("id", userId)
          .single();

        if (!error && userData) {
          setUserRole(userData.role);
          setStoreId(userData.store_id);
          console.log("USER INFO:", userData);
        }
      }

      setSessionChecked(true);
    };

    checkSession();
  }, []);

 useEffect(() => {
  if (!isLoggedIn) return;
  if (storeId == null) return;

  let isMounted = true;

  const initMenuMaster = async () => {
    try {
      setMenuMasterLoading(true);

      const loadedMenuCategories = await loadMenuMaster(storeId);
      const normalized = normalizeMenuMasterCategories(loadedMenuCategories);
      const nextMenuCategories =
        normalized.length > 0 ? normalized : cloneCategories(INITIAL_CATEGORIES);

      if (!isMounted) return;

      setMenuMasterCategories(nextMenuCategories);
      await fetchData(selectedDate, nextMenuCategories);
    } catch (error) {
      console.error("Menu Master Load Error:", error);
      if (!isMounted) return;

      const fallbackCategories = cloneCategories(INITIAL_CATEGORIES);
      setMenuMasterCategories(fallbackCategories);
      await fetchData(selectedDate, fallbackCategories);
    } finally {
      if (isMounted) setMenuMasterLoading(false);
    }
  };

  initMenuMaster();

  return () => {
    isMounted = false;
  };
}, [isLoggedIn, storeId]);

useEffect(() => {
  if (!isLoggedIn) return;
  if (storeId == null) return;
  if (menuMasterLoading) return;

  void fetchData(selectedDate, menuMasterCategories);
}, [selectedDate, isLoggedIn, menuMasterLoading, storeId, menuMasterCategories]);

 useEffect(() => {
  if (!isLoggedIn) return;
  if (storeId == null) return;
  if (menuMasterLoading) return;

  void fetchData(selectedDate);
}, [selectedDate, isLoggedIn, menuMasterLoading, storeId]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastSeq, toastMsg]);

  const monthlyRate = useMemo(() => {
    const target = monthlyTarget;
    if (!target || target <= 0) return 0;
    return (monthlyStats.total / target) * 100;
  }, [monthlyStats.total, monthlyTarget]);

  if (!sessionChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <i className="fa-solid fa-user text-white text-2xl"></i>
            </div>

            <h1 className="text-white font-black text-2xl uppercase tracking-tight">
              SALES COACH AI
            </h1>

            <p className="text-indigo-100 text-sm font-bold opacity-0 mt-1">
              Supabase Login
            </p>

            <div className="mt-3 text-indigo-100 text-s font-semibold opacity-200 space-y-1">
              <div>ID : test</div>
              <div>PW : 0000</div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ID"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg font-bold"
                autoFocus
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg font-bold"
              />
              {authError && (
                <p className="text-rose-500 text-xs font-bold mt-3 text-center">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (menuMasterLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-900 text-xl font-black">Menu Master Loading...</div>
          <div className="mt-2 text-sm font-semibold text-slate-500">menu_master 데이터를 불러오는 중입니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-44 md:pb-32">
      <nav className="bg-indigo-600 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
              <i className="fa-solid fa-store font-black"></i>
            </div>

            <div>
              <h1 className="text-white font-black text-base md:text-lg leading-none uppercase tracking-tight">
                홍콩반점 테스트
              </h1>
              <p className="text-indigo-200 text-[9px] md:text-[10px] font-bold uppercase mt-1 tracking-widest">
                Sales Coach AI (USD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-white font-bold text-xs md:text-sm bg-indigo-500/50 px-2.5 py-1 rounded-full border border-indigo-400 flex flex-col items-end leading-tight">
              <div className="flex items-center gap-2">
                {dbLoading && <i className="fa-solid fa-spinner fa-spin text-xs"></i>}
                {data.date}
              </div>
              <div className="text-[7px] font-black tracking-widest text-indigo-200/90 uppercase">
                POWERED BY <span className="text-white">YOUNGSEOL</span>
              </div>
            </div>

            <button onClick={handleLogout} className="text-white/60 hover:text-white transition-colors" title="로그아웃">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-6 md:mt-10 space-y-8 md:space-y-12">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-base flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-indigo-500"></i>
              {data.date.substring(0, 7)} 월간 요약
            </h3>
            <div className="flex items-center gap-2 md:gap-3">
              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                월 목표
              </label>
              <div className="relative w-32 md:w-36">
                <input
                  type="number"
                  value={data.monthlyTarget || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setData((prev) => ({ ...prev, monthlyTarget: v }));
                    setMonthlyTarget(v);
                  }}
                  onBlur={() => {
                    handleSaveMonthlyTarget(monthlyTarget);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-2 pr-10 py-1 text-right text-[11px] md:text-sm font-bold focus:ring-1 focus:ring-indigo-400 outline-none tabular-nums"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 pointer-events-none">
                  USD
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            <div className="space-y-1">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                이번 달 누적 매출
              </p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">${monthlyStats.total.toLocaleString()}</p>
            </div>

            <div className="space-y-1 md:border-l md:border-slate-100 md:pl-8">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                일평균 매출
              </p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                ${Math.round(monthlyStats.avg).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1 md:border-l md:border-slate-100 md:pl-8">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                목표 달성률
              </p>
              <div className="flex items-end gap-2">
                <p className="text-2xl md:text-3xl font-black text-indigo-600">{monthlyRate.toFixed(1)}%</p>
                <div className="flex-1 h-2 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${Math.min(monthlyRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage("daily-sales")}
            className={`h-11 rounded-xl px-4 text-sm font-semibold transition-all ${
              currentPage === "daily-sales"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Daily Sales
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("menu-settings")}
            className={`h-11 rounded-xl px-4 text-sm font-semibold transition-all ${
              currentPage === "menu-settings"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Menu Settings
          </button>
        </section>

        {currentPage === "daily-sales" ? (
          <DailySalesPage
            data={data}
            setData={setData}
            setSelectedDate={setSelectedDate}
            datesWithData={datesWithData}
            onMonthChange={handleMonthChange}
            refreshMonthlyStats={refreshMonthlyStats}
            showToast={showToast}
            onDelete={handleDelete}
            storeId={storeId!}
          />
        ) : (
         <MenuSettingsPage
  selectedDate={data.date}
  categories={data.categories}
  originalCategories={originalCategories}
  onChangeCategories={handleMenuSettingsCategoriesChange}
  onSavePrices={handleSaveMenuPrices}
  onReloadMenuMaster={reloadMenuMaster}
  saving={priceSaving}
  storeId={storeId!}
  onShowToast={showToast}
/>
        )}
      </main>

      {toastMsg && (
        <div className="fixed bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg z-[10001] text-sm font-bold pointer-events-none">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default App;
