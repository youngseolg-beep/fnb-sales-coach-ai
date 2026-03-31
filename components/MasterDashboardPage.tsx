import React, { useEffect, useMemo, useState } from "react";
import { loadAllStoresRange, type MasterSalesRow } from "../services/masterDashboardService";
import { formatLocalDate } from "../utils2/date";

type StoreSummary = {
  storeId: number;
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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const data = await loadAllStoresRange(getMonthStart(), getToday());

        if (!isMounted) return;
        setRows(data);
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
  }, [rows]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-2xl font-black text-slate-900">Master Dashboard</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              전체 매장 데이터를 불러오는 중입니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-rose-200 p-8">
            <h1 className="text-2xl font-black text-slate-900">Master Dashboard</h1>
            <p className="mt-2 text-sm font-medium text-rose-500">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-indigo-500 uppercase">
                Master Dashboard
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
                전체 매장 통합 현황
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                기준 기간: {getMonthStart()} ~ {getToday()}
              </p>
            </div>

            <div className="inline-flex items-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              총 {storeCount}개 매장 집계
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Total Sales
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              ${Math.round(totalSales).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Store Count
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {storeCount.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Avg Sales / Store
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              ${Math.round(avgSalesPerStore).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Total Orders
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {Math.round(totalOrders).toLocaleString()}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Overall AOV
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              ${totalAov.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Overall Conversion
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {totalConversionRate.toFixed(1)}%
            </p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">매장별 매출 순위</h2>
              <p className="mt-1 text-sm text-slate-500">이번 달 누적 기준</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-black tracking-wider text-slate-400 uppercase">
                    Rank
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-black tracking-wider text-slate-400 uppercase">
                    Store
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black tracking-wider text-slate-400 uppercase">
                    Sales
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black tracking-wider text-slate-400 uppercase">
                    Orders
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black tracking-wider text-slate-400 uppercase">
                    Visits
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black tracking-wider text-slate-400 uppercase">
                    AOV
                  </th>
                </tr>
              </thead>

              <tbody>
                {storeSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-slate-400">
                      표시할 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  storeSummaries.map((store, index) => {
                    const aov = store.orders > 0 ? store.sales / store.orders : 0;

                    return (
                      <tr key={store.storeId} className="border-t border-slate-100">
                        <td className="px-6 py-4 text-sm font-black text-slate-900">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          Store {store.storeId}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right text-slate-900">
                          ${Math.round(store.sales).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right text-slate-600">
                          {Math.round(store.orders).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right text-slate-600">
                          {Math.round(store.visits).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right text-slate-600">
                          ${aov.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
