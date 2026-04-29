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
    <section className="space-y-6">
      {/* 1. 상단 분석 컨트롤 패널 */}
      <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] md:rounded-[32px]">
        <div className="border-b border-slate-100/60 px-5 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <h3 className="text-[18px] font-extrabold text-slate-900 md:text-[22px]">기간 분석</h3>
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-slate-500">기간별 핵심 성과 지표와 트렌드를 비교 분석합니다.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-1.5 md:gap-3 md:rounded-full md:p-2">
              <input
                type="date"
                value={periodRange.start}
                onChange={(e) => setPeriodRange((prev) => ({ ...prev, start: e.target.value }))}
                className="h-10 flex-1 rounded-xl border-none bg-white px-3 text-[13px] font-bold text-slate-700 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 md:h-11 md:flex-none md:rounded-full md:px-5"
              />
              <span className="hidden text-[14px] font-black text-slate-300 md:block">~</span>
              <input
                type="date"
                value={periodRange.end}
                onChange={(e) => setPeriodRange((prev) => ({ ...prev, end: e.target.value }))}
                className="h-10 flex-1 rounded-xl border-none bg-white px-3 text-[13px] font-bold text-slate-700 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 md:h-11 md:flex-none md:rounded-full md:px-5"
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
                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[13px] font-bold text-white shadow-md transition-all hover:bg-indigo-600 disabled:bg-slate-300 md:h-11 md:w-auto md:rounded-full"
              >
                {periodLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    분석 중...
                  </>
                ) : (
                  "데이터 분석"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. 대시보드 요약 위젯 영역 */}
        <div className="bg-slate-50/50 p-5 md:p-8">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr_1.2fr]">
            {/* 핵심 포인트 */}
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 text-white shadow-lg md:p-7">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-300"></span>
                  Key Insights
                </div>
                <div className="mt-2 text-[18px] font-extrabold leading-tight md:text-[22px]">이번 기간 핵심 변화</div>
                
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md border border-white/10">
                    <div>
                      <div className="text-[10px] font-black tracking-widest text-emerald-300">BEST</div>
                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-[16px] font-bold md:text-[18px]">{bestMetric.label}</span>
                        <span className="text-[13px] text-white/80 pb-0.5">{bestMetric.compare} → {bestMetric.current}</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-emerald-400/20 px-2.5 py-1 text-[13px] font-black text-emerald-300">
                      {bestMetric.rate >= 0 ? "+" : ""}{bestMetric.rate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md border border-white/10">
                    <div>
                      <div className="text-[10px] font-black tracking-widest text-rose-300">WATCH</div>
                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-[16px] font-bold md:text-[18px]">{worstMetric.label}</span>
                        <span className="text-[13px] text-white/80 pb-0.5">{worstMetric.compare} → {worstMetric.current}</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-rose-400/20 px-2.5 py-1 text-[13px] font-black text-rose-300">
                      {worstMetric.rate >= 0 ? "+" : ""}{worstMetric.rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 빠른 요약 */}
            <div className="flex flex-col justify-between rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm md:p-7">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Total Revenue</div>
                <div className="mt-2 text-[28px] font-black tracking-tight text-slate-900 md:text-[34px]">
                  {formatCurrencyValue(safeNumber(periodStats?.totalSales), country)}
                </div>
                <div className="mt-1 text-[12px] font-medium text-slate-400">{periodRange.start} ~ {periodRange.end}</div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orders</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{safeNumber(periodStats?.totalOrders).toLocaleString()}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visitors</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{safeNumber(periodStats?.totalVisitors).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 비교 설정 */}
            <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm md:p-7">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Comparison</div>
              <div className="mt-4">
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

          {/* 3. 4대 KPI 비교 카드 */}
          <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4 md:mt-6">
            {summaryCards.map((card) => {
              const maxVal = Math.max(card.rawCurrent, card.rawCompare);
              const currentPercent = maxVal === 0 ? 0 : (card.rawCurrent / maxVal) * 100;
              const comparePercent = maxVal === 0 ? 0 : (card.rawCompare / maxVal) * 100;
              const isPositive = card.rate >= 0;

              return (
                <div key={card.label} className="group relative overflow-hidden rounded-[20px] border border-slate-100 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:-translate-y-1 hover:shadow-lg md:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-extrabold text-slate-600 md:text-[14px]">
                      {card.label}
                    </div>
                    <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {isPositive ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      )}
                      {Math.abs(card.rate).toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-3 text-[22px] font-black tracking-tight text-slate-900 md:mt-4 md:text-[28px]">
                    {card.current}
                  </div>
                  
                  <div className="mt-5 space-y-2.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Compare</span>
                        <span>{card.compare}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-300 transition-all duration-1000 ease-out" style={{ width: `${comparePercent}%` }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-500">
                        <span>Current</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isPositive ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-gradient-to-r from-rose-400 to-rose-500"}`} style={{ width: `${currentPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. 하위 분석 섹션들 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Boost Plan */}
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] md:p-8">
          <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900">Boost Plan</h3>
                <p className="text-[12px] font-medium text-slate-500">데이터 기반 매출 증대 액션 플랜</p>
              </div>
            </div>
            <div className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-black text-amber-600">
              {boostPlans.length}개의 실행안 제안됨
            </div>
          </div>
          <PeriodBoostPlan boostPlans={boostPlans} />
        </section>

        {/* Top 10 메뉴 비교 */}
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] md:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </span>
            <div>
              <h3 className="text-[18px] font-bold text-slate-900">Top 10 메뉴 비교</h3>
              <p className="text-[12px] font-medium text-slate-500">이전 기간 대비 상위 메뉴 성과 추이</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <PeriodTopMenuCompare currentMenus={currentPeriodMenus} comparisonMenus={comparisonPeriodMenus} minDays={1} currentDays={currentPeriodDays} comparisonDays={comparisonPeriodDays} />
            </div>
          </div>
        </section>

        {/* 메뉴 엔지니어링 */}
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] md:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </span>
            <div>
              <h3 className="text-[18px] font-bold text-slate-900">메뉴 엔지니어링 분석</h3>
              <p className="text-[12px] font-medium text-slate-500">수익성과 인기도 기반 메뉴 매트릭스</p>
            </div>
          </div>
          <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
        </section>

        {/* 5. 일별 추이 (다중 바 차트 + 표 완전 삭제) */}
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] md:p-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              </span>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900">일별 종합 트렌드</h3>
                <p className="text-[12px] font-medium text-slate-500">매출, 주문, 방문객 지표의 일자별 비교</p>
              </div>
            </div>
            
            {/* 차트 범례 (Legend) */}
            <div className="flex items-center gap-4 rounded-full bg-slate-50 px-4 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span> 매출
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span> 주문
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-violet-400"></span> 방문
              </div>
            </div>
          </div>

          {/* 그룹화된 다중 바 차트 렌더링 영역 */}
          {(periodStats?.list || []).length > 0 ? (
            <div className="flex h-[220px] items-end justify-between gap-1 md:h-[280px] md:gap-3">
              {periodStats.list.map((row: any, idx: number) => {
                // 각각 독립적인 Max 값을 구해서 각 막대의 높이(%)를 상대적으로 계산합니다.
                const maxSales = Math.max(0, ...periodStats.list.map((r: any) => Number(r.total_sales || 0)));
                const maxOrders = Math.max(0, ...periodStats.list.map((r: any) => Number(r.orders || 0)));
                const maxVisitors = Math.max(0, ...periodStats.list.map((r: any) => Number(r.guests || 0)));

                const currentSales = Number(row.total_sales || 0);
                const currentOrders = Number(row.orders || 0);
                const currentVisitors = Number(row.guests || 0);

                const salesPercent = maxSales === 0 ? 0 : (currentSales / maxSales) * 100;
                const ordersPercent = maxOrders === 0 ? 0 : (currentOrders / maxOrders) * 100;
                const visitorsPercent = maxVisitors === 0 ? 0 : (currentVisitors / maxVisitors) * 100;
                
                const dateStr = row.date.slice(-2);

                return (
                  <div key={idx} className="group relative flex h-full w-full flex-col items-center justify-end hover:bg-slate-50/50 rounded-t-xl transition-colors">
                    {/* 통합 Tooltip (모든 정보 포함) */}
                    <div className="absolute bottom-full mb-2 z-20 hidden w-max opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100">
                      <div className="relative rounded-xl bg-slate-900 p-3 text-left text-[11px] font-medium text-white shadow-xl md:text-xs">
                        <div className="mb-2 border-b border-slate-700 pb-2 font-bold text-slate-300">{row.date}</div>
                        <div className="flex justify-between gap-4 py-0.5">
                          <span className="text-indigo-400 font-bold">매출</span> 
                          <span className="font-extrabold">{formatCurrencyValue(currentSales, country)}</span>
                        </div>
                        <div className="flex justify-between gap-4 py-0.5">
                          <span className="text-sky-400 font-bold">주문</span> 
                          <span className="font-extrabold">{currentOrders.toLocaleString()}건</span>
                        </div>
                        <div className="flex justify-between gap-4 py-0.5">
                          <span className="text-violet-400 font-bold">방문</span> 
                          <span className="font-extrabold">{currentVisitors.toLocaleString()}명</span>
                        </div>
                        {/* 툴팁 꼬리 */}
                        <div className="absolute -bottom-1 left-1/2 -ml-1 h-2.5 w-2.5 rotate-45 bg-slate-900"></div>
                      </div>
                    </div>
                    
                    {/* Grouped Bar Track (3개의 막대 나란히) */}
                    <div className="flex h-full w-full items-end justify-center gap-[2px] md:gap-1 px-0.5">
                      {/* 매출 Bar */}
                      <div className="flex h-full w-1.5 md:w-2.5 flex-col justify-end">
                        <div className="w-full rounded-t-sm bg-indigo-500 transition-all duration-500 opacity-90 group-hover:opacity-100" style={{ height: `${salesPercent}%`, minHeight: currentSales > 0 ? "4px" : "0" }}></div>
                      </div>
                      {/* 주문 Bar */}
                      <div className="flex h-full w-1.5 md:w-2.5 flex-col justify-end">
                        <div className="w-full rounded-t-sm bg-sky-400 transition-all duration-500 opacity-90 group-hover:opacity-100" style={{ height: `${ordersPercent}%`, minHeight: currentOrders > 0 ? "4px" : "0" }}></div>
                      </div>
                      {/* 방문객 Bar */}
                      <div className="flex h-full w-1.5 md:w-2.5 flex-col justify-end">
                        <div className="w-full rounded-t-sm bg-violet-400 transition-all duration-500 opacity-90 group-hover:opacity-100" style={{ height: `${visitorsPercent}%`, minHeight: currentVisitors > 0 ? "4px" : "0" }}></div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pb-1 text-[10px] font-bold text-slate-400 md:text-[12px]">{dateStr}일</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-[13px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl">
              데이터가 없습니다. 상단에서 분석 기간을 설정해 주세요.
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
