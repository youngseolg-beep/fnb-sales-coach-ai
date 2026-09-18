import { loadDailyRange } from "./salesStorage";
import {
  deriveSharedSideDishTotal,
  loadSharedSideDishHistory,
  type SharedSideDishConfig,
} from "./sharedSideDishService";

export type FoodCostSummary = {
  periodSales: number;
  directMenuCost: number;
  sharedSideDishCost: number;
  totalFoodCost: number;
  foodCostRate: number;
  grossProfitBeforeOtherExpenses: number;
  analyzedDays: number;
};

const nonNegativeFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
};

const calculateDirectMenuCost = (categories: any[]) =>
  (Array.isArray(categories) ? categories : []).reduce((categoryTotal, category) => {
    const itemTotal = (Array.isArray(category?.items) ? category.items : []).reduce(
      (sum: number, item: any) => {
        const quantity = nonNegativeFiniteNumber(item?.qty);
        const unitCost = nonNegativeFiniteNumber(item?.unitCost);
        return quantity > 0 ? sum + quantity * unitCost : sum;
      },
      0
    );
    return categoryTotal + itemTotal;
  }, 0);

const findApplicableSharedSideDishConfig = (
  history: SharedSideDishConfig[],
  salesDate: string
) => history.find((config) => config.effectiveDate <= salesDate) ?? null;

export async function calculateFoodCostForRange(
  startDate: string,
  endDate: string,
  storeId: number
): Promise<FoodCostSummary> {
  const [rows, sharedSideDishHistory] = await Promise.all([
    loadDailyRange(startDate, endDate, storeId),
    loadSharedSideDishHistory(storeId),
  ]);

  let periodSales = 0;
  let directMenuCost = 0;
  let sharedSideDishCost = 0;

  for (const row of rows) {
    periodSales += nonNegativeFiniteNumber(row.posSales) + nonNegativeFiniteNumber(row.deliverySales);
    directMenuCost += calculateDirectMenuCost(row.categories);

    const config = findApplicableSharedSideDishConfig(sharedSideDishHistory, String(row.date));
    if (config) {
      sharedSideDishCost +=
        nonNegativeFiniteNumber(row.sharedSideDishCount) *
        nonNegativeFiniteNumber(deriveSharedSideDishTotal(config.items));
    }
  }

  const totalFoodCost = directMenuCost + sharedSideDishCost;
  const foodCostRate = periodSales > 0 ? (totalFoodCost / periodSales) * 100 : 0;

  return {
    periodSales,
    directMenuCost,
    sharedSideDishCost,
    totalFoodCost,
    foodCostRate,
    grossProfitBeforeOtherExpenses: periodSales - totalFoodCost,
    analyzedDays: rows.length,
  };
}
