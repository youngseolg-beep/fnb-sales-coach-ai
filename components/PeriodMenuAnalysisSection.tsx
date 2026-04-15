import React from "react";
import type { ComparisonMode } from "../utils2/periodComparison";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";

import PeriodComparisonPanel from "./PeriodComparisonPanel";
import PeriodTopMenuCompare from "./PeriodTopMenuCompare";
import PeriodMenuEngineering from "./PeriodMenuEngineering";
import PeriodBoostPlan from "./PeriodBoostPlan";

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
  const safeNumber = (value: any) => Number(value || 0);

  const summaryCards = [
    {
      label: "매출",
      current: `$${safeNumber(currentPeriodStats?.sales).toLocaleString()}`,
      compare: `$${safeNumber(comparisonStats?.sales).toLocaleString()}`,
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
      current: `$${safeNumber(currentPeriodStats?.aov).toFixed(2)}`,
      compare: `$${safeNumber(comparisonStats?.aov).toFixed(2)}`,
      rate: aovChangeRate,
    },
  ];

  const rateTone = (rate: number) =>
    rate > 0
      ? "bg-emerald-50 text-emerald-600"
      : rate < 0
      ? "bg-rose-50 text-rose-500"
      : "bg-slate-100 text-slate-500";

  return (
    <section className="space-y-3 md:space-y-4">
      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm md:rounded-[28px]">
        
        {/* 상단 */}
        <div className="border-b border-slate-100 px-3 py-2 md:px-5 md:py-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-500">
                Period Analysis
              </div>
              <h3 className="mt-1 text-[14px] font-bold text-slate-900">
                기간 분석
              </h3>
            </div>

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
              <input
                type="date"
                value={periodRange.start}
                onChange={(e) =>
                  setPeriodRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="h-8 rounded-lg border px-2 text-[11px]"
              />
              <input
                type="date"
                value={periodRange.end}
                onChange={(e) =>
                  setPeriodRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="h-8 rounded-lg border px-2 text-[11px]"
              />
              <button
                onClick={async () => {
                  await loadCurrentPeriodData(true);
                  await loadComparisonData(true);
                  await fetchPeriodStats(true);
                }}
                className="h-8 rounded-lg bg-indigo-500 px-2 text-[10px] text-white"
              >
                분석
              </button>
            </div>
          </div>
        </div>

        {/* KPI 압축 */}
        <div className="space-y-3 bg-slate-50/60 px-3 py-3 md:px-6 md:py-5">
          <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border bg-white px-2 py-2"
              >
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{card.label}</span>
                  <span className={rateTone(card.rate)}>
                    {card.rate >= 0 ? "+" : ""}
                    {card.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm font-bold">{card.current}</div>
                <div className="text-[9px] text-slate-400">
                  {card.compare}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Boost */}
      <section className="rounded-[20px] border bg-white p-3">
        <PeriodBoostPlan boostPlans={boostPlans} />
      </section>

      {/* Top10 */}
      <section className="rounded-[20px] border bg-white p-3">
        <PeriodTopMenuCompare
          currentMenus={currentPeriodMenus}
          comparisonMenus={comparisonPeriodMenus}
          minDays={1}
          currentDays={currentPeriodDays}
          comparisonDays={comparisonPeriodDays}
        />
      </section>

      {/* 엔지니어링 */}
      <section className="rounded-[20px] border bg-white p-3">
        <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
      </section>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
