import { MenuCategory, MenuItem, MenuEngineeringItem, MenuEngineeringResult } from "../types";
import { listDatesInMonth, loadDaily, listDatesInRange } from "./salesStorage";

// 이름 정규화(필요하면 나중에 매칭에 사용)
const normalizeName = (name: string): string => {
  return (name || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
};

// ✅ 기본 제외(주류/음료) — options.excludedMenuNames로 추가 가능
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

// ─────────────────────────────────────────────────────────────
// 월 단위 (유지)
// ─────────────────────────────────────────────────────────────
export const calculateMenuEngineering = async (
  yearMonth: string,
  initialCategories: MenuCategory[]
): Promise<MenuEngineeringResult | null> => {
  const dates = await listDatesInMonth(yearMonth);
  return internalCalculate(dates, initialCategories);
};

// ─────────────────────────────────────────────────────────────
// 기간 단위 (코칭리포트용: 기본 최근 7일만)
// ─────────────────────────────────────────────────────────────
export const calculateMenuEngineeringForRange = async (
  startDate: string,
  endDate: string,
  initialCategories: MenuCategory[],
  options?: { maxDays?: number; excludedMenuNames?: string[] }
): Promise<MenuEngineeringResult | null> => {
  const mergedExcluded = [
    ...DEFAULT_EXCLUDED_MENU_NAMES,
    ...(options?.excludedMenuNames ?? []),
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean);

  const excluded = new Set(mergedExcluded);

  let dates = await listDatesInRange(startDate, endDate);

  // ✅ 너무 오래 걸리면 최근 maxDays만 분석 (기본 7일)
  const maxDays = options?.maxDays ?? 7;
  if (maxDays > 0 && dates.length > maxDays) {
    dates = dates.slice(-maxDays);
  }

  return internalCalculate(dates, initialCategories, excluded);
};

// ─────────────────────────────────────────────────────────────
// 내부 공통 계산
// ─────────────────────────────────────────────────────────────
const internalCalculate = async (
  dates: string[],
  initialCategories: MenuCategory[],
  excludedMenuNames?: Set<string>
): Promise<MenuEngineeringResult | null> => {
  const datesCount = Array.isArray(dates) ? dates.length : 0;

  // ✅ 7일 미만이면 분석 불가(안전 리턴)
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

  // Debug counters
  let loadedCount = 0;
  let categoriesCountTotal = 0;
  let itemsCountTotal = 0;
  let qtyPositiveItemsCount = 0;

  // id별 판매량 누적
  const aggregatedQuantities: Record<string, number> = {};

  for (const date of dates) {
    const dailyData = await loadDaily(date);
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

        // ✅ 제외 메뉴는 집계에서 제외
        if (excludedMenuNames && excludedMenuNames.has((item.name || "").trim())) continue;

        const q = Number(item.qty || 0);
        if (q > 0) {
          qtyPositiveItemsCount++;
          aggregatedQuantities[item.id] = (aggregatedQuantities[item.id] || 0) + q;
        }
      }
    }
  }

  const aggregatedIdsCount = Object.keys(aggregatedQuantities).length;

  // 메뉴 마스터(초기 카테고리)에서 id→item 매핑
  const allMenuItems: Record<string, MenuItem> = {};
  for (const cat of initialCategories) {
    for (const item of cat.items) {
      allMenuItems[item.id] = item;
    }
  }

  // item별 ME metrics 생성
  const menuEngineeringItems: MenuEngineeringItem[] = [];
  for (const itemId of Object.keys(aggregatedQuantities)) {
    const item = allMenuItems[itemId];
    if (!item) continue;

    const qty_month = Number(aggregatedQuantities[itemId] || 0);
    const revenue_month = Number(item.price || 0) * qty_month;

    const hasCost = item.unitCost !== undefined && item.unitCost !== null;
    const unitCost = hasCost ? Number(item.unitCost) : null;

    const cogs_month = hasCost ? unitCost! * qty_month : null;
    const cm = hasCost ? Number(item.price || 0) - unitCost! : null;
    const gp_month = cogs_month !== null ? revenue_month - cogs_month : null;

    menuEngineeringItems.push({
      ...item,
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

  // 데이터가 없으면 빈 결과 반환
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

  // ✅ thresholds (평균 기반)
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

  // 분류
  const starsRaw: MenuEngineeringItem[] = [];
  const cashCowsRaw: MenuEngineeringItem[] = [];
  const puzzlesRaw: MenuEngineeringItem[] = [];
  const dogsRaw: MenuEngineeringItem[] = [];
  const noCostItems: MenuEngineeringItem[] = [];

  for (const item of menuEngineeringItems) {
    // 원가 없는 메뉴는 별도 분리
    if (item.unitCost === undefined || item.unitCost === null) {
      noCostItems.push(item);
      continue;
    }

    const qty = Number(item.qty_month || 0);
    const cm = Number(item.cm ?? 0);

    const isPopular = qty >= popularityThreshold;
    const isProfitable = cm >= profitabilityThreshold;

    item.popularity = isPopular ? "High" : "Low";
    item.profitability = isProfitable ? "High" : "Low";

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

  // ✅ 표시용: "최대 3개" + "카테고리 간 중복 방지" + "가능하면 3개 채우기"
  const usedNames = new Set<string>();
  const withCostPool = menuEngineeringItems.filter((it) => it.unitCost !== undefined && it.unitCost !== null);

  const pickTopUnique = (
    primary: MenuEngineeringItem[],
    fallback: MenuEngineeringItem[],
    sortFn: (a: MenuEngineeringItem, b: MenuEngineeringItem) => number,
    n = 3
  ) => {
    const picked: MenuEngineeringItem[] = [];

    const pushIfOk = (it: MenuEngineeringItem) => {
      const key = (it.name || "").trim();
      if (!key) return false;
      if (usedNames.has(key)) return false;
      usedNames.add(key);
      picked.push(it);
      return true;
    };

    // 1) 1차 후보에서 먼저 채움
    for (const it of [...primary].sort(sortFn)) {
      if (picked.length >= n) break;
      pushIfOk(it);
    }

    // 2) 부족하면 fallback에서 채움(전체 풀에서)
    if (picked.length < n) {
      for (const it of [...fallback].sort(sortFn)) {
        if (picked.length >= n) break;
        pushIfOk(it);
      }
    }

    return picked;
  };

  const starsTop3 = pickTopUnique(
    starsRaw,
    withCostPool,
    (a, b) => Number(b.revenue_month || 0) - Number(a.revenue_month || 0),
    3
  );

  const cashCowsTop3 = pickTopUnique(
    cashCowsRaw,
    withCostPool,
    (a, b) => Number(b.qty_month || 0) - Number(a.qty_month || 0),
    3
  );

  const puzzlesTop3 = pickTopUnique(
    puzzlesRaw,
    withCostPool,
    (a, b) => Number(b.cm ?? 0) - Number(a.cm ?? 0),
    3
  );

  const dogsTop3 = pickTopUnique(
    dogsRaw,
    withCostPool,
    (a, b) => Number(a.revenue_month || 0) - Number(b.revenue_month || 0),
    3
  );

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
