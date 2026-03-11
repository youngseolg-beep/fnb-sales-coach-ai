import React from "react";
import PeriodTopMenuCompare, { PeriodMenuRow } from "./PeriodTopMenuCompare";
import PeriodComparisonPanel from "./PeriodComparisonPanel";

interface Props {
  periodRange: { start: string; end: string };
  setPeriodRange: any;

  comparisonMode: any;
  setComparisonMode: any;

  comparisonRange: any;
  setComparisonRange: any;

  canRunPeriodAnalysis: boolean;

  currentPeriodStats: any;
  comparisonStats: any;

  salesChangeRate: number;
  ordersChangeRate: number;
  visitorsChangeRate: number;
  aovChangeRate: number;

  periodLoading: boolean;
  selectedPeriodDays: number;

  loadCurrentPeriodData: () => Promise<void>;
  loadComparisonData: () => Promise<void>;
  fetchPeriodStats: () => Promise<void>;

  calculateMenuEngineeringForRange: any;
  setMenuEngineeringResult: any;

  data: any;

  currentPeriodMenus: PeriodMenuRow[];
  comparisonPeriodMenus: PeriodMenuRow[];

  currentPeriodDays: number;
  comparisonPeriodDays: number;

  sortedMenuEngineering: any;
  boostPlans: any;

  periodStats: any;
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

  periodStats
}) => {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* HEADER */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 md:px-8 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-base flex items-center gap-2">
          <i className="fa-solid fa-chart-column text-indigo-500"></i>
          기간별 성과 분석
        </h3>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="date"
            value={periodRange.start}
            onChange={(e) => setPeriodRange((prev: any) => ({ ...prev, start: e.target.value }))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-400"
          />

          <span className="text-slate-400 text-center text-sm font-bold">~</span>

          <input
            type="date"
            value={periodRange.end}
            onChange={(e) => setPeriodRange((prev: any) => ({ ...prev, end: e.target.value }))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-400"
          />

          <button
            type="button"
            onClick={async () => {

              if (selectedPeriodDays < 7) {
                alert("메뉴 엔지니어링 분석은 최소 7일 이상의 데이터가 필요합니다.");
                return;
              }

              await loadCurrentPeriodData();
              await loadComparisonData();
              await fetchPeriodStats();

              const meResult = await calculateMenuEngineeringForRange(
                periodRange.start,
                periodRange.end,
                data.categories,
                { maxDays: 60 }
              );

              setMenuEngineeringResult(meResult);
            }}
            disabled={periodLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
          >
            {periodLoading ? "분석 중..." : "기간 분석"}
          </button>
        </div>
      </div>

      <div className="p-5 md:p-8 space-y-6">

        <PeriodComparisonPanel
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          periodRange={periodRange}
          comparisonRange={comparisonRange}
          setComparisonRange={setComparisonRange}
          canRunPeriodAnalysis={canRunPeriodAnalysis}
        />

        {/* KPI 비교 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-bold text-slate-500 mb-2">기간 매출 비교</div>

            <div className="text-2xl font-black text-slate-900">
              ${Number(currentPeriodStats?.sales ?? 0).toLocaleString()}
            </div>

            <div className="text-sm text-slate-500 mt-1">
              비교군: ${Number(comparisonStats?.sales ?? 0).toLocaleString()}
            </div>

            <div className={`text-sm font-bold mt-2 ${salesChangeRate >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {salesChangeRate.toFixed(1)}%
            </div>
          </div>

        </div>

        {/* Top Menu */}
        <PeriodTopMenuCompare
          currentMenus={currentPeriodMenus}
          comparisonMenus={comparisonPeriodMenus}
          minDays={1}
          currentDays={currentPeriodDays}
          comparisonDays={comparisonPeriodDays}
        />

      </div>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
