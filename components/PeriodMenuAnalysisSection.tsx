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
  const rateColor = (v: number) =>
    v >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      {/* 헤더 */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Period Analysis
          </div>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            기간 분석
          </h3>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={periodRange.start}
            onChange={(e) =>
              setPeriodRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="border rounded-xl px-3 py-2 text-sm font-bold"
          />
          <span>~</span>
          <input
            type="date"
            value={periodRange.end}
            onChange={(e) =>
              setPeriodRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="border rounded-xl px-3 py-2 text-sm font-bold"
          />
          <button
            onClick={async () => {
              if (selectedPeriodDays < 7) {
                showToast("최소 7일 필요");
                return;
              }
              await loadCurrentPeriodData(true);
              await loadComparisonData(true);
              await fetchPeriodStats(true);

              const me = await calculateMenuEngineeringForRange(
                periodRange.start,
                periodRange.end,
                data.categories,
                { maxDays: 60 }
              );

              setMenuEngineeringResult(me);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black"
          >
            {periodLoading ? "분석 중..." : "분석 실행"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">

        <PeriodComparisonPanel
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          periodRange={periodRange}
          comparisonRange={comparisonRange}
          setComparisonRange={setComparisonRange}
          canRunPeriodAnalysis={canRunPeriodAnalysis}
        />

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "매출",
              value: `$${Number(currentPeriodStats?.sales || 0).toLocaleString()}`,
              comp: `$${Number(comparisonStats?.sales || 0).toLocaleString()}`,
              rate: salesChangeRate,
            },
            {
              label: "주문",
              value: Number(currentPeriodStats?.orders || 0),
              comp: Number(comparisonStats?.orders || 0),
              rate: ordersChangeRate,
            },
            {
              label: "방문객",
              value: Number(currentPeriodStats?.visitors || 0),
              comp: Number(comparisonStats?.visitors || 0),
              rate: visitorsChangeRate,
            },
            {
              label: "객단가",
              value: `$${Number(currentPeriodStats?.aov || 0).toFixed(2)}`,
              comp: `$${Number(comparisonStats?.aov || 0).toFixed(2)}`,
              rate: aovChangeRate,
            },
          ].map((k, i) => (
            <div key={i} className="p-4 rounded-2xl border bg-slate-50">
              <div className="text-xs text-slate-500 font-bold">{k.label}</div>
              <div className="text-xl font-black text-slate-900 mt-1">{k.value}</div>
              <div className="text-xs text-slate-400 mt-1">vs {k.comp}</div>
              <div className={`text-sm font-black mt-2 ${rateColor(k.rate)}`}>
                {k.rate.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        <PeriodTopMenuCompare
          currentMenus={currentPeriodMenus}
          comparisonMenus={comparisonPeriodMenus}
          minDays={1}
          currentDays={currentPeriodDays}
          comparisonDays={comparisonPeriodDays}
        />

        {/* 핵심 강조 영역 */}
        <div className="grid md:grid-cols-2 gap-6">
          <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
          <PeriodBoostPlan boostPlans={boostPlans} />
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl">
            <div className="text-xs text-slate-400">총 매출</div>
            <div className="text-xl font-black">
              ${Number(periodStats?.totalSales || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 border rounded-2xl">
            <div className="text-xs text-slate-400">총 주문</div>
            <div className="text-xl font-black">
              {Number(periodStats?.totalOrders || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 border rounded-2xl">
            <div className="text-xs text-slate-400">총 방문객</div>
            <div className="text-xl font-black">
              {Number(periodStats?.totalVisitors || 0).toLocaleString()}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
