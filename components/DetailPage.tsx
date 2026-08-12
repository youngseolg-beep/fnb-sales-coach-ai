import React, { useEffect, useMemo, useRef, useState } from "react";
import { subDays } from "date-fns";

import ReportDisplay from "./ReportDisplay";
import PeriodMenuAnalysisSection from "./PeriodMenuAnalysisSection";
import CoachV4Page from "./CoachV4Page";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";

import { generateCoachingReport } from "../services/geminiService";
import { getComparisonRange, type ComparisonMode } from "../utils2/periodComparison";
import { calculateMenuEngineeringForRange } from "../services/menuEngineeringService";
import { generateAiMenuEngineering, type AiMenuEngineeringResult } from "../services/menuEngineeringAiService";
import { generateAiBoostPlan, type AiBoostPlan } from "../services/boostPlanAiService";
import { loadDailyRange } from "../services/salesStorage";
import { getCoachDemoRows, isCoachDemoFixtureEnabled, type CoachDemoDailyRow } from "../services/coachDemoData";
import { getCurrencyByCountry } from "../utils2/currency";
import { loadCoachReport, saveCoachReport } from "../services/coachReportStorage";

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
  userEmail?: string;
  homeLandingTarget: "coach:insight" | "coach:report" | null;
  onHomeLandingHandled: () => void;
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

const DetailPage: React.FC<Props> = ({ selectedDate, data, showToast, storeId, userEmail, homeLandingTarget, onHomeLandingHandled }) => {
  useEffect(() => {
    console.log("BRAND:", data.brand);
    console.log("COUNTRY:", data.country);
  }, [data.brand, data.country]);
  
  const [report, setReport] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [reportScopeKey, setReportScopeKey] = useState("");
  const [reportError, setReportError] = useState("");
  const [persistedOperatingStatus, setPersistedOperatingStatus] = useState<"generating" | "completed" | "failed" | null>(null);
  const [loading, setLoading] = useState(false);
  const insightSectionRef = useRef<HTMLElement>(null);
  const reportActionRef = useRef<HTMLButtonElement>(null);

  const [menuEngineeringResult, setMenuEngineeringResult] = useState<MenuEngineeringResult | null>(null);
  const [menuEngineeringResultScopeKey, setMenuEngineeringResultScopeKey] = useState("");
  const [menuEngineeringAiResult, setMenuEngineeringAiResult] = useState<AiMenuEngineeringResult | null>(null);
  const [menuEngineeringAiScopeKey, setMenuEngineeringAiScopeKey] = useState("");
  const [menuEngineeringAiLoading, setMenuEngineeringAiLoading] = useState(false);
  const [menuEngineeringAiError, setMenuEngineeringAiError] = useState("");
  const [menuEngineeringAiStatus, setMenuEngineeringAiStatus] = useState<"generating" | "completed" | "failed" | null>(null);
  const [boostPlanAiResult, setBoostPlanAiResult] = useState<AiBoostPlan | null>(null);
  const [boostPlanAiScopeKey, setBoostPlanAiScopeKey] = useState("");
  const [boostPlanAiLoading, setBoostPlanAiLoading] = useState(false);
  const [boostPlanAiError, setBoostPlanAiError] = useState("");
  const [boostPlanAiStatus, setBoostPlanAiStatus] = useState<"generating" | "completed" | "failed" | null>(null);

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("WOW");
  const [comparisonRange, setComparisonRange] = useState<{ start: string; end: string } | null>(null);
  const [v4Period, setV4Period] = useState<"today" | "week" | "month" | "custom">("today");

  const [periodRange, setPeriodRange] = useState(() => ({ start: selectedDate, end: selectedDate }));

  const [currentPeriodStats, setCurrentPeriodStats] = useState<any>(null);
  const [comparisonStats, setComparisonStats] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodStats, setPeriodStats] = useState<any>(null);

  const currentRangeRequestRef = useRef("");
  const comparisonRangeRequestRef = useRef("");
  const periodStatsRequestRef = useRef("");

  const makeRangeKey = (start: string, end: string) => `${start}__${end}`;
  const reportScope = (reportType: "operating_coaching" | "menu_engineering" | "boost_plan") => ({
    storeId, reportType, periodStart: periodRange.start, periodEnd: periodRange.end,
  });

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const saved = await loadCoachReport(reportScope("operating_coaching"));
        if (!active) return;
        if (saved?.status === "completed" && typeof saved.result === "string") {
          setReport(saved.result);
          setReportDate(periodRange.end);
          setReportScopeKey(`${storeId}:${periodRange.start}:${periodRange.end}`);
        } else {
          setReport("");
          setReportDate("");
          setReportScopeKey("");
        }
        setReportError(saved?.status === "failed" ? String(saved.errorMessage || "AI 코칭 리포트를 생성하지 못했습니다.") : "");
        setPersistedOperatingStatus(saved?.status || null);
      } catch (error) { console.error("Coach report restore error:", error); }
    };
    void restore();
    return () => { active = false; };
  }, [storeId, periodRange.start, periodRange.end]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const saved = await loadCoachReport(reportScope("menu_engineering"));
        if (!active) return;
        if (saved?.status === "completed" && saved.result) {
          setMenuEngineeringAiResult(saved.result as AiMenuEngineeringResult);
          setMenuEngineeringAiScopeKey(`${storeId}:${periodRange.start}:${periodRange.end}`);
        } else {
          setMenuEngineeringAiResult(null);
          setMenuEngineeringAiScopeKey("");
        }
        setMenuEngineeringAiError(saved?.status === "failed" ? String(saved.errorMessage || "AI 메뉴 분석을 생성하지 못했습니다.") : "");
        setMenuEngineeringAiStatus(saved?.status || null);
      } catch (error) { console.error("Menu report restore error:", error); }
    };
    void restore();
    return () => { active = false; };
  }, [storeId, periodRange.start, periodRange.end]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const saved = await loadCoachReport(reportScope("boost_plan"));
        if (!active) return;
        if (saved?.status === "completed" && saved.result) {
          setBoostPlanAiResult(saved.result as AiBoostPlan);
          setBoostPlanAiScopeKey(`${storeId}:${periodRange.start}:${periodRange.end}`);
        } else {
          setBoostPlanAiResult(null);
          setBoostPlanAiScopeKey("");
        }
        setBoostPlanAiError(saved?.status === "failed" ? String(saved.errorMessage || "AI 부스트 플랜을 생성하지 못했습니다.") : "");
        setBoostPlanAiStatus(saved?.status || null);
      } catch (error) { console.error("Boost report restore error:", error); }
    };
    void restore();
    return () => { active = false; };
  }, [storeId, periodRange.start, periodRange.end]);

  const loadCoachRange = async (start: string, end: string): Promise<{ rows: any[]; usingDemo: boolean }> => {
    if (isCoachDemoFixtureEnabled(userEmail)) {
      return { rows: getCoachDemoRows(start, end, data.categories), usingDemo: true };
    }
    const savedRows = await loadDailyRange(start, end, storeId);
    return { rows: savedRows, usingDemo: false };
  };

  useEffect(() => {
    if (v4Period === "custom") return;

    const end = new Date(selectedDate);
    if (v4Period === "today") setPeriodRange({ start: selectedDate, end: selectedDate });
    else if (v4Period === "week") setPeriodRange({ start: formatLocalDate(subDays(end, 6)), end: selectedDate });
    else setPeriodRange({ start: formatLocalDate(new Date(end.getFullYear(), end.getMonth(), 1)), end: selectedDate });

    setReport("");
    setReportDate("");
    setReportScopeKey("");
    setReportError("");
  }, [selectedDate, v4Period]);

  useEffect(() => {
    if (!periodRange.start || !periodRange.end) return;

    if (comparisonMode === "MANUAL") {
      setComparisonRange(getComparisonRange(periodRange, "MANUAL"));
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
    const currentSales = Number(currentPeriodStats?.sales || 0);
    const currentOrders = Number(currentPeriodStats?.orders || 0);
    const currentVisitors = Number(currentPeriodStats?.visitors || 0);
    const currentAov = currentOrders > 0 ? currentSales / currentOrders : 0;
    const currentConversion = currentVisitors > 0 ? (currentOrders / currentVisitors) * 100 : 0;
    const comparisonSales = Number(comparisonStats?.sales || 0);
    const comparisonOrders = Number(comparisonStats?.orders || 0);
    const comparisonVisitors = Number(comparisonStats?.visitors || 0);
    const comparisonAov = comparisonOrders > 0 ? comparisonSales / comparisonOrders : 0;
    const comparisonConversion = comparisonVisitors > 0 ? (comparisonOrders / comparisonVisitors) * 100 : 0;
    const hasPeriodData = Number(currentPeriodStats?.rows || 0) > 0 && (currentSales > 0 || currentOrders > 0 || currentVisitors > 0);

    if (!hasPeriodData && !hasMeaningfulData) {
      showToast("해당 날짜에 생성할 매출 데이터가 없습니다.");
      return;
    }

    setLoading(true);
    setReportError("");
    setPersistedOperatingStatus("generating");
    void saveCoachReport({ ...reportScope("operating_coaching"), periodPreset: v4Period, status: "generating", result: null });
    try {
      const reportData: SalesReportData = {
        ...data,
        date: periodRange.end,
        posSales: hasPeriodData ? currentSales : data.posSales,
        deliverySales: 0,
        orders: hasPeriodData ? currentOrders : data.orders,
        visitCount: hasPeriodData ? currentVisitors : data.visitCount,
      };
      const reportResults: CalculationResult = {
        ...results,
        calcSales: hasPeriodData ? currentSales : results.calcSales,
        aov: hasPeriodData ? currentAov : results.aov,
        conversionRate: hasPeriodData ? currentConversion : results.conversionRate,
      };
      const topMenus = aggregateMenusFromRows(currentPeriodStats?.rawRows || []).map((item) => ({
        ...item,
        price: item.qty > 0 ? item.sales / item.qty : undefined,
      }));
      const result = await generateCoachingReport(reportData, reportResults, menuEngineeringResult, {
        throwOnError: true,
        context: {
          storeId,
          periodType: v4Period,
          periodRange,
          comparisonRange,
          current: { sales: currentSales, orders: currentOrders, visitors: currentVisitors, aov: currentAov, conversion: currentConversion },
          comparison: comparisonRange ? { sales: comparisonSales, orders: comparisonOrders, visitors: comparisonVisitors, aov: comparisonAov, conversion: comparisonConversion } : null,
          changes: {
            sales: calcChangeRate(currentSales, comparisonSales),
            orders: calcChangeRate(currentOrders, comparisonOrders),
            visitors: calcChangeRate(currentVisitors, comparisonVisitors),
            aov: calcChangeRate(currentAov, comparisonAov),
            conversion: calcChangeRate(currentConversion, comparisonConversion),
          },
          topMenus,
        },
      });
      setReport(result);
      setReportDate(periodRange.end);
      setReportScopeKey(`${storeId}:${periodRange.start}:${periodRange.end}`);
      setPersistedOperatingStatus("completed");
      void saveCoachReport({
        ...reportScope("operating_coaching"), periodPreset: v4Period, status: "completed", result,
        inputSnapshot: { current: { sales: currentSales, orders: currentOrders, visitors: currentVisitors }, comparison: comparisonRange },
      });
      showToast("코칭 리포트 생성 완료");
    } catch (error) {
      console.error("DetailPage generate report error:", error);
      setReportError("AI 코칭 리포트를 생성하지 못했습니다.");
      setPersistedOperatingStatus("failed");
      void saveCoachReport({ ...reportScope("operating_coaching"), periodPreset: v4Period, status: "failed", result: null, errorMessage: String((error as Error)?.message || error) });
      showToast("코칭 리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriodKPI = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      return { sales: 0, orders: 0, visitors: 0, aov: 0 };
    }

    const sales = rows.reduce((sum, row) => sum + Number(row?.posSales ?? row?.sales ?? row?.total_sales ?? row?.totalSales ?? 0), 0);
    const orders = rows.reduce((sum, row) => sum + Number(row?.orders ?? row?.orderCount ?? 0), 0);
    const visitors = rows.reduce((sum, row) => sum + Number(row?.visitCount ?? row?.visitors ?? row?.guests ?? row?.guestCount ?? 0), 0);

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
    if (!force && comparisonRangeRequestRef.current === requestKey) return;
    comparisonRangeRequestRef.current = requestKey;

    try {
      const { rows } = await loadCoachRange(comparisonRange.start, comparisonRange.end);
      if (comparisonRangeRequestRef.current !== requestKey) return;
      const kpi = calculatePeriodKPI(rows);
      setComparisonStats({ ...kpi, rows: rows.length, rawRows: rows });
    } catch (error) {
      if (comparisonRangeRequestRef.current !== requestKey) return;
      console.error("loadComparisonData error:", error);
      setComparisonStats({ sales: 0, orders: 0, visitors: 0, aov: 0, rows: 0, rawRows: [] });
    }
  };

  const loadCurrentPeriodData = async (force = false) => {
    if (!periodRange.start || !periodRange.end) return;

    const requestKey = makeRangeKey(periodRange.start, periodRange.end);
    if (!force && currentRangeRequestRef.current === requestKey) return;
    currentRangeRequestRef.current = requestKey;

    try {
      const { rows } = await loadCoachRange(periodRange.start, periodRange.end);
      if (currentRangeRequestRef.current !== requestKey) return;
      const kpi = calculatePeriodKPI(rows);
      setCurrentPeriodStats({ ...kpi, rows: rows.length, rawRows: rows });
    } catch (error) {
      if (currentRangeRequestRef.current !== requestKey) return;
      console.error("loadCurrentPeriodData error:", error);
      setCurrentPeriodStats({ sales: 0, orders: 0, visitors: 0, aov: 0, rows: 0, rawRows: [] });
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

    const comparisonKey = comparisonRange?.start && comparisonRange?.end
        ? makeRangeKey(comparisonRange.start, comparisonRange.end)
        : "no_comparison";

    const requestKey = `${makeRangeKey(periodRange.start, periodRange.end)}__${comparisonKey}`;

    if (!force && periodStatsRequestRef.current === requestKey) return;
    periodStatsRequestRef.current = requestKey;

    setPeriodLoading(true);
    setPeriodStats(null);

    try {
      const [currentResult, comparisonResult] = await Promise.all([
        loadCoachRange(periodRange.start, periodRange.end),
        comparisonRange?.start && comparisonRange?.end
          ? loadCoachRange(comparisonRange.start, comparisonRange.end)
          : Promise.resolve({ rows: [], usingDemo: false }),
      ]);
      const currentRows = currentResult.rows;
      const comparisonRows = comparisonResult.rows;

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
        setPeriodStats({ totalSales: 0, totalOrders: 0, totalVisitors: 0, list: [], comparisonList: [] });
      }
    } catch (e) {
      if (periodStatsRequestRef.current !== requestKey) return;
      console.error("fetchPeriodStats error:", e);
      setPeriodStats({ totalSales: 0, totalOrders: 0, totalVisitors: 0, list: [], comparisonList: [] });
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

  useEffect(() => {
    void fetchPeriodStats();
  }, [periodRange.start, periodRange.end, comparisonRange?.start, comparisonRange?.end, storeId]);

  const salesChangeRate = useMemo(() => calcChangeRate(Number(currentPeriodStats?.sales || 0), Number(comparisonStats?.sales || 0)), [currentPeriodStats?.sales, comparisonStats?.sales]);
  const ordersChangeRate = useMemo(() => calcChangeRate(Number(currentPeriodStats?.orders || 0), Number(comparisonStats?.orders || 0)), [currentPeriodStats?.orders, comparisonStats?.orders]);
  const visitorsChangeRate = useMemo(() => calcChangeRate(Number(currentPeriodStats?.visitors || 0), Number(comparisonStats?.visitors || 0)), [currentPeriodStats?.visitors, comparisonStats?.visitors]);
  const aovChangeRate = useMemo(() => calcChangeRate(Number(currentPeriodStats?.aov || 0), Number(comparisonStats?.aov || 0)), [currentPeriodStats?.aov, comparisonStats?.aov]);

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
        dailyTargetReason: `최근 ${days}일 평균 ${avgDaily.toFixed(1)}개/일 → +${Math.round(growth * 100)}% 목표 ${target}개 (상한 ${cap}개)`,
      };
    };

    const getSecondItemForSetDiscount = (mainItem: any) => {
      const availableSoftDrinks = allMenuItemsFlat.filter((item) => SOFT_DRINKS.includes(item.name) && item.id !== mainItem.id && item.unitCost != null);
      if (availableSoftDrinks.length > 0) return availableSoftDrinks[0];

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
      .sort((a, b) => (b.cm as number) - (a.cm as number) || (b.revenue_month as number) - (a.revenue_month as number));

    const targetableStars = menuEngineeringResult.stars
      .filter((item) => item.unitCost != null)
      .sort((a, b) => (b.revenue_month as number) - (a.revenue_month as number));

    const targetableCashCows = menuEngineeringResult.cashCows
      .filter((item) => item.unitCost != null)
      .sort((a, b) => (b.qty_month as number) - (a.qty_month as number));

    const analyzedDatesCount = menuEngineeringResult.analyzedDatesCount > 0 ? menuEngineeringResult.analyzedDatesCount : 1;

    const plans: any[] = [];
    const usedItemIds = new Set<string>();
    const getUnusedTargetItem = (list: any[]) => list.find((item) => !usedItemIds.has(item.id));

    let menuBoardTarget = getUnusedTargetItem(targetableStars) || getUnusedTargetItem(targetableCashCows);
    if (menuBoardTarget) {
      usedItemIds.add(menuBoardTarget.id);
      const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(menuBoardTarget.qty_month || 0, analyzedDatesCount, "MENU_BOARD");
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
      const randomSoftDrink = SOFT_DRINKS[0];
      const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(staffUpsellTarget.qty_month || 0, analyzedDatesCount, "STAFF_UPSELL");
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

          const finalDiscountAmount = discountPercentage > 0 ? roundTo0_5(setPrice * (discountPercentage / 100)) : 0;

          if (finalDiscountAmount > 0) {
            const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(setDiscountTarget.qty_month || 0, analyzedDatesCount, "SET_DISCOUNT");
            plans.push({
              puzzleItemName: setDiscountTarget.name,
              setName: `${setDiscountTarget.name} + ${secondItem.name} 할인 세트`,
              setComposition: `${setDiscountTarget.name} + ${secondItem.name}`,
              discount: `${discountPercentage}% OFF`,
              dailyTargetQty,
              staffComment: `세트 할인: ${setDiscountTarget.name} + ${secondItem.name} ${discountPercentage}% 적용.`,
              type: "SET_DISCOUNT",
              reason: `마진(GP) + 판매량(인기도) 기반으로 ${discountPercentage}% 산정. 현재 GP ${(gp * 100).toFixed(1)}% → 할인 후 GP ${Math.round(minGPAfter * 100)}% 이상 유지. ${dailyTargetReason}`,
            });
          }
        }
      }
    }

    return plans.slice(0, 3);
  }, [menuEngineeringResult, sortedMenuEngineering, data.categories]);

  const loadDeterministicMenuEngineering = async () => {
    const demoRows: CoachDemoDailyRow[] = isCoachDemoFixtureEnabled(userEmail)
      ? getCoachDemoRows(periodRange.start, periodRange.end, data.categories)
      : [];
    const result = await calculateMenuEngineeringForRange(periodRange.start, periodRange.end, data.categories, {
      maxDays: 60,
      storeId,
      demoRows,
    });
    setMenuEngineeringResult(result);
    setMenuEngineeringResultScopeKey(`${storeId}:${periodRange.start}:${periodRange.end}`);
    return result;
  };

  useEffect(() => {
    let active = true;
    setMenuEngineeringResult(null);
    setMenuEngineeringResultScopeKey("");
    const loadEngineering = async () => {
      const result = await loadDeterministicMenuEngineering();
      if (active) setMenuEngineeringResult(result);
    };
    void loadEngineering();
    return () => { active = false; };
  }, [periodRange.start, periodRange.end, data.categories, storeId, userEmail]);

  const boostPlanScopeKey = `${storeId}:${periodRange.start}:${periodRange.end}`;
  const isCurrentBoostPlanAiResult = boostPlanAiScopeKey === boostPlanScopeKey && !!boostPlanAiResult;
  const deterministicMenuEngineeringScopeKey = `${storeId}:${periodRange.start}:${periodRange.end}`;

  const handleGenerateAiBoostPlan = async () => {
    if (boostPlanAiLoading) return;

    const deterministicMenuEngineering = menuEngineeringResult?.items.length && menuEngineeringResultScopeKey === deterministicMenuEngineeringScopeKey
      ? menuEngineeringResult
      : await loadDeterministicMenuEngineering();
    if (!deterministicMenuEngineering?.items.length) {
      setBoostPlanAiError("선택한 기간에 부스트 플랜을 만들 메뉴 성과 데이터가 없습니다.");
      setBoostPlanAiStatus("failed");
      return;
    }
    const deterministicCandidates = menuEngineeringResult === deterministicMenuEngineering && boostPlans.length > 0
      ? boostPlans
      : deterministicMenuEngineering.items
        .filter((item) => item.unitCost !== null)
        .sort((a, b) => Number(b.revenue_month || 0) - Number(a.revenue_month || 0))
        .slice(0, 3)
        .map((item) => ({
          puzzleItemName: item.name,
          setName: `${item.name} 실행 우선 후보`,
          type: item.category,
          dailyTargetQty: Math.max(1, Math.ceil(Number(item.qty_month || 0) / Math.max(1, deterministicMenuEngineering.analyzedDatesCount))),
          reason: `분류 ${item.category} · 단위 마진 ${Number(item.cm || 0).toFixed(2)}`,
          guardrail: "저장된 판매가와 원가 데이터 범위에서만 실행합니다.",
        }));

    const currentSales = Number(currentPeriodStats?.sales || 0);
    const currentOrders = Number(currentPeriodStats?.orders || 0);
    const currentVisitors = Number(currentPeriodStats?.visitors || 0);
    const currentAov = currentOrders > 0 ? currentSales / currentOrders : 0;
    const currentConversion = currentVisitors > 0 ? (currentOrders / currentVisitors) * 100 : 0;
    const comparisonSales = Number(comparisonStats?.sales || 0);
    const comparisonOrders = Number(comparisonStats?.orders || 0);
    const comparisonVisitors = Number(comparisonStats?.visitors || 0);
    const comparisonAov = comparisonOrders > 0 ? comparisonSales / comparisonOrders : 0;
    const comparisonConversion = comparisonVisitors > 0 ? (comparisonOrders / comparisonVisitors) * 100 : 0;
    const classificationMap: Record<string, "STAR" | "CASH_COW" | "PUZZLE" | "DOG"> = {
      Stars: "STAR", "Cash Cows": "CASH_COW", Puzzles: "PUZZLE", Dogs: "DOG",
    };

    setBoostPlanAiLoading(true);
    setBoostPlanAiError("");
    setBoostPlanAiStatus("generating");
    void saveCoachReport({ ...reportScope("boost_plan"), periodPreset: v4Period, status: "generating", result: null });
    try {
      const result = await generateAiBoostPlan({
        store: { storeId, brand: data.brand, country: data.country, currency: getCurrencyByCountry(data.country || "") },
        period: { current: periodRange, comparison: comparisonRange },
        performance: {
          totalSales: currentSales,
          salesDelta: calcChangeRate(currentSales, comparisonSales),
          orders: currentOrders,
          ordersDelta: calcChangeRate(currentOrders, comparisonOrders),
          visitors: currentVisitors,
          visitorsDelta: calcChangeRate(currentVisitors, comparisonVisitors),
          averageTicket: currentAov,
          aovDelta: calcChangeRate(currentAov, comparisonAov),
          conversion: currentConversion,
          conversionDelta: calcChangeRate(currentConversion, comparisonConversion),
          monthlyTarget: Number(data.monthlyTarget || 0) > 0 ? Number(data.monthlyTarget) : null,
          targetGap: Number(data.monthlyTarget || 0) > 0 ? Math.max(0, Number(data.monthlyTarget) - Number(data.mtdSales || 0)) : null,
        },
        menuEngineering: {
          popularityThreshold: Number(deterministicMenuEngineering.popularityThreshold || 0),
          profitabilityThreshold: Number(deterministicMenuEngineering.profitabilityThreshold || 0),
          analyzedDayCount: Number(deterministicMenuEngineering.analyzedDatesCount || 0),
          menus: deterministicMenuEngineering.items.map((item) => ({
            id: item.id, name: item.name, classification: classificationMap[item.category],
            quantity: item.qty_month, price: item.price, unitCost: item.unitCost ?? null,
            revenue: item.revenue_month, contributionMargin: item.cm ?? null,
          })),
        },
        aiMenuEngineering: isCurrentMenuEngineeringAiResult ? menuEngineeringAiResult : null,
        deterministicCandidates,
      });
      setBoostPlanAiResult(result);
      setBoostPlanAiScopeKey(boostPlanScopeKey);
      setBoostPlanAiStatus("completed");
      void saveCoachReport({ ...reportScope("boost_plan"), periodPreset: v4Period, status: "completed", result });
    } catch (error) {
      console.error("DetailPage AI Boost Plan error:", error);
      setBoostPlanAiStatus("failed");
      setBoostPlanAiError("AI 부스트 플랜을 생성하지 못했습니다.");
      void saveCoachReport({ ...reportScope("boost_plan"), periodPreset: v4Period, status: "failed", result: null, errorMessage: String((error as Error)?.message || error) });
    } finally {
      setBoostPlanAiLoading(false);
    }
  };

  const isShowingCurrentDateReport = reportDate === selectedDate && !!report;

  useEffect(() => {
    if (!homeLandingTarget) return;
    const target = homeLandingTarget === "coach:insight" ? insightSectionRef.current : reportActionRef.current;
    if (!target) return;

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      onHomeLandingHandled();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [homeLandingTarget, onHomeLandingHandled]);

  const handleV4PeriodChange = (period: "today" | "week" | "month" | "custom") => {
    setV4Period(period);
    if (period === "today") {
      setComparisonMode("MANUAL");
      return;
    }

    if (period === "week") {
      setComparisonMode("WOW");
      return;
    }

    if (period === "custom") {
      setComparisonMode("MANUAL");
      return;
    }

    setComparisonMode("MOM");
  };

  const handleCustomRangeChange = (next: { start: string; end: string }) => {
    setV4Period("custom");
    setComparisonMode("MANUAL");
    setPeriodRange(next);
  };

  const menuEngineeringScopeKey = `${storeId}:${periodRange.start}:${periodRange.end}`;
  const isCurrentMenuEngineeringAiResult =
    menuEngineeringAiScopeKey === menuEngineeringScopeKey && !!menuEngineeringAiResult;

  const handleGenerateMenuEngineeringAi = async () => {
    if (menuEngineeringAiLoading) return;

    const deterministicMenuEngineering = menuEngineeringResult?.items.length && menuEngineeringResultScopeKey === deterministicMenuEngineeringScopeKey
      ? menuEngineeringResult
      : await loadDeterministicMenuEngineering();
    if (!deterministicMenuEngineering?.items.length) {
      setMenuEngineeringAiError("선택한 기간에 AI 메뉴 분석을 만들 메뉴 성과 데이터가 없습니다.");
      setMenuEngineeringAiStatus("failed");
      return;
    }

    setMenuEngineeringAiLoading(true);
    setMenuEngineeringAiError("");
    setMenuEngineeringAiStatus("generating");
    void saveCoachReport({ ...reportScope("menu_engineering"), periodPreset: v4Period, status: "generating", result: null });
    try {
      const classificationMap: Record<string, "STAR" | "CASH_COW" | "PUZZLE" | "DOG"> = {
        Stars: "STAR",
        "Cash Cows": "CASH_COW",
        Puzzles: "PUZZLE",
        Dogs: "DOG",
      };
      const result = await generateAiMenuEngineering({
        store: {
          storeId,
          brand: data.brand,
          country: data.country,
          currency: getCurrencyByCountry(data.country || ""),
        },
        period: periodRange,
        overall: {
          totalSales: Number(currentPeriodStats?.sales || 0),
          orders: Number(currentPeriodStats?.orders || 0),
          visitors: Number(currentPeriodStats?.visitors || 0),
          averageTicket: Number(currentPeriodStats?.aov || 0),
        },
        summary: {
          popularityThreshold: Number(deterministicMenuEngineering.popularityThreshold || 0),
          profitabilityThreshold: Number(deterministicMenuEngineering.profitabilityThreshold || 0),
          analyzedDayCount: Number(deterministicMenuEngineering.analyzedDatesCount || 0),
        },
        menus: deterministicMenuEngineering.items.map((item) => ({
          id: item.id,
          name: item.name,
          classification: classificationMap[item.category],
          quantity: Number(item.qty_month || 0),
          price: Number(item.price || 0),
          unitCost: item.unitCost ?? null,
          revenue: Number(item.revenue_month || 0),
          contributionMargin: item.cm ?? null,
          popularity: item.popularity,
          profitability: item.profitability,
        })),
      });
      setMenuEngineeringAiResult(result);
      setMenuEngineeringAiScopeKey(menuEngineeringScopeKey);
      setMenuEngineeringAiStatus("completed");
      void saveCoachReport({ ...reportScope("menu_engineering"), periodPreset: v4Period, status: "completed", result });
    } catch (error) {
      console.error("DetailPage Menu Engineering AI error:", error);
      setMenuEngineeringAiStatus("failed");
      setMenuEngineeringAiError("AI 메뉴 분석을 생성하지 못했습니다.");
      void saveCoachReport({ ...reportScope("menu_engineering"), periodPreset: v4Period, status: "failed", result: null, errorMessage: String((error as Error)?.message || error) });
    } finally {
      setMenuEngineeringAiLoading(false);
    }
  };

  const canGenerateV4Report =
    (Number(currentPeriodStats?.rows || 0) > 0 && (
      Number(currentPeriodStats?.sales || 0) > 0 ||
      Number(currentPeriodStats?.orders || 0) > 0 ||
      Number(currentPeriodStats?.visitors || 0) > 0
    )) || hasMeaningfulData;

  return (
    <CoachV4Page
      data={data}
      storeId={storeId}
      selectedDate={selectedDate}
      loading={loading}
      reportStatus={persistedOperatingStatus}
      report={report}
      reportScopeKey={reportScopeKey}
      reportError={reportError}
      salesChangeRate={salesChangeRate}
      ordersChangeRate={ordersChangeRate}
      visitorsChangeRate={visitorsChangeRate}
      aovChangeRate={aovChangeRate}
      starCount={menuEngineeringResult?.stars.length || 0}
      activePeriod={v4Period}
      periodRange={periodRange}
      comparisonRange={comparisonRange}
      periodStats={currentPeriodStats ? { sales: Number(currentPeriodStats.sales || 0), orders: Number(currentPeriodStats.orders || 0), visitors: Number(currentPeriodStats.visitors || 0) } : null}
      canGenerateReport={canGenerateV4Report}
      onGenerateReport={handleGenerateReport}
      insightRef={insightSectionRef}
      reportActionRef={reportActionRef}
      currentPeriodMenus={currentPeriodMenus}
      comparisonPeriodMenus={comparisonPeriodMenus}
      trendRows={periodStats?.list || []}
      onCustomRangeChange={handleCustomRangeChange}
      engineeringContent={
        menuEngineeringResult ? (
          <div className="space-y-2">
            {selectedPeriodDays < 7 && <p className="rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-700">분석 기간이 짧아 메뉴 성과 판단의 정확도가 낮을 수 있습니다.</p>}
            {[
              ["Stars", menuEngineeringResult.stars],
              ["Cash Cows", menuEngineeringResult.cashCows],
              ["Puzzles", menuEngineeringResult.puzzles],
              ["Dogs", menuEngineeringResult.dogs],
            ].map(([name, items]) => (
              <div key={String(name)} className="rounded-lg border border-[#eee8e3] p-3">
                <div className="text-xs font-bold text-[#624634]">{name} ({(items as any[]).length})</div>
                <div className="mt-1 text-[11px] text-[#746a63]">
                  {(items as any[]).slice(0, 3).map((item) => item.name).join(", ") || "데이터 없음"}
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-[#e5ddff] bg-[#fbfaff] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#57458e]">AI 메뉴 전략</div>
                  <div className="mt-1 text-[10px] text-[#746a63]">분류 결과를 기반으로 실행 우선순위를 제안합니다.</div>
                </div>
                {!menuEngineeringAiLoading && menuEngineeringAiStatus !== "generating" && (
                  <button type="button" onClick={() => void handleGenerateMenuEngineeringAi()} className="shrink-0 rounded-lg bg-[#7456e5] px-3 py-2 text-[11px] font-semibold text-white">
                    {isCurrentMenuEngineeringAiResult ? "다시 분석" : "AI 메뉴 분석하기"}
                  </button>
                )}
              </div>
              {(menuEngineeringAiLoading || menuEngineeringAiStatus === "generating") && <p className="mt-3 text-[11px] font-medium text-[#62587c]">AI 메뉴 분석이 진행 중입니다.</p>}
              {menuEngineeringAiError && !menuEngineeringAiLoading && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#f1d7d7] bg-white p-2.5"><p className="text-[11px] font-medium text-[#9f3f3f]">{menuEngineeringAiError}</p><button type="button" onClick={() => void handleGenerateMenuEngineeringAi()} className="shrink-0 text-[11px] font-semibold text-[#7b4e38]">다시 시도</button></div>}
              {isCurrentMenuEngineeringAiResult && menuEngineeringAiResult && <div className="mt-3 space-y-3"><p className="text-[12px] font-semibold leading-5 text-[#302a38]">{menuEngineeringAiResult.summary}</p><div className="space-y-2">{menuEngineeringAiResult.priorities.map((priority) => <div key={`${priority.menuId}-${priority.priority}`} className="rounded-lg border border-[#ece7f7] bg-white p-2.5"><div className="flex items-center justify-between gap-2"><b className="text-[11px] text-[#3b3146]">{priority.menuName}</b><span className="rounded-full bg-[#f0ecff] px-2 py-0.5 text-[9px] font-semibold text-[#6250bd]">{priority.priority}</span></div><p className="mt-1 text-[10px] leading-4 text-[#665d6d]">{priority.diagnosis}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-[#57458e]">{priority.recommendedAction}</p></div>)}</div><div className="grid grid-cols-2 gap-2 text-[10px] leading-4 text-[#665d6d]"><p><b className="text-[#57458e]">Stars:</b> {menuEngineeringAiResult.categoryStrategies.stars}</p><p><b className="text-[#57458e]">Cash Cows:</b> {menuEngineeringAiResult.categoryStrategies.cashCows}</p><p><b className="text-[#57458e]">Puzzles:</b> {menuEngineeringAiResult.categoryStrategies.puzzles}</p><p><b className="text-[#57458e]">Dogs:</b> {menuEngineeringAiResult.categoryStrategies.dogs}</p></div></div>}
            </div>
          </div>
        ) : <p className="py-3 text-center text-xs text-slate-500">선택한 기간의 메뉴 성과 데이터를 불러오는 중입니다.</p>
      }
      boostContent={
        boostPlans.length ? (
          <div className="space-y-2">
            {boostPlans.map((plan: any, index: number) => <div key={`${plan.puzzleItemName}-${index}`} className="rounded-lg border border-[#eee8e3] p-3"><div className="text-xs font-bold text-[#624634]">{plan.setName}</div><p className="mt-1 text-[11px] leading-4 text-[#746a63]">{plan.reason}</p></div>)}
            <div className="rounded-lg border border-[#f1dfd5] bg-[#fffaf7] p-3">
              <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold text-[#8b4d32]">AI 부스트 플랜</div><p className="mt-1 text-[10px] text-[#746a63]">기존 후보와 마진 가드레일 안에서 실행 우선순위를 만듭니다.</p></div>{!boostPlanAiLoading && boostPlanAiStatus !== "generating" && <button type="button" onClick={() => void handleGenerateAiBoostPlan()} className="shrink-0 rounded-lg bg-[#8b5e3c] px-3 py-2 text-[11px] font-semibold text-white">{isCurrentBoostPlanAiResult ? "다시 분석" : "AI 부스트 플랜 만들기"}</button>}</div>
              {(boostPlanAiLoading || boostPlanAiStatus === "generating") && <p className="mt-3 text-[11px] font-medium text-[#76503c]">AI 부스트 플랜이 진행 중입니다.</p>}
              {boostPlanAiError && !boostPlanAiLoading && <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#f1d7d7] bg-white p-2.5"><p className="text-[11px] font-medium text-[#9f3f3f]">{boostPlanAiError}</p><button type="button" onClick={() => void handleGenerateAiBoostPlan()} className="shrink-0 text-[11px] font-semibold text-[#7b4e38]">다시 시도</button></div>}
              {isCurrentBoostPlanAiResult && boostPlanAiResult && <div className="mt-3 space-y-3"><p className="text-[12px] font-semibold leading-5 text-[#3a2c25]">{boostPlanAiResult.summary}</p><div className="rounded-lg bg-white p-2.5"><p className="text-[10px] font-semibold text-[#8b4d32]">{boostPlanAiResult.target.objective}</p><p className="mt-1 text-[10px] text-[#746a63]">{boostPlanAiResult.target.timeHorizon}{boostPlanAiResult.target.targetGrowthPercent !== null ? ` · 목표 ${boostPlanAiResult.target.targetGrowthPercent}%` : ""}</p></div>{boostPlanAiResult.actions.map((action) => <div key={action.priority} className="rounded-lg border border-[#f0e5de] bg-white p-2.5"><div className="flex items-center justify-between gap-2"><b className="text-[11px] text-[#3a2c25]">{action.priority}. {action.title}</b><span className="text-[9px] text-[#8b5e3c]">{action.timing}</span></div><p className="mt-1 text-[10px] font-medium text-[#76503c]">{action.targetMenuNames.join(", ")}</p><p className="mt-1 text-[10px] leading-4 text-[#665d58]">{action.rationale}</p><ul className="mt-2 list-disc space-y-0.5 pl-4 text-[10px] leading-4 text-[#665d58]">{action.executionSteps.slice(0, 2).map((step) => <li key={step}>{step}</li>)}</ul><p className="mt-2 text-[10px] text-[#76503c]">예상 효과: {action.expectedEffect}</p></div>)}<div className="text-[10px] leading-4 text-[#665d58]">{boostPlanAiResult.watchouts.slice(0, 2).map((item) => <p key={item}>주의: {item}</p>)}{boostPlanAiResult.successMetrics.slice(0, 2).map((item) => <p key={item}>지표: {item}</p>)}</div></div>}
            </div>
          </div>
        ) : <div className="rounded-lg border border-[#f1dfd5] bg-[#fffaf7] p-3 text-center"><p className="text-xs text-[#746a63]">선택한 기간의 메뉴 성과를 바탕으로 실행안을 만듭니다.</p>{boostPlanAiStatus === "generating" ? <p className="mt-2 text-[11px] font-medium text-[#76503c]">AI 부스트 플랜이 진행 중입니다.</p> : <button type="button" onClick={() => void handleGenerateAiBoostPlan()} className="mt-3 rounded-lg bg-[#8b5e3c] px-3 py-2 text-[11px] font-semibold text-white">AI 부스트 플랜 만들기</button>}</div>
      }
      onPeriodChange={handleV4PeriodChange}
    />
  );

  return (
    <div className="mx-auto max-w-[760px] space-y-5 pb-28 text-[#1f1f1f]">
      {/* 1. 프리미엄 페이지 타이틀 섹션 */}
      <section ref={insightSectionRef} className="flex flex-col gap-4 rounded-[20px] border border-[#e8e1db] bg-white px-5 py-5 shadow-[0_6px_18px_rgba(70,54,42,0.04)] md:flex-row md:items-center md:justify-between md:px-8 md:py-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#e7ddff] bg-[linear-gradient(135deg,#f1eeff_0%,#e2dcff_100%)] shadow-sm">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7c6cf6]">
              Insight Detail
            </div>
            <h2 className="mt-1 text-[22px] font-bold tracking-[-0.04em] text-[#1f1f1f] md:text-[26px]">
              매출 분석 & AI 코칭
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              오늘의 리포트와 기간별 성과를 심층 분석합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 2. AI 코칭 리포트 패널 (비서 느낌의 UI) */}
      <section id="coach-report" className="relative overflow-hidden rounded-[20px] border border-[#e5def7] bg-white shadow-[0_8px_22px_rgba(70,54,42,0.055)]">
        {/* 패널 헤더 */}
        <div className="border-b border-[#eee8fa] bg-[linear-gradient(110deg,#fbfaff_0%,#f4f1ff_100%)] px-5 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#7c6cf6] text-white shadow-[0_5px_12px_rgba(124,108,246,0.24)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {/* 반짝이는 점 */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border border-white"></span>
                </span>
              </span>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500">
                  AI Report
                </div>
                <div className="text-[16px] font-extrabold text-slate-900 md:text-[18px]">
                  AI 운영 코칭 리포트
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm border border-slate-100 text-[11px] font-bold text-slate-500">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                기준일: <span className="text-slate-900">{selectedDate}</span>
              </div>

              <button
                ref={reportActionRef}
                type="button"
                onClick={handleGenerateReport}
                disabled={loading}
                className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#7c6cf6] px-6 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(124,108,246,0.22)] transition hover:bg-[#6958db] disabled:bg-[#ccc6ec] sm:w-auto"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>데이터 분석 및 리포트 작성 중...</span>
                  </>
                ) : (
                  <>
                    <span>코칭 리포트 생성하기</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 패널 본문 (리포트 또는 Empty State) */}
        <div className="p-5 md:p-8">
          {loading ? (
            /* 스켈레톤 로딩 애니메이션 */
            <div className="animate-pulse space-y-6 py-4">
              <div className="h-4 w-1/4 rounded-full bg-slate-200"></div>
              <div className="space-y-3">
                <div className="h-3 w-3/4 rounded-full bg-slate-100"></div>
                <div className="h-3 w-5/6 rounded-full bg-slate-100"></div>
                <div className="h-3 w-2/3 rounded-full bg-slate-100"></div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-4 w-1/3 rounded-full bg-slate-200"></div>
                <div className="h-24 w-full rounded-xl bg-slate-50"></div>
              </div>
            </div>
          ) : isShowingCurrentDateReport ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ReportDisplay
                report={report}
                loading={false}
                menuEngineeringResult={null}
                sortedMenuEngineering={null}
                boostPlans={[]}
              />
            </div>
          ) : (
            /* 매력적인 Empty State */
            <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#ddd5f6] bg-[#fbfaff] py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 md:text-[18px]">AI 코치가 데이터를 분석할 준비가 되었습니다</h3>
              <p className="mt-2 max-w-sm text-[13px] font-medium text-slate-500 leading-relaxed">
                해당 날짜의 판매 데이터를 바탕으로 원가 절감과 매출 증대를 위한 핵심 인사이트를 즉시 생성합니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. 하단 기간 분석 섹션 (기존 유지) */}
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
