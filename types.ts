export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  unitCost?: number;
}

export interface SalesReportData {
  date: string;
  posSales: number;
  orders: number;
  visitCount: number;
  deliverySales?: number;
  note: string;
  monthlyTarget: number;
  mtdSales: number;
  categories: MenuCategory[];
}

export interface CalculationResult {
  calcSales: number;
  gapUsd: number;
  gapRate: number;
  status: "✅" | "🟡" | "🔴";
  aov: number;
  conversionRate: number;
  addonPerOrder: number;
}

export interface CorrectedItem {
  matched_id?: string;
  item_original: string;
  item_corrected: string;
  unit_price: number;
  qty: number;
  confidence: number;
  needs_review: boolean;
  candidates?: { name: string; id: string; score: number }[];
}

export interface MenuEngineeringItem extends MenuItem {
  qty_month: number;
  revenue_month: number;
  cogs_month: number | null;
  cm: number | null;
  gp_month: number | null;
  popularity: "High" | "Low";
  profitability: "High" | "Low";
  category: "Stars" | "Cash Cows" | "Puzzles" | "Dogs";
}

export interface MenuEngineeringResult {
  items: MenuEngineeringItem[];
  popularityThreshold: number;
  profitabilityThreshold: number;
  stars: MenuEngineeringItem[];
  cashCows: MenuEngineeringItem[];
  puzzles: MenuEngineeringItem[];
  dogs: MenuEngineeringItem[];
  noCostItems: MenuEngineeringItem[];
  analyzedDatesCount: number;
  debugStats: {
    datesCount: number;
    loadedCount: number;
    categoriesCountTotal: number;
    itemsCountTotal: number;
    qtyPositiveItemsCount: number;
    aggregatedIdsCount: number;
  };
}
