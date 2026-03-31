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

const toSafeNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getToday = () => formatLocalDate(new Date());

const getMonthStart = () => {
  const today = new Date();
  return formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
};

export default function MasterDashboardPage() {
  const [rows, setRows] = useState<MasterSalesRow[]>([]);
  const [storeMap, setStoreMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const [salesRes, storeRes] = await Promise.all([
          loadAllStoresRange(getMonthStart(), getToday()),
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
        if (isMounted) setLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

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
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.28em] uppercase text-indigo-200">
                Master Dashboard
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-black text-white tracking-tight">
                전체 매장 통합 현황
              </h1>
              <p className="mt-3 text-sm md:text-base font-medium text-indigo-100">
                기준 기간 {getMonthStart()} ~ {getToday()}
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

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">매장별 매출 순위</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">이번 달 누적 기준</p>
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
                      <td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">
                        표시할 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    storeSummaries.map((store, index) => {
                      const aov = store.orders > 0 ? store.sales / store.orders : 0;

                      return (
                        <tr key={store.storeId} className="border-b border-slate-100 last:border-b-0">
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
                {topStore && totalSales > 0 ? ((topStore.sales / totalSales) * 100).toFixed(1) : "0.0"}%
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
