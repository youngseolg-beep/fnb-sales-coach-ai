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

export default function MasterDashboardPage() {
  const [rows, setRows] = useState<MasterSalesRow[]>([]);
  const [storeMap, setStoreMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);

        const [data, storeRes] = await Promise.all([
          loadAllStoresRange(
            formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
            formatLocalDate(new Date())
          ),
          supabase.from("stores").select("id, name"),
        ]);

        if (!isMounted) return;

        const map: Record<number, string> = {};
        (storeRes.data || []).forEach((s: any) => {
          map[s.id] = s.name;
        });

        setStoreMap(map);
        setRows(data);
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

      prev.sales += Number((row as any).total_sales ?? 0);
      prev.orders += Number((row as any).orders ?? 0);
      prev.visits += Number((row as any).visit_count ?? 0);
      prev.days += 1;

      map.set(storeId, prev);
    }

    return Array.from(map.values()).sort((a, b) => b.sales - a.sales);
  }, [rows, storeMap]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Master Dashboard</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Store</th>
            <th>Sales</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {storeSummaries.map((store, i) => (
            <tr key={store.storeId}>
              <td>{i + 1}</td>
              <td>{store.storeName}</td>
              <td>${store.sales}</td>
              <td>{store.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
