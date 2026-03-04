import { MenuCategory, MenuItem, MenuEngineeringItem, MenuEngineeringResult } from "../types";
import { listDatesInMonth, loadDaily, listDatesInRange } from "./salesStorage";
export const calculateMenuEngineeringForRange = async (
  startDate: string,
  endDate: string,
  initialCategories: MenuCategory[],
  options?: { maxDays?: number }
): Promise<MenuEngineeringResult | null> => {
  const EXCLUDED_MENU_NAMES = new Set([
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
  ]);

  const isExcluded = (name: string) => EXCLUDED_MENU_NAMES.has((name || "").trim());

  let dates = await listDatesInRange(startDate, endDate);

  // ✅ 너무 오래 걸리면 최근 maxDays만 분석 (기본: 7일)
  const maxDays = options?.maxDays ?? 7;
  if (maxDays > 0 && dates.length > maxDays) {
    dates = dates.slice(-maxDays);
  }

  // 7일 미만이면 분석 불가(너희 UI 룰 유지)
  if (dates.length < 7) {
    return {
      items: [],
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      stars: [],
      cashCows: [],
      puzzles: [],
      dogs: [],
      noCostItems: [],
      analyzedDatesCount: dates.length,
      debugStats: {
        datesCount: dates.length,
        loadedCount: 0,
        categoriesCountTotal: 0,
        itemsCountTotal: 0,
        qtyPositiveItemsCount: 0,
        aggregatedIdsCount: 0,
      },
    };
  }

  // Debug counters
  const datesCount = dates.length;
  let loadedCount = 0;
  let categoriesCountTotal = 0;
  let itemsCountTotal = 0;
  let qtyPositiveItemsCount = 0;

  const aggregatedQuantities: { [id: string]: number } = {};

  for (const date of dates) {
    const dailyData = await loadDaily(date);
    if (!dailyData) continue;

    loadedCount++;
    if (!dailyData.categories) continue;

    categoriesCountTotal += dailyData.categories.length;

    dailyData.categories.forEach((cat) => {
      if (!cat.items) return;

      itemsCountTotal += cat.items.length;

      cat.items.forEach((item) => {
        if (isExcluded(item.name)) return;

        if (item.qty > 0) {
          qtyPositiveItemsCount++;
          aggregatedQuantities[item.id] = (aggregatedQuantities[item.id] || 0) + item.qty;
        }
      });
    });
  }

  const aggregatedIdsCount = Object.keys(aggregatedQuantities).length;

  // 모든 메뉴 마스터
  const allMenuItems: { [id: string]: MenuItem } = {};
  initialCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      allMenuItems[item.id] = item;
    });
  });

  // Calculate metrics for each item
  const menuEngineeringItems: MenuEngineeringItem[] = [];
  for (const itemId in aggregatedQuantities) {
    const item = allMenuItems[itemId];
    if (!item) continue;

    const qty_month = aggregatedQuantities[itemId];
    const revenue_month = (Number(item.price) || 0) * qty_month;

    const hasCost = item.unitCost !== undefined && item.unitCost !== null;
    const unitCost = hasCost ? Number(item.unitCost) : null;

    const cogs_month = unitCost !== null ? unitCost * qty_month : null;
    const cm = unitCost !== null ? Number(item.price) - unitCost : null;
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

  // ✅ thresholds (ReferenceError 안 나게 여기서 확정)
  const itemsWithQty = menuEngineeringItems
    .map((it) => Number(it.qty_month || 0))
    .filter((v) => Number.isFinite(v));

  const itemsWithCm = menuEngineeringItems
    .map((it) => (it.cm === null ? NaN : Number(it.cm)))
    .filter((v) => Number.isFinite(v));

  const popularityThreshold =
    itemsWithQty.length > 0 ? itemsWithQty.reduce((a, b) => a + b, 0) / itemsWithQty.length : 0;

  const profitabilityThreshold =
    itemsWithCm.length > 0 ? itemsWithCm.reduce((a, b) => a + b, 0) / itemsWithCm.length : 0;

  // Classify items
  const starsArr: MenuEngineeringItem[] = [];
  const cashCowsArr: MenuEngineeringItem[] = [];
  const puzzlesArr: MenuEngineeringItem[] = [];
  const dogsArr: MenuEngineeringItem[] = [];
  const noCostItemsArr: MenuEngineeringItem[] = [];

  menuEngineeringItems.forEach((item) => {
    // 원가 없는 건 별도
    if (item.unitCost === undefined || item.unitCost === null) {
      noCostItemsArr.push(item);
      return;
    }

    const qty = Number(item.qty_month || 0);
    const cm = Number(item.cm || 0);

    const isPopular = qty >= popularityThreshold;
    const isProfitable = cm >= profitabilityThreshold;

    item.popularity = isPopular ? "High" : "Low";
    item.profitability = isProfitable ? "High" : "Low";

    if (isPopular && isProfitable) {
      item.category = "Stars";
      starsArr.push(item);
    } else if (isPopular && !isProfitable) {
      item.category = "Cash Cows";
      cashCowsArr.push(item);
    } else if (!isPopular && isProfitable) {
      item.category = "Puzzles";
      puzzlesArr.push(item);
    } else {
      item.category = "Dogs";
      dogsArr.push(item);
    }
  });

  // ✅ 각 그룹 TOP3 정렬
  const starsTop3 = [...starsArr]
    .sort((a, b) => Number(b.revenue_month || 0) - Number(a.revenue_month || 0))
    .slice(0, 3);

  const cashCowsTop3 = [...cashCowsArr]
    .sort((a, b) => Number(b.qty_month || 0) - Number(a.qty_month || 0))
    .slice(0, 3);

  const puzzlesTop3 = [...puzzlesArr]
    .sort((a, b) => Number(b.cm || 0) - Number(a.cm || 0))
    .slice(0, 3);

  const dogsTop3 = [...dogsArr]
    .sort((a, b) => Number(a.revenue_month || 0) - Number(b.revenue_month || 0))
    .slice(0, 3);

  // ✅ 최소 3개 채우기(데이터 적어서 1개만 보이는 문제 방지)
  const ensureMinItems = (target: MenuEngineeringItem[], source: MenuEngineeringItem[], n = 3) => {
    if (target.length >= n) return target;

    const pool = source.filter((it) => !target.some((t) => t.id === it.id));
    const sorted = [...pool].sort(
      (a, b) => Number(b.revenue_month || 0) - Number(a.revenue_month || 0)
    );

    return [...target, ...sorted.slice(0, n - target.length)];
  };

  const starsFinal = ensureMinItems(starsTop3, menuEngineeringItems, 3);
  const cashCowsFinal = ensureMinItems(cashCowsTop3, menuEngineeringItems, 3);
  const puzzlesFinal = ensureMinItems(puzzlesTop3, menuEngineeringItems, 3);
  const dogsFinal = ensureMinItems(dogsTop3, menuEngineeringItems, 3);

  return {
    items: menuEngineeringItems,
    popularityThreshold,
    profitabilityThreshold,
    stars: starsFinal,
    cashCows: cashCowsFinal,
    puzzles: puzzlesFinal,
    dogs: dogsFinal,
    noCostItems: noCostItemsArr,
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
