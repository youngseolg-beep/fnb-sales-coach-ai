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
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#9C948E]">Sales Coach AI</p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em]">가입 승인 관리</h1>
              <p className="mt-2 text-sm text-[#706A66]">계정 생성 신청 내역을 검토하고 승인합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowApprovalPage(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#ECE7E1] bg-white px-4 text-sm font-semibold text-[#706A66] transition hover:bg-[#F7F2EE] sm:w-auto"
            >
              대시보드로 돌아가기
            </button>
          </div>
          <AdminApprovalPage />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F6] text-[#1F1F1F]">
      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#8B6F5B]">Master Workspace</p>
            <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.045em] sm:text-[34px]">
              안녕하세요, Master님!
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#706A66] sm:text-base">
              필요한 지표만 빠르게 확인하고, 변화가 큰 매장부터 살펴보세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApprovalPage(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#8B6F5B] px-5 text-sm font-semibold text-white transition hover:bg-[#765C49] active:scale-[0.99]"
          >
            <i className="fa-solid fa-user-check text-xs" />
            가입 승인 관리
          </button>
        </section>

        <section className="mt-7 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["today", "thisWeek", "thisMonth", "last30Days", "custom"] as MasterDatePreset[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPreset(item)}
                  className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
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
                className="h-10 rounded-xl border border-[#ECE7E1] bg-white px-3 text-sm font-semibold text-[#706A66] outline-none"
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
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={range.startDate}
                onChange={(event) => handleCustomDateChange("startDate", event.target.value)}
                className="h-11 rounded-xl border border-[#ECE7E1] bg-white px-3 text-sm text-[#1F1F1F]"
              />
              <span className="text-sm text-[#9C948E]">~</span>
              <input
                type="date"
                value={range.endDate}
                onChange={(event) => handleCustomDateChange("endDate", event.target.value)}
                className="h-11 rounded-xl border border-[#ECE7E1] bg-white px-3 text-sm text-[#1F1F1F]"
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
            <section className="mt-7 overflow-hidden rounded-[20px] border border-[#ECE7E1] bg-white">
              <div className="flex flex-col gap-2 border-b border-[#F1ECE8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-[17px] font-bold tracking-[-0.025em]">
                    {getPresetLabel(preset)} 주요 지표
                  </h2>
                  <p className="mt-1 text-xs text-[#9C948E]">{range.startDate} ~ {range.endDate}</p>
                </div>
                {selectedBrand !== "ALL" ? (
                  <span className="text-xs font-semibold text-[#8B6F5B]">{selectedBrand}</span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4">
                <div className="border-b border-r border-[#F1ECE8] p-5 lg:border-b-0 lg:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#706A66]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F2EE] text-[#8B6F5B]"><i className="fa-solid fa-coins" /></span>
                    전체 매출
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-[-0.035em]">{formatCurrency(visibleSummary.totalSales)}</div>
                  <div className={`mt-2 text-xs font-semibold ${growthClass(salesGrowth)}`}>{growthText(salesGrowth)}</div>
                  <div className="mt-1 text-[11px] text-[#9C948E]">{getComparisonLabel(range)}</div>
                </div>

                <div className="border-b border-[#F1ECE8] p-5 lg:border-b-0 lg:border-r lg:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#706A66]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F2EE] text-[#8B6F5B]"><i className="fa-solid fa-receipt" /></span>
                    전체 주문 수
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-[-0.035em]">{formatNumber(visibleSummary.totalOrders)}</div>
                  {selectedBrand === "ALL" ? (
                    <div className={`mt-2 text-xs font-semibold ${growthClass(result?.summary.growth.orders.rate)}`}>
                      {growthText(result?.summary.growth.orders.rate)}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-[#9C948E]">선택 브랜드 기준</div>
                  )}
                </div>

                <div className="border-r border-[#F1ECE8] p-5 lg:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#706A66]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F2EE] text-[#8B6F5B]"><i className="fa-solid fa-tag" /></span>
                    평균 AOV
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-[-0.035em]">{formatCurrency(visibleSummary.averageAov)}</div>
                  {selectedBrand === "ALL" ? (
                    <div className={`mt-2 text-xs font-semibold ${growthClass(result?.summary.growth.aov.rate)}`}>
                      {growthText(result?.summary.growth.aov.rate)}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-[#9C948E]">선택 브랜드 기준</div>
                  )}
                </div>

                <div className="p-5 lg:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#706A66]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F2EE] text-[#8B6F5B]"><i className="fa-solid fa-user-check" /></span>
                    전체 전환율
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-[-0.035em] text-emerald-600">{formatPercent(visibleSummary.overallConversionRate)}</div>
                  <div className="mt-2 text-xs text-[#706A66]">방문 {formatNumber(visibleSummary.totalVisitCount)} / 주문 {formatNumber(visibleSummary.totalOrders)}</div>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-[20px] border border-[#DCD7FF] bg-[#FBFAFF] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F0EEFF] text-[#7C6CF6]">
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#7C6CF6]">AI Coach에서 확인할 포인트</p>
                  <p className="mt-1.5 text-base font-semibold leading-6 text-[#1F1F1F] sm:text-[17px]">{insightText}</p>
                  <p className="mt-1.5 text-sm leading-5 text-[#706A66]">이 영역은 현재 지표를 요약한 안내이며, 상세 AI 분석 결과를 새로 생성하지 않습니다.</p>
                </div>
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-[20px] border border-[#ECE7E1] bg-white">
              <div className="flex items-center justify-between border-b border-[#F1ECE8] px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-[17px] font-bold tracking-[-0.025em]">주요 매장</h2>
                  <p className="mt-1 text-xs text-[#9C948E]">매출 기준 상위 {Math.min(topStores.length, 5)}개 매장</p>
                </div>
              </div>

              {topStores.length > 0 ? (
                <div className="divide-y divide-[#F1ECE8]">
                  {topStores.map((store, index) => {
                    const rate = result?.storeGrowth?.[store.storeId]?.rate ?? null;
                    return (
                      <div key={store.storeId} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:px-6">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-[#F3E4CB] text-[#7A593E]" : "bg-[#F4F1EE] text-[#706A66]"}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1F1F1F]">{store.storeName}</p>
                          <p className="mt-1 text-xs text-[#9C948E]">{store.brandName || "브랜드 정보 없음"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#1F1F1F]">{formatCurrency(store.totalSales)}</p>
                          <p className={`mt-1 text-xs font-semibold ${growthClass(rate)}`}>{growthText(rate)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-10 text-center sm:px-6">
                  <p className="text-sm font-semibold text-[#706A66]">표시할 매장 데이터가 없습니다.</p>
                  <p className="mt-1 text-xs text-[#9C948E]">선택한 기간이나 브랜드를 다시 확인해 주세요.</p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
