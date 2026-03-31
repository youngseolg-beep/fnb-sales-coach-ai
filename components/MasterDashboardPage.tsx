import React, { useEffect, useMemo, useState } from "react";
import {
  getMasterDateRange,
  loadMasterDashboard,
  type MasterDatePreset,
  type MasterDateRange,
  type MasterDashboardResult,
  type RiskCard,
  type StoreKpiRow,
} from "../services/masterDashboardService";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value: number, digits = 1) {
  return `${(value || 0).toFixed(digits)}%`;
}

function formatGrowth(rate: number | null) {
  if (rate === null || !Number.isFinite(rate)) return "-";
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}

function growthTone(rate: number | null) {
  if (rate === null || !Number.isFinite(rate)) {
    return "text-slate-400";
  }
  if (rate > 0) return "text-emerald-400";
  if (rate < 0) return "text-rose-400";
  return "text-slate-300";
}

function riskTone(level: RiskCard["level"]) {
  if (level === "danger") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }
  if (level === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function getPresetLabel(preset: MasterDatePreset) {
  if (preset === "today") return "Today";
  if (preset === "thisWeek") return "This Week";
  if (preset === "thisMonth") return "This Month";
  if (preset === "last30Days") return "Last 30 Days";
  return "Custom";
}

function getRangeLabel(range: MasterDateRange) {
  return `${range.startDate} ~ ${range.endDate}`;
}

function buildDetailRiskText(row: StoreKpiRow) {
  const items: string[] = [];

  if (row.totalSales < 1000) items.push("매출 위험");
  else if (row.totalSales < 3000) items.push("매출 주의");

  if (row.aov < 12) items.push("객단가 위험");
  else if (row.aov < 16) items.push("객단가 주의");

  if (row.conversionRate < 10) items.push("전환율 위험");
  else if (row.conversionRate < 15) items.push("전환율 주의");

  return items.length > 0 ? items.join(" / ") : "정상";
}

export default function MasterDashboardPage() {
  const [preset, setPreset] = useState<MasterDatePreset>("today");
  const [range, setRange] = useState<MasterDateRange>(getMasterDateRange("today"));
  const [result, setResult] = useState<MasterDashboardResult | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (preset !== "custom") {
      setRange(getMasterDateRange(preset));
    }
  }, [preset]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");
        const data = await loadMasterDashboard(range);

        if (cancelled) return;

        setResult(data);

        if (!data.ranking.length) {
          setSelectedStoreId(null);
        } else if (!data.ranking.some((row) => row.storeId === selectedStoreId)) {
          setSelectedStoreId(data.ranking[0].storeId);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "마스터 대시보드 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [range.startDate, range.endDate]);

  const summary = result?.summary;
  const ranking = result?.ranking || [];
  const risks = result?.risks || [];

  const selectedStore = useMemo(() => {
    return ranking.find((row) => row.storeId === selectedStoreId) || null;
  }, [ranking, selectedStoreId]);

  const handlePresetChange = (nextPreset: MasterDatePreset) => {
    setPreset(nextPreset);
  };

  const handleCustomDateChange = (key: "startDate" | "endDate", value: string) => {
    setPreset("custom");
    setRange((prev) => ({
      ...prev,
      preset: "custom",
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-400">Sales Coach AI</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Master Dashboard</h1>
              <div className="mt-2 text-sm text-slate-400">
                {getPresetLabel(preset)} · {getRangeLabel(range)}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {(["today", "thisWeek", "thisMonth", "last30Days", "custom"] as MasterDatePreset[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePresetChange(item)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      preset === item
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {getPresetLabel(item)}
                  </button>
                ))}
              </div>

              {preset === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={range.startDate}
                    onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="date"
                    value={range.endDate}
                    onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
            데이터 불러오는 중...
          </div>
        ) : null}

        {!loading && summary && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">전체 매출</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(summary.totalSales)}</div>
                <div className={`mt-2 text-sm font-medium ${growthTone(summary.growth.sales.rate)}`}>
                  {formatGrowth(summary.growth.sales.rate)}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">전체 주문 수</div>
                <div className="mt-2 text-3xl font-semibold">{formatNumber(summary.totalOrders)}</div>
                <div className={`mt-2 text-sm font-medium ${growthTone(summary.growth.orders.rate)}`}>
                  {formatGrowth(summary.growth.orders.rate)}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">평균 매출</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(summary.averageSales)}</div>
                <div className="mt-2 text-sm text-slate-400">매장당 평균</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">전체 평균 AOV</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(summary.averageAov)}</div>
                <div className={`mt-2 text-sm font-medium ${growthTone(summary.growth.aov.rate)}`}>
                  {formatGrowth(summary.growth.aov.rate)}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">전체 전환율</div>
                <div className="mt-2 text-3xl font-semibold">{formatPercent(summary.overallConversionRate)}</div>
                <div className="mt-2 text-sm text-slate-400">방문 {formatNumber(summary.totalVisitCount)} / 주문 {formatNumber(summary.totalOrders)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">Top Store</div>
                <div className="mt-2 text-2xl font-semibold">{summary.topStoreName}</div>
                <div className="mt-2 text-sm text-slate-300">{formatCurrency(summary.topStoreSales)}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">매출 성장률</div>
                <div className={`mt-2 text-2xl font-semibold ${growthTone(summary.growth.sales.rate)}`}>
                  {formatGrowth(summary.growth.sales.rate)}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  현재 {formatCurrency(summary.growth.sales.current)} / 이전 {formatCurrency(summary.growth.sales.previous)}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">주문/AOV 성장률</div>
                <div className="mt-2 flex items-center gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Orders</div>
                    <div className={`text-lg font-semibold ${growthTone(summary.growth.orders.rate)}`}>
                      {formatGrowth(summary.growth.orders.rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">AOV</div>
                    <div className={`text-lg font-semibold ${growthTone(summary.growth.aov.rate)}`}>
                      {formatGrowth(summary.growth.aov.rate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">매장별 매출 순위</div>
                    <div className="mt-1 text-lg font-semibold">Store Ranking</div>
                  </div>
                  <div className="text-sm text-slate-500">{ranking.length} stores</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-slate-400">
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Store</th>
                        <th className="px-3 py-3">Sales</th>
                        <th className="px-3 py-3">Orders</th>
                        <th className="px-3 py-3">AOV</th>
                        <th className="px-3 py-3">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((row, index) => {
                        const isSelected = row.storeId === selectedStoreId;

                        return (
                          <tr
                            key={row.storeId}
                            onClick={() => setSelectedStoreId(row.storeId)}
                            className={`cursor-pointer border-b border-white/5 transition hover:bg-white/5 ${
                              isSelected ? "bg-blue-500/10" : ""
                            }`}
                          >
                            <td className="px-3 py-3">{index + 1}</td>
                            <td className="px-3 py-3 font-medium text-slate-100">{row.storeName}</td>
                            <td className="px-3 py-3">{formatCurrency(row.totalSales)}</td>
                            <td className="px-3 py-3">{formatNumber(row.orders)}</td>
                            <td className="px-3 py-3">{formatCurrency(row.aov)}</td>
                            <td className="px-3 py-3">{formatPercent(row.conversionRate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {ranking.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">
                    해당 기간 데이터가 없습니다.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm text-slate-400">선택 매장 상세</div>
                  <div className="mt-1 text-lg font-semibold">{selectedStore?.storeName || "-"}</div>

                  {selectedStore ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="text-slate-400">매출</div>
                        <div className="mt-1 font-semibold">{formatCurrency(selectedStore.totalSales)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="text-slate-400">주문 수</div>
                        <div className="mt-1 font-semibold">{formatNumber(selectedStore.orders)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="text-slate-400">방문 수</div>
                        <div className="mt-1 font-semibold">{formatNumber(selectedStore.visitCount)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="text-slate-400">AOV</div>
                        <div className="mt-1 font-semibold">{formatCurrency(selectedStore.aov)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="text-slate-400">Conversion</div>
                        <div className="mt-1 font-semibold">{formatPercent(selectedStore.conversionRate)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="text-slate-400">Risk Check</div>
                        <div className="mt-1 font-semibold">{buildDetailRiskText(selectedStore)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
                      순위표에서 매장을 선택하세요.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm text-slate-400">문제 매장 자동 탐지</div>
                  <div className="mt-1 text-lg font-semibold">Risk Cards</div>

                  <div className="mt-4 flex flex-col gap-3">
                    {risks.length > 0 ? (
                      risks.map((risk, index) => (
                        <div
                          key={`${risk.storeId}-${risk.type}-${index}`}
                          className={`rounded-2xl border p-3 ${riskTone(risk.level)}`}
                        >
                          <div className="text-sm font-semibold">{risk.label}</div>
                          <div className="mt-1 text-sm">{risk.storeName}</div>
                          <div className="mt-1 text-xs opacity-80">
                            {risk.type === "sales" && formatCurrency(risk.value)}
                            {risk.type === "aov" && formatCurrency(risk.value)}
                            {risk.type === "conversion" && formatPercent(risk.value)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
                        현재 위험 카드가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
