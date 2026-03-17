import React, { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, subDays } from "date-fns";

import DataInput from "./DataInput";
import ReportDisplay from "./ReportDisplay";
import PeriodMenuAnalysisSection from "./PeriodMenuAnalysisSection";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";

import { getComparisonRange, type ComparisonMode } from "../utils2/periodComparison";
import { generateCoachingReport } from "../services/geminiService";
import { calculateMenuEngineeringForRange } from "../services/menuEngineeringService";
import { loadDailyRange, saveDailyData } from "../services/salesStorage";

import type {
  SalesReportData,
  CalculationResult,
  MenuEngineeringResult,
} from "../types";

interface Props {
  data: SalesReportData;
  setData: React.Dispatch<React.SetStateAction<SalesReportData>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  datesWithData: string[];
  onMonthChange: (month: Date) => Promise<void>;
  refreshMonthlyStats: (yearMonth: string) => Promise<void>;
  showToast: (msg: string) => void;
  onDelete: () => Promise<void>;
  storeId: number;
}

const DailySalesPage: React.FC<Props> = ({
  data,
  setData,
  setSelectedDate,
  datesWithData,
  onMonthChange,
  refreshMonthlyStats,
  showToast,
  onDelete,
  storeId,
}) => {

const MONTHLY_TARGET_PREFIX = "fb_coach_monthly_target_";
const getMonthKey = (dateStr: string) => dateStr.substring(0, 7);

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const saveMonthlyTarget = (yearMonth: string, value: number) => {
  if (typeof window === "undefined") return;
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return;
  localStorage.setItem(MONTHLY_TARGET_PREFIX + yearMonth, String(v));
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

const DailySalesPage: React.FC<Props> = ({
  data,
  setData,
  setSelectedDate,
  datesWithData,
  onMonthChange,
  refreshMonthlyStats,
  showToast,
  onDelete,
}) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [ocrApplied, setOcrApplied] = useState(false);
  const [dataSaved, setDataSaved] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [menuEngineeringResult, setMenuEngineeringResult] = useState<MenuEngineeringResult | null>(null);

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("WOW");
  const [comparisonRange, setComparisonRange] = useState<{ start: string; end: string } | null>(null);

  const [periodRange, setPeriodRange] = useState(() => {
    const today = new Date();
    const start = subDays(today, 7);

    return {
      start: formatLocalDate(start),
      end: formatLocalDate(today),
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

  const hasMeaningfulInput = (v: SalesReportData) => {
    const hasBase =
      Number(v.posSales || 0) > 0 ||
      Number(v.orders || 0) > 0 ||
      Number(v.visitCount || 0) > 0 ||
      String(v.note || "").trim().length > 0;

    const hasMenu = v.categories.some((cat) => cat.items.some((item) => Number(item.qty || 0) > 0));
    return hasBase || hasMenu;
  };

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

  useEffect(() => {
    setOcrApplied(false);
    setDataSaved(hasMeaningfulInput(data));
    setReportGenerated(false);
    setSaveStatus("");
    setLastSavedAt("");
    setReport("");
    setMenuEngineeringResult(null);
  }, [data.date]);

  useEffect(() => {
  if (!data.date) return;

  const month = new Date(data.date);

  if (onMonthChange) {
    onMonthChange(month);
  }
}, [data.date]);

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
      const rows = await loadDailyRange(comparisonRange.start, comparisonRange.end);

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
      const rows = await loadDailyRange(periodRange.start, periodRange.end);

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
  }, [comparisonRange?.start, comparisonRange?.end]);

  useEffect(() => {
    void loadCurrentPeriodData();
  }, [periodRange.start, periodRange.end]);

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
        loadDailyRange(periodRange.start, periodRange.end),
        comparisonRange?.start && comparisonRange?.end
          ? loadDailyRange(comparisonRange.start, comparisonRange.end)
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

   const handleDataChange = (newData: SalesReportData) => {
    const dateChanged = String(newData.date || "") !== String(data.date || "");

    if (dateChanged) {
      const nextDate = String(newData.date || "");

      const runDateChange = async () => {
        try {
          const currentData = data;

          const categoriesChanged =
            JSON.stringify(newData.categories) !== JSON.stringify(currentData.categories);

          const baseFieldsChanged =
            Number(newData.posSales || 0) !== Number(currentData.posSales || 0) ||
            Number(newData.deliverySales || 0) !== Number(currentData.deliverySales || 0) ||
            Number(newData.orders || 0) !== Number(currentData.orders || 0) ||
            Number(newData.visitCount || 0) !== Number(currentData.visitCount || 0) ||
            Number(newData.toppingQty || 0) !== Number(currentData.toppingQty || 0) ||
            String(newData.note || "") !== String(currentData.note || "") ||
            JSON.stringify(newData.categories) !== JSON.stringify(currentData.categories);

          const hasUnsavedCurrent =
            ocrApplied ||
            !dataSaved ||
            categoriesChanged ||
            baseFieldsChanged;

          if (hasUnsavedCurrent && hasMeaningfulInput(currentData)) {
            let calcSales = 0;
            currentData.categories.forEach((cat) => {
              cat.items.forEach((item) => {
                calcSales += Number(item.price || 0) * Number(item.qty || 0);
              });
            });

            const savePayload: any = {
              ...currentData,
              deliverySales: Number(currentData.deliverySales || 0),
              toppingQty: Number(currentData.toppingQty || 0),
              totalSales: Math.round(calcSales * 100) / 100,
            };

            const res = await saveDailyData(
              {
                date: currentData.date,
                ...savePayload,
              },
              storeId
            );

            if ((res as any)?.ok === false || (res as any)?.success === false) {
              throw new Error(
                (res as any)?.error?.message ||
                  (res as any)?.error ||
                  "AUTO_SAVE_FAILED"
              );
            }

            setLastSavedAt(new Date().toLocaleString());
            setSaveStatus("자동 저장 완료");
            setDataSaved(true);
          }

          setSelectedDate(nextDate);
          setData((prev) => ({
            ...prev,
            date: nextDate,
          }));
        } catch (error: any) {
          console.error("Auto save before date change failed:", error);
          setSaveStatus(`날짜 변경 전 자동 저장 실패: ${error?.message || "알 수 없는 오류"}`);
          showToast("날짜 변경 전 자동 저장에 실패했습니다.");
        }
      };

      void runDateChange();
      return;
    }

    const categoriesChanged =
      JSON.stringify(newData.categories) !== JSON.stringify(data.categories);

    const baseFieldsChanged =
      Number(newData.posSales || 0) !== Number(data.posSales || 0) ||
      Number(newData.deliverySales || 0) !== Number(data.deliverySales || 0) ||
      Number(newData.orders || 0) !== Number(data.orders || 0) ||
      Number(newData.visitCount || 0) !== Number(data.visitCount || 0) ||
      Number(newData.toppingQty || 0) !== Number(data.toppingQty || 0) ||
      String(newData.note || "") !== String(data.note || "");

    const monthlyTargetChanged =
      Number(newData.monthlyTarget || 0) !== Number(data.monthlyTarget || 0);

    setData(newData);

    if (monthlyTargetChanged) {
      const ym = getMonthKey(newData.date);
      saveMonthlyTarget(ym, Number(newData.monthlyTarget || 0));
    }

    if (categoriesChanged || baseFieldsChanged) {
      setOcrApplied(true);
      setDataSaved(false);
      setReportGenerated(false);
      setSaveStatus("");
    }
  };

  const handleSave = async (silent = false) => {
    try {
      if (!silent) setSaveStatus("데이터 저장 중...");

      let calcSales = 0;
      data.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          calcSales += Number(item.price || 0) * Number(item.qty || 0);
        });
      });

      const payload: any = {
        ...data,
        deliverySales: Number(data.deliverySales || 0),
        toppingQty: Number(data.toppingQty || 0),
        totalSales: Math.round(calcSales * 100) / 100,
      };

      const res = await saveDailyData(payload, storeId);

      if ((res as any)?.ok === false || (res as any)?.success === false) {
        throw new Error(
          (res as any)?.error?.message ||
            (res as any)?.error ||
            "SAVE_FAILED"
        );
      }

      setSaveStatus("저장 완료");
      setLastSavedAt(new Date().toLocaleString());
      setDataSaved(true);
      setReportGenerated(false);

      if (!silent) {
        showToast("매출 데이터가 저장되었습니다. 이제 코칭 리포트를 생성하세요.");
      }

      try {
        await refreshMonthlyStats(data.date.substring(0, 7));
        await loadCurrentPeriodData(true);
        await loadComparisonData(true);
      } catch (e) {
        console.warn("refreshMonthlyStats failed (ignored):", e);
      }

      return true;
    } catch (error: any) {
      console.error("Save Error:", error);
      setSaveStatus(`저장 중 오류: ${error?.message || "알 수 없는 오류"}`);
      if (!silent) showToast("저장 중 오류가 발생했습니다.");
      return false;
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const saved = await handleSave(true);
      if (!saved) return;

      const targetDate = data.date;
      const end = parseISO(targetDate);
      const start = subDays(end, 6);
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");

      const meResult = await calculateMenuEngineeringForRange(startDate, endDate, data.categories, { maxDays: 7 });
      setMenuEngineeringResult(meResult);

      const result = await generateCoachingReport(data, results, meResult);
      setReport(result);
      setReportGenerated(true);
      showToast("AI 코칭 리포트 생성 완료");
    } catch (error: any) {
      console.error("Process Error:", error);
    } finally {
      setLoading(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <>
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 md:px-8 md:py-4">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-base flex items-center gap-2">
            <i className="fa-solid fa-calendar-check text-indigo-500"></i>
            오늘의 성과 요약 ({data.date})
          </h3>
        </div>
        <div className="p-5 md:p-8 grid grid-cols-2 md:grid-cols-5 gap-5 md:gap-8">
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              오늘 매출
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900">${results.calcSales.toLocaleString()}</p>
          </div>
          <div className="space-y-1 md:border-l md:border-slate-100 md:pl-8">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              오늘 주문수
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900">{data.orders.toLocaleString()}건</p>
          </div>
          <div className="space-y-1 md:border-l md:border-slate-100 md:pl-8">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              오늘 방문객
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900">{data.visitCount.toLocaleString()}명</p>
          </div>
          <div className="space-y-1 md:border-l md:border-slate-100 md:pl-8">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              주문당 매출 (AOV)
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900">${results.aov.toFixed(2)}</p>
          </div>
          <div className="space-y-1 md:border-l md:border-slate-100 md:pl-8">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">POS 오차</p>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black text-slate-900">${results.gapUsd}</span>
              <span
                className={`text-xs md:text-sm font-bold ${
                  results.status === "🔴"
                    ? "text-rose-500"
                    : results.status === "🟡"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {results.status}
              </span>
            </div>
          </div>
        </div>
      </section>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4">
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">매출 코치 리포트</h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            분석을 통해 객단가와 전환율을 높이는 부스트 전략을 제안합니다.
          </p>
        </div>
      </header>

      <div className="relative">
        <DataInput
          data={data}
          onChange={handleDataChange}
          loading={loading}
          datesWithData={[...datesWithData]}
          onMonthChange={onMonthChange}
        />

        {saveStatus && (
          <div className="mt-4 text-center">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                saveStatus === "저장 완료" || saveStatus === "자동 저장 완료"
                  ? "bg-emerald-50 text-emerald-600"
                  : saveStatus.startsWith("저장 실패") ||
                    saveStatus.startsWith("저장 중 오류") ||
                    saveStatus.startsWith("날짜 변경 전 자동 저장 실패")
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {saveStatus}
            </span>
          </div>
        )}

        {lastSavedAt && (
          <div className="mt-2 text-center text-[10px] font-bold text-slate-400">마지막 저장: {lastSavedAt}</div>
        )}
      </div>

      <ReportDisplay
        report={report}
        loading={loading}
        menuEngineeringResult={null}
        sortedMenuEngineering={null}
        boostPlans={[]}
      />

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

      <div className="fixed bottom-4 md:bottom-6 left-0 right-0 z-[9999] px-4 md:px-6 pointer-events-none">
        <div className="max-w-6xl mx-auto pointer-events-auto">
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="bg-white text-rose-600 border-2 border-rose-200 px-3 py-3 md:px-6 md:py-4 rounded-2xl font-black text-sm md:text-lg shadow-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 ring-1 md:ring-2 ring-red-400"
            >
              <i className="fa-solid fa-trash-can text-sm md:text-base"></i>
              일 데이터 리셋
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className={`px-3 py-3 md:px-8 md:py-4 rounded-2xl font-black text-sm md:text-lg shadow-xl transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 border-2 ${
                ocrApplied && !dataSaved
                  ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300 hover:bg-indigo-700"
                  : "bg-white text-slate-900 border-slate-900 hover:bg-slate-50"
              }`}
            >
              <i className="fa-solid fa-floppy-disk text-sm md:text-base"></i>
              매출 데이터 저장
            </button>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading}
              className={`col-span-2 md:col-span-1 px-3 py-3 md:px-10 md:py-4 rounded-2xl font-black text-sm md:text-lg shadow-2xl transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 ${
                dataSaved && !reportGenerated
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-300 hover:bg-emerald-700"
                  : "bg-slate-900 text-white hover:bg-indigo-600 disabled:bg-slate-300"
              }`}
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin text-sm md:text-base"></i>
              ) : (
                <i className="fa-solid fa-wand-magic-sparkles text-sm md:text-base"></i>
              )}
              코칭 리포트 생성
            </button>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-slate-900 text-xl">일 데이터 리셋</h3>
            <p className="text-slate-700">해당일의 모든 데이터를 삭제 하겠습니까?</p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                취소
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowResetModal(false);
                  await onDelete();
                  setReport("");
                  setMenuEngineeringResult(null);
                  setOcrApplied(false);
                  setDataSaved(false);
                  setReportGenerated(false);
                  setSaveStatus("데이터 삭제됨");
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailySalesPage;
