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
        <div className="border-b border-slate-100 px-3 py-2 md:px-5 md:py-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-indigo-500">
                Period Analysis
              </div>
              <h3 className="mt-1 text-[14px] font-bold text-slate-900">
                기간 분석
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50/60 px-3 py-3 md:px-6 md:py-5">

          {/* KPI */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 md:px-3 md:py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-500">
                    {card.label}
                  </div>
                  <div
                    className={`px-1.5 py-[2px] text-[9px] font-bold rounded ${rateTone(
                      card.rate
                    )}`}
                  >
                    {card.rate >= 0 ? "+" : ""}
                    {card.rate.toFixed(1)}%
                  </div>
                </div>

                <div className="mt-1 text-sm font-bold text-slate-900">
                  {card.current}
                </div>

                <div className="mt-[2px] text-[9px] text-slate-400">
                  {card.compare}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
        <PeriodBoostPlan boostPlans={boostPlans} />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
        <PeriodTopMenuCompare
          currentMenus={currentPeriodMenus}
          comparisonMenus={comparisonPeriodMenus}
          minDays={1}
          currentDays={currentPeriodDays}
          comparisonDays={comparisonPeriodDays}
        />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
        <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
      </section>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
