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
  payload?: {
    totalSales?: number | null;
    posSales?: number | null;
    deliverySales?: number | null;
    orders?: number | null;
    visitCount?: number | null;
    categories?: any[] | null;
  } | null;
};

export type StoreKpiRow = {
  storeId: number;
  storeName: string;
  brandName: string;
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

export type TopMenuRow = {
  name: string;
  qty: number;
  sales: number;
};

export type MasterDashboardResult = {
  summary: MasterDashboardSummary;
  ranking: StoreKpiRow[];
  risks: RiskCard[];
  topMenus: TopMenuRow[];
  topMenusByBrand: Record<string, TopMenuRow[]>;
};

type SalesDailyRow = {
  date?: string | null;
  store_id: number | null;
  total_sales?: number | null;
  orders?: number | null;
  visit_count?: number | null;
  payload?: {
    totalSales?: number | null;
    posSales?: number | null;
    deliverySales?: number | null;
    orders?: number | null;
    visitCount?: number | null;
    categories?: any[] | null;
  } | null;
};

type StoreRow = {
  id: number;
  store_name: string | null;
  brands?: {
    brand_name?: string | null;
  } | null;
};

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function diffDaysInclusive(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / 86400000) + 1;
}

function addDays(dateString: string, days: number) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

export function getMasterDateRange(preset: MasterDatePreset): MasterDateRange {
  const today = new Date();
  const todayStr = toLocalDateString(today);

  if (preset === "today") {
    return {
      startDate: todayStr,
      endDate: todayStr,
      preset,
    };
  }

  if (preset === "thisWeek") {
    return {
      startDate: toLocalDateString(startOfWeek(today)),
      endDate: toLocalDateString(endOfWeek(today)),
      preset,
    };
  }

  if (preset === "thisMonth") {
    return {
      startDate: toLocalDateString(startOfMonth(today)),
      endDate: toLocalDateString(endOfMonth(today)),
      preset,
    };
  }

  if (preset === "last30Days") {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return {
      startDate: toLocalDateString(start),
      endDate: todayStr,
      preset,
    };
  }

  return {
    startDate: todayStr,
    endDate: todayStr,
    preset: "custom",
  };
}

export function getPreviousRange(range: MasterDateRange): MasterDateRange {
  if (range.preset === "today") {
    const prev = addDays(range.startDate, -1);
    return {
      startDate: prev,
      endDate: prev,
      preset: range.preset,
    };
  }

  if (range.preset === "thisWeek") {
    return {
      startDate: addDays(range.startDate, -7),
      endDate: addDays(range.endDate, -7),
      preset: range.preset,
    };
  }

  if (range.preset === "thisMonth") {
    const start = new Date(range.startDate);
    const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);

    return {
      startDate: toLocalDateString(prevMonthStart),
      endDate: toLocalDateString(prevMonthEnd),
      preset: range.preset,
    };
  }

  const days = diffDaysInclusive(range.startDate, range.endDate);
  return {
    startDate: addDays(range.startDate, -days),
    endDate: addDays(range.startDate, -1),
    preset: range.preset,
  };
}

function safeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function extractSales(row: SalesDailyRow) {
  const payloadTotal = safeNumber(row.payload?.totalSales);
  if (payloadTotal > 0) return payloadTotal;

  const totalSales = safeNumber(row.total_sales);
  if (totalSales > 0) return totalSales;

  const posSales = safeNumber(row.payload?.posSales);
  const deliverySales = safeNumber(row.payload?.deliverySales);
  return posSales + deliverySales;
}

function extractOrders(row: SalesDailyRow) {
  const payloadOrders = safeNumber(row.payload?.orders);
  if (payloadOrders > 0) return payloadOrders;
  return safeNumber(row.orders);
}

function extractVisitCount(row: SalesDailyRow) {
  const payloadVisit = safeNumber(row.payload?.visitCount);
  if (payloadVisit > 0) return payloadVisit;
  return safeNumber(row.visit_count);
}

function buildStoreMetaMap(stores: StoreRow[]) {
  const map = new Map<number, { storeName: string; brandName: string }>();

  for (const store of stores) {
    map.set(store.id, {
      storeName: store.store_name || `Store ${store.id}`,
      brandName: store.brands?.brand_name || "Unknown",
    });
  }

  return map;
}

function calcRate(current: number, previous: number) {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function aggregateRows(
  rows: SalesDailyRow[],
  storeMetaMap: Map<number, { storeName: string; brandName: string }>
) {
  const storeMap = new Map<number, StoreKpiRow>();

  for (const row of rows) {
    const storeId = safeNumber(row.store_id);
    if (!storeId) continue;

    const totalSales = extractSales(row);
    const orders = extractOrders(row);
    const visitCount = extractVisitCount(row);
    const meta = storeMetaMap.get(storeId) || {
      storeName: `Store ${storeId}`,
      brandName: "Unknown",
    };

    const prev = storeMap.get(storeId) || {
      storeId,
      storeName: meta.storeName,
      brandName: meta.brandName,
      totalSales: 0,
      orders: 0,
      visitCount: 0,
      aov: 0,
      conversionRate: 0,
    };

    prev.totalSales += totalSales;
    prev.orders += orders;
    prev.visitCount += visitCount;

    storeMap.set(storeId, prev);
  }

  const ranking = Array.from(storeMap.values()).map((item) => {
    const aov = item.orders > 0 ? item.totalSales / item.orders : 0;
    const conversionRate = item.visitCount > 0 ? (item.orders / item.visitCount) * 100 : 0;

    return {
      ...item,
      aov,
      conversionRate,
    };
  });

  ranking.sort((a, b) => b.totalSales - a.totalSales);

  return ranking;
}

function buildRisks(ranking: StoreKpiRow[]) {
  const risks: RiskCard[] = [];

  for (const row of ranking) {
    if (row.totalSales < 1000) {
      risks.push({
        type: "sales",
        level: "danger",
        storeId: row.storeId,
        storeName: row.storeName,
        label: "매출 위험",
        value: row.totalSales,
      });
    } else if (row.totalSales < 3000) {
      risks.push({
        type: "sales",
        level: "warning",
        storeId: row.storeId,
        storeName: row.storeName,
        label: "매출 주의",
        value: row.totalSales,
      });
    }

    if (row.aov < 12) {
      risks.push({
        type: "aov",
        level: "danger",
        storeId: row.storeId,
        storeName: row.storeName,
        label: "객단가 위험",
        value: row.aov,
      });
    } else if (row.aov < 16) {
      risks.push({
        type: "aov",
        level: "warning",
        storeId: row.storeId,
        storeName: row.storeName,
        label: "객단가 주의",
        value: row.aov,
      });
    }

    if (row.conversionRate < 10) {
      risks.push({
        type: "conversion",
        level: "danger",
        storeId: row.storeId,
        storeName: row.storeName,
        label: "전환율 위험",
        value: row.conversionRate,
      });
    } else if (row.conversionRate < 15) {
      risks.push({
        type: "conversion",
        level: "warning",
        storeId: row.storeId,
        storeName: row.storeName,
        label: "전환율 주의",
        value: row.conversionRate,
      });
    }
  }

  return risks;
}

function buildSummary(currentRanking: StoreKpiRow[], previousRanking: StoreKpiRow[]): MasterDashboardSummary {
  const totalSales = currentRanking.reduce((sum, row) => sum + row.totalSales, 0);
  const totalOrders = currentRanking.reduce((sum, row) => sum + row.orders, 0);
  const totalVisitCount = currentRanking.reduce((sum, row) => sum + row.visitCount, 0);

  const storeCount = currentRanking.length;
  const averageSales = storeCount > 0 ? totalSales / storeCount : 0;
  const averageAov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const overallConversionRate = totalVisitCount > 0 ? (totalOrders / totalVisitCount) * 100 : 0;

  const topStore = currentRanking[0];

  const previousTotalSales = previousRanking.reduce((sum, row) => sum + row.totalSales, 0);
  const previousTotalOrders = previousRanking.reduce((sum, row) => sum + row.orders, 0);
  const previousAverageAov = previousTotalOrders > 0 ? previousTotalSales / previousTotalOrders : 0;

  return {
    totalSales,
    totalOrders,
    averageSales,
    averageAov,
    overallConversionRate,
    topStoreName: topStore?.storeName || "-",
    topStoreSales: topStore?.totalSales || 0,
    totalVisitCount,
    growth: {
      sales: {
        current: totalSales,
        previous: previousTotalSales,
        rate: calcRate(totalSales, previousTotalSales),
      },
      orders: {
        current: totalOrders,
        previous: previousTotalOrders,
        rate: calcRate(totalOrders, previousTotalOrders),
      },
      aov: {
        current: averageAov,
        previous: previousAverageAov,
        rate: calcRate(averageAov, previousAverageAov),
      },
    },
  };
}
function buildBrandGrowth(
  currentRanking: StoreKpiRow[],
  previousRanking: StoreKpiRow[]
) {
  const map: Record<string, { current: number; previous: number; rate: number | null }> = {};

  function aggregate(rows: StoreKpiRow[]) {
    const brandMap: Record<string, number> = {};

    for (const row of rows) {
      const brand = row.brandName || "Unknown";
      brandMap[brand] = (brandMap[brand] || 0) + row.totalSales;
    }

    return brandMap;
  }

  const currentMap = aggregate(currentRanking);
  const previousMap = aggregate(previousRanking);

  const allBrands = new Set([
    ...Object.keys(currentMap),
    ...Object.keys(previousMap),
  ]);

  for (const brand of allBrands) {
    const current = currentMap[brand] || 0;
    const previous = previousMap[brand] || 0;

    let rate: number | null = null;
    if (previous > 0) {
      rate = ((current - previous) / previous) * 100;
    }

    map[brand] = {
      current,
      previous,
      rate,
    };
  }

  return map;
}
function buildStoreGrowth(
  currentRanking: StoreKpiRow[],
  previousRanking: StoreKpiRow[]
) {
  const map: Record<number, { current: number; previous: number; rate: number | null }> = {};

  const previousMap = new Map<number, number>();

  for (const row of previousRanking) {
    previousMap.set(row.storeId, row.totalSales);
  }

  for (const row of currentRanking) {
    const current = row.totalSales;
    const previous = previousMap.get(row.storeId) || 0;

    let rate: number | null = null;
    if (previous > 0) {
      rate = ((current - previous) / previous) * 100;
    }

    map[row.storeId] = {
      current,
      previous,
      rate,
    };
  }

  for (const row of previousRanking) {
    if (map[row.storeId]) continue;

    map[row.storeId] = {
      current: 0,
      previous: row.totalSales,
      rate: row.totalSales > 0 ? -100 : null,
    };
  }

  return map;
}
async function fetchSalesRows(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("sales_daily")
    .select("date,store_id,total_sales,orders,visit_count,payload")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    throw error;
  }

  return (data || []) as SalesDailyRow[];
}

async function fetchStores() {
  const { data, error } = await supabase
    .from("stores")
    .select("id, store_name, brands(brand_name)");

  if (error) {
    throw error;
  }

  return (data || []) as StoreRow[];
}

function buildTopMenus(rows: SalesDailyRow[]) {
  const menuMap = new Map<string, TopMenuRow>();

  for (const row of rows) {
    const payload = row.payload as any;
    if (!payload || !payload.categories) continue;

    for (const cat of payload.categories) {
      for (const item of cat.items || []) {
        const name = item.name;
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        const sales = qty * price;

        const prev = menuMap.get(name) || { name, qty: 0, sales: 0 };
        prev.qty += qty;
        prev.sales += sales;
        menuMap.set(name, prev);
      }
    }
  }

  return Array.from(menuMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
}

function buildTopMenusByBrand(
  rows: SalesDailyRow[],
  storeMetaMap: Map<number, { storeName: string; brandName: string }>
) {
  const rowsByBrand: Record<string, SalesDailyRow[]> = {};

  for (const row of rows) {
    const storeId = safeNumber(row.store_id);
    if (!storeId) continue;

    const meta = storeMetaMap.get(storeId);
    const brandName = meta?.brandName || "Unknown";

    if (!rowsByBrand[brandName]) {
      rowsByBrand[brandName] = [];
    }

    rowsByBrand[brandName].push(row);
  }

  const result: Record<string, TopMenuRow[]> = {};

  for (const [brandName, brandRows] of Object.entries(rowsByBrand)) {
    result[brandName] = buildTopMenus(brandRows);
  }

  return result;
}

export async function loadAllStoresRange(startDate: string, endDate: string): Promise<MasterSalesRow[]> {
  const rows = await fetchSalesRows(startDate, endDate);

  return rows.map((row) => ({
    date: row.date || "",
    store_id: row.store_id,
    total_sales: safeNumber(row.total_sales),
    orders: safeNumber(row.orders),
    visit_count: safeNumber(row.visit_count),
    payload: row.payload || null,
  }));
}

export async function loadMasterDashboard(range: MasterDateRange): Promise<MasterDashboardResult> {
  const [stores, currentRows, previousRows] = await Promise.all([
    fetchStores(),
    fetchSalesRows(range.startDate, range.endDate),
    fetchSalesRows(getPreviousRange(range).startDate, getPreviousRange(range).endDate),
  ]);

  const storeMetaMap = buildStoreMetaMap(stores);

  const currentRanking = aggregateRows(currentRows, storeMetaMap);
  const previousRanking = aggregateRows(previousRows, storeMetaMap);

  return {
    summary: buildSummary(currentRanking, previousRanking),
    ranking: currentRanking,
    risks: buildRisks(currentRanking),
    topMenus: buildTopMenus(currentRows),
    topMenusByBrand: buildTopMenusByBrand(currentRows, storeMetaMap),
    brandGrowth: buildBrandGrowth(currentRanking, previousRanking),
  };
}
