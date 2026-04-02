import { supabase } from "./supabaseClient";

export type MasterDatePreset = "today" | "thisWeek" | "thisMonth" | "last30Days" | "custom";

export type MasterDateRange = {
  startDate: string;
  endDate: string;
  preset: MasterDatePreset;
};

export type MasterSalesRow = {
  date: string;
  store_id: number | null;
  total_sales: number;
  orders: number;
  visit_count: number;
  payload?: any;
};

export type StoreKpiRow = {
  storeId: number;
  storeName: string;
  brandName: string; // ✅ 추가
  totalSales: number;
  orders: number;
  visitCount: number;
  aov: number;
  conversionRate: number;
};

export type RiskLevel = "danger" | "warning" | "good";

export type RiskCard = {
  type: "sales" | "aov" | "conversion";
  level: RiskLevel;
  storeId: number;
  storeName: string;
  label: string;
  value: number;
};

export type GrowthMetric = {
  current: number;
  previous: number;
  rate: number | null;
};

export type DashboardGrowth = {
  sales: GrowthMetric;
  orders: GrowthMetric;
  aov: GrowthMetric;
};

export type MasterDashboardSummary = {
  totalSales: number;
  totalOrders: number;
  averageSales: number;
  averageAov: number;
  overallConversionRate: number;
  topStoreName: string;
  topStoreSales: number;
  totalVisitCount: number;
  growth: DashboardGrowth;
};

export type MasterDashboardResult = {
  summary: MasterDashboardSummary;
  ranking: StoreKpiRow[];
  risks: RiskCard[];
};

type SalesDailyRow = any;

type StoreRow = {
  id: number;
  store_name: string | null;
  brand?: {
    brand_name: string;
  } | null;
};

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractSales(row: any) {
  return safeNumber(row.payload?.totalSales || row.total_sales);
}

function extractOrders(row: any) {
  return safeNumber(row.payload?.orders || row.orders);
}

function extractVisitCount(row: any) {
  return safeNumber(row.payload?.visitCount || row.visit_count);
}

function buildStoreMap(stores: StoreRow[]) {
  const map = new Map<number, { name: string; brand: string }>();

  for (const s of stores) {
    map.set(s.id, {
      name: s.store_name || `Store ${s.id}`,
      brand: s.brand?.brand_name || "Unknown",
    });
  }

  return map;
}

function aggregateRows(rows: SalesDailyRow[], storeMap: Map<number, { name: string; brand: string }>) {
  const m = new Map<number, StoreKpiRow>();

  for (const row of rows) {
    const id = safeNumber(row.store_id);
    if (!id) continue;

    const meta = storeMap.get(id) || { name: `Store ${id}`, brand: "Unknown" };

    const prev = m.get(id) || {
      storeId: id,
      storeName: meta.name,
      brandName: meta.brand,
      totalSales: 0,
      orders: 0,
      visitCount: 0,
      aov: 0,
      conversionRate: 0,
    };

    prev.totalSales += extractSales(row);
    prev.orders += extractOrders(row);
    prev.visitCount += extractVisitCount(row);

    m.set(id, prev);
  }

  const arr = Array.from(m.values()).map((r) => ({
    ...r,
    aov: r.orders > 0 ? r.totalSales / r.orders : 0,
    conversionRate: r.visitCount > 0 ? (r.orders / r.visitCount) * 100 : 0,
  }));

  arr.sort((a, b) => b.totalSales - a.totalSales);

  return arr;
}

async function fetchStores() {
  const { data, error } = await supabase
    .from("stores")
    .select("id, store_name, brands(brand_name)");

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    store_name: row.store_name,
    brand: row.brands,
  })) as StoreRow[];
}

async function fetchSalesRows(start: string, end: string) {
  const { data, error } = await supabase
    .from("sales_daily")
    .select("*")
    .gte("date", start)
    .lte("date", end);

  if (error) throw error;
  return data || [];
}

export async function loadMasterDashboard(range: MasterDateRange) {
  const [stores, rows] = await Promise.all([
    fetchStores(),
    fetchSalesRows(range.startDate, range.endDate),
  ]);

  const storeMap = buildStoreMap(stores);
  const ranking = aggregateRows(rows, storeMap);

  return {
    summary: {
      totalSales: 0,
      totalOrders: 0,
      averageSales: 0,
      averageAov: 0,
      overallConversionRate: 0,
      topStoreName: "-",
      topStoreSales: 0,
      totalVisitCount: 0,
      growth: {
        sales: { current: 0, previous: 0, rate: null },
        orders: { current: 0, previous: 0, rate: null },
        aov: { current: 0, previous: 0, rate: null },
      },
    },
    ranking,
    risks: [],
    topMenus: [],
  };
}
