import { MenuCategory, MenuItem, MenuEngineeringItem, MenuEngineeringResult } from '../types';
import { listDatesInMonth, loadDaily, listDatesInRange } from './salesStorage';

// Helper to normalize menu names for matching
const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
};

export const calculateMenuEngineering = async (yearMonth: string, initialCategories: MenuCategory[]): Promise<MenuEngineeringResult | null> => {
  const dates = await listDatesInMonth(yearMonth);
  
  // Debug counters
  const datesCount = dates.length;
  let loadedCount = 0;
  let categoriesCountTotal = 0;
  let itemsCountTotal = 0;
  let qtyPositiveItemsCount = 0;

  const aggregatedQuantities: { [id: string]: number } = {};

  for (const date of dates) {
    const dailyData = await loadDaily(date);
    if (dailyData) {
      loadedCount++;
      if (dailyData.categories) {
        categoriesCountTotal += dailyData.categories.length;
        dailyData.categories.forEach(cat => {
          if (cat.items) {
            itemsCountTotal += cat.items.length;
            cat.items.forEach(item => {
              if (item.qty > 0) {
                qtyPositiveItemsCount++;
                aggregatedQuantities[item.id] = (aggregatedQuantities[item.id] || 0) + item.qty;
              }
            });
          }
        });
      }
    }
  }

  const aggregatedIdsCount = Object.keys(aggregatedQuantities).length;

  const menuEngineeringItems: MenuEngineeringItem[] = [];
  const allMenuItems: { [id: string]: MenuItem } = {};
  initialCategories.forEach(cat => {
    cat.items.forEach(item => {
      allMenuItems[item.id] = item;
    });
  });

  // Calculate metrics for each item
  for (const itemId in aggregatedQuantities) {
    const item = allMenuItems[itemId];
    if (!item) continue;

    const qty_month = aggregatedQuantities[itemId];
    const revenue_month = item.price * qty_month;
    const cogs_month = item.unitCost ? item.unitCost * qty_month : null;
    const cm = item.unitCost ? item.price - item.unitCost : null;
    const gp_month = (revenue_month && cogs_month !== null) ? revenue_month - cogs_month : null;

    menuEngineeringItems.push({
      ...item,
      qty_month,
      revenue_month,
      cogs_month,
      cm,
      gp_month,
      popularity: 'Low', // Placeholder
      profitability: 'Low', // Placeholder
      category: 'Dogs', // Placeholder
    });
  }

  if (menuEngineeringItems.length === 0) {
    return {
      items: [],
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      stars: [],
      cashCows: [],
      puzzles: [],
      dogs: [],
      noCostItems: [],
      analyzedDatesCount: datesCount,
      debugStats: {
        datesCount,
        loadedCount,
        categoriesCountTotal,
        itemsCountTotal,
        qtyPositiveItemsCount,
        aggregatedIdsCount,
      },
    };
  }

  // Calculate thresholds
  const totalQtySold = menuEngineeringItems.reduce((sum, item) => sum + item.qty_month, 0);
  const averageQtyPerItem = totalQtySold / menuEngineeringItems.length;

  const itemsWithCm = menuEngineeringItems.filter(item => item.cm !== null);
  const totalCm = itemsWithCm.reduce((sum, item) => sum + (item.cm as number), 0);
  const averageCmPerItem = itemsWithCm.length > 0 ? totalCm / itemsWithCm.length : 0;

  // Classify items
  const stars: MenuEngineeringItem[] = [];
  const cashCows: MenuEngineeringItem[] = [];
  const puzzles: MenuEngineeringItem[] = [];
  const dogs: MenuEngineeringItem[] = [];
  const noCostItems: MenuEngineeringItem[] = [];

  menuEngineeringItems.forEach(item => {
    if (item.unitCost === undefined || item.unitCost === null) {
      noCostItems.push(item);
      return; // Exclude from classification
    }

    const popularity = item.qty_month >= averageQtyPerItem ? 'High' : 'Low';
    const profitability = item.cm !== null && item.cm >= averageCmPerItem ? 'High' : 'Low';

    item.popularity = popularity;
    item.profitability = profitability;

    if (popularity === 'High' && profitability === 'High') {
      item.category = 'Stars';
      stars.push(item);
    } else if (popularity === 'High' && profitability === 'Low') {
      item.category = 'Cash Cows';
      cashCows.push(item);
    } else if (popularity === 'Low' && profitability === 'High') {
      item.category = 'Puzzles';
      puzzles.push(item);
    } else {
      item.category = 'Dogs';
      dogs.push(item);
    }
  });

  return {
    items: menuEngineeringItems,
    popularityThreshold: averageQtyPerItem,
    profitabilityThreshold: averageCmPerItem,
    stars,
    cashCows,
    puzzles,
    dogs,
    noCostItems,
    analyzedDatesCount: datesCount,
    debugStats: {
      datesCount,
      loadedCount,
      categoriesCountTotal,
      itemsCountTotal,
      qtyPositiveItemsCount,
      aggregatedIdsCount,
    },
  };
};

export const calculateMenuEngineeringForRange = async (startDate: string, endDate: string, initialCategories: MenuCategory[]): Promise<MenuEngineeringResult | null> => {
  const EXCLUDED_MENU_NAMES = new Set([
    '참이슬 프레쉬 360ml',
    '처음처럼 360ml',
    '진로이즈백 360ml',
    '막걸리',
    '앙코르 맥주 S 330ml',
    '앙코르 맥주 L 640ml',
    '앙코르 생맥주 250ml',
    '앙코르 생맥주 500ml',
    '하이네켄 생맥주 250ml',
    '콜라 330ml',
    '스프라이트 330ml',
    '소다 330ml',
    '봉봉 238ml',
    '쌕쌕 238ml',
    '쿨피스 250ml',
    '밀키스 250ml',
    '이과두주 100ml',
    '이과두주 500ml',
    '보건주 125ml',
    '보건주 520ml',
    '노주교 500ml',
  ]);
  const dates = await listDatesInRange(startDate, endDate);

  // If less than 7 days of data, return a minimal object indicating analysis is not possible.
  if (dates.length < 7) {
    return {
      items: [],
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      stars: [],
      cashCows: [],
      puzzles: [],
      dogs: [],
      noCostItems: [],
      analyzedDatesCount: dates.length,
      debugStats: {
        datesCount: dates.length,
        loadedCount: 0,
        categoriesCountTotal: 0,
        itemsCountTotal: 0,
        qtyPositiveItemsCount: 0,
        aggregatedIdsCount: 0,
      },
    };
  }



  // Debug counters
  const datesCount = dates.length;
  let loadedCount = 0;
  let categoriesCountTotal = 0;
  let itemsCountTotal = 0;
  let qtyPositiveItemsCount = 0;

  const aggregatedQuantities: { [id: string]: number } = {};

  for (const date of dates) {
    const dailyData = await loadDaily(date);
    if (dailyData) {
      loadedCount++;
      if (dailyData.categories) {
        categoriesCountTotal += dailyData.categories.length;
        dailyData.categories.forEach(cat => {
          if (cat.items) {
            itemsCountTotal += cat.items.length;
            cat.items.forEach(item => {
              if (EXCLUDED_MENU_NAMES.has(item.name)) return; // Added exclusion check
              if (item.qty > 0) {
                qtyPositiveItemsCount++;
                aggregatedQuantities[item.id] = (aggregatedQuantities[item.id] || 0) + item.qty;
              }
            });
          }
        });
      }
    }
  }

  const aggregatedIdsCount = Object.keys(aggregatedQuantities).length;

  const menuEngineeringItems: MenuEngineeringItem[] = [];
  const allMenuItems: { [id: string]: MenuItem } = {};
  initialCategories.forEach(cat => {
    cat.items.forEach(item => {
      allMenuItems[item.id] = item;
    });
  });

  // Calculate metrics for each item
  for (const itemId in aggregatedQuantities) {
    const item = allMenuItems[itemId];
    if (!item) continue;

    const qty_month = aggregatedQuantities[itemId];
    const revenue_month = item.price * qty_month;
    const cogs_month = item.unitCost ? item.unitCost * qty_month : null;
    const cm = item.unitCost ? item.price - item.unitCost : null;
    const gp_month = (revenue_month && cogs_month !== null) ? revenue_month - cogs_month : null;

    menuEngineeringItems.push({
      ...item,
      qty_month,
      revenue_month,
      cogs_month,
      cm,
      gp_month,
      popularity: 'Low', // Placeholder
      profitability: 'Low', // Placeholder
      category: 'Dogs', // Placeholder
    });
  }

  if (menuEngineeringItems.length === 0) {
    return {
      items: [],
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      stars: [],
      cashCows: [],
      puzzles: [],
      dogs: [],
      noCostItems: [],
      analyzedDatesCount: datesCount,
      debugStats: {
        datesCount,
        loadedCount,
        categoriesCountTotal,
        itemsCountTotal,
        qtyPositiveItemsCount,
        aggregatedIdsCount,
      },
    };
  }

  // Calculate thresholds
  const totalQtySold = menuEngineeringItems.reduce((sum, item) => sum + item.qty_month, 0);
  const averageQtyPerItem = totalQtySold / menuEngineeringItems.length;

  const itemsWithCm = menuEngineeringItems.filter(item => item.cm !== null);
  const totalCm = itemsWithCm.reduce((sum, item) => sum + (item.cm as number), 0);
  const averageCmPerItem = itemsWithCm.length > 0 ? totalCm / itemsWithCm.length : 0;

  // Classify items
  const stars: MenuEngineeringItem[] = [];
  const cashCows: MenuEngineeringItem[] = [];
  const puzzles: MenuEngineeringItem[] = [];
  const dogs: MenuEngineeringItem[] = [];
  const noCostItems: MenuEngineeringItem[] = [];

  menuEngineeringItems.forEach(item => {
    if (item.unitCost === undefined || item.unitCost === null) {
      noCostItems.push(item);
      return; // Exclude from classification
    }

    const popularity = item.qty_month >= averageQtyPerItem ? 'High' : 'Low';
    const profitability = item.cm !== null && item.cm >= averageCmPerItem ? 'High' : 'Low';

    item.popularity = popularity;
    item.profitability = profitability;

    if (popularity === 'High' && profitability === 'High') {
      item.category = 'Stars';
      stars.push(item);
    } else if (popularity === 'High' && profitability === 'Low') {
      item.category = 'Cash Cows';
      cashCows.push(item);
    } else if (popularity === 'Low' && profitability === 'High') {
      item.category = 'Puzzles';
      puzzles.push(item);
    } else {
      item.category = 'Dogs';
      dogs.push(item);
    }
  });

  return {
    items: menuEngineeringItems,
    popularityThreshold: averageQtyPerItem,
    profitabilityThreshold: averageCmPerItem,
    stars,
    cashCows,
    puzzles,
    dogs,
    noCostItems,
    analyzedDatesCount: datesCount,
    debugStats: {
      datesCount,
      loadedCount,
      categoriesCountTotal,
      itemsCountTotal,
      qtyPositiveItemsCount,
      aggregatedIdsCount,
    },
  };
};
