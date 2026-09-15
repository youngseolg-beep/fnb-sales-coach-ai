import React, { useState, useEffect, useCallback, useRef } from "react";
import type { ComparisonMode } from "../utils2/periodComparison";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";

import PeriodComparisonPanel from "./PeriodComparisonPanel";
import PeriodTopMenuCompare from "./PeriodTopMenuCompare";
import PeriodMenuEngineering from "./PeriodMenuEngineering";
import PeriodBoostPlan from "./PeriodBoostPlan";
import { formatCurrencyValue } from "../utils2/currency";

interface Props {
  storeId: number;
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
  storeId,
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
  const [isConfidenceGuideOpen, setIsConfidenceGuideOpen] = useState(false);
  const confidenceGuideRef = useRef<HTMLSpanElement>(null);
  const menuAnalysisRequestRef = useRef(0);

  useEffect(() => {
    if (!isConfidenceGuideOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!confidenceGuideRef.current?.contains(event.target as Node)) {
        setIsConfidenceGuideOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isConfidenceGuideOpen]);

  const runAnalysis = useCallback(async (isManual = false) => {
    const requestId = ++menuAnalysisRequestRef.current;
    setMenuEngineeringResult(null);

    if (selectedPeriodDays < 1) return;

    try {
      await Promise.all([
        loadCurrentPeriodData(isManual),
        loadComparisonData(isManual),
        fetchPeriodStats(isManual)
      ]);

      const meResult = await calculateMenuEngineeringForRange(
        periodRange.start,
        periodRange.end,
        data.categories,
        { maxDays: 60, storeId }
      );

      if (requestId === menuAnalysisRequestRef.current) {
        setMenuEngineeringResult(meResult);
      }
    } catch (error) {
      if (requestId === menuAnalysisRequestRef.current) {
        console.error("Analysis Error:", error);
      }
    }
  }, [
    periodRange.start,
    periodRange.end,
    storeId,
    selectedPeriodDays,
    data.categories,
    loadCurrentPeriodData,
    loadComparisonData,
    fetchPeriodStats,
    calculateMenuEngineeringForRange,
    setMenuEngineeringResult
  ]);

  useEffect(() => {
    void runAnalysis(false);
    // runAnalysis intentionally changes with loaders supplied by DetailPage.
    // Recalculate only when the active range or authenticated store changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodRange.start, periodRange.end, selectedPeriodDays, storeId]);

  const confidenceMessage = selectedPeriodDays >= 1 && selectedPeriodDays <= 6
    ? { className: "bg-amber-50 text-amber-700", text: "데이터가 적어 결과 변동성이 클 수 있습니다." }
    : selectedPeriodDays >= 7 && selectedPeriodDays <= 13
      ? { className: "bg-slate-50 text-slate-500", text: "단기 분석 결과입니다." }
      : null;

  const summaryCards = [
    { label: "매출", current: formatCurrencyValue(safeNumber(currentPeriodStats?.sales), country), compare: formatCurrencyValue(safeNumber(comparisonStats?.sales), country), rawCurrent: safeNumber(currentPeriodStats?.sales), rawCompare: safeNumber(comparisonStats?.sales), rate: salesChangeRate },
    { label: "주문", current: safeNumber(currentPeriodStats?.orders).toLocaleString(), compare: safeNumber(comparisonStats?.orders).toLocaleString(), rawCurrent: safeNumber(currentPeriodStats?.orders), rawCompare: safeNumber(comparisonStats?.orders), rate: ordersChangeRate },
    { label: "방문객", current: safeNumber(currentPeriodStats?.visitors).toLocaleString(), compare: safeNumber(comparisonStats?.visitors).toLocaleString(), rawCurrent: safeNumber(currentPeriodStats?.visitors), rawCompare: safeNumber(comparisonStats?.visitors), rate: visitorsChangeRate },
    { label: "객단가", current: formatCurrencyValue(safeNumber(currentPeriodStats?.aov), country), compare: formatCurrencyValue(safeNumber(comparisonStats?.aov), country), rawCurrent: safeNumber(currentPeriodStats?.aov), rawCompare: safeNumber(comparisonStats?.aov), rate: aovChangeRate },
  ];

  return (
    <div className="space-y-5">
      {/* 4대 KPI 비교 카드 */}
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const maxVal = Math.max(card.rawCurrent, card.rawCompare);
          const currentPercent = maxVal === 0 ? 0 : (card.rawCurrent / maxVal) * 100;
          const comparePercent = maxVal === 0 ? 0 : (card.rawCompare / maxVal) * 100;
          const isPositive = card.rate >= 0;

          return (
          <div key={card.label} className="rounded-[16px] border border-[#e8e1db] bg-white p-3.5 shadow-[0_4px_12px_rgba(70,54,42,0.03)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500">{card.label}</span>
                <span className={`text-[10px] font-semibold ${isPositive ? "text-[#2d8a55]" : "text-[#d83a32]"}`}>
                  {isPositive ? "↑" : "↓"} {Math.abs(card.rate).toFixed(1)}%
                </span>
              </div>
              <div className="text-[18px] font-black text-slate-900">{card.current}</div>
              <div className="mt-3 space-y-1">
                <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-300 transition-all duration-700" style={{ width: `${comparePercent}%` }}></div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${isPositive ? "bg-blue-600" : "bg-rose-500"}`} style={{ width: `${currentPercent}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 일별 트렌드 차트 (Clipping 완벽 해결) */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm w-full">
        {/* z-index와 pointer-events-none으로 차트 위젯 라벨을 툴팁 렌더링에 간섭하지 않게 분리 */}
        <div className="relative z-10 mb-0 flex items-center justify-between pointer-events-none">
          <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
             일별 트렌드
          </h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span> 매출
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span> 주문
            </div>
          </div>
        </div>

        {(periodStats?.list || []).length > 0 ? (
          // [핵심] pt-28(112px)로 상단 툴팁 공간을 엄청 넉넉하게 확보하고, -mt-20(-80px)으로 시각적 틈을 위로 당겨 메꿈.
          <div className="relative z-0 w-full overflow-x-auto pt-28 -mt-20 pb-2 scrollbar-hide">
            <div className="flex h-[140px] min-w-[500px] items-end justify-between gap-2 md:h-[180px] md:gap-3 px-4">
              {periodStats.list.map((row: any, idx: number) => {
                const maxSales = Math.max(0, ...periodStats.list.map((r: any) => Number(r.total_sales || 0)));
                const maxOrders = Math.max(0, ...periodStats.list.map((r: any) => Number(r.orders || 0)));
                const salesPercent = maxSales === 0 ? 0 : (Number(row.total_sales) / maxSales) * 100;
                const ordersPercent = maxOrders === 0 ? 0 : (Number(row.orders) / maxOrders) * 100;

                return (
                  <div key={idx} className="group relative flex h-full min-w-[20px] flex-1 flex-col items-center justify-end" 
                       onClick={() => setActiveTooltipIdx(activeTooltipIdx === idx ? null : idx)}>
                    
                    {/* Tooltip (pointer-events-none 추가하여 터치 간섭 방지) */}
                    {activeTooltipIdx === idx && (
                      <div className="absolute bottom-[calc(100%+8px)] z-30 w-max rounded-lg bg-slate-800 p-2 text-white text-[10px] shadow-xl pointer-events-none">
                        <div className="font-bold border-b border-slate-600 pb-1 mb-1">{row.date}</div>
                        <div className="flex justify-between gap-3"><span>매출</span><b>{formatCurrencyValue(row.total_sales, country)}</b></div>
                        <div className="flex justify-between gap-3"><span>주문</span><b>{row.orders}건</b></div>
                        <div className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-slate-800"></div>
                      </div>
                    )}
                    
                    {/* Bars */}
                    <div className="flex h-full w-full items-end justify-center gap-[1px]">
                      <div className="w-2 md:w-3 bg-blue-600 rounded-t-sm" style={{ height: `${salesPercent}%` }}></div>
                      <div className="w-2 md:w-3 bg-sky-400 rounded-t-sm" style={{ height: `${ordersPercent}%` }}></div>
                    </div>
                    <div className="mt-1.5 text-[8px] font-bold text-slate-400">{row.date.slice(-2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-[11px] border border-dashed rounded-lg">데이터가 없습니다.</div>
        )}
      </section>

      {/* Top 5 메뉴 비교 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-[14px] font-bold text-slate-900">Top 5 메뉴 비교</h3>
        <PeriodTopMenuCompare currentMenus={currentPeriodMenus} comparisonMenus={comparisonPeriodMenus} minDays={1} currentDays={currentPeriodDays} comparisonDays={comparisonPeriodDays} country={country} />
      </section>

      {/* 분석 설정 패널 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900">분석 기간 설정</h3>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={periodRange.start} onChange={(e) => setPeriodRange(p => ({ ...p, start: e.target.value }))}
                   className="rounded-lg border border-slate-200 px-2 py-1 text-[12px] font-bold outline-none" />
            <span className="text-slate-300 text-xs">~</span>
            <input type="date" value={periodRange.end} onChange={(e) => setPeriodRange(p => ({ ...p, end: e.target.value }))}
                   className="rounded-lg border border-slate-200 px-2 py-1 text-[12px] font-bold outline-none" />
            
            <button onClick={() => void runAnalysis(true)} disabled={periodLoading}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors">
              {periodLoading ? "분석 중..." : "데이터 분석 실행"}
            </button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <PeriodComparisonPanel comparisonMode={comparisonMode} setComparisonMode={setComparisonMode} periodRange={periodRange} comparisonRange={comparisonRange} setComparisonRange={setComparisonRange} canRunPeriodAnalysis={canRunPeriodAnalysis} />
        </div>
      </section>

      {/* 메뉴 엔지니어링 & 부스트 플랜 */}
      <div className="grid grid-cols-1 gap-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-1.5">
            <h3 className="text-[14px] font-bold text-slate-900">메뉴 엔지니어링</h3>
            <span ref={confidenceGuideRef} className="relative" onMouseEnter={() => setIsConfidenceGuideOpen(true)} onMouseLeave={() => setIsConfidenceGuideOpen(false)}>
              <button type="button" aria-label="메뉴 엔지니어링 분석 신뢰도 기준" aria-expanded={isConfidenceGuideOpen} onClick={() => setIsConfidenceGuideOpen((open) => !open)} className="text-[13px] leading-none text-slate-400 hover:text-slate-600">ⓘ</button>
              {isConfidenceGuideOpen && <div role="tooltip" className="absolute left-0 top-5 z-30 w-72 rounded-lg border border-slate-200 bg-white p-3 text-[10px] leading-4 text-slate-600 shadow-lg">
                <p className="font-bold text-slate-800">분석 신뢰도 기준</p>
                <div className="mt-2 space-y-2">
                  <p><b>1~6일 · 신뢰도 낮음</b><br />데이터가 적어 결과 변동성이 클 수 있습니다.</p>
                  <p><b>7~13일 · 신뢰도 보통</b><br />단기 흐름을 확인하기에 적합합니다.</p>
                  <p><b>14~27일 · 신뢰도 높음</b><br />메뉴 성과 판단에 활용할 수 있습니다.</p>
                  <p><b>28~60일 · 신뢰도 매우 높음</b><br />메뉴 전략 판단에 권장되는 기간입니다.</p>
                </div>
                <p className="mt-2 border-t border-slate-100 pt-2 text-slate-500">※ 실제 신뢰도는 판매량과 주문 수에 따라서도 달라질 수 있습니다.<br />※ 60일을 초과한 기간은 최근 최대 60일 기준으로 분석합니다.</p>
              </div>}
            </span>
          </div>
          {confidenceMessage && <p className={`mb-3 rounded-lg p-2 text-[10px] leading-4 ${confidenceMessage.className}`}>{confidenceMessage.text}</p>}
          <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-[14px] font-bold text-slate-900">Boost Plan</h3>
          <PeriodBoostPlan boostPlans={boostPlans} />
        </section>
      </div>
    </div>
  );
};

export default PeriodMenuAnalysisSection;
