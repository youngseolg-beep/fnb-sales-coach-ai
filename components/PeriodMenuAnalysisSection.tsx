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

  const bestMetric = [...summaryCards].sort((a, b) => b.rate - a.rate)[0];
  const worstMetric = [...summaryCards].sort((a, b) => a.rate - b.rate)[0];
  const totalSales = safeNumber(periodStats?.totalSales);
  const totalOrders = safeNumber(periodStats?.totalOrders);
  const totalVisitors = safeNumber(periodStats?.totalVisitors);

  const rateClass = (rate: number) =>
    rate > 0
      ? "text-emerald-600"
      : rate < 0
      ? "text-rose-600"
      : "text-slate-500";

  const rateBadgeClass = (rate: number) =>
    rate > 0
      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
      : rate < 0
      ? "bg-rose-50 text-rose-600 border-rose-200"
      : "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-5 md:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-400">
              Period Analysis
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              기간 분석
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              숫자 나열보다 먼저, 이 기간에 무엇이 좋아졌고 무엇을 바로 실행해야 하는지 보여줍니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="date"
              value={periodRange.start}
              onChange={(e) => setPeriodRange((prev) => ({ ...prev, start: e.target.value }))}
              className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="hidden text-sm font-black text-slate-400 sm:block">~</span>
            <input
              type="date"
              value={periodRange.end}
              onChange={(e) => setPeriodRange((prev) => ({ ...prev, end: e.target.value }))}
              className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={async () => {
                if (selectedPeriodDays < 7) {
                  showToast("메뉴 엔지니어링 분석은 최소 7일 이상의 데이터가 필요합니다.");
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
              className="h-11 rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:bg-slate-300"
            >
              {periodLoading ? "분석 중..." : "분석 실행"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-slate-50/60 px-5 py-5 md:px-7 md:py-7">
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Key Insight
            </div>
            <div className="mt-3 text-xl font-black leading-tight text-slate-900">
              이번 기간 핵심 변화
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-600">
                  Best
                </div>
                <div className="mt-1 text-base font-black text-slate-900">
                  {bestMetric.label} {bestMetric.rate >= 0 ? "+" : ""}
                  {bestMetric.rate.toFixed(1)}%
                </div>
                <div className="mt-1 text-sm font-medium text-slate-600">
                  비교군 {bestMetric.compare} → 현재 {bestMetric.current}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-600">
                  Watch Point
                </div>
                <div className="mt-1 text-base font-black text-slate-900">
                  {worstMetric.label} {worstMetric.rate >= 0 ? "+" : ""}
                  {worstMetric.rate.toFixed(1)}%
                </div>
                <div className="mt-1 text-sm font-medium text-slate-600">
                  비교군 {worstMetric.compare} → 현재 {worstMetric.current}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Current Period
            </div>
            <div className="mt-3 text-sm font-bold text-slate-500">
              {periodRange.start} ~ {periodRange.end}
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-400">총 매출</div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  ${totalSales.toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-400">주문</div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    {totalOrders.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-400">방문객</div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    {totalVisitors.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-200">
              Action Focus
            </div>
            <div className="mt-3 text-lg font-black leading-tight">
              지금 바로 볼 포인트
            </div>
            <div className="mt-5 space-y-3 text-sm font-medium text-indigo-50">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                {boostPlans.length > 0
                  ? `실행 액션 ${boostPlans.length}개가 준비되었습니다. 가장 먼저 1번 액션부터 적용하세요.`
                  : "아직 액션 플랜이 없습니다. 분석 실행 후 추천 액션이 생성됩니다."}
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                {sortedMenuEngineering
                  ? "Menu Engineering 결과가 생성되었습니다. Star / Puzzle / Dog 구조를 바로 확인하세요."
                  : "메뉴 엔지니어링 결과가 아직 없습니다. 분석 실행 후 메뉴 구조를 확인하세요."}
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <PeriodComparisonPanel
            comparisonMode={comparisonMode}
            setComparisonMode={setComparisonMode}
            periodRange={periodRange}
            comparisonRange={comparisonRange}
            setComparisonRange={setComparisonRange}
            canRunPeriodAnalysis={canRunPeriodAnalysis}
          />
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-black text-slate-500">{card.label}</div>
                <div
                  className={`rounded-full border px-2.5 py-1 text-xs font-black ${rateBadgeClass(
                    card.rate
                  )}`}
                >
                  {card.rate >= 0 ? "+" : ""}
                  {card.rate.toFixed(1)}%
                </div>
              </div>

              <div className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                {card.current}
              </div>

              <div className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Compare
              </div>
              <div className="mt-1 text-sm font-bold text-slate-500">{card.compare}</div>

              <div className={`mt-4 text-sm font-black ${rateClass(card.rate)}`}>
                {card.rate > 0
                  ? "좋아졌습니다"
                  : card.rate < 0
                  ? "체크가 필요합니다"
                  : "변화가 거의 없습니다"}
              </div>
            </div>
          ))}
        </section>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Action Plan
              </div>
              <div className="mt-1 text-xl font-black text-slate-900">Boost Plan</div>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
              {boostPlans.length}개 실행안
            </div>
          </div>
          <PeriodBoostPlan boostPlans={boostPlans} />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Menu Compare
            </div>
            <div className="mt-1 text-xl font-black text-slate-900">Top10 메뉴 비교</div>
          </div>
          <PeriodTopMenuCompare
            currentMenus={currentPeriodMenus}
            comparisonMenus={comparisonPeriodMenus}
            minDays={1}
            currentDays={currentPeriodDays}
            comparisonDays={comparisonPeriodDays}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Menu Structure
              </div>
              <div className="mt-1 text-xl font-black text-slate-900">메뉴 엔지니어링 분석</div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              최근 분석 기준
            </div>
          </div>
          <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Total Sales
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              ${totalSales.toLocaleString()}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Total Orders
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {totalOrders.toLocaleString()}건
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Total Visitors
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {totalVisitors.toLocaleString()}명
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Daily Trend
            </div>
            <div className="mt-1 text-xl font-black text-slate-900">일별 추이</div>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    날짜
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    매출
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    주문
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    방문객
                  </th>
                </tr>
              </thead>
              <tbody>
                {(periodStats?.list || []).length > 0 ? (
                  (periodStats?.list || []).map((row: any) => (
                    <tr key={row.date} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-3 font-bold text-slate-700">{row.date}</td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">
                        ${Number(row.total_sales || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-600">
                        {Number(row.orders || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-600">
                        {Number(row.guests || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm font-bold text-slate-400">
                      기간 분석 데이터를 불러오면 여기에 표시됩니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
};

export default PeriodMenuAnalysisSection;
