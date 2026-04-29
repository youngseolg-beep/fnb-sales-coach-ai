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
      rawCurrent: safeNumber(currentPeriodStats?.sales),
      rawCompare: safeNumber(comparisonStats?.sales),
      rate: salesChangeRate,
    },
    {
      label: "주문",
      current: safeNumber(currentPeriodStats?.orders).toLocaleString(),
      compare: safeNumber(comparisonStats?.orders).toLocaleString(),
      rawCurrent: safeNumber(currentPeriodStats?.orders),
      rawCompare: safeNumber(comparisonStats?.orders),
      rate: ordersChangeRate,
    },
    {
      label: "방문객",
      current: safeNumber(currentPeriodStats?.visitors).toLocaleString(),
      compare: safeNumber(comparisonStats?.visitors).toLocaleString(),
      rawCurrent: safeNumber(currentPeriodStats?.visitors),
      rawCompare: safeNumber(comparisonStats?.visitors),
      rate: visitorsChangeRate,
    },
    {
      label: "객단가",
      current: formatCurrencyValue(safeNumber(currentPeriodStats?.aov), country),
      compare: formatCurrencyValue(safeNumber(comparisonStats?.aov), country),
      rawCurrent: safeNumber(currentPeriodStats?.aov),
      rawCompare: safeNumber(comparisonStats?.aov),
      rate: aovChangeRate,
    },
  ];

  const bestMetric = [...summaryCards].sort((a, b) => b.rate - a.rate)[0];
  const worstMetric = [...summaryCards].sort((a, b) => a.rate - b.rate)[0];

  return (
    <section className="space-y-4">
      {/* 1. 기간 분석 상단 영역 */}
      <section className="rounded-[20px] border border-slate-200 bg-white shadow-sm md:rounded-[28px]">
        <div className="border-b border-slate-100 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 md:text-xl">기간 분석</h3>
              <p className="mt-1 text-[12px] font-medium text-slate-500 md:text-sm">핵심 변화 → 액션</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodRange.start}
                onChange={(e) => setPeriodRange((prev) => ({ ...prev, start: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white md:h-10 md:w-auto md:px-3 md:text-sm"
              />
              <span className="text-[12px] font-black text-slate-300 md:text-sm">~</span>
              <input
                type="date"
                value={periodRange.end}
                onChange={(e) => setPeriodRange((prev) => ({ ...prev, end: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white md:h-10 md:w-auto md:px-3 md:text-sm"
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
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 text-[12px] font-bold text-white hover:bg-slate-800 disabled:bg-slate-300 md:h-10 md:px-5 md:text-sm"
              >
                {periodLoading ? "분석 중..." : "분석"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 px-4 py-4 md:px-6 md:py-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.35fr]">
            {/* 핵심 포인트 */}
            <div className="rounded-2xl bg-slate-800 p-5 text-white">
              <div className="text-[11px] font-bold text-slate-400">이번 기간 먼저 볼 변화</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-slate-700 p-3">
                  <div className="text-[10px] font-bold text-slate-300">BEST</div>
                  <div className="mt-1 text-sm font-bold">
                    {bestMetric.label} {bestMetric.rate >= 0 ? "+" : ""}{bestMetric.rate.toFixed(1)}%
                  </div>
                  <div className="text-[12px] text-slate-400">{bestMetric.compare} → {bestMetric.current}</div>
                </div>
                <div className="rounded-xl bg-slate-700 p-3">
                  <div className="text-[10px] font-bold text-slate-300">WATCH</div>
                  <div className="mt-1 text-sm font-bold">
                    {worstMetric.label} {worstMetric.rate >= 0 ? "+" : ""}{worstMetric.rate.toFixed(1)}%
                  </div>
                  <div className="text-[12px] text-slate-400">{worstMetric.compare} → {worstMetric.current}</div>
                </div>
              </div>
            </div>

            {/* 빠른 요약 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[11px] font-bold text-slate-400">빠른 요약</div>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400">TOTAL SALES</div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrencyValue(safeNumber(periodStats?.totalSales), country)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-400">ORDERS</div>
                    <div className="mt-1 text-base font-bold text-slate-900">{safeNumber(periodStats?.totalOrders).toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-400">VISITORS</div>
                    <div className="mt-1 text-base font-bold text-slate-900">{safeNumber(periodStats?.totalVisitors).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 비교 설정 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[11px] font-bold text-slate-400">비교 설정</div>
              <div className="mt-3">
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

          {/* KPI 카드 배열 */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const maxVal = Math.max(card.rawCurrent, card.rawCompare);
              const currentPercent = maxVal === 0 ? 0 : (card.rawCurrent / maxVal) * 100;
              const comparePercent = maxVal === 0 ? 0 : (card.rawCompare / maxVal) * 100;
              const isPositive = card.rate >= 0;

              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div className="text-[13px] font-bold text-slate-500">{card.label}</div>
                    <div className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {isPositive ? "+" : ""}{card.rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-2 text-[20px] font-bold tracking-tight text-slate-900">{card.current}</div>
                  <div className="mt-1 text-[11px] font-medium text-slate-400">vs {card.compare}</div>

                  <div className="mt-4 space-y-2">
                    <div className="flex flex-col gap-1">
                      <div className="h-1 w-full rounded-full bg-slate-100">
                        <div className="h-1 rounded-full bg-slate-400 transition-all" style={{ width: `${comparePercent}%` }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-1 w-full rounded-full bg-slate-100">
                        <div className={`h-1 rounded-full transition-all ${isPositive ? "bg-indigo-500" : "bg-rose-500"}`} style={{ width: `${currentPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
        <div className="mb-4">
          <div className="text-[13px] font-bold text-slate-900">Boost Plan</div>
        </div>
        <PeriodBoostPlan boostPlans={boostPlans} />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
        <div className="mb-4">
          <div className="text-[13px] font-bold text-slate-900">Top10 메뉴 비교</div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
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

      <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
        <div className="mb-4">
          <div className="text-[13px] font-bold text-slate-900">메뉴 엔지니어링 분석</div>
        </div>
        <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
      </section>

      {/* 2. 일별 추이 (Daily Trend) - UX 중심 시각화 적용 */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
        <div className="mb-6">
          <h3 className="text-[16px] font-bold text-slate-900">일별 매출 추이</h3>
          <p className="mt-1 text-[12px] font-medium text-slate-500">기간 내 매출 흐름과 상세 데이터</p>
        </div>

        {/* 바 차트 영역 (UX) */}
        {(periodStats?.list || []).length > 0 && (
          <div className="mb-6 flex h-[180px] items-end justify-between gap-1 border-b border-slate-100 pb-2 md:h-[220px]">
            {periodStats.list.map((row: any, idx: number) => {
              const maxSales = Math.max(...periodStats.list.map((r: any) => Number(r.total_sales || 0)));
              const currentSales = Number(row.total_sales || 0);
              const heightPercent = maxSales === 0 ? 0 : (currentSales / maxSales) * 100;
              const dateStr = row.date.slice(-2); // "24", "25" 일만 추출

              return (
                <div key={idx} className="group relative flex h-full w-full flex-col items-center justify-end">
                  {/* Tooltip UX: 마우스 오버 시 표시 */}
                  <div className="absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-white group-hover:block md:-top-10 md:text-xs">
                    {formatCurrencyValue(currentSales, country)}
                  </div>
                  {/* Bar UX */}
                  <div className="flex h-full w-full max-w-[24px] items-end rounded-t bg-slate-50 md:max-w-[40px]">
                    <div
                      className="w-full rounded-t bg-indigo-500 transition-all hover:bg-indigo-400"
                      style={{ height: `${heightPercent}%`, minHeight: currentSales > 0 ? "4px" : "0" }}
                    ></div>
                  </div>
                  {/* X축 라벨 */}
                  <div className="mt-2 text-[10px] text-slate-500">{dateStr}일</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 상세 데이터 테이블 영역 (UX) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pr-4 font-medium">날짜</th>
                <th className="pb-3 px-4 text-right font-medium">매출</th>
                <th className="pb-3 px-4 text-right font-medium">주문</th>
                <th className="pb-3 pl-4 text-right font-medium">방문객</th>
              </tr>
            </thead>
            <tbody>
              {(periodStats?.list || []).length > 0 ? (
                (periodStats?.list || []).map((row: any) => (
                  <tr key={row.date} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-700">{row.date}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrencyValue(Number(row.total_sales || 0), country)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{Number(row.orders || 0).toLocaleString()}</td>
                    <td className="py-3 pl-4 text-right text-slate-600">{Number(row.guests || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">데이터가 없습니다.</td>
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
