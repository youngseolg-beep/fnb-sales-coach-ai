import React, { useMemo, useState, type RefObject } from "react";
import type { SalesReportData } from "../types";
import type { PeriodMenuRow } from "./PeriodTopMenuCompare";
import PeriodTopMenuCompare from "./PeriodTopMenuCompare";
import ReportDisplay from "./ReportDisplay";
import { formatCurrencyValue } from "../utils2/currency";

type PeriodKey = "today" | "week" | "month" | "custom";

type Props = {
  data: SalesReportData;
  storeId: number;
  selectedDate: string;
  loading: boolean;
  report: string;
  reportScopeKey: string;
  reportError: string;
  salesChangeRate: number;
  ordersChangeRate: number;
  visitorsChangeRate: number;
  aovChangeRate: number;
  starCount: number;
  activePeriod: PeriodKey;
  periodRange: { start: string; end: string };
  comparisonRange: { start: string; end: string } | null;
  periodStats: { sales: number; orders: number; visitors: number } | null;
  canGenerateReport: boolean;
  onGenerateReport: () => Promise<void>;
  insightRef: RefObject<HTMLElement | null>;
  reportActionRef: RefObject<HTMLButtonElement | null>;
  currentPeriodMenus: PeriodMenuRow[];
  comparisonPeriodMenus: PeriodMenuRow[];
  trendRows: Array<{ date: string; total_sales: number; orders: number }>;
  engineeringContent: React.ReactNode;
  boostContent: React.ReactNode;
  onPeriodChange: (period: PeriodKey) => void;
  onCustomRangeChange: (range: { start: string; end: string }) => void;
};

const CoachV4Page: React.FC<Props> = ({
  data, storeId, selectedDate, loading, report, reportScopeKey, reportError, salesChangeRate, ordersChangeRate, visitorsChangeRate, aovChangeRate,
  starCount, activePeriod, periodRange, comparisonRange, periodStats, insightRef,
  currentPeriodMenus, comparisonPeriodMenus, trendRows, engineeringContent, boostContent,
  canGenerateReport, onGenerateReport, reportActionRef, onPeriodChange, onCustomRangeChange,
}) => {
  const [openPanel, setOpenPanel] = useState<"analysis" | "report" | "engineering" | "boost" | null>(null);
  const country = data.country;
  const sales = periodStats?.sales ?? Number(data.posSales || 0) + Number(data.deliverySales || 0);
  const orders = periodStats?.orders ?? Number(data.orders || 0);
  const visitors = periodStats?.visitors ?? Number(data.visitCount || 0);
  const aov = orders > 0 ? sales / orders : 0;
  const conversion = visitors > 0 ? (orders / visitors) * 100 : 0;
  const insight = useMemo(() => {
    if (salesChangeRate < 0) return `매출이 비교 기간보다 ${Math.abs(salesChangeRate).toFixed(0)}% 감소했어요.`;
    if (salesChangeRate > 0) return `매출이 비교 기간보다 ${salesChangeRate.toFixed(0)}% 증가했어요.`;
    return "선택한 기간의 매출 데이터를 바탕으로 다음 행동을 확인하세요.";
  }, [salesChangeRate]);
  const highestSales = Math.max(1, ...trendRows.map((row) => Number(row.total_sales || 0)));
  const scopeKey = `${storeId}:${periodRange.start}:${periodRange.end}`;
  const reportMatchesScope = Boolean(report) && reportScopeKey === scopeKey;
  const reportSectionTitles = activePeriod === "today"
    ? ["오늘 요약", "핵심 원인", "목표 및 성과 진단", "데일리 액션 플랜", "실행 체크리스트"]
    : ["운영 요약", "핵심 원인", "목표 및 성과 진단", "다음 실행 액션", "실행 체크리스트"];

  const rows = [
    { key: "analysis" as const, icon: "fa-chart-column", title: "매출 분석", copy: "선택한 기간의 변화와 상위 메뉴를 비교합니다.", badge: `매출 ${salesChangeRate >= 0 ? "+" : ""}${salesChangeRate.toFixed(1)}%`, color: "text-[#735ce8]" },
    { key: "report" as const, icon: "fa-wand-magic-sparkles", title: "AI 운영 코칭 리포트", copy: "AI가 현재 기간의 매장 운영 데이터를 종합 분석합니다.", badge: reportMatchesScope ? "리포트 보기" : "분석하기", color: "text-[#7456e5]" },
    { key: "engineering" as const, icon: "fa-star", title: "Menu Engineering", copy: "메뉴별 성과와 개선 기회를 확인하세요.", badge: `STAR ${starCount}개`, color: "text-[#7456e5]" },
    { key: "boost" as const, icon: "fa-bullseye", title: "Boost Plan", copy: "분석 결과를 바탕으로 다음 실행을 확인하세요.", badge: "실행 제안", color: "text-[#f05252]" },
  ];

  return <main className="mx-auto w-full max-w-[430px] space-y-4 pb-32 text-[#1f1f1f]">
    <nav className="grid grid-cols-4 rounded-[12px] border border-[#eee8e3] bg-white p-1">{([ ["today", "오늘"], ["week", "이번 주"], ["month", "이번 달"], ["custom", "직접 선택"] ] as const).map(([key, label]) => <button key={key} type="button" onClick={() => onPeriodChange(key)} className={`h-9 rounded-[9px] text-[11px] font-semibold ${activePeriod === key ? "bg-[#8b5e3c] text-white shadow-[0_4px_9px_rgba(100,66,43,0.18)]" : "text-[#4b413b]"}`}>{label}</button>)}</nav>

    {activePeriod === "custom" && <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[12px] border border-[#eee8e3] bg-white p-3"><input aria-label="시작일" type="date" value={periodRange.start} onChange={(event) => onCustomRangeChange({ ...periodRange, start: event.target.value })} className="min-w-0 rounded-lg border border-[#e7ded7] px-2 py-2 text-xs" /><span className="text-[#857a72]">~</span><input aria-label="종료일" type="date" value={periodRange.end} onChange={(event) => onCustomRangeChange({ ...periodRange, end: event.target.value })} className="min-w-0 rounded-lg border border-[#e7ded7] px-2 py-2 text-xs" /></section>}

    <section ref={insightRef} className="overflow-hidden rounded-[18px] border border-[#e5ddff] bg-[linear-gradient(135deg,#fcfbff_0%,#f3efff_100%)] p-5 shadow-[0_5px_16px_rgba(101,78,171,0.08)]">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold text-[#6d55df]"><i className="fa-solid fa-robot mr-1" />AI Coach · 오늘의 판단</p><h2 className="mt-5 max-w-[235px] text-[21px] font-bold leading-[1.3] tracking-[-0.055em]">{insight}</h2></div><div className="relative mt-1 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/75 shadow-[0_8px_18px_rgba(96,76,152,0.12)]"><i className="fa-solid fa-robot text-[34px] text-[#2b2635]" /><i className="fa-solid fa-sparkles absolute -bottom-1 -left-2 text-[15px] text-[#9b7cff]" /></div></div>
      <div className="mt-5 grid grid-cols-[1fr_12px_1fr_12px_1fr] items-stretch gap-1"><ReasonCard title="원인" main={`주문수 ${ordersChangeRate.toFixed(0)}%`} sub={`객단가 ${aovChangeRate.toFixed(0)}%`} /><Arrow /><ReasonCard title="추천" main="세트 메뉴" sub="상단 노출" /><Arrow /><ReasonCard title="예상 효과" main="+4~7%" sub="매출 회복 가능" /></div>
    </section>

    <section><h2 className="mb-3 text-[16px] font-bold tracking-[-0.04em]">오늘의 KPI <span className="text-[11px] font-medium text-[#746c66]">(근거 데이터)</span></h2><div className="grid grid-cols-5 gap-2">{[
      ["fa-won-sign", "오늘 매출", formatCurrencyValue(sales, country), salesChangeRate, "bg-[#eee9ff] text-[#7a65dc]"],
      ["fa-bag-shopping", "주문수", `${orders}건`, ordersChangeRate, "bg-[#e9f8e8] text-[#43a353]"],
      ["fa-user", "객단가", formatCurrencyValue(aov, country), aovChangeRate, "bg-[#fff3d9] text-[#e49d22]"],
      ["fa-users", "방문객", `${visitors}명`, visitorsChangeRate, "bg-[#e7f3ff] text-[#5a9ddd]"],
      ["fa-chart-pie", "전환율", visitors > 0 ? `${conversion.toFixed(1)}%` : "-", 0, "bg-[#e3f8f6] text-[#47afa9]"],
    ].map(([icon, label, value, delta, color]) => <KpiCard key={String(label)} icon={String(icon)} label={String(label)} value={String(value)} delta={Number(delta)} color={String(color)} />)}</div></section>

    <section className="space-y-2">{rows.map((row) => <React.Fragment key={row.key}><button ref={row.key === "report" ? reportActionRef : undefined} type="button" disabled={row.key === "report" && loading} onClick={() => { setOpenPanel((current) => current === row.key ? null : row.key); if (row.key === "report" && !reportMatchesScope && canGenerateReport && !loading) void onGenerateReport(); }} className="flex w-full items-center gap-3 rounded-[13px] border border-[#eee8e3] bg-white p-3 text-left shadow-[0_2px_8px_rgba(70,54,42,0.03)] disabled:opacity-60"><span className={`flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#faf7ff] ${row.color}`}><i className={`fa-solid ${row.icon}`} /></span><span className="min-w-0 flex-1"><b className="block text-[13px]">{row.title}</b><small className="mt-0.5 block truncate text-[10px] text-[#736a63]">{row.copy}</small></span><span className="rounded-[8px] border border-[#ede7df] px-2 py-1 text-[10px] font-semibold text-[#7a604c]">{loading && row.key === "report" ? "분석 중" : row.badge}</span><i className="fa-solid fa-chevron-right text-[10px] text-[#7f746d]" /></button>{openPanel === row.key && <div className="overflow-hidden rounded-[13px] border border-[#eee8e3] bg-white p-3">{row.key === "analysis" ? <PeriodAnalysis periodRange={periodRange} comparisonRange={comparisonRange} salesChangeRate={salesChangeRate} ordersChangeRate={ordersChangeRate} visitorsChangeRate={visitorsChangeRate} aovChangeRate={aovChangeRate} conversion={conversion} trendRows={trendRows} highestSales={highestSales} currentMenus={currentPeriodMenus} comparisonMenus={comparisonPeriodMenus} country={country} /> : row.key === "report" ? <V4Report report={report} reportMatchesScope={reportMatchesScope} loading={loading} error={reportError} canGenerateReport={canGenerateReport} onRetry={onGenerateReport} /> : row.key === "engineering" ? engineeringContent : boostContent}</div>}</React.Fragment>)}</section>
  </main>;
};

const V4Report: React.FC<{ report: string; reportMatchesScope: boolean; loading: boolean; error: string; canGenerateReport: boolean; onRetry: () => Promise<void>; sectionTitles: string[] }> = ({ report, reportMatchesScope, loading, error, canGenerateReport, onRetry, sectionTitles }) => {
  if (loading) return <div className="rounded-xl bg-[#fbfaff] p-5 text-center"><div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#e4dcff] border-t-[#7259dd]" /><p className="mt-3 text-sm font-semibold text-[#423856]">AI가 운영 데이터를 분석하고 있습니다...</p></div>;
  if (error) return <div className="rounded-xl border border-[#f2d8d8] bg-[#fffafa] p-4 text-center"><p className="text-sm font-semibold text-[#9f3f3f]">AI 코칭 리포트를 생성하지 못했습니다.</p><button type="button" onClick={() => void onRetry()} className="mt-3 rounded-lg border border-[#d8bbb0] px-3 py-2 text-xs font-semibold text-[#81513c]">다시 시도</button></div>;
  if (reportMatchesScope) return <ReportDisplay report={report} loading={false} menuEngineeringResult={null} sortedMenuEngineering={null} boostPlans={[]} sectionTitles={sectionTitles} />;
  if (!canGenerateReport) return <div className="rounded-xl border border-dashed border-[#e3ddd7] bg-[#fdfaf8] p-5 text-center text-sm font-medium text-[#857a72]">선택한 기간에 분석할 매출 데이터가 없습니다.</div>;
  return <div className="rounded-xl bg-[#fbfaff] p-5 text-center text-sm font-medium text-[#62587c]">AI 분석을 시작합니다.</div>;
};

const PeriodAnalysis: React.FC<{ periodRange: { start: string; end: string }; comparisonRange: { start: string; end: string } | null; salesChangeRate: number; ordersChangeRate: number; visitorsChangeRate: number; aovChangeRate: number; conversion: number; trendRows: Array<{ date: string; total_sales: number; orders: number }>; highestSales: number; currentMenus: PeriodMenuRow[]; comparisonMenus: PeriodMenuRow[]; country?: string }> = ({ periodRange, comparisonRange, salesChangeRate, ordersChangeRate, visitorsChangeRate, aovChangeRate, conversion, trendRows, highestSales, currentMenus, comparisonMenus, country }) => <div className="space-y-4 text-[11px]"><div className="grid grid-cols-2 gap-2"><PeriodDate label="현재 기간" value={`${periodRange.start} ~ ${periodRange.end}`} /><PeriodDate label="비교 기간" value={comparisonRange ? `${comparisonRange.start} ~ ${comparisonRange.end}` : "비교 기간 없음"} /></div><div className="grid grid-cols-2 gap-2 rounded-lg border border-[#eee8e3] p-3">{[["매출", salesChangeRate], ["주문수", ordersChangeRate], ["방문객", visitorsChangeRate], ["객단가", aovChangeRate], ["전환율", conversion]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between"><span className="text-[#766c65]">{label}</span><b className={Number(value) < 0 ? "text-[#e45252]" : "text-[#2f9a5b]"}>{label === "전환율" ? `${Number(value).toFixed(1)}%` : `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(1)}%`}</b></div>)}</div><p className="rounded-lg bg-[#f6f2ff] p-3 leading-5 text-[#62587c]">비교 기간의 매출과 주문 변화를 바탕으로 다음 실행 항목을 확인하세요.</p><section><h3 className="mb-2 font-bold text-[#302a26]">일별 추이</h3>{trendRows.length ? <div className={`flex h-24 items-end gap-1 rounded-lg bg-[#faf8f6] px-2 pt-2 ${trendRows.length === 1 ? "justify-center" : ""}`}>{trendRows.map((row) => <div key={row.date} className={`flex h-full min-w-0 flex-col justify-end ${trendRows.length === 1 ? "w-16" : "flex-1"}`}><div className="rounded-t bg-[#8b5e3c]" style={{ height: `${trendRows.length === 1 ? 42 : Math.max(4, (Number(row.total_sales || 0) / highestSales) * 100)}%` }} title={`${row.date}: ${formatCurrencyValue(Number(row.total_sales || 0), country)}`} /><span className="mt-1 text-center text-[8px] text-[#8a8079]">{row.date.slice(-2)} · {formatCurrencyValue(Number(row.total_sales || 0), country)}</span></div>)}</div> : <p className="rounded-lg border border-dashed border-[#e3ddd7] p-4 text-center text-[#857a72]">선택한 기간의 일별 데이터가 없습니다.</p>}</section><section><h3 className="mb-2 font-bold text-[#302a26]">Top 5 메뉴 비교</h3><PeriodTopMenuCompare currentMenus={currentMenus} comparisonMenus={comparisonMenus} minDays={1} currentDays={trendRows.length} comparisonDays={comparisonMenus.length ? 1 : 0} country={country} /></section></div>;
const PeriodDate: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-lg bg-[#faf8f6] p-2"><p className="text-[#7a7069]">{label}</p><b className="mt-1 block text-[10px] text-[#302a26]">{value}</b></div>;
const Arrow = () => <div className="flex items-center justify-center text-[11px] text-[#453c36]"><i className="fa-solid fa-arrow-right" /></div>;
const ReasonCard: React.FC<{ title: string; main: string; sub: string }> = ({ title, main, sub }) => <div className="rounded-[10px] border border-[#ece6f7] bg-white/70 px-2 py-3 text-center"><p className="text-[10px] font-semibold">{title}</p><b className="mt-3 block text-[12px] text-[#332a38]">{main}</b><small className="mt-1 block text-[10px] text-[#6b615c]">{sub}</small></div>;
const KpiCard: React.FC<{ icon: string; label: string; value: string; delta: number; color: string }> = ({ icon, label, value, delta, color }) => <div className="min-w-0 rounded-[12px] border border-[#eee8e3] bg-white p-2 shadow-[0_2px_7px_rgba(70,54,42,0.025)]"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${color}`}><i className={`fa-solid ${icon}`} /></span><p className="mt-2 truncate text-[9px] text-[#665d57]">{label}</p><b className="mt-1 block truncate text-[11px] tracking-[-0.06em]">{value}</b><small className={`mt-2 block text-[9px] ${delta < 0 ? "text-[#ef5a5a]" : "text-[#36a160]"}`}>{delta === 0 ? "비교 없음" : `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`}</small></div>;

export default CoachV4Page;
