import React, { useEffect, useMemo, useState } from "react";
import {
  getMasterDateRange,
  loadMasterDashboard,
  type MasterDashboardResult,
  type MasterDatePreset,
  type MasterDateRange,
  type StoreKpiRow,
} from "../services/masterDashboardService";
import AdminApprovalPage from "./AdminApprovalPage";
import MasterStoreDetailPage from "./MasterStoreDetailPage";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return `${value.toFixed(digits)}%`;
}

function getPresetLabel(preset: MasterDatePreset) {
  if (preset === "today") return "Today";
  if (preset === "thisWeek") return "This Week";
  if (preset === "thisMonth") return "This Month";
  if (preset === "last30Days") return "Last 30 Days";
  return "Custom";
}

function getComparisonLabel(range: MasterDateRange) {
  if (range.preset === "today") return "전일 대비";
  if (range.preset === "thisWeek") return "이전 주 대비";
  if (range.preset === "thisMonth") return "이전 달 대비";

  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return `이전 ${dayCount}일 대비`;
}

function growthClass(rate: number | null | undefined) {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return "text-[#9C948E]";
  if (rate > 0) return "text-emerald-600";
  if (rate < 0) return "text-rose-500";
  return "text-[#706A66]";
}

function growthText(rate: number | null | undefined) {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return "비교 데이터 없음";
  const arrow = rate > 0 ? "↑" : rate < 0 ? "↓" : "→";
  return `${arrow} ${Math.abs(rate).toFixed(1)}%`;
}

function summarizeRows(rows: StoreKpiRow[]) {
  const totalSales = rows.reduce((sum, row) => sum + row.totalSales, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalVisitCount = rows.reduce((sum, row) => sum + row.visitCount, 0);
  const averageAov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const overallConversionRate = totalVisitCount > 0 ? (totalOrders / totalVisitCount) * 100 : 0;

  return {
    totalSales,
    totalOrders,
    averageAov,
    overallConversionRate,
    totalVisitCount,
  };
}

export default function MasterDashboardPage() {
  const [preset, setPreset] = useState<MasterDatePreset>(() => {
    if (typeof window === "undefined") return "today";
    const saved = localStorage.getItem("masterDashboardPreset");
    if (
      saved === "today" ||
      saved === "thisWeek" ||
      saved === "thisMonth" ||
      saved === "last30Days" ||
      saved === "custom"
    ) {
      return saved;
    }
    return "today";
  });

  const [range, setRange] = useState<MasterDateRange>(() => {
    if (typeof window === "undefined") return getMasterDateRange("today");

    const savedPreset = localStorage.getItem("masterDashboardPreset");
    const savedStartDate = localStorage.getItem("masterDashboardStartDate");
    const savedEndDate = localStorage.getItem("masterDashboardEndDate");

    if (savedPreset === "custom" && savedStartDate && savedEndDate) {
      return {
        startDate: savedStartDate,
        endDate: savedEndDate,
        preset: "custom",
      };
    }

    if (
      savedPreset === "today" ||
      savedPreset === "thisWeek" ||
      savedPreset === "thisMonth" ||
      savedPreset === "last30Days"
    ) {
      return getMasterDateRange(savedPreset);
    }

    return getMasterDateRange("today");
  });

  const [result, setResult] = useState<MasterDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApprovalPage, setShowApprovalPage] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    if (typeof window === "undefined") return "ALL";
    return localStorage.getItem("masterDashboardSelectedBrand") || "ALL";
  });

  useEffect(() => {
    if (preset !== "custom") setRange(getMasterDateRange(preset));
  }, [preset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("masterDashboardPreset", preset);
  }, [preset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("masterDashboardSelectedBrand", selectedBrand);
  }, [selectedBrand]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("masterDashboardStartDate", range.startDate);
    localStorage.setItem("masterDashboardEndDate", range.endDate);
  }, [range.startDate, range.endDate]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await loadMasterDashboard(range);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "마스터 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [range.startDate, range.endDate]);

  const brandList = useMemo(() => {
    const brands = Array.from(
      new Set((result?.ranking || []).map((row) => row.brandName).filter(Boolean))
    );
    return ["ALL", ...brands];
  }, [result?.ranking]);

  useEffect(() => {
    if (!brandList.includes(selectedBrand)) setSelectedBrand("ALL");
  }, [brandList, selectedBrand]);

  const visibleRanking = useMemo(() => {
    const rows = result?.ranking || [];
    if (selectedBrand === "ALL") return rows;
    return rows.filter((row) => row.brandName === selectedBrand);
  }, [result?.ranking, selectedBrand]);

  const visibleSummary = useMemo(() => {
    if (!result) return null;
    if (selectedBrand === "ALL") return result.summary;

    const filtered = summarizeRows(visibleRanking);
    return {
      ...result.summary,
      ...filtered,
      topStoreName: visibleRanking[0]?.storeName || "-",
      topStoreSales: visibleRanking[0]?.totalSales || 0,
    };
  }, [result, selectedBrand, visibleRanking]);

  const salesGrowth = useMemo(() => {
    if (!result) return null;
    if (selectedBrand === "ALL") return result.summary.growth.sales.rate;
    return result.brandGrowth?.[selectedBrand]?.rate ?? null;
  }, [result, selectedBrand]);

  const topStores = visibleRanking.slice(0, 5);

  const insightText = useMemo(() => {
    if (!visibleSummary) return "현재 기간 데이터를 확인하고 있어요.";
    if (salesGrowth === null || !Number.isFinite(salesGrowth)) {
      return "비교 가능한 이전 기간 데이터가 충분하지 않습니다.";
    }
    if (salesGrowth <= -10) {
      return `${getComparisonLabel(range)} 매출이 ${Math.abs(salesGrowth).toFixed(1)}% 감소했습니다. 주요 매장의 변화를 먼저 확인해 보세요.`;
    }
    if (salesGrowth >= 10) {
      return `${getComparisonLabel(range)} 매출이 ${salesGrowth.toFixed(1)}% 증가했습니다. 성장한 매장의 운영 포인트를 확인해 보세요.`;
    }
    return `${getComparisonLabel(range)} 매출 변동은 ${salesGrowth.toFixed(1)}%입니다. 큰 변동 없이 유지되고 있습니다.`;
  }, [range, salesGrowth, visibleSummary]);

  const handleCustomDateChange = (key: "startDate" | "endDate", value: string) => {
    setPreset("custom");
    setRange((prev) => ({ ...prev, preset: "custom", [key]: value }));
  };

  if (showApprovalPage) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] text-[#1F1F1F]">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-3 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-[9.5px] font-medium text-[#9C948E] sm:text-sm">Sales Coach AI</p>
              <h1 className="mt-0.5 text-[17px] font-bold leading-[1.2] tracking-[-0.03em] sm:mt-1 sm:text-2xl sm:leading-tight">가입 승인 관리</h1>
              <p className="mt-0.5 text-[10.5px] leading-[1.4] text-[#706A66] sm:mt-2 sm:text-sm">계정 생성 신청 내역을 검토하고 승인합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowApprovalPage(false)}
              className="inline-flex h-8 w-fit items-center justify-center self-start rounded-[8px] border border-[#ECE7E1] bg-white px-3 text-[10.5px] font-medium text-[#706A66] transition hover:bg-[#F7F2EE] sm:h-11 sm:w-auto sm:self-auto sm:rounded-xl sm:px-4 sm:text-sm sm:font-semibold"
            >
              대시보드로 돌아가기
            </button>
          </div>
          <AdminApprovalPage />
        </div>
      </div>
    );
  }

  if (selectedStoreId !== null) {
    return <MasterStoreDetailPage
      storeId={selectedStoreId}
      range={range}
      preset={preset}
      onPresetChange={setPreset}
      onCustomDateChange={handleCustomDateChange}
      onBack={() => setSelectedStoreId(null)}
    />;
  }

  return (
    <main className="min-h-screen bg-[#FAF8F6] text-[#1F1F1F]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <section className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#8B6F5B] sm:text-sm">Master Workspace</p>
            <h1 className="mt-1 text-[22px] font-bold leading-[1.2] tracking-[-0.045em] sm:mt-2 sm:text-[34px] sm:leading-tight">
              안녕하세요, Master님!
            </h1>
            <p className="mt-1 text-[12px] leading-[1.45] text-[#706A66] sm:mt-2 sm:text-base sm:leading-6">
              필요한 지표만 빠르게 확인하고, 변화가 큰 매장부터 살펴보세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApprovalPage(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#8B6F5B] px-4 text-[13px] font-semibold text-white transition hover:bg-[#765C49] active:scale-[0.99] sm:h-12 sm:px-5 sm:text-sm"
          >
            <i className="fa-solid fa-user-check text-xs" />
            가입 승인 관리
          </button>
        </section>

        <section className="mt-5 flex flex-col gap-2 sm:mt-7 sm:gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(["today", "thisWeek", "thisMonth", "last30Days", "custom"] as MasterDatePreset[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPreset(item)}
                  className={`h-10 rounded-xl border px-2.5 text-[12px] font-semibold transition sm:px-4 sm:text-sm ${
                    preset === item
                      ? "border-[#8B6F5B] bg-[#8B6F5B] text-white"
                      : "border-[#ECE7E1] bg-white text-[#706A66] hover:bg-[#F7F2EE]"
                  }`}
                >
                  {getPresetLabel(item)}
                </button>
              )
            )}

            {brandList.length > 2 ? (
              <select
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
                className="h-10 rounded-xl border border-[#ECE7E1] bg-white px-2.5 text-[12px] font-semibold text-[#706A66] outline-none sm:px-3 sm:text-sm"
                aria-label="브랜드 선택"
              >
                {brandList.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand === "ALL" ? "전체 브랜드" : brand}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {preset === "custom" ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <input
                type="date"
                value={range.startDate}
                onChange={(event) => handleCustomDateChange("startDate", event.target.value)}
                className="h-10 rounded-xl border border-[#ECE7E1] bg-white px-2.5 text-[12px] text-[#1F1F1F] sm:h-11 sm:px-3 sm:text-sm"
              />
              <span className="text-[12px] text-[#9C948E] sm:text-sm">~</span>
              <input
                type="date"
                value={range.endDate}
                onChange={(event) => handleCustomDateChange("endDate", event.target.value)}
                className="h-10 rounded-xl border border-[#ECE7E1] bg-white px-2.5 text-[12px] text-[#1F1F1F] sm:h-11 sm:px-3 sm:text-sm"
              />
            </div>
          ) : null}
        </section>

        {error ? (
          <section className="mt-7 rounded-[18px] border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-exclamation mt-0.5 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-rose-700">데이터를 불러오지 못했어요.</p>
                <p className="mt-1 text-sm text-rose-600">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <section className="mt-7 rounded-[20px] border border-[#ECE7E1] bg-white p-6">
            <div className="h-4 w-28 animate-pulse rounded bg-[#F0EAE5]" />
            <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-[#F0EAE5]" />
                  <div className="h-8 w-28 animate-pulse rounded bg-[#F0EAE5]" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && visibleSummary ? (
          <>
            <section className="mt-5 overflow-hidden rounded-[20px] border border-[#ECE7E1] bg-white sm:mt-7">
              <div className="flex flex-col gap-2 border-b border-[#F1ECE8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div>
                  <h2 className="text-[15px] font-bold tracking-[-0.025em] sm:text-[17px]">
                    {getPresetLabel(preset)} 주요 지표
                  </h2>
                  <p className="mt-1 text-[10.5px] text-[#9C948E] sm:text-xs">{range.startDate} ~ {range.endDate}</p>
                </div>
                {selectedBrand !== "ALL" ? (
                  <span className="text-[10.5px] font-semibold text-[#8B6F5B] sm:text-xs">{selectedBrand}</span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4">
                <div className="border-b border-r border-[#F1ECE8] p-3 sm:p-5 lg:border-b-0 lg:p-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#706A66] sm:gap-2 sm:text-xs">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F2EE] text-[11px] text-[#8B6F5B] sm:h-8 sm:w-8"><i className="fa-solid fa-coins" /></span>
                    전체 매출
                  </div>
                  <div className="mt-2 text-[20px] font-bold leading-none tracking-[-0.035em] sm:mt-3 sm:text-2xl">{formatCurrency(visibleSummary.totalSales)}</div>
                  <div className={`mt-1.5 text-[11px] font-semibold sm:mt-2 sm:text-xs ${growthClass(salesGrowth)}`}>{growthText(salesGrowth)}</div>
                  <div className="mt-1 text-[10px] text-[#9C948E] sm:text-[11px]">{getComparisonLabel(range)}</div>
                </div>

                <div className="border-b border-[#F1ECE8] p-3 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#706A66] sm:gap-2 sm:text-xs">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F2EE] text-[11px] text-[#8B6F5B] sm:h-8 sm:w-8"><i className="fa-solid fa-receipt" /></span>
                    전체 주문 수
                  </div>
                  <div className="mt-2 text-[20px] font-bold leading-none tracking-[-0.035em] sm:mt-3 sm:text-2xl">{formatNumber(visibleSummary.totalOrders)}</div>
                  {selectedBrand === "ALL" ? (
                    <div className={`mt-1.5 text-[11px] font-semibold sm:mt-2 sm:text-xs ${growthClass(result?.summary.growth.orders.rate)}`}>
                      {growthText(result?.summary.growth.orders.rate)}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[10px] text-[#9C948E] sm:mt-2 sm:text-xs">선택 브랜드 기준</div>
                  )}
                </div>

                <div className="border-r border-[#F1ECE8] p-3 sm:p-5 lg:p-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#706A66] sm:gap-2 sm:text-xs">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F2EE] text-[11px] text-[#8B6F5B] sm:h-8 sm:w-8"><i className="fa-solid fa-tag" /></span>
                    평균 AOV
                  </div>
                  <div className="mt-2 text-[20px] font-bold leading-none tracking-[-0.035em] sm:mt-3 sm:text-2xl">{formatCurrency(visibleSummary.averageAov)}</div>
                  {selectedBrand === "ALL" ? (
                    <div className={`mt-1.5 text-[11px] font-semibold sm:mt-2 sm:text-xs ${growthClass(result?.summary.growth.aov.rate)}`}>
                      {growthText(result?.summary.growth.aov.rate)}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[10px] text-[#9C948E] sm:mt-2 sm:text-xs">선택 브랜드 기준</div>
                  )}
                </div>

                <div className="p-3 sm:p-5 lg:p-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#706A66] sm:gap-2 sm:text-xs">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F2EE] text-[11px] text-[#8B6F5B] sm:h-8 sm:w-8"><i className="fa-solid fa-user-check" /></span>
                    전체 전환율
                  </div>
                  <div className="mt-2 text-[20px] font-bold leading-none tracking-[-0.035em] text-emerald-600 sm:mt-3 sm:text-2xl">{formatPercent(visibleSummary.overallConversionRate)}</div>
                  <div className="mt-1.5 text-[10px] text-[#706A66] sm:mt-2 sm:text-xs">방문 {formatNumber(visibleSummary.totalVisitCount)} / 주문 {formatNumber(visibleSummary.totalOrders)}</div>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-[20px] border border-[#DCD7FF] bg-[#FBFAFF] px-3.5 py-3.5 sm:mt-5 sm:px-6 sm:py-5">
              <div className="flex items-start gap-2 sm:gap-4">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[#F0EEFF] text-[12px] text-[#7C6CF6] sm:h-11 sm:w-11 sm:rounded-[14px]">
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#7C6CF6] sm:text-xs">AI Coach에서 확인할 포인트</p>
                  <p className="mt-1 text-[14px] font-semibold leading-[1.4] text-[#1F1F1F] sm:mt-1.5 sm:text-[17px] sm:leading-6">{insightText}</p>
                  <p className="mt-1 text-[12px] leading-[1.5] text-[#706A66] sm:mt-1.5 sm:text-sm">이 영역은 현재 지표를 요약한 안내이며, 상세 AI 분석 결과를 새로 생성하지 않습니다.</p>
                </div>
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-[20px] border border-[#ECE7E1] bg-white sm:mt-5">
              <div className="flex items-center justify-between border-b border-[#F1ECE8] px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <h2 className="text-[15px] font-bold tracking-[-0.025em] sm:text-[17px]">주요 매장</h2>
                  <p className="mt-1 text-[10.5px] text-[#9C948E] sm:text-xs">매출 기준 상위 {Math.min(topStores.length, 5)}개 매장</p>
                </div>
              </div>

              {topStores.length > 0 ? (
                <div className="divide-y divide-[#F1ECE8]">
                  {topStores.map((store, index) => {
                    const rate = result?.storeGrowth?.[store.storeId]?.rate ?? null;
                    return (
                      <button
                        key={store.storeId}
                        type="button"
                        onClick={() => setSelectedStoreId(store.storeId)}
                        className="grid w-full grid-cols-[28px_minmax(0,1fr)_auto_12px] items-center gap-2 px-3 py-2.5 text-left transition hover:bg-[#FDF9F5] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A8866B] sm:grid-cols-[36px_minmax(0,1fr)_auto_14px] sm:gap-3 sm:px-6 sm:py-4"
                        aria-label={`${store.storeName} 매장 성과 보기`}
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold sm:h-8 sm:w-8 sm:text-xs ${index === 0 ? "bg-[#F3E4CB] text-[#7A593E]" : "bg-[#F4F1EE] text-[#706A66]"}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#1F1F1F] sm:text-sm">{store.storeName}</p>
                          {store.brandName && store.brandName !== "Unknown" ? <p className="mt-0.5 text-[10.5px] text-[#9C948E] sm:mt-1 sm:text-xs">{store.brandName}</p> : null}
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-[#1F1F1F] sm:text-sm">{formatCurrency(store.totalSales)}</p>
                          <p className={`mt-0.5 text-[11px] font-semibold sm:mt-1 sm:text-xs ${growthClass(rate)}`}>{growthText(rate)}</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[10px] text-[#B5ACA5]" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-7 text-center sm:px-6 sm:py-10">
                  <p className="text-[12px] font-semibold text-[#706A66] sm:text-sm">표시할 매장 데이터가 없습니다.</p>
                  <p className="mt-1 text-[10.5px] text-[#9C948E] sm:text-xs">선택한 기간이나 브랜드를 다시 확인해 주세요.</p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
