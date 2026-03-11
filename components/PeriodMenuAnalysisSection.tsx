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

  loadCurrentPeriodData: () => Promise<void>;
  loadComparisonData: () => Promise<void>;
  fetchPeriodStats: () => Promise<void>;

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
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 md:px-8 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-base flex items-center gap-2">
          <i className="fa-solid fa-chart-column text-indigo-500"></i>
          기간별 성과 분석
        </h3>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="date"
            value={periodRange.start}
            onChange={(e) => setPeriodRange((prev) => ({ ...prev, start: e.target.value }))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <span className="text-slate-400 text-center text-sm font-bold">~</span>
          <input
            type="date"
            value={periodRange.end}
            onChange={(e) => setPeriodRange((prev) => ({ ...prev, end: e.target.value }))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={async () => {
              if (selectedPeriodDays < 7) {
                showToast("메뉴 엔지니어링 분석은 최소 7일 이상의 데이터가 필요합니다.");
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

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-bold text-slate-500 mb-2">기간 주문수 비교</div>
            <div className="text-2xl font-black text-slate-900">
              {Number(currentPeriodStats?.orders ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              비교군: {Number(comparisonStats?.orders ?? 0).toLocaleString()}
            </div>
            <div className={`text-sm font-bold mt-2 ${ordersChangeRate >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {ordersChangeRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-bold text-slate-500 mb-2">기간 방문객 비교</div>
            <div className="text-2xl font-black text-slate-900">
              {Number(currentPeriodStats?.visitors ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              비교군: {Number(comparisonStats?.visitors ?? 0).toLocaleString()}
            </div>
            <div className={`text-sm font-bold mt-2 ${visitorsChangeRate >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {visitorsChangeRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-bold text-slate-500 mb-2">기간 객단가 비교</div>
            <div className="text-2xl font-black text-slate-900">
              ${Number(currentPeriodStats?.aov ?? 0).toFixed(2)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              비교군: ${Number(comparisonStats?.aov ?? 0).toFixed(2)}
            </div>
            <div className={`text-sm font-bold mt-2 ${aovChangeRate >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {aovChangeRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <PeriodTopMenuCompare
          currentMenus={currentPeriodMenus}
          comparisonMenus={comparisonPeriodMenus}
          minDays={1}
          currentDays={currentPeriodDays}
          comparisonDays={comparisonPeriodDays}
        />

        <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />

        <PeriodBoostPlan boostPlans={boostPlans} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">기간 총 매출</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              ${Number(periodStats?.totalSales || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">기간 총 주문</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {Number(periodStats?.totalOrders || 0).toLocaleString()}건
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">기간 총 방문객</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {Number(periodStats?.totalVisitors || 0).toLocaleString()}명
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-black text-slate-800 text-sm">일별 추이</h4>
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-white sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-black text-slate-500">날짜</th>
                    <th className="text-right px-4 py-3 font-black text-slate-500">매출</th>
                    <th className="text-right px-4 py-3 font-black text-slate-500">주문</th>
                    <th className="text-right px-4 py-3 font-black text-slate-500">방문객</th>
                  </tr>
                </thead>
                <tbody>
                  {(periodStats?.list || []).length > 0 ? (
                    (periodStats?.list || []).map((row: any) => (
                      <tr key={row.date} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-bold text-slate-700">{row.date}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          ${Number(row.total_sales || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {Number(row.orders || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {Number(row.guests || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold">
                        기간 분석 데이터를 불러오면 여기에 표시됩니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
