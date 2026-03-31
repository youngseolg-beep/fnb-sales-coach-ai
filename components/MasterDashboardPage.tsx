import React, { useEffect, useMemo, useState } from "react";
import { loadAllStoresRange, type MasterSalesRow } from "../services/masterDashboardService";
import { formatLocalDate } from "../utils2/date";
import { supabase } from "../services/supabaseClient";

type StoreSummary = {
  storeId: number;
  storeName: string;
  sales: number;
  orders: number;
  visits: number;
  days: number;
};

type AlertCard = {
  type: "sales" | "aov" | "conversion";
  severity: "high" | "medium";
  title: string;
  storeName: string;
  value: string;
  reason: string;
};

type FilterKey = "today" | "this_week" | "this_month" | "last_30_days" | "custom";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_30_days", label: "Last 30 Days" },
  { key: "custom", label: "Custom" },
];

const toSafeNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getToday = () => formatLocalDate(new Date());

const getDateRangeByFilter = (
  filter: FilterKey,
  customStartDate: string,
  customEndDate: string
) => {
  const today = new Date();
  const end = formatLocalDate(today);

  if (filter === "custom") {
    const normalizedStart = customStartDate || end;
    const normalizedEnd = customEndDate || normalizedStart;
    return normalizedStart <= normalizedEnd
      ? { start: normalizedStart, end: normalizedEnd }
      : { start: normalizedEnd, end: normalizedStart };
  }

  if (filter === "today") {
    return { start: end, end };
  }

  if (filter === "this_week") {
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    return {
      start: formatLocalDate(monday),
      end,
    };
  }

  if (filter === "last_30_days") {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 29);
    return {
      start: formatLocalDate(startDate),
      end,
    };
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: formatLocalDate(monthStart),
    end,
  };
};

export default function MasterDashboardPage() {
  const todayStr = useMemo(() => getToday(), []);
  const monthStartStr = useMemo(() => {
    const today = new Date();
    return formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const [rows, setRows] = useState<MasterSalesRow[]>([]);
  const [storeMap, setStoreMap] = useState<Record<number, string>>({});
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("this_month");
  const [customStartDate, setCustomStartDate] = useState(monthStartStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);
const [errorMsg, setErrorMsg] = useState("");

useEffect(() => {
  let isMounted = true;

  const run = async () => {
    try {
      if (loading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setErrorMsg("");

      const [salesRes, storeRes] = await Promise.all([
        loadAllStoresRange(dateRange.start, dateRange.end),
        supabase.from("stores").select("*").order("id", { ascending: true }),
      ]);

      if (!isMounted) return;

      const nextStoreMap: Record<number, string> = {};
      (storeRes.data || []).forEach((store: any) => {
        nextStoreMap[Number(store.id)] = String(store.store_name ?? `Store ${store.id}`);
      });

      setStoreMap(nextStoreMap);
      setRows(salesRes);
    } catch (error) {
      console.error("MasterDashboardPage load error:", error);
      if (!isMounted) return;
      setErrorMsg("대시보드 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      if (!isMounted) return;
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  run();

  return () => {
    isMounted = false;
  };
}, [dateRange.start, dateRange.end]);

if (loading) {
  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-8">
          <div className="text-[11px] font-black tracking-[0.25em] uppercase text-indigo-500">
            Master Dashboard
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">전체 매장 통합 현황</div>
          <div className="mt-2 text-sm font-medium text-slate-500">
            전체 매장 데이터를 불러오는 중입니다.
          </div>
        </div>
      </div>
    </div>
  );
}

  const storeSummaries = useMemo<StoreSummary[]>(() => {
    const map = new Map<number, StoreSummary>();

    for (const row of rows) {
      const storeId = Number(row.store_id);
      if (!Number.isFinite(storeId)) continue;

      const prev = map.get(storeId) ?? {
        storeId,
        storeName: storeMap[storeId] || `Store ${storeId}`,
        sales: 0,
        orders: 0,
        visits: 0,
        days: 0,
      };

      prev.sales += toSafeNumber((row as any).total_sales ?? (row as any).posSales ?? 0, 0);
      prev.orders += toSafeNumber((row as any).orders ?? 0, 0);
      prev.visits += toSafeNumber((row as any).visit_count ?? (row as any).visitCount ?? 0, 0);
      prev.days += 1;

      map.set(storeId, prev);
    }

    return Array.from(map.values()).sort((a, b) => b.sales - a.sales);
  }, [rows, storeMap]);

  useEffect(() => {
    if (storeSummaries.length === 0) {
      setSelectedStoreId(null);
      return;
    }

    if (
      selectedStoreId == null ||
      !storeSummaries.some((store) => store.storeId === selectedStoreId)
    ) {
      setSelectedStoreId(storeSummaries[0].storeId);
    }
  }, [storeSummaries, selectedStoreId]);

  const totalSales = useMemo(
    () => storeSummaries.reduce((sum, store) => sum + store.sales, 0),
    [storeSummaries]
  );

  const totalOrders = useMemo(
    () => storeSummaries.reduce((sum, store) => sum + store.orders, 0),
    [storeSummaries]
  );

  const totalVisits = useMemo(
    () => storeSummaries.reduce((sum, store) => sum + store.visits, 0),
    [storeSummaries]
  );

  const storeCount = storeSummaries.length;
  const avgSalesPerStore = storeCount > 0 ? totalSales / storeCount : 0;
  const totalAov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalConversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
  const topStore = storeSummaries[0] ?? null;

  const averageAovAcrossStores = useMemo(() => {
    if (storeSummaries.length === 0) return 0;
    return (
      storeSummaries.reduce((sum, store) => {
        const aov = store.orders > 0 ? store.sales / store.orders : 0;
        return sum + aov;
      }, 0) / storeSummaries.length
    );
  }, [storeSummaries]);

  const averageConversionAcrossStores = useMemo(() => {
    if (storeSummaries.length === 0) return 0;
    return (
      storeSummaries.reduce((sum, store) => {
        const conversion = store.visits > 0 ? (store.orders / store.visits) * 100 : 0;
        return sum + conversion;
      }, 0) / storeSummaries.length
    );
  }, [storeSummaries]);

  const alertCards = useMemo<AlertCard[]>(() => {
    if (storeSummaries.length === 0) return [];

    const avgSales = avgSalesPerStore;
    const avgAov = averageAovAcrossStores;
    const avgConversion = averageConversionAcrossStores;
    const cards: AlertCard[] = [];

    for (const store of storeSummaries) {
      const aov = store.orders > 0 ? store.sales / store.orders : 0;
      const conversion = store.visits > 0 ? (store.orders / store.visits) * 100 : 0;

      if (avgSales > 0 && store.sales < avgSales * 0.6) {
        cards.push({
          type: "sales",
          severity: "high",
          title: "매출 위험 매장",
          storeName: store.storeName,
          value: `$${Math.round(store.sales).toLocaleString()}`,
          reason: `평균 매장 매출 대비 ${((store.sales / avgSales) * 100).toFixed(1)}% 수준`,
        });
      } else if (avgSales > 0 && store.sales < avgSales * 0.8) {
        cards.push({
          type: "sales",
          severity: "medium",
          title: "매출 주의 매장",
          storeName: store.storeName,
          value: `$${Math.round(store.sales).toLocaleString()}`,
          reason: `평균 매장 매출 대비 ${((store.sales / avgSales) * 100).toFixed(1)}% 수준`,
        });
      }

      if (avgAov > 0 && aov < avgAov * 0.75) {
        cards.push({
          type: "aov",
          severity: "high",
          title: "객단가 위험 매장",
          storeName: store.storeName,
          value: `$${aov.toFixed(2)}`,
          reason: `평균 객단가 대비 ${((aov / avgAov) * 100).toFixed(1)}% 수준`,
        });
      } else if (avgAov > 0 && aov < avgAov * 0.9) {
        cards.push({
          type: "aov",
          severity: "medium",
          title: "객단가 주의 매장",
          storeName: store.storeName,
          value: `$${aov.toFixed(2)}`,
          reason: `평균 객단가 대비 ${((aov / avgAov) * 100).toFixed(1)}% 수준`,
        });
      }

      if (avgConversion > 0 && conversion < avgConversion * 0.75) {
        cards.push({
          type: "conversion",
          severity: "high",
          title: "전환율 위험 매장",
          storeName: store.storeName,
          value: `${conversion.toFixed(1)}%`,
          reason: `평균 전환율 대비 ${((conversion / avgConversion) * 100).toFixed(1)}% 수준`,
        });
      } else if (avgConversion > 0 && conversion < avgConversion * 0.9) {
        cards.push({
          type: "conversion",
          severity: "medium",
          title: "전환율 주의 매장",
          storeName: store.storeName,
          value: `${conversion.toFixed(1)}%`,
          reason: `평균 전환율 대비 ${((conversion / avgConversion) * 100).toFixed(1)}% 수준`,
        });
      }
    }

    const priority = { high: 0, medium: 1 };

    return cards
      .sort((a, b) => priority[a.severity] - priority[b.severity])
      .slice(0, 6);
  }, [storeSummaries, avgSalesPerStore, averageAovAcrossStores, averageConversionAcrossStores]);

  const selectedStore = useMemo(() => {
    if (selectedStoreId == null) return null;
    return storeSummaries.find((store) => store.storeId === selectedStoreId) ?? null;
  }, [storeSummaries, selectedStoreId]);

  const selectedStoreAov =
    selectedStore && selectedStore.orders > 0 ? selectedStore.sales / selectedStore.orders : 0;

  const selectedStoreConversion =
    selectedStore && selectedStore.visits > 0
      ? (selectedStore.orders / selectedStore.visits) * 100
      : 0;

  const selectedStoreShare =
    selectedStore && totalSales > 0 ? (selectedStore.sales / totalSales) * 100 : 0;

  const selectedStoreRank = selectedStore
    ? storeSummaries.findIndex((store) => store.storeId === selectedStore.storeId) + 1
    : 0;

  const selectedStoreAlerts = useMemo(() => {
    if (!selectedStore) return [];

    const messages: { label: string; value: string; severity: "high" | "medium" }[] = [];

    if (avgSalesPerStore > 0 && selectedStore.sales < avgSalesPerStore * 0.6) {
      messages.push({
        label: "매출 위험",
        value: `평균 매출 대비 ${((selectedStore.sales / avgSalesPerStore) * 100).toFixed(1)}%`,
        severity: "high",
      });
    } else if (avgSalesPerStore > 0 && selectedStore.sales < avgSalesPerStore * 0.8) {
      messages.push({
        label: "매출 주의",
        value: `평균 매출 대비 ${((selectedStore.sales / avgSalesPerStore) * 100).toFixed(1)}%`,
        severity: "medium",
      });
    }

    if (averageAovAcrossStores > 0 && selectedStoreAov < averageAovAcrossStores * 0.75) {
      messages.push({
        label: "객단가 위험",
        value: `평균 객단가 대비 ${((selectedStoreAov / averageAovAcrossStores) * 100).toFixed(1)}%`,
        severity: "high",
      });
    } else if (averageAovAcrossStores > 0 && selectedStoreAov < averageAovAcrossStores * 0.9) {
      messages.push({
        label: "객단가 주의",
        value: `평균 객단가 대비 ${((selectedStoreAov / averageAovAcrossStores) * 100).toFixed(1)}%`,
        severity: "medium",
      });
    }

    if (
      averageConversionAcrossStores > 0 &&
      selectedStoreConversion < averageConversionAcrossStores * 0.75
    ) {
      messages.push({
        label: "전환율 위험",
        value: `평균 전환율 대비 ${((selectedStoreConversion / averageConversionAcrossStores) * 100).toFixed(1)}%`,
        severity: "high",
      });
    } else if (
      averageConversionAcrossStores > 0 &&
      selectedStoreConversion < averageConversionAcrossStores * 0.9
    ) {
      messages.push({
        label: "전환율 주의",
        value: `평균 전환율 대비 ${((selectedStoreConversion / averageConversionAcrossStores) * 100).toFixed(1)}%`,
        severity: "medium",
      });
    }

    return messages;
  }, [
    selectedStore,
    selectedStoreAov,
    selectedStoreConversion,
    avgSalesPerStore,
    averageAovAcrossStores,
    averageConversionAcrossStores,
  ]);

  const selectedStoreSummaryText = useMemo(() => {
    if (!selectedStore) return "";

    const summaryParts: string[] = [];

    if (avgSalesPerStore > 0 && selectedStore.sales < avgSalesPerStore * 0.8) {
      summaryParts.push("매출이 평균 대비 낮음");
    }
    if (averageAovAcrossStores > 0 && selectedStoreAov < averageAovAcrossStores * 0.9) {
      summaryParts.push("객단가 개선 필요");
    }
    if (
      averageConversionAcrossStores > 0 &&
      selectedStoreConversion < averageConversionAcrossStores * 0.9
    ) {
      summaryParts.push("전환율 개선 필요");
    }

    if (summaryParts.length === 0) {
      return "현재 기준으로 큰 이상 징후 없이 안정적으로 운영 중입니다.";
    }

    return `${summaryParts.join(" / ")} 상태입니다.`;
  }, [
    selectedStore,
    selectedStoreAov,
    selectedStoreConversion,
    avgSalesPerStore,
    averageAovAcrossStores,
    averageConversionAcrossStores,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-8">
            <div className="text-[11px] font-black tracking-[0.25em] uppercase text-indigo-500">
              Master Dashboard
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">전체 매장 통합 현황</div>
            <div className="mt-2 text-sm font-medium text-slate-500">
              전체 매장 데이터를 불러오는 중입니다.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-rose-200 rounded-[28px] shadow-sm p-8">
            <div className="text-[11px] font-black tracking-[0.25em] uppercase text-rose-500">
              Master Dashboard
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">전체 매장 통합 현황</div>
            <div className="mt-2 text-sm font-medium text-rose-500">{errorMsg}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-5 py-6 md:px-8 md:py-8 space-y-6">
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-600 rounded-[32px] p-7 md:p-9 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-black tracking-[0.28em] uppercase text-indigo-200">
                  Master Dashboard
                </div>
                <h1 className="mt-3 text-3xl md:text-4xl font-black text-white tracking-tight">
                  전체 매장 통합 현황
                </h1>
                <p className="mt-3 text-sm md:text-base font-medium text-indigo-100">
                  기준 기간 {dateRange.start} ~ {dateRange.end}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-full lg:min-w-[360px] lg:max-w-[420px]">
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-4">
                  <div className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-200">
                    Total Stores
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {storeCount.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-4">
                  <div className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-200">
                    Top Store
                  </div>
                  <div className="mt-2 text-lg font-black text-white truncate">
                    {topStore ? topStore.storeName : "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => {
                const active = selectedFilter === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedFilter(option.key)}
                    className={`h-11 rounded-2xl px-4 text-sm font-black transition-all ${
                      active
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {selectedFilter === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                <label className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3">
                  <div className="text-[10px] font-black tracking-[0.18em] uppercase text-indigo-200">
                    Start Date
                  </div>
                  <input
                    type="date"
                    value={customStartDate}
                    max={customEndDate || todayStr}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="mt-2 w-full bg-transparent text-white font-bold outline-none"
                  />
                </label>

                <label className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3">
                  <div className="text-[10px] font-black tracking-[0.18em] uppercase text-indigo-200">
                    End Date
                  </div>
                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate}
                    max={todayStr}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="mt-2 w-full bg-transparent text-white font-bold outline-none"
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
            <div className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">
              Total Sales
            </div>
            <div className="mt-4 text-3xl font-black text-slate-900">
              ${Math.round(totalSales).toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">전체 매장 합산 매출</div>
          </div>

          <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
            <div className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">
              Total Orders
            </div>
            <div className="mt-4 text-3xl font-black text-slate-900">
              {Math.round(totalOrders).toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">전체 주문 수</div>
          </div>

          <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
            <div className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">
              Avg Sales / Store
            </div>
            <div className="mt-4 text-3xl font-black text-slate-900">
              ${Math.round(avgSalesPerStore).toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">매장당 평균 매출</div>
          </div>

          <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
            <div className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">
              Overall AOV
            </div>
            <div className="mt-4 text-3xl font-black text-slate-900">
              ${totalAov.toFixed(2)}
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">전체 평균 객단가</div>
          </div>
        </section>

        <section className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.22em] uppercase text-rose-500">
                Alert Center
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900">문제 매장 자동 탐지</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                평균 대비 낮은 매출 · 객단가 · 전환율을 자동 탐지합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600">
              총 {alertCards.length}건 탐지
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {alertCards.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <div className="text-lg font-black text-slate-900">이상 징후 없음</div>
                <div className="mt-2 text-sm font-medium text-slate-500">
                  현재 기준으로 평균 대비 눈에 띄는 문제 매장이 없습니다.
                </div>
              </div>
            ) : (
              alertCards.map((alert, index) => {
                const isHigh = alert.severity === "high";

                return (
                  <div
                    key={`${alert.type}_${alert.storeName}_${index}`}
                    className={`rounded-[24px] border p-5 shadow-sm ${
                      isHigh ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black tracking-[0.18em] uppercase ${
                          isHigh ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                        }`}
                      >
                        {isHigh ? "High Risk" : "Watch"}
                      </div>
                      <div
                        className={`text-sm font-black ${
                          isHigh ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {alert.value}
                      </div>
                    </div>

                    <div className="mt-4 text-lg font-black text-slate-900">{alert.title}</div>
                    <div className="mt-2 text-base font-bold text-slate-700">{alert.storeName}</div>
                    <div className="mt-3 text-sm font-medium text-slate-600">{alert.reason}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="space-y-4">
            <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">매장별 매출 순위</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    선택 기간 기준 · 행 클릭 시 상세 보기
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                  총 {storeCount}개 매장
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-4 text-left text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                        Rank
                      </th>
                      <th className="px-4 py-4 text-left text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                        Store
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                        Sales
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                        Orders
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                        Visits
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                        AOV
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeSummaries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-sm font-medium text-slate-400"
                        >
                          표시할 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      storeSummaries.map((store, index) => {
                        const aov = store.orders > 0 ? store.sales / store.orders : 0;
                        const isSelected = selectedStoreId === store.storeId;

                        return (
                          <tr
                            key={store.storeId}
                            className={`border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
                              isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"
                            }`}
                            onClick={() => setSelectedStoreId(store.storeId)}
                          >
                            <td className="px-4 py-4">
                              <div className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-black text-white">
                                #{index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-black text-slate-900">{store.storeName}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-400">
                                store_id: {store.storeId}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-black text-slate-900">
                              ${Math.round(store.sales).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-600">
                              {Math.round(store.orders).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-600">
                              {Math.round(store.visits).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-600">
                              ${aov.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedStore && (
              <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[11px] font-black tracking-[0.22em] uppercase text-indigo-500">
                      Selected Store Detail
                    </div>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {selectedStore.storeName}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      현재 선택한 매장 상세 현황
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                    매출 순위 #{selectedStoreRank}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      Sales
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900">
                      ${Math.round(selectedStore.sales).toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      Orders
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900">
                      {Math.round(selectedStore.orders).toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      Visits
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900">
                      {Math.round(selectedStore.visits).toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      AOV
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900">
                      ${selectedStoreAov.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      Conversion
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900">
                      {selectedStoreConversion.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
                  <div className="rounded-[24px] border border-slate-200 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      Store Summary
                    </div>
                    <div className="mt-3 text-lg font-black text-slate-900">
                      전체 매출 비중 {selectedStoreShare.toFixed(1)}%
                    </div>
                    <div className="mt-3 text-sm font-medium text-slate-600">
                      {selectedStoreSummaryText}
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-slate-900"
                        style={{ width: `${Math.min(selectedStoreShare, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 p-5">
                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                      Risk Check
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedStoreAlerts.length === 0 ? (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                          <div className="text-sm font-black text-emerald-700">정상 운영</div>
                          <div className="mt-1 text-sm font-medium text-emerald-600">
                            현재 기준으로 평균 대비 뚜렷한 위험 신호가 없습니다.
                          </div>
                        </div>
                      ) : (
                        selectedStoreAlerts.map((item, index) => (
                          <div
                            key={`${item.label}_${index}`}
                            className={`rounded-2xl px-4 py-4 border ${
                              item.severity === "high"
                                ? "bg-rose-50 border-rose-200"
                                : "bg-amber-50 border-amber-200"
                            }`}
                          >
                            <div
                              className={`text-sm font-black ${
                                item.severity === "high" ? "text-rose-700" : "text-amber-700"
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600">
                              {item.value}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
              <div className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">
                Overall Conversion
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">
                {totalConversionRate.toFixed(1)}%
              </div>
              <div className="mt-2 text-sm text-slate-500 font-medium">전체 방문 대비 주문 전환율</div>
              <div className="mt-5 h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-slate-900"
                  style={{ width: `${Math.min(totalConversionRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
              <div className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">
                Top Store Share
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">
                {topStore && totalSales > 0
                  ? ((topStore.sales / totalSales) * 100).toFixed(1)
                  : "0.0"}
                %
              </div>
              <div className="mt-2 text-sm text-slate-500 font-medium">
                {topStore ? `${topStore.storeName} 매출 비중` : "상위 매장 정보 없음"}
              </div>
              <div className="mt-5 space-y-3">
                {storeSummaries.map((store) => {
                  const share = totalSales > 0 ? (store.sales / totalSales) * 100 : 0;

                  return (
                    <div key={store.storeId}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">{store.storeName}</span>
                        <span className="font-black text-slate-900">{share.toFixed(1)}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.min(share, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
