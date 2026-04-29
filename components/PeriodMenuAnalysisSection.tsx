import React, { useState } from "react";
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
  setComparisonRange: React.Dispatch<React.SetStateAction<{ start: string; end: string } | null>>;
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
  const [activeTooltipIdx, setActiveTooltipIdx] = useState<number | null>(null);

  const summaryCards = [
    { label: "매출", current: formatCurrencyValue(safeNumber(currentPeriodStats?.sales), country), compare: formatCurrencyValue(safeNumber(comparisonStats?.sales), country), rawCurrent: safeNumber(currentPeriodStats?.sales), rawCompare: safeNumber(comparisonStats?.sales), rate: salesChangeRate },
    { label: "주문", current: safeNumber(currentPeriodStats?.orders).toLocaleString(), compare: safeNumber(comparisonStats?.orders).toLocaleString(), rawCurrent: safeNumber(currentPeriodStats?.orders), rawCompare: safeNumber(comparisonStats?.orders), rate: ordersChangeRate },
    { label: "방문객", current: safeNumber(currentPeriodStats?.visitors).toLocaleString(), compare: safeNumber(comparisonStats?.visitors).toLocaleString(), rawCurrent: safeNumber(currentPeriodStats?.visitors), rawCompare: safeNumber(comparisonStats?.visitors), rate: visitorsChangeRate },
    { label: "객단가", current: formatCurrencyValue(safeNumber(currentPeriodStats?.aov), country), compare: formatCurrencyValue(safeNumber(comparisonStats?.aov), country), rawCurrent: safeNumber(currentPeriodStats?.aov), rawCompare: safeNumber(comparisonStats?.aov), rate: aovChangeRate },
  ];

  return (
    <div className="space-y-5">
      {/* [상단 1] 4대 KPI 비교 카드 - 화이트&블루 테마 */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const maxVal = Math.max(card.rawCurrent, card.rawCompare);
          const currentPercent = maxVal === 0 ? 0 : (card.rawCurrent / maxVal) * 100;
          const comparePercent = maxVal === 0 ? 0 : (card.rawCompare / maxVal) * 100;
          const isPositive = card.rate >= 0;

          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-[12px] font-bold text-slate-500">{card.label}</span>
                <span className={`text-[11px] font-black ${isPositive ? "text-blue-600" : "text-rose-500"}`}>
                  {isPositive ? "↑" : "↓"} {Math.abs(card.rate).toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 text-[18px] font-black text-slate-900 md:text-[22px]">{card.current}</div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-300 transition-all duration-700" style={{ width: `${comparePercent}%` }}></div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-700 ${isPositive ? "bg-blue-600" : "bg-rose-500"}`} style={{ width: `${currentPercent}%` }}></div>
                </div>
              </div>
              <div className="mt-2 text-[10px] font-medium text-slate-400 text-right">vs {card.compare}</div>
            </div>
          );
        })}
      </div>

      {/* [상단 2] 일별 종합 트렌드 차트 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">일별 트렌드</h3>
            <p className="text-[12px] text-slate-500">매출, 주문, 방문객 종합 추이</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span> 매출
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-sky-400"></span> 주문
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-300"></span> 방문
            </div>
          </div>
        </div>

        {(periodStats?.list || []).length > 0 ? (
          <div className="flex h-[180px] items-end justify-between gap-1 md:h-[220px] md:gap-4">
            {periodStats.list.map((row: any, idx: number) => {
              const maxSales = Math.max(0, ...periodStats.list.map((r: any) => Number(r.total_sales || 0)));
              const maxOrders = Math.max(0, ...periodStats.list.map((r: any) => Number(r.orders || 0)));
              const maxVisitors = Math.max(0, ...periodStats.list.map((r: any) => Number(r.guests || 0)));

              const salesPercent = maxSales === 0 ? 0 : (Number(row.total_sales) / maxSales) * 100;
              const ordersPercent = maxOrders === 0 ? 0 : (Number(row.orders) / maxOrders) * 100;
              const visitorsPercent = maxVisitors === 0 ? 0 : (Number(row.guests) / maxVisitors) * 100;

              return (
                <div key={idx} className="group relative flex h-full w-full flex-col items-center justify-end" 
                     onClick={() => setActiveTooltipIdx(activeTooltipIdx === idx ? null : idx)}>
                  {activeTooltipIdx === idx && (
                    <div className="absolute bottom-full mb-2 z-30 w-max rounded-lg bg-slate-800 p-2 text-white text-[10px] shadow-xl">
                      <div className="font-bold border-b border-slate-600 pb-1 mb-1">{row.date}</div>
                      <div className="flex justify-between gap-3"><span>매출</span><b>{formatCurrencyValue(row.total_sales, country)}</b></div>
                      <div className="flex justify-between gap-3"><span>주문</span><b>{row.orders}건</b></div>
                      <div className="flex justify-between gap-3"><span>방문</span><b>{row.guests}명</b></div>
                    </div>
                  )}
                  <div className="flex h-full w-full items-end justify-center gap-[2px]">
                    <div className="w-1 md:w-2 bg-blue-600 rounded-t-sm" style={{ height: `${salesPercent}%` }}></div>
                    <div className="w-1 md:w-2 bg-sky-400 rounded-t-sm" style={{ height: `${ordersPercent}%` }}></div>
                    <div className="w-1 md:w-2 bg-slate-300 rounded-t-sm" style={{ height: `${visitorsPercent}%` }}></div>
                  </div>
                  <div className="mt-2 text-[9px] font-bold text-slate-400">{row.date.slice(-2)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-[12px] border border-dashed rounded-xl">데이터가 없습니다.</div>
        )}
      </section>

      {/* [중단] Top 5 메뉴 비교 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-[16px] font-bold text-slate-900">Top 5 메뉴 비교</h3>
        <PeriodTopMenuCompare currentMenus={currentPeriodMenus} comparisonMenus={comparisonPeriodMenus} minDays={1} currentDays={currentPeriodDays} comparisonDays={comparisonPeriodDays} />
      </section>

      {/* [하단 1] 분석 설정 패널 - 뒤로 밀기 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">분석 기간 설정</h3>
            <p className="text-[12px] text-slate-500">상세 분석을 위한 기간을 선택하세요.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={periodRange.start} onChange={(e) => setPeriodRange(p => ({ ...p, start: e.target.value }))}
                   className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-bold outline-none focus:border-blue-500" />
            <span className="text-slate-300">~</span>
            <input type="date" value={periodRange.end} onChange={(e) => setPeriodRange(p => ({ ...p, end: e.target.value }))}
                   className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-bold outline-none focus:border-blue-500" />
            <button onClick={async () => {
              if (selectedPeriodDays < 7) { showToast("7일 이상 데이터 필요"); return; }
              await Promise.all([loadCurrentPeriodData(true), loadComparisonData(true), fetchPeriodStats(true)]);
              const meResult = await calculateMenuEngineeringForRange(periodRange.start, periodRange.end, data.categories, { maxDays: 60 });
              setMenuEngineeringResult(meResult);
            }} disabled={periodLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors">
              {periodLoading ? "분석 중..." : "데이터 분석 실행"}
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <PeriodComparisonPanel comparisonMode={comparisonMode} setComparisonMode={setComparisonMode} periodRange={periodRange} comparisonRange={comparisonRange} setComparisonRange={setComparisonRange} canRunPeriodAnalysis={canRunPeriodAnalysis} />
        </div>
      </section>

      {/* [하단 2] 심층 분석 (메뉴 엔지니어링 & 부스트 플랜) */}
      <div className="grid grid-cols-1 gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-[16px] font-bold text-slate-900">메뉴 엔지니어링</h3>
          <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-[16px] font-bold text-slate-900">Boost Plan</h3>
          <PeriodBoostPlan boostPlans={boostPlans} />
        </section>
      </div>
    </div>
  );
};

export default PeriodMenuAnalysisSection;
