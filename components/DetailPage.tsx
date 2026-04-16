import React, { useEffect, useMemo, useRef, useState } from "react";
import { subDays } from "date-fns";

import ReportDisplay from "./ReportDisplay";
import PeriodMenuAnalysisSection from "./PeriodMenuAnalysisSection";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";

import { generateCoachingReport } from "../services/geminiService";
import { getComparisonRange, type ComparisonMode } from "../utils2/periodComparison";
import { calculateMenuEngineeringForRange } from "../services/menuEngineeringService";
import { loadDailyRange } from "../services/salesStorage";

import type {
  SalesReportData,
  CalculationResult,
  MenuEngineeringResult,
} from "../types";

type Props = {
  selectedDate: string;
  data: SalesReportData;
  showToast: (msg: string) => void;
  storeId: number;
};

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const calcChangeRate = (current: number, previous: number) => {
  if (!Number.isFinite(previous) || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const getInclusiveDayCountFromStrings = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const aggregateMenusFromRows = (rows: any[]): PeriodMenuRow[] => {
  const map = new Map<string, PeriodMenuRow>();

  rows.forEach((row: any) => {
    const categories = Array.isArray(row?.categories) ? row.categories : [];

    categories.forEach((cat: any) => {
      const items = Array.isArray(cat?.items) ? cat.items : [];

      items.forEach((it: any) => {
        const name = String(it?.name || "").trim();
        const qty = Number(it?.qty || 0);
        const price = Number(it?.price || 0);

        if (!name || qty <= 0) return;

        if (!map.has(name)) {
          map.set(name, { name, qty: 0, sales: 0 });
        }

        const prev = map.get(name)!;
        prev.qty += qty;
        prev.sales += qty * price;
      });
    });
  });

  return Array.from(map.values());
};

const SOFT_DRINKS = [
  "콜라 330ml",
  "스프라이트 330ml",
  "소다 330ml",
  "밀키스 250ml",
  "쿨피스 250ml",
  "봉봉 238ml",
  "쌕쌕 238ml",
];

const roundTo0_5 = (num: number): number => Math.round(num * 2) / 2;

const DetailPage: React.FC<Props> = ({ selectedDate, data, showToast, storeId }) => {
  useEffect(() => {
  console.log("BRAND:", data.brand);
  console.log("COUNTRY:", data.country);
}, [data.brand, data.country]);
  const [report, setReport] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [menuEngineeringResult, setMenuEngineeringResult] = useState<MenuEngineeringResult | null>(null);

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("WOW");
  const [comparisonRange, setComparisonRange] = useState<{ start: string; end: string } | null>(null);

  const [periodRange, setPeriodRange] = useState(() => {
    const end = new Date(selectedDate);
    const start = subDays(end, 7);

    return {
      start: formatLocalDate(start),
      end: selectedDate,
    };
  });

  const [currentPeriodStats, setCurrentPeriodStats] = useState<any>(null);
  const [comparisonStats, setComparisonStats] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodStats, setPeriodStats] = useState<any>(null);

  const currentRangeRequestRef = useRef("");
  const comparisonRangeRequestRef = useRef("");
  const periodStatsRequestRef = useRef("");

  const makeRangeKey = (start: string, end: string) => `${start}__${end}`;

  useEffect(() => {
    const end = new Date(selectedDate);
    const start = subDays(end, 7);

    setPeriodRange({
      start: formatLocalDate(start),
      end: selectedDate,
    });

    setReport("");
    setReportDate("");
  }, [selectedDate]);

  useEffect(() => {
    if (!periodRange.start || !periodRange.end) return;

    if (comparisonMode === "MANUAL") {
      setComparisonRange((prev) => {
        if (prev?.start && prev?.end) return prev;
        return getComparisonRange(periodRange, "MANUAL");
      });
      return;
    }

    setComparisonRange(getComparisonRange(periodRange, comparisonMode));
  }, [periodRange.start, periodRange.end, comparisonMode]);

  const results = useMemo((): CalculationResult => {
    const deliverySales = Number(data.deliverySales || 0);
    const totalSales = Number(data.posSales || 0) + deliverySales;

    let menuSales = 0;
    let addonSum = 0;

    data.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        menuSales += item.price * (item.qty || 0);
        if (cat.name.includes("토핑")) addonSum += item.qty || 0;
      });
    });

    const gapUsd = data.posSales - menuSales;
    const gapRate = data.posSales > 0 ? (gapUsd / data.posSales) * 100 : 0;
    const absGapRate = Math.abs(gapRate);

    let status: "✅" | "🟡" | "🔴" = "✅";
    if (absGapRate > 3) status = "🔴";
    else if (absGapRate > 1) status = "🟡";

    return {
      calcSales: Math.round(totalSales * 100) / 100,
      gapUsd: Math.round(gapUsd * 100) / 100,
      gapRate: Math.round(gapRate * 100) / 100,
      status,
      aov: data.orders > 0 ? Math.round((totalSales / data.orders) * 100) / 100 : 0,
      conversionRate: data.visitCount > 0 ? Math.round((data.orders / data.visitCount) * 1000) / 10 : 0,
      addonPerOrder: data.orders > 0 ? Math.round((addonSum / data.orders) * 10) / 10 : 0,
    };
  }, [data]);

  const hasMeaningfulData = useMemo(() => {
    const hasBase =
      Number(data.posSales || 0) > 0 ||
      Number(data.deliverySales || 0) > 0 ||
      Number(data.orders || 0) > 0 ||
      Number(data.visitCount || 0) > 0 ||
      String(data.note || "").trim().length > 0;

    const hasMenu = data.categories.some((cat) =>
      cat.items.some((item) => Number(item.qty || 0) > 0)
    );

    return hasBase || hasMenu;
  }, [data]);

  const handleGenerateReport = async () => {
    if (!hasMeaningfulData) {
      showToast("해당 날짜에 생성할 매출 데이터가 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const coachOnlyMenuEngineering = null;
      const result = await generateCoachingReport(data, results, coachOnlyMenuEngineering);
      setReport(result);
      setReportDate(selectedDate);
      showToast("코칭 리포트 생성 완료");
    } catch (error) {
      console.error("DetailPage generate report error:", error);
      showToast("코칭 리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriodKPI = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      return {
        sales: 0,
        orders: 0,
        visitors: 0,
        aov: 0,
      };
    }

    const sales = rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row?.posSales ??
            row?.sales ??
            row?.total_sales ??
            row?.totalSales ??
            0
        ),
      0
    );

    const orders = rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row?.orders ??
            row?.orderCount ??
            0
        ),
      0
    );

    const visitors = rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row?.visitCount ??
            row?.visitors ??
            row?.guests ??
            row?.guestCount ??
            0
        ),
      0
    );

    return {
      sales,
      orders,
      visitors,
      aov: orders > 0 ? sales / orders : 0,
    };
  };

  const loadComparisonData = async (force = false) => {
    if (!comparisonRange?.start || !comparisonRange?.end) return;

    const requestKey = makeRangeKey(comparisonRange.start, comparisonRange.end);

    if (!force && comparisonRangeRequestRef.current === requestKey) {
      return;
    }

    comparisonRangeRequestRef.current = requestKey;

    try {
      const rows = await loadDailyRange(comparisonRange.start, comparisonRange.end, storeId);

      if (comparisonRangeRequestRef.current !== requestKey) return;

      const kpi = calculatePeriodKPI(rows);

      setComparisonStats({
        ...kpi,
        rows: rows.length,
        rawRows: rows,
      });
    } catch (error) {
      if (comparisonRangeRequestRef.current !== requestKey) return;

      console.error("loadComparisonData error:", error);
      setComparisonStats({
        sales: 0,
        orders: 0,
        visitors: 0,
        aov: 0,
        rows: 0,
        rawRows: [],
      });
    }
  };

  const loadCurrentPeriodData = async (force = false) => {
    if (!periodRange.start || !periodRange.end) return;

    const requestKey = makeRangeKey(periodRange.start, periodRange.end);

    if (!force && currentRangeRequestRef.current === requestKey) {
      return;
    }

    currentRangeRequestRef.current = requestKey;

    try {
      const rows = await loadDailyRange(periodRange.start, periodRange.end, storeId);

      if (currentRangeRequestRef.current !== requestKey) return;

      const kpi = calculatePeriodKPI(rows);

      setCurrentPeriodStats({
        ...kpi,
        rows: rows.length,
        rawRows: rows,
      });
    } catch (error) {
      if (currentRangeRequestRef.current !== requestKey) return;

      console.error("loadCurrentPeriodData error:", error);
      setCurrentPeriodStats({
        sales: 0,
        orders: 0,
        visitors: 0,
        aov: 0,
        rows: 0,
        rawRows: [],
      });
    }
  };

  useEffect(() => {
    void loadComparisonData();
  }, [comparisonRange?.start, comparisonRange?.end, storeId]);

  useEffect(() => {
    void loadCurrentPeriodData();
  }, [periodRange.start, periodRange.end, storeId]);

  const fetchPeriodStats = async (force = false) => {
    if (!periodRange.start || !periodRange.end) return;

    const comparisonKey =
      comparisonRange?.start && comparisonRange?.end
        ? makeRangeKey(comparisonRange.start, comparisonRange.end)
        : "no_comparison";

    const requestKey = `${makeRangeKey(periodRange.start, periodRange.end)}__${comparisonKey}`;

    if (!force && periodStatsRequestRef.current === requestKey) {
      return;
    }

    periodStatsRequestRef.current = requestKey;

    setPeriodLoading(true);
    setPeriodStats(null);

    try {
      const [currentRows, comparisonRows] = await Promise.all([
        loadDailyRange(periodRange.start, periodRange.end, storeId),
        comparisonRange?.start && comparisonRange?.end
          ? loadDailyRange(comparisonRange.start, comparisonRange.end, storeId)
          : Promise.resolve([]),
      ]);

      if (periodStatsRequestRef.current !== requestKey) return;

      const currentList = currentRows.map((row: any) => ({
        date: row.date,
        total_sales: Number(row.sales || 0),
        orders: Number(row.orders || 0),
        guests: Number(row.visitors || 0),
        categories: Array.isArray(row.categories) ? row.categories : [],
      }));

      const comparisonList = comparisonRows.map((row: any) => ({
        date: row.date,
        total_sales: Number(row.sales || 0),
        orders: Number(row.orders || 0),
        guests: Number(row.visitors || 0),
        categories: Array.isArray(row.categories) ? row.categories : [],
      }));

      if (currentList.length > 0) {
        const totalSales = currentList.reduce((acc, curr) => acc + Number(curr.total_sales || 0), 0);
        const totalOrders = currentList.reduce((acc, curr) => acc + Number(curr.orders || 0), 0);
        const totalVisitors = currentList.reduce((acc, curr) => acc + Number(curr.guests || 0), 0);

        setPeriodStats({
          totalSales,
          totalOrders,
          totalVisitors,
          list: currentList.sort((a, b) => a.date.localeCompare(b.date)),
          comparisonList: comparisonList.sort((a, b) => a.date.localeCompare(b.date)),
        });
      } else {
        setPeriodStats({
          totalSales: 0,
          totalOrders: 0,
          totalVisitors: 0,
          list: [],
          comparisonList: [],
        });
      }
    } catch (e) {
      if (periodStatsRequestRef.current !== requestKey) return;

      console.error("fetchPeriodStats error:", e);
      setPeriodStats({
        totalSales: 0,
        totalOrders: 0,
        totalVisitors: 0,
        list: [],
        comparisonList: [],
      });
    } finally {
      if (periodStatsRequestRef.current === requestKey) {
        setPeriodLoading(false);
      }
    }
  };

  const selectedPeriodDays = useMemo(() => {
    if (!periodRange.start || !periodRange.end) return 0;
    return getInclusiveDayCountFromStrings(periodRange.start, periodRange.end);
  }, [periodRange.start, periodRange.end]);

  const canRunPeriodAnalysis = selectedPeriodDays >= 7;

  const salesChangeRate = useMemo(
    () => calcChangeRate(Number(currentPeriodStats?.sales || 0), Number(comparisonStats?.sales || 0)),
    [currentPeriodStats?.sales, comparisonStats?.sales]
  );

  const ordersChangeRate = useMemo(
    () => calcChangeRate(Number(currentPeriodStats?.orders || 0), Number(comparisonStats?.orders || 0)),
    [currentPeriodStats?.orders, comparisonStats?.orders]
  );

  const visitorsChangeRate = useMemo(
    () => calcChangeRate(Number(currentPeriodStats?.visitors || 0), Number(comparisonStats?.visitors || 0)),
    [currentPeriodStats?.visitors, comparisonStats?.visitors]
  );

  const aovChangeRate = useMemo(
    () => calcChangeRate(Number(currentPeriodStats?.aov || 0), Number(comparisonStats?.aov || 0)),
    [currentPeriodStats?.aov, comparisonStats?.aov]
  );

  const currentPeriodMenus = useMemo(() => {
    const list = periodStats?.list || [];
    return aggregateMenusFromRows(list);
  }, [periodStats]);

  const comparisonPeriodMenus = useMemo(() => {
    const list = periodStats?.comparisonList || [];
    return aggregateMenusFromRows(list);
  }, [periodStats]);

  const currentPeriodDays = Number(currentPeriodStats?.rows || 0);
  const comparisonPeriodDays = Number(comparisonStats?.rows || 0);

  const sortedMenuEngineering = useMemo(() => {
    if (!menuEngineeringResult) return null;

    const totalRevenueForRange =
      menuEngineeringResult.items?.reduce((sum: number, it: any) => sum + (Number(it.revenue_month) || 0), 0) || 0;

    const formatItem = (item: any, totalRevenueForRange2: number) => {
      const unitCost = item.unitCost !== null ? item.unitCost.toFixed(2) : "N/A";
      const costRate =
        item.price > 0 && item.unitCost !== null ? ((item.unitCost / item.price) * 100).toFixed(1) : "N/A";
      const gp_month =
        item.revenue_month !== null && item.cogs_month !== null
          ? (item.revenue_month - item.cogs_month).toFixed(2)
          : "N/A";
      const revenueText = item.revenue_month !== null ? item.revenue_month.toFixed(2) : "N/A";

      let revenueContribution = "N/A";
      if (item.revenue_month !== null && totalRevenueForRange2 > 0) {
        revenueContribution = ((item.revenue_month / totalRevenueForRange2) * 100).toFixed(1);
      }

      return `${item.name} — 원가 $${unitCost} (${costRate}%) / 판매 ${item.qty_month} / 매출 $${revenueText} / 이익 $${gp_month} / 매출 기여도 ${revenueContribution}%`;
    };

    const safeNum = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

    const starsTop3 = [...menuEngineeringResult.stars]
      .sort((a, b) => safeNum(b.revenue_month) - safeNum(a.revenue_month))
      .slice(0, 3)
      .map((item) => formatItem(item, totalRevenueForRange));

    const cashCowsTop3 = [...menuEngineeringResult.cashCows]
      .sort((a, b) => safeNum(b.qty_month) - safeNum(a.qty_month))
      .slice(0, 3)
      .map((item) => formatItem(item, totalRevenueForRange));

    const puzzlesTop3 = [...menuEngineeringResult.puzzles]
      .sort((a, b) => safeNum(b.cm) - safeNum(a.cm) || safeNum(b.revenue_month) - safeNum(a.revenue_month))
      .slice(0, 3)
      .map((item) => formatItem(item, totalRevenueForRange));

    const dogsTop3 = [...menuEngineeringResult.dogs]
      .sort((a, b) => safeNum(a.revenue_month) - safeNum(b.revenue_month))
      .slice(0, 3)
      .map((item) => formatItem(item, totalRevenueForRange));

    const noCostItemsList = menuEngineeringResult.noCostItems.map((item) => item.name).join(", ");

    return {
      starsTop3,
      cashCowsTop3,
      puzzlesTop3,
      dogsTop3,
      noCostItemsList,
      popularityThreshold: menuEngineeringResult.popularityThreshold.toFixed(1),
      profitabilityThreshold: menuEngineeringResult.profitabilityThreshold.toFixed(2),
    };
  }, [menuEngineeringResult]);

  const boostPlans = useMemo(() => {
    if (!menuEngineeringResult || !sortedMenuEngineering) return [];

    const allMenuItemsFlat = data.categories.flatMap((cat) => cat.items);

    const isFriedDish = (itemName: string) => {
      const friedKeywords = ["탕수육", "깐풍기", "유린기", "치킨", "튀김"];
      return friedKeywords.some((keyword) => itemName.includes(keyword));
    };

    const calculateDailyTargetAndReason = (
      itemQty: number,
      analyzedDays: number,
      type: "MENU_BOARD" | "STAFF_UPSELL" | "SET_DISCOUNT"
    ) => {
      const qty = Math.max(0, Number(itemQty) || 0);
      const days = Math.max(1, Number(analyzedDays) || 1);
      const avgDaily = qty / days;

      const growth = type === "SET_DISCOUNT" ? 0.3 : type === "MENU_BOARD" ? 0.1 : 0.15;

      let target = Math.ceil(avgDaily * (1 + growth));
      const cap = Math.min(8, Math.max(2, Math.ceil(avgDaily * 2)));
      target = Math.max(1, Math.min(target, cap));

      if (type === "SET_DISCOUNT" && avgDaily > 0) target = Math.max(2, target);

      return {
        dailyTargetQty: target,
        dailyTargetReason: `최근 ${days}일 평균 ${avgDaily.toFixed(1)}개/일 → +${Math.round(
          growth * 100
        )}% 목표 ${target}개 (상한 ${cap}개)`,
      };
    };

    const getSecondItemForSetDiscount = (mainItem: any) => {
      const availableSoftDrinks = allMenuItemsFlat.filter(
        (item) => SOFT_DRINKS.includes(item.name) && item.id !== mainItem.id && item.unitCost != null
      );
      if (availableSoftDrinks.length > 0) {
        return availableSoftDrinks[Math.floor(Math.random() * availableSoftDrinks.length)];
      }

      const compatibleItems = allMenuItemsFlat
        .filter((item) => {
          if (item.id === mainItem.id || item.unitCost == null) return false;
          if (isFriedDish(mainItem.name) && item.name.includes("토핑")) return false;
          if (item.name.includes("해물육교자")) return true;
          return item.price < 10;
        })
        .sort((a, b) => a.price - b.price);

      return compatibleItems.length > 0 ? compatibleItems[0] : null;
    };

    const targetablePuzzles = menuEngineeringResult.puzzles
      .filter((item) => item.unitCost != null)
      .sort(
        (a, b) =>
          (b.cm as number) - (a.cm as number) || (b.revenue_month as number) - (a.revenue_month as number)
      );

    const targetableStars = menuEngineeringResult.stars
      .filter((item) => item.unitCost != null)
      .sort((a, b) => (b.revenue_month as number) - (a.revenue_month as number));

    const targetableCashCows = menuEngineeringResult.cashCows
      .filter((item) => item.unitCost != null)
      .sort((a, b) => (b.qty_month as number) - (a.qty_month as number));

    const analyzedDatesCount =
      menuEngineeringResult.analyzedDatesCount > 0 ? menuEngineeringResult.analyzedDatesCount : 1;

    const plans: any[] = [];
    const usedItemIds = new Set<string>();
    const getUnusedTargetItem = (list: any[]) => list.find((item) => !usedItemIds.has(item.id));

    let menuBoardTarget = getUnusedTargetItem(targetableStars) || getUnusedTargetItem(targetableCashCows);
    if (menuBoardTarget) {
      usedItemIds.add(menuBoardTarget.id);
      const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(
        menuBoardTarget.qty_month || 0,
        analyzedDatesCount,
        "MENU_BOARD"
      );
      plans.push({
        puzzleItemName: menuBoardTarget.name,
        setName: `${menuBoardTarget.name} 대표 추천 메뉴`,
        setComposition: `메뉴판 상단 배치, POP 부착, 카운터 추천 멘트`,
        discount: "NO DISCOUNT",
        dailyTargetQty,
        staffComment: `메뉴판 1번 위치, 카운터에서 ${menuBoardTarget.name} 적극 추천!`,
        type: "MENU_BOARD",
        reason: `판매량이 높고 인기가 많은 메뉴입니다. 대표 메뉴 노출 강화. ${dailyTargetReason}`,
      });
    }

    let staffUpsellTarget = getUnusedTargetItem(targetableStars) || getUnusedTargetItem(targetableCashCows);
    if (staffUpsellTarget) {
      usedItemIds.add(staffUpsellTarget.id);
      const randomSoftDrink = SOFT_DRINKS[Math.floor(Math.random() * SOFT_DRINKS.length)];
      const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(
        staffUpsellTarget.qty_month || 0,
        analyzedDatesCount,
        "STAFF_UPSELL"
      );
      plans.push({
        puzzleItemName: staffUpsellTarget.name,
        setName: `${staffUpsellTarget.name} 주문 시`,
        setComposition: `${staffUpsellTarget.name} (혜택) + ${randomSoftDrink} 1개 무료`,
        discount: "FREE DRINK",
        dailyTargetQty,
        staffComment: `손님께 ${staffUpsellTarget.name} 추천 시 ${randomSoftDrink} 무료 제공 안내.`,
        type: "STAFF_UPSELL",
        reason: `판매량 높은 메뉴에 무료 음료 제공으로 객단가↑/만족도↑. ${dailyTargetReason}`,
      });
    }

    const setDiscountTarget = getUnusedTargetItem(targetablePuzzles);
    if (setDiscountTarget) {
      const secondItem = getSecondItemForSetDiscount(setDiscountTarget);
      if (secondItem) {
        const setPrice = Number(setDiscountTarget.price || 0) + Number(secondItem.price || 0);
        const setUnitCost = Number(setDiscountTarget.unitCost || 0) + Number((secondItem as any).unitCost || 0);

        if (setPrice > 0 && setUnitCost >= 0) {
          const gp = (setPrice - setUnitCost) / setPrice;
          const minGPAfter = 0.35;
          const maxDiscountByMargin = Math.max(0, Math.floor(((gp - minGPAfter) * 100) / 5) * 5);

          const popularity = Number(setDiscountTarget.qty_month || 0);
          let base = 15;
          if (popularity <= 3) base = 25;
          else if (popularity <= 7) base = 20;
          else if (popularity <= 12) base = 15;
          else base = 10;

          let discountPercentage = Math.min(base, 25, maxDiscountByMargin);
          discountPercentage = Math.max(0, Math.min(25, discountPercentage));
          if (discountPercentage < 10) discountPercentage = 0;

          const finalDiscountAmount =
            discountPercentage > 0 ? roundTo0_5(setPrice * (discountPercentage / 100)) : 0;

          if (finalDiscountAmount > 0) {
            const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(
              setDiscountTarget.qty_month || 0,
              analyzedDatesCount,
              "SET_DISCOUNT"
            );

            plans.push({
              puzzleItemName: setDiscountTarget.name,
              setName: `${setDiscountTarget.name} + ${secondItem.name} 할인 세트`,
              setComposition: `${setDiscountTarget.name} + ${secondItem.name}`,
              discount: `${discountPercentage}% OFF`,
              dailyTargetQty,
              staffComment: `세트 할인: ${setDiscountTarget.name} + ${secondItem.name} ${discountPercentage}% 적용 (할인 후 GP ${Math.round(
                minGPAfter * 100
              )}%+ 유지).`,
              type: "SET_DISCOUNT",
              reason: `마진(GP) + 판매량(인기도) 기반으로 ${discountPercentage}% 산정. 현재 GP ${(gp * 100).toFixed(
                1
              )}% → 할인 후 GP ${Math.round(minGPAfter * 100)}% 이상 유지. ${dailyTargetReason}`,
            });
          }
        }
      }
    }

    return plans.slice(0, 3);
  }, [menuEngineeringResult, sortedMenuEngineering, data.categories]);

  const isShowingCurrentDateReport = reportDate === selectedDate && !!report;

  return (
    <div className="space-y-5 text-slate-900">
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
    Detail
  </div>

  <h2 className="mt-1 text-[14px] font-bold text-slate-900">
    매출 분석 & 코칭
  </h2>

  <p className="mt-1 text-[12px] font-medium text-slate-500">
    리포트 · 기간 분석 · 메뉴 성과 기반 인사이트
  </p>
</section>

     <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        AI Report
      </div>
      <div className="mt-1 text-[14px] font-bold text-slate-900">
        코칭 리포트
      </div>
    </div>

    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="text-[10px] font-bold leading-tight text-slate-400 sm:text-right">
        <div>기준일: {selectedDate}</div>
        {isShowingCurrentDateReport && <div>현재 날짜 리포트 표시중</div>}
      </div>

      <button
        type="button"
        onClick={handleGenerateReport}
        disabled={loading}
        className="inline-flex h-7 items-center justify-center rounded-lg bg-slate-900 px-2 text-[10px] font-bold text-white transition-all hover:bg-indigo-600 disabled:bg-slate-300 sm:h-9 sm:rounded-xl sm:px-4 sm:text-sm"
      >
        {loading ? "코칭 리포트 생성 중..." : "코칭 리포트 생성"}
      </button>
    </div>
  </div>

  <div className="mt-3">
    {isShowingCurrentDateReport ? (
      <ReportDisplay
        report={report}
        loading={false}
        menuEngineeringResult={null}
        sortedMenuEngineering={null}
        boostPlans={[]}
      />
    ) : (
      <div className="rounded-xl bg-slate-50 p-3 text-[12px] font-medium leading-snug text-slate-500 sm:rounded-2xl sm:p-5 sm:text-sm">
        아직 이 날짜의 코칭 리포트가 생성되지 않았습니다. 코칭 리포트 생성 버튼을 눌러 바로 확인하세요.
      </div>
    )}
  </div>
</section>

     <PeriodMenuAnalysisSection
  periodRange={periodRange}
  setPeriodRange={setPeriodRange}
  comparisonMode={comparisonMode}
  setComparisonMode={setComparisonMode}
  comparisonRange={comparisonRange}
  setComparisonRange={setComparisonRange}
  canRunPeriodAnalysis={canRunPeriodAnalysis}
  currentPeriodStats={currentPeriodStats}
  comparisonStats={comparisonStats}
  salesChangeRate={salesChangeRate}
  ordersChangeRate={ordersChangeRate}
  visitorsChangeRate={visitorsChangeRate}
  aovChangeRate={aovChangeRate}
  periodLoading={periodLoading}
  selectedPeriodDays={selectedPeriodDays}
  loadCurrentPeriodData={loadCurrentPeriodData}
  loadComparisonData={loadComparisonData}
  fetchPeriodStats={fetchPeriodStats}
  calculateMenuEngineeringForRange={calculateMenuEngineeringForRange}
  setMenuEngineeringResult={setMenuEngineeringResult}
  data={data}
  currentPeriodMenus={currentPeriodMenus}
  comparisonPeriodMenus={comparisonPeriodMenus}
  currentPeriodDays={currentPeriodDays}
  comparisonPeriodDays={comparisonPeriodDays}
  sortedMenuEngineering={sortedMenuEngineering}
  boostPlans={boostPlans}
  periodStats={periodStats}
  showToast={showToast}
/>
      </div>
  );
};

export default DetailPage;
