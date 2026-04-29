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

  // 1. 시각화 계산을 위한 데이터 보강 (raw 값 추가)
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
    <section className="space-y-3 md:space-y-4">
      {/* 기간 설정 섹션 */}
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
                onChange={(e) => setPeriodRange((prev) => ({ ...prev, start: e.target.value }))}
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white md:h-10 md:rounded-xl md:px-3 md:text-sm"
              />
              <span className="hidden text-[10px] font-black text-slate-300 sm:block md:text-sm">~</span>
              <input
                type="date"
                value={periodRange.end}
                onChange={(e) => setPeriodRange((prev) => ({ ...prev, end: e.target.value }))}
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

        <div className="space-y-4 bg-slate-50/60 px-3 py-3 md:px-6 md:py-6">
          <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-[1fr_1fr_1.35fr]">
            {/* 핵심 포인트 (하이라이트 카드) */}
            <div className="rounded-[18px] bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-lg md:rounded-[24px] md:p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100 md:text-[11px]">핵심 포인트</div>
              <div className="mt-2 text-sm font-black leading-snug md:text-xl">이번 기간 먼저 볼 변화</div>
              <div className="mt-4 space-y-2.5">
                <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm md:rounded-2xl md:px-4">
                  <div className="text-[10px] font-black text-white/60 md:text-[11px]">BEST</div>
                  <div className="mt-1 text-sm font-black md:text-lg">
                    {bestMetric.label} {bestMetric.rate >= 0 ? "+" : ""}{bestMetric.rate.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-white/80 md:text-sm">{bestMetric.compare} → {bestMetric.current}</div>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm md:rounded-2xl md:px-4">
                  <div className="text-[10px] font-black text-white/60 md:text-[11px]">WATCH</div>
                  <div className="mt-1 text-sm font-black md:text-lg">
                    {worstMetric.label} {worstMetric.rate >= 0 ? "+" : ""}{worstMetric.rate.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-white/80 md:text-sm">{worstMetric.compare} → {worstMetric.current}</div>
                </div>
              </div>
            </div>

            {/* 빠른 요약 */}
            <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[24px] md:p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">빠른 요약</div>
              <div className="mt-1 text-xs font-bold text-slate-500 md:text-sm">{periodRange.start} ~ {periodRange.end}</div>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-[10px] font-black text-slate-400 md:text-xs">TOTAL SALES</div>
                  <div className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                    {formatCurrencyValue(safeNumber(periodStats?.totalSales), country)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-black text-slate-400 md:text-[11px]">ORDERS</div>
                    <div className="mt-1 text-base font-black text-slate-900 md:text-lg">{safeNumber(periodStats?.totalOrders).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-black text-slate-400 md:text-[11px]">VISITORS</div>
                    <div className="mt-1 text-base font-black text-slate-900 md:text-lg">{safeNumber(periodStats?.totalVisitors).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 비교 설정 */}
            <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[24px] md:p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">비교 설정</div>
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

          {/* 2. 4대 KPI 카드 영역: Vendify 스타일 시각화 적용 */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const maxVal = Math.max(card.rawCurrent, card.rawCompare);
              const currentPercent = maxVal === 0 ? 0 : (card.rawCurrent / maxVal) * 100;
              const comparePercent = maxVal === 0 ? 0 : (card.rawCompare / maxVal) * 100;
              const isPositive = card.rate >= 0;

              return (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md md:rounded-[20px] md:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12px] font-black uppercase tracking-[0.05em] text-slate-500 md:text-[13px]">
                      {card.label}
                    </div>
                    <div
                      className={`inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-black md:text-[11px] ${
                        isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isPositive ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                      {Math.abs(card.rate).toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-2 text-[20px] font-black tracking-tight text-slate-900 md:mt-3 md:text-[26px]">
                    {card.current}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-slate-400 md:text-[12px]">
                    <span>vs 이전 기간</span>
                    <span>{card.compare}</span>
                  </div>

                  {/* 시각적 비교 바 (Bar) */}
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-tighter"><span>Compare</span></div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-slate-400 transition-all duration-1000 ease-out"
                          style={{ width: `${comparePercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-black text-indigo-400 uppercase tracking-tighter"><span>Current</span></div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                            isPositive ? "bg-indigo-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${currentPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Boost Plan 섹션 */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">Action Plan</div>
            <div className="mt-1 text-base font-black text-slate-900 md:text-lg">Boost Plan</div>
          </div>
          <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-600 md:text-xs">
            {boostPlans.length}개 실행안
          </div>
        </div>
        <PeriodBoostPlan boostPlans={boostPlans} />
      </section>

      {/* Top10 메뉴 비교 섹션 */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
        <div className="mb-3 md:mb-4">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">Menu Compare</div>
          <div className="mt-1 text-base font-black text-slate-900 md:text-lg">Top10 메뉴 비교</div>
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

      {/* 메뉴 엔지니어링 분석 섹션 */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">Menu Structure</div>
            <div className="mt-1 text-base font-black text-slate-900 md:text-lg">메뉴 엔지니어링 분석</div>
          </div>
          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 md:text-xs">최근 분석 기준</div>
        </div>
        <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
      </section>

      {/* 일별 추이 섹션 */}
      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm md:rounded-[28px]">
        <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2.5 md:px-5 md:py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">Daily Trend</div>
          <div className="mt-0.5 text-[15px] font-black text-slate-900 md:text-lg">일별 추이</div>
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
                <th className="px-1.5 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px]">날짜</th>
                <th className="px-1.5 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px]">매출</th>
                <th className="px-1.5 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px]">주문</th>
                <th className="px-1.5 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 md:px-4 md:py-2.5 md:text-[11px]">방문객</th>
              </tr>
            </thead>
            <tbody>
              {(periodStats?.list || []).length > 0 ? (
                (periodStats?.list || []).map((row: any) => (
                  <tr key={row.date} className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50">
                    <td className="truncate px-1.5 py-1.5 font-bold text-slate-700 md:px-4 md:py-2.5">{row.date}</td>
                    <td className="px-1.5 py-1.5 text-right font-black text-slate-900 md:px-4 md:py-2.5">{formatCurrencyValue(Number(row.total_sales || 0), country)}</td>
                    <td className="px-1.5 py-1.5 text-right font-medium text-slate-600 md:px-4 md:py-2.5">{Number(row.orders || 0).toLocaleString()}</td>
                    <td className="px-1.5 py-1.5 text-right font-medium text-slate-600 md:px-4 md:py-2.5">{Number(row.guests || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-5 text-center text-[11px] font-bold text-slate-400 md:py-7 md:text-sm">데이터를 불러오면 여기에 표시됩니다.</td>
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
