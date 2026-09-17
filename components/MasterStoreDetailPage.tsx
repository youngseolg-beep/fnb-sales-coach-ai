import { useEffect, useMemo, useState } from "react";
import {
  loadMasterStoreDetail,
  type MasterDatePreset,
  type MasterDateRange,
  type StoreDetailDailyRow,
  type StoreDetailResult,
} from "../services/masterDashboardService";

type Props = {
  storeId: number;
  range: MasterDateRange;
  preset: MasterDatePreset;
  onPresetChange: (preset: MasterDatePreset) => void;
  onCustomDateChange: (key: "startDate" | "endDate", value: string) => void;
  onBack: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function presetLabel(preset: MasterDatePreset) {
  return ({ today: "Today", thisWeek: "This Week", thisMonth: "This Month", last30Days: "Last 30 Days", custom: "Custom" })[preset];
}

function growthLabel(rate: number | null) {
  if (rate === null || !Number.isFinite(rate)) return "비교 데이터 없음";
  return `${rate > 0 ? "↑" : rate < 0 ? "↓" : "→"} ${Math.abs(rate).toFixed(1)}%`;
}

function growthClass(rate: number | null) {
  if (rate === null || !Number.isFinite(rate)) return "text-[#9C948E]";
  if (rate > 0) return "text-emerald-600";
  if (rate < 0) return "text-rose-500";
  return "text-[#706A66]";
}

function TrendChart({ daily, singleDay }: { daily: StoreDetailDailyRow[]; singleDay: boolean }) {
  if (daily.length === 0) return <p className="py-10 text-center text-sm text-[#9C948E]">선택한 기간의 매출 데이터가 없습니다.</p>;
  if (daily.length === 1) {
    return <div className="flex h-40 flex-col items-center justify-center text-center"><p className="text-sm text-[#706A66]">{singleDay ? "선택한 기간이 1일이어서 추이 비교가 없습니다." : "추이를 확인할 일별 매출 데이터가 충분하지 않습니다."}</p><p className="mt-2 text-xl font-bold">{formatCurrency(daily[0].totalSales)}</p></div>;
  }

  const width = 640;
  const height = 180;
  const inset = { top: 14, right: 12, bottom: 28, left: 12 };
  const values = daily.map((row) => row.totalSales);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const spread = Math.max(max - min, 1);
  const x = (index: number) => inset.left + (index / (daily.length - 1)) * (width - inset.left - inset.right);
  const y = (value: number) => inset.top + (1 - (value - min) / spread) * (height - inset.top - inset.bottom);
  const points = daily.map((row, index) => `${x(index)},${y(row.totalSales)}`).join(" ");
  const labels = Array.from(new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1]));

  return <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full overflow-visible sm:h-[190px]" role="img" aria-label="일별 매출 추이">
    <line x1={inset.left} x2={width - inset.right} y1={height - inset.bottom} y2={height - inset.bottom} stroke="#ECE7E1" />
    <polyline fill="none" stroke="#8B6F5B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
    {daily.map((row, index) => <circle key={row.date} cx={x(index)} cy={y(row.totalSales)} r="3" fill="#8B6F5B" />)}
    {labels.map((index) => <text key={index} x={x(index)} y={height - 7} textAnchor={index === 0 ? "start" : index === daily.length - 1 ? "end" : "middle"} fontSize="11" fill="#9C948E">{daily[index].date.slice(5)}</text>)}
  </svg>;
}

function checkpoint(detail: StoreDetailResult) {
  const growth = detail.summary.growth;
  if (growth.sales.rate === null) return "이전 기간 데이터가 충분하지 않습니다. 현재 매출과 메뉴 구성을 중심으로 확인해 보세요.";
  if (growth.sales.rate <= -10) return `이전 동일 기간 대비 매출이 ${Math.abs(growth.sales.rate).toFixed(1)}% 감소했습니다. 주문 수와 객단가 변화를 함께 확인해 보세요.`;
  if ((growth.orders.rate ?? 0) <= -10) return "주문 수 감소가 매출 하락에 영향을 주고 있습니다.";
  if ((growth.aov.rate ?? 0) < 0) return "평균 객단가가 이전 기간보다 낮아졌습니다. 메뉴 판매 구성을 확인해 보세요.";
  if ((growth.conversionRate.rate ?? 0) < 0) return "방문 대비 주문 전환율이 낮아졌습니다.";
  return "현재 기간의 매출과 메뉴 구성이 안정적으로 유지되고 있습니다. 상위 메뉴의 흐름을 함께 확인해 보세요.";
}

export default function MasterStoreDetailPage({ storeId, range, preset, onPresetChange, onCustomDateChange, onBack }: Props) {
  const [detail, setDetail] = useState<StoreDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await loadMasterStoreDetail(storeId, range);
        if (!cancelled) setDetail(data);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "매장 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [storeId, range.startDate, range.endDate]);

  const kpis = useMemo(() => detail ? [
    { label: "매출", value: formatCurrency(detail.summary.totalSales), growth: detail.summary.growth.sales.rate },
    { label: "주문 수", value: formatNumber(detail.summary.totalOrders), growth: detail.summary.growth.orders.rate },
    { label: "평균 AOV", value: formatCurrency(detail.summary.averageAov), growth: detail.summary.growth.aov.rate },
    { label: "전환율", value: formatPercent(detail.summary.conversionRate), growth: detail.summary.growth.conversionRate.rate },
  ] : [], [detail]);

  const showBrand = detail?.brandName && detail.brandName !== "Unknown";

  return <main className="min-h-screen bg-[#FAF8F6] text-[#1F1F1F]"><div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
    <button type="button" onClick={onBack} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ECE7E1] bg-white px-3 text-sm font-semibold text-[#706A66] transition hover:bg-[#F7F2EE]" aria-label="전체 매장으로 돌아가기"><i className="fa-solid fa-arrow-left text-xs" />전체 매장으로</button>
    <header className="mt-5"><p className="text-xs font-semibold text-[#8B6F5B] sm:text-sm">Store Performance</p><h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.035em] sm:text-[28px]">{detail?.storeName || "매장 성과"}</h1>{showBrand ? <p className="mt-1 text-sm text-[#706A66]">{detail?.brandName}</p> : null}<p className="mt-2 text-xs text-[#9C948E]">{range.startDate} ~ {range.endDate}</p></header>

    <section className="mt-5 flex flex-col gap-2 sm:mt-7 sm:gap-3"><div className="flex flex-wrap gap-2">{(["today", "thisWeek", "thisMonth", "last30Days", "custom"] as MasterDatePreset[]).map((item) => <button key={item} type="button" onClick={() => onPresetChange(item)} className={`h-10 rounded-xl border px-3 text-[12px] font-semibold sm:px-4 sm:text-sm ${preset === item ? "border-[#8B6F5B] bg-[#8B6F5B] text-white" : "border-[#ECE7E1] bg-white text-[#706A66] hover:bg-[#F7F2EE]"}`}>{presetLabel(item)}</button>)}</div>{preset === "custom" ? <div className="flex flex-wrap items-center gap-2"><input type="date" value={range.startDate} onChange={(event) => onCustomDateChange("startDate", event.target.value)} className="h-10 rounded-xl border border-[#ECE7E1] bg-white px-3 text-sm" /><span className="text-sm text-[#9C948E]">~</span><input type="date" value={range.endDate} onChange={(event) => onCustomDateChange("endDate", event.target.value)} className="h-10 rounded-xl border border-[#ECE7E1] bg-white px-3 text-sm" /></div> : null}</section>

    {loading ? <section className="mt-6 rounded-[20px] border border-[#ECE7E1] bg-white p-5"><div className="h-4 w-28 animate-pulse rounded bg-[#F0EAE5]" /><div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded bg-[#FAF8F6]" />)}</div></section> : null}
    {error ? <section className="mt-6 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}
    {!loading && !error && detail ? <>
      <section className="mt-6 overflow-hidden rounded-[20px] border border-[#ECE7E1] bg-white"><div className="grid grid-cols-2 lg:grid-cols-4">{kpis.map((kpi, index) => <div key={kpi.label} className={`p-4 sm:p-5 ${index < 2 ? "border-b lg:border-b-0" : ""} ${index % 2 === 0 ? "border-r lg:border-r" : ""} ${index < 3 ? "lg:border-r" : ""} border-[#F1ECE8]`}><p className="text-xs font-semibold text-[#706A66]">{kpi.label}</p><p className="mt-2 text-xl font-bold tracking-[-0.03em] sm:text-2xl">{kpi.value}</p><p className={`mt-2 text-xs font-semibold ${growthClass(kpi.growth)}`}>{growthLabel(kpi.growth)}</p><p className="mt-1 text-[11px] text-[#9C948E]">이전 동일 기간 대비</p></div>)}</div></section>
      <section className="mt-5 rounded-[20px] border border-[#ECE7E1] bg-white px-4 py-4 sm:px-6 sm:py-5"><h2 className="text-[17px] font-bold">매출 추이</h2><div className="mt-4"><TrendChart daily={detail.daily} singleDay={range.startDate === range.endDate} /></div></section>
      <section className="mt-5 rounded-[20px] border border-[#ECE7E1] bg-white px-4 py-4 sm:px-6 sm:py-5"><h2 className="text-[17px] font-bold">채널별 매출</h2>{detail.channel.hasData ? <div className="mt-4 space-y-3">{[["POS 매출", detail.channel.posSales], ["Delivery 매출", detail.channel.deliverySales], ...(detail.channel.otherSales > 0 ? [["기타", detail.channel.otherSales] as [string, number]] : [])].map(([label, value]) => <div key={label}><div className="flex justify-between text-sm"><span className="text-[#706A66]">{label}</span><strong>{formatCurrency(value)}</strong></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F4F1EE]"><div className="h-full rounded-full bg-[#8B6F5B]" style={{ width: `${detail.summary.totalSales > 0 ? Math.min((value / detail.summary.totalSales) * 100, 100) : 0}%` }} /></div></div>)}</div> : <p className="mt-3 text-sm text-[#9C948E]">채널별 매출 데이터가 없습니다.</p>}</section>
      <section className="mt-5 overflow-hidden rounded-[20px] border border-[#ECE7E1] bg-white"><div className="border-b border-[#F1ECE8] px-4 py-4 sm:px-6"><h2 className="text-[17px] font-bold">Top 메뉴</h2></div>{detail.topMenus.length ? <div className="divide-y divide-[#F1ECE8]">{detail.topMenus.map((menu, index) => <div key={menu.name} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6"><span className="text-sm font-bold text-[#8B6F5B]">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{menu.name}</p><p className="mt-0.5 text-xs text-[#9C948E]">{formatNumber(menu.qty)}개</p></div><p className="text-sm font-semibold">{formatCurrency(menu.sales)}</p></div>)}</div> : <p className="px-4 py-8 text-center text-sm text-[#9C948E]">메뉴 판매 데이터가 없습니다.</p>}</section>
      <section className="mt-5 rounded-[20px] border border-[#DCD7FF] bg-[#FBFAFF] px-4 py-4 sm:px-6 sm:py-5"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#7C6CF6]"><i className="fa-solid fa-wand-magic-sparkles text-sm" /></span><div><h2 className="text-xs font-bold text-[#7C6CF6]">AI Coach에서 확인할 포인트</h2><p className="mt-1 text-sm leading-6 text-[#1F1F1F]">{checkpoint(detail)}</p></div></div></section>
    </> : null}
  </div></main>;
}
