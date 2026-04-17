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
  const safeNumber = (value: any) => Number(value || 0);
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
      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm md:rounded-[28px]">
        <div className="border-b border-slate-100 px-3 py-2 md:px-5 md:py-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-indigo-500 md:text-[11px] md:tracking-[0.16em]">
                Period Analysis
              </div>

              <h3 className="mt-1 text-[14px] font-bold text-slate-900 md:text-xl">
                기간 분석
              </h3>

              <p className="mt-0.5 text-[11px] font-medium text-slate-500 md:text-sm">
                핵심 변화 → 액션
              </p>
            </div>

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
              <input
                type="date"
                value={periodRange.start}
                onChange={(e) =>
                  setPeriodRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white md:h-10 md:rounded-xl md:px-3 md:text-sm"
              />

              <span className="hidden text-[10px] font-black text-slate-300 sm:block md:text-sm">
                ~
              </span>

              <input
                type="date"
                value={periodRange.end}
                onChange={(e) =>
                  setPeriodRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white md:h-10 md:rounded-xl md:px-3 md:text-sm"
              />

              <button
                type="button"
                onClick={async () => {
                  if (selectedPeriodDays < 7) {
                    showToast("메뉴 엔지니어링 분석은 최소 7일 이상 필요");
                    return;
                  }

                  await loadCurrentPeriodData(true);
                  await loadComparisonData(true);
                  await fetchPeriodStats(true);

                  const meResult = await calculateMenuEngineeringForRange(
                    periodRange.start,
                    periodRange.end,
                    data.categories,
                    { maxDays: 60 }
                  );

                  setMenuEngineeringResult(meResult);
                }}
                disabled={periodLoading}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-500 px-2 text-[10px] font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300 md:h-10 md:rounded-xl md:px-4 md:text-sm"
              >
                {periodLoading ? "분석 중..." : "분석"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50/60 px-3 py-3 md:space-y-4 md:px-6 md:py-5">
          <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-[1.1fr_1.1fr_1fr]">
            <div className="rounded-[18px] bg-gradient-to-br from-indigo-500 to-violet-500 p-4 text-white md:rounded-[24px] md:p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100 md:text-[11px] md:tracking-[0.16em]">
                핵심 포인트
              </div>
              <div className="mt-2 text-sm font-black leading-snug md:text-lg">
                이번 기간 먼저 볼 변화
              </div>

              <div className="mt-3 space-y-2">
                <div className="rounded-xl bg-white/15 px-3 py-2.5 md:rounded-2xl md:px-4 md:py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70 md:text-[11px] md:tracking-[0.14em]">
                    Best
                  </div>
                  <div className="mt-1 text-sm font-black md:text-base">
                    {bestMetric.label} {bestMetric.rate >= 0 ? "+" : ""}
                    {bestMetric.rate.toFixed(1)}%
                  </div>
                  <div className="mt-1 text-[11px] text-white/85 md:text-sm">
                    {bestMetric.compare} → {bestMetric.current}
                  </div>
                </div>

                <div className="rounded-xl bg-white/15 px-3 py-2.5 md:rounded-2xl md:px-4 md:py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70 md:text-[11px] md:tracking-[0.14em]">
                    Watch
                  </div>
                  <div className="mt-1 text-sm font-black md:text-base">
                    {worstMetric.label} {worstMetric.rate >= 0 ? "+" : ""}
                    {worstMetric.rate.toFixed(1)}%
                  </div>
                  <div className="mt-1 text-[11px] text-white/85 md:text-sm">
                    {worstMetric.compare} → {worstMetric.current}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-white p-4 md:rounded-[24px] md:p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                빠른 요약
              </div>
              <div className="mt-2 text-xs font-bold text-slate-500 md:text-sm">
                {periodRange.start} ~ {periodRange.end}
              </div>

              <div className="mt-4 space-y-2.5 md:mt-5 md:space-y-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 md:text-xs md:tracking-[0.12em]">
                    Total Sales
                  </div>
                  <div className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                    {formatCurrencyValue(totalSales, country)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                  <div className="rounded-xl bg-slate-50 p-2.5 md:rounded-2xl md:p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 md:text-[11px] md:tracking-[0.12em]">
                      Orders
                    </div>
                    <div className="mt-1 text-base font-black text-slate-900 md:text-lg">
                      {totalOrders.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 md:rounded-2xl md:p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 md:text-[11px] md:tracking-[0.12em]">
                      Visitors
                    </div>
                    <div className="mt-1 text-base font-black text-slate-900 md:text-lg">
                      {totalVisitors.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-white p-3 md:rounded-[24px] md:p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                비교 설정
              </div>
              <div className="mt-2 md:mt-3">
                <PeriodComparisonPanel
                  comparisonMode={comparisonMode}
                  setComparisonMode={setComparisonMode}
                  periodRange={periodRange}
                  comparisonRange={comparisonRange}
                  setComparisonRange={setComparisonRange}
                  canRunPeriodAnalysis={canRunPeriodAnalysis}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-2.5 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[14px] border border-slate-200 bg-white px-2 py-2 shadow-sm md:rounded-[18px] md:px-3 md:py-3"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="text-[10px] font-black text-slate-500 md:text-[12px]">
                    {card.label}
                  </div>
                  <div
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-black md:px-2 md:text-[10px] ${rateTone(
                      card.rate
                    )}`}
                  >
                    {card.rate >= 0 ? "+" : ""}
                    {card.rate.toFixed(1)}%
                  </div>
                </div>

                <div className="mt-1 text-[16px] font-black leading-none tracking-tight text-slate-900 md:mt-2 md:text-[22px]">
                  {card.current}
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.06em] text-slate-400 md:text-[10px] md:tracking-[0.1em]">
                  Compare
                </div>
                <div className="mt-0.5 text-[10px] font-bold leading-none text-slate-500 md:text-[12px]">
                  {card.compare}
                </div>

                <div className="mt-1.5 text-[9px] font-black leading-none text-slate-500 md:mt-2 md:text-[11px]">
                  {rateText(card.rate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
              Action Plan
            </div>
            <div className="mt-1 text-base font-black text-slate-900 md:text-lg">
              Boost Plan
            </div>
          </div>
          <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-600 md:px-3 md:py-1 md:text-xs">
            {boostPlans.length}개 실행안
          </div>
        </div>
        <PeriodBoostPlan boostPlans={boostPlans} />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
        <div className="mb-3 md:mb-4">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
            Menu Compare
          </div>
          <div className="mt-1 text-base font-black text-slate-900 md:text-lg">
            Top10 메뉴 비교
          </div>
        </div>

        <div className="overflow-visible md:overflow-x-auto">
          <div className="min-w-0 md:min-w-[720px]">
            <PeriodTopMenuCompare
              currentMenus={currentPeriodMenus}
              comparisonMenus={comparisonPeriodMenus}
              minDays={1}
              currentDays={currentPeriodDays}
              comparisonDays={comparisonPeriodDays}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
              Menu Structure
            </div>
            <div className="mt-1 text-base font-black text-slate-900 md:text-lg">
              메뉴 엔지니어링 분석
            </div>
          </div>
          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 md:px-3 md:py-1 md:text-xs">
            최근 분석 기준
          </div>
        </div>
        <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
      </section>

      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm md:rounded-[28px]">
        <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2.5 md:px-5 md:py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
            Daily Trend
          </div>
          <div className="mt-0.5 text-[15px] font-black text-slate-900 md:mt-1 md:text-lg">
            일별 추이
          </div>
        </div>

        <div className="max-h-[360px] overflow-auto">
          <table className="w-full min-w-[340px] table-fixed text-[11px] md:min-w-[560px] md:text-sm">
            <colgroup>
              <col className="w-[72px] md:w-[120px]" />
              <col className="w-[86px] md:w-[140px]" />
              <col className="w-[44px] md:w-[90px]" />
              <col className="w-[50px] md:w-[100px]" />
            </colgroup>
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100">
                <th className="px-1.5 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px] md:tracking-[0.12em]">
                  날짜
                </th>
                <th className="px-1.5 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px] md:tracking-[0.12em]">
                  매출
                </th>
                <th className="px-1.5 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px] md:tracking-[0.12em]">
                  주문
                </th>
                <th className="px-1.5 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px] md:tracking-[0.12em]">
                  방문객
                </th>
              </tr>
            </thead>
            <tbody>
              {(periodStats?.list || []).length > 0 ? (
                (periodStats?.list || []).map((row: any) => (
                  <tr key={row.date} className="border-b border-slate-100 last:border-b-0">
                    <td className="truncate px-1.5 py-1.5 font-bold text-slate-700 md:px-4 md:py-2.5">
                      {row.date}
                    </td>
                    <td className="px-1.5 py-1.5 text-right font-black text-slate-900 md:px-4 md:py-2.5">
                      {formatCurrencyValue(Number(row.total_sales || 0), country)}
                    </td>
                    <td className="px-1.5 py-1.5 text-right font-medium text-slate-600 md:px-4 md:py-2.5">
                      {Number(row.orders || 0).toLocaleString()}
                    </td>
                    <td className="px-1.5 py-1.5 text-right font-medium text-slate-600 md:px-4 md:py-2.5">
                      {Number(row.guests || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-5 text-center text-[11px] font-bold text-slate-400 md:py-7 md:text-sm"
                  >
                    기간 분석 데이터를 불러오면 여기에 표시됩니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
