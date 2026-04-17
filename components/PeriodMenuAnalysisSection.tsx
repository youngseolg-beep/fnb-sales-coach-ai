import React from "react";
import type { ComparisonMode } from "../utils2/periodComparison";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";

import PeriodComparisonPanel from "./PeriodComparisonPanel";
import PeriodTopMenuCompare from "./PeriodTopMenuCompare";
import PeriodMenuEngineering from "./PeriodMenuEngineering";
import PeriodBoostPlan from "./PeriodBoostPlan";
import { formatCurrencyValue } from "../utils2/currency";

interface Props {
  periodRange: { start: string; end: string };
  setPeriodRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;
  comparisonRange: { start: string; end: string } | null;
  setComparisonRange: React.Dispatch<
    React.SetStateAction<{ start: string; end: string } | null>
  >;
  canRunPeriodAnalysis: boolean;
  currentPeriodStats: any;
  comparisonStats: any;
  salesChangeRate: number;
  ordersChangeRate: number;
  visitorsChangeRate: number;
  aovChangeRate: number;
  periodLoading: boolean;
  selectedPeriodDays: number;
  loadCurrentPeriodData: (force?: boolean) => Promise<void>;
  loadComparisonData: (force?: boolean) => Promise<void>;
  fetchPeriodStats: (force?: boolean) => Promise<void>;
  calculateMenuEngineeringForRange: any;
  setMenuEngineeringResult: React.Dispatch<React.SetStateAction<any>>;
  data: any;
  currentPeriodMenus: PeriodMenuRow[];
  comparisonPeriodMenus: PeriodMenuRow[];
  currentPeriodDays: number;
  comparisonPeriodDays: number;
  sortedMenuEngineering: any;
  boostPlans: any[];
  periodStats: any;
  showToast: (msg: string) => void;
}

const PeriodMenuAnalysisSection: React.FC<Props> = ({
  periodRange,
  setPeriodRange,
  comparisonMode,
  setComparisonMode,
  comparisonRange,
  setComparisonRange,
  canRunPeriodAnalysis,
  currentPeriodStats,
  comparisonStats,
  salesChangeRate,
  ordersChangeRate,
  visitorsChangeRate,
  aovChangeRate,
  periodLoading,
  selectedPeriodDays,
  loadCurrentPeriodData,
  loadComparisonData,
  fetchPeriodStats,
  calculateMenuEngineeringForRange,
  setMenuEngineeringResult,
  data,
  currentPeriodMenus,
  comparisonPeriodMenus,
  currentPeriodDays,
  comparisonPeriodDays,
  sortedMenuEngineering,
  boostPlans,
  periodStats,
  showToast,
}) => {
  const safeNumber = (v: any) => Number(v || 0);
  const country = (data as any)?.country;

  const summaryCards = [
    {
      label: "매출",
      current: formatCurrencyValue(safeNumber(currentPeriodStats?.sales), country),
      compare: formatCurrencyValue(safeNumber(comparisonStats?.sales), country),
      rate: salesChangeRate,
    },
    {
      label: "주문",
      current: safeNumber(currentPeriodStats?.orders).toLocaleString(),
      compare: safeNumber(comparisonStats?.orders).toLocaleString(),
      rate: ordersChangeRate,
    },
    {
      label: "방문객",
      current: safeNumber(currentPeriodStats?.visitors).toLocaleString(),
      compare: safeNumber(comparisonStats?.visitors).toLocaleString(),
      rate: visitorsChangeRate,
    },
    {
      label: "객단가",
      current: formatCurrencyValue(safeNumber(currentPeriodStats?.aov), country),
      compare: formatCurrencyValue(safeNumber(comparisonStats?.aov), country),
      rate: aovChangeRate,
    },
  ];

  const bestMetric = [...summaryCards].sort((a, b) => b.rate - a.rate)[0];
  const worstMetric = [...summaryCards].sort((a, b) => a.rate - b.rate)[0];

  const totalSales = safeNumber(periodStats?.totalSales);
  const totalOrders = safeNumber(periodStats?.totalOrders);
  const totalVisitors = safeNumber(periodStats?.totalVisitors);

  const rateTone = (rate: number) =>
    rate > 0
      ? "bg-emerald-50 text-emerald-600"
      : rate < 0
      ? "bg-rose-50 text-rose-500"
      : "bg-slate-100 text-slate-500";

  const rateText = (rate: number) =>
    rate > 0 ? "좋아짐" : rate < 0 ? "체크 필요" : "유지";

  return (
    <section className="space-y-3 md:space-y-4">
      <section className="rounded-xl border bg-white p-4">
        <div className="text-sm font-bold mb-2">
          {periodRange.start} ~ {periodRange.end}
        </div>

        <div className="text-xl font-bold">
          {formatCurrencyValue(totalSales, country)}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>Orders: {totalOrders.toLocaleString()}</div>
          <div>Visitors: {totalVisitors.toLocaleString()}</div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {summaryCards.map((card) => (
          <div key={card.label} className="border p-2 rounded">
            <div className="text-xs">{card.label}</div>
            <div className="font-bold">{card.current}</div>
            <div className="text-xs">{card.compare}</div>
          </div>
        ))}
      </div>

      <PeriodBoostPlan boostPlans={boostPlans} />

      <PeriodTopMenuCompare
        currentMenus={currentPeriodMenus}
        comparisonMenus={comparisonPeriodMenus}
        minDays={1}
        currentDays={currentPeriodDays}
        comparisonDays={comparisonPeriodDays}
      />

      <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />

      <table className="w-full mt-4 text-sm">
        <thead>
          <tr>
            <th>날짜</th>
            <th>매출</th>
            <th>주문</th>
            <th>방문객</th>
          </tr>
        </thead>
        <tbody>
          {(periodStats?.list || []).map((row: any) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>{formatCurrencyValue(row.total_sales, country)}</td>
              <td>{Number(row.orders || 0)}</td>
              <td>{Number(row.guests || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
