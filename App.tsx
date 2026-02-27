
import React, { useState, useMemo, useEffect } from 'react';
import { SalesReportData, CalculationResult, MenuCategory, MenuEngineeringResult } from './types';
import { generateCoachingReport } from './services/geminiService';
import { calculateMenuEngineering, calculateMenuEngineeringForRange } from './services/menuEngineeringService';
import { format, parseISO, subDays } from 'date-fns';
import { 
  loadDaily, 
  saveDaily, 
  getMonthlyTotal, 
  listDatesInMonth,
  deleteDaily
} from './services/salesStorage';
import DataInput from './components/DataInput';
import ReportDisplay from './components/ReportDisplay';

const STORE_ID = "hongkongbanjeom-cambodia";
const AUTH_KEY = "fb_coach_auth";

// Helper functions for boost plans
const roundTo0_5 = (num: number): number => {
  return Math.round(num * 2) / 2;
};

const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

const SOFT_DRINKS = [
  '콜라 330ml',
  '스프라이트 330ml',
  '소다 330ml',
  '밀키스 250ml',
  '쿨피스 250ml',
  '봉봉 238ml',
  '쌕쌕 238ml',
];

const INITIAL_CATEGORIES: MenuCategory[] = [
  {
    name: "음식 메뉴 (Main Dishes)",
    items: [
      { id: 'f1', name: '짜장면', price: 7, qty: 0, unitCost: 1.42 },
      { id: 'f2', name: '짬뽕', price: 7, qty: 0, unitCost: 2.24 },
      { id: 'f3', name: '짬뽕밥', price: 8, qty: 0, unitCost: 2.34 },
      { id: 'f4', name: '백짬뽕', price: 7, qty: 0, unitCost: 2.13 },
      { id: 'f5', name: '백짬뽕밥', price: 8, qty: 0, unitCost: 2.08 },
      { id: 'f6', name: '볶음짬뽕', price: 9, qty: 0, unitCost: 2.94 },
      { id: 'f7', name: '고추짜장', price: 9, qty: 0, unitCost: 1.57 },
      { id: 'f8', name: '고추짬뽕', price: 10, qty: 0, unitCost: 2.51 },
      { id: 'f9', name: '고추짬뽕밥', price: 12, qty: 0, unitCost: 2.61 },
      { id: 'f10', name: '짜장밥', price: 5, qty: 0, unitCost: 1.67 },
      { id: 'f11', name: '잡채밥', price: 10, qty: 0, unitCost: 3.35 },
      { id: 'f12', name: '야채볶음밥', price: 5, qty: 0, unitCost: 1.69 },
      { id: 'f13', name: '소고기볶음밥', price: 7, qty: 0, unitCost: 2.36 },
      { id: 'f14', name: '마파두부', price: 12, qty: 0, unitCost: 2.24 },
      { id: 'f15', name: '마파두부덮밥', price: 9, qty: 0, unitCost: 1.72 },
      { id: 'f16', name: '깐풍기', price: 15, qty: 0, unitCost: 2.97 },
      { id: 'f17', name: '고추유린기', price: 15, qty: 0, unitCost: 3.71 },
      { id: 'f18', name: '쟁반짜장', price: 18, qty: 0, unitCost: 4.38 },
      { id: 'f19', name: '돌짜장', price: 18, qty: 0, unitCost: 5.32 },
      { id: 'f20', name: '해물육교자', price: 5.5, qty: 0, unitCost: 2.42 },
    ]
  },
  {
    name: "탕수육 (Tangsuyuk)",
    items: [
      { id: 't1', name: '탕수육 S', price: 12, qty: 0, unitCost: 2.70 },
      { id: 't2', name: '탕수육 M', price: 15, qty: 0, unitCost: 3.23 },
      { id: 't3', name: '탕수육 L', price: 18, qty: 0, unitCost: 4.50 },
    ]
  },
  {
    name: "토핑 (Add-ons)",
    items: [
      { id: 'a1', name: '토핑 해시브라운', price: 2, qty: 0, unitCost: 0.28 },
      { id: 'a2', name: '토핑 계란프라이', price: 1, qty: 0, unitCost: 0.141 },
      { id: 'a3', name: '토핑 슬라이스치즈', price: 1, qty: 0, unitCost: 0.29 },
    ]
  },
  {
    name: "음료 및 주류 (Beverages)",
    items: [
      { id: 'b1', name: '참이슬 프레쉬 360ml', price: 5, qty: 0 },
      { id: 'b2', name: '처음처럼 360ml', price: 5, qty: 0 },
      { id: 'b3', name: '진로이즈백 360ml', price: 5, qty: 0 },
      { id: 'b4', name: '막걸리', price: 6, qty: 0 },
      { id: 'b5', name: '앙코르 맥주 S 330ml', price: 2.5, qty: 0 },
      { id: 'b6', name: '앙코르 맥주 L 640ml', price: 4.5, qty: 0 },
      { id: 'b7', name: '앙코르 생맥주 250ml', price: 2, qty: 0 },
      { id: 'b8', name: '앙코르 생맥주 500ml', price: 3, qty: 0 },
      { id: 'b9', name: '하이네켄 생맥주 250ml', price: 2.5, qty: 0 },
      { id: 'b10', name: '콜라 330ml', price: 1, qty: 0 },
      { id: 'b11', name: '스프라이트 330ml', price: 1, qty: 0 },
      { id: 'b12', name: '소다 330ml', price: 1, qty: 0 },
      { id: 'b13', name: '봉봉 238ml', price: 2, qty: 0 },
      { id: 'b14', name: '쌕쌕 238ml', price: 2, qty: 0 },
      { id: 'b15', name: '쿨피스 250ml', price: 2, qty: 0 },
      { id: 'b16', name: '밀키스 250ml', price: 2, qty: 0 },
    ]
  },
  {
    name: "고량주 (Liquors)",
    items: [
      { id: 'l1', name: '이과두주 100ml', price: 4, qty: 0 },
      { id: 'l2', name: '이과두주 500ml', price: 8, qty: 0 },
      { id: 'l3', name: '보건주 125ml', price: 6, qty: 0 },
      { id: 'l4', name: '보건주 520ml', price: 18, qty: 0 },
      { id: 'l5', name: '노주교 500ml', price: 60, qty: 0 },
    ]
  }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_KEY) === 'true';
    }
    return false;
  });
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [data, setData] = useState<SalesReportData>({
    date: new Date().toISOString().split('T')[0],
    posSales: 0,
    orders: 0,
    visitCount: 0,
    note: '',
    monthlyTarget: 15000,
    mtdSales: 0,
    categories: INITIAL_CATEGORIES
  });
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [menuEngineeringResult, setMenuEngineeringResult] = useState<MenuEngineeringResult | null>(null);

  const [pastData, setPastData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    avg: 0,
    rate: 0
  });
  const [periodRange, setPeriodRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [periodStats, setPeriodStats] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [datesWithData, setDatesWithData] = useState<string[]>([]);

  const sortedMenuEngineering = useMemo(() => {
    if (!menuEngineeringResult) return null;

    const totalRevenueForRange = menuEngineeringResult.items?.reduce((sum: number, it: any) => sum + (Number(it.revenue_month) || 0), 0) || 0;

    const formatItem = (item: any, totalRevenueForRange: number) => {
      const unitCost = item.unitCost !== null ? item.unitCost.toFixed(2) : 'N/A';
      const costRate = (item.price > 0 && item.unitCost !== null) ? ((item.unitCost / item.price) * 100).toFixed(1) : 'N/A';
      const gp_month = (item.revenue_month !== null && item.cogs_month !== null) ? (item.revenue_month - item.cogs_month).toFixed(2) : 'N/A';
      const revenueText = item.revenue_month !== null ? item.revenue_month.toFixed(2) : 'N/A';

      let revenueContribution = 'N/A';
      if (item.revenue_month !== null && totalRevenueForRange > 0) {
        revenueContribution = ((item.revenue_month / totalRevenueForRange) * 100).toFixed(1);
      }

      return `${item.name} — 원가 $${unitCost} (${costRate}%) / 판매 ${item.qty_month} / 매출 $${revenueText} / 이익 $${gp_month} / 매출 기여도 ${revenueContribution}%`;
    };

    const starsTop3 = menuEngineeringResult.stars
      .filter(item => item.revenue_month !== null)
      .sort((a, b) => (b.revenue_month as number) - (a.revenue_month as number))
      .slice(0, 3).map((item) => formatItem(item, totalRevenueForRange));

    const cashCowsTop3 = menuEngineeringResult.cashCows
      .filter(item => item.qty_month !== null)
      .sort((a, b) => (b.qty_month as number) - (a.qty_month as number))
      .slice(0, 3).map((item) => formatItem(item, totalRevenueForRange));

    const puzzlesTop3 = menuEngineeringResult.puzzles
      .filter(item => item.cm !== null && item.revenue_month !== null)
      .sort((a, b) => (b.cm as number) - (a.cm as number) || (b.revenue_month as number) - (a.revenue_month as number))
      .slice(0, 3).map((item) => formatItem(item, totalRevenueForRange));

    const dogsTop3 = menuEngineeringResult.dogs
      .filter(item => item.revenue_month !== null)
      .sort((a, b) => (a.revenue_month as number) - (b.revenue_month as number))
      .slice(0, 3).map((item) => formatItem(item, totalRevenueForRange));

    const noCostItemsList = menuEngineeringResult.noCostItems.map(item => item.name).join(", ");

    return {
      starsTop3,
      cashCowsTop3,
      puzzlesTop3,
      dogsTop3,
      noCostItemsList,
      popularityThreshold: menuEngineeringResult.popularityThreshold.toFixed(1),
      profitabilityThreshold: menuEngineeringResult.profitabilityThreshold.toFixed(2),
    };
  }, [menuEngineeringResult]);

  const boostPlans = useMemo(() => {
    if (!menuEngineeringResult || !sortedMenuEngineering) return [];

    const allMenuItemsFlat = INITIAL_CATEGORIES.flatMap(cat => cat.items);

    const isFriedDish = (itemName: string) => {
      const friedKeywords = ['탕수육', '깐풍기', '유린기', '치킨', '튀김'];
      return friedKeywords.some(keyword => itemName.includes(keyword));
    };

    const calculateDailyTargetAndReason = (itemQtyMonth: number, analyzedDatesCount: number) => {
      const baseline = Math.max(1, Math.round((itemQtyMonth || 0) / analyzedDatesCount));
      const target = baseline + (Math.random() > 0.5 ? 1 : 2); // Add 1 or 2
      return {
        dailyTargetQty: target,
        dailyTargetReason: `최근 7일 평균 1일 ${baseline}개 → 목표 ${target}개`,
      };
    };

    const getSecondItemForSetDiscount = (mainItem: any) => {
      // Soft drinks are always compatible
      const availableSoftDrinks = allMenuItemsFlat.filter(item =>
        SOFT_DRINKS.includes(item.name) && item.id !== mainItem.id && item.unitCost !== undefined && item.unitCost !== null
      );
      if (availableSoftDrinks.length > 0) {
        return availableSoftDrinks[Math.floor(Math.random() * availableSoftDrinks.length)];
      }

      // For other items, apply compatibility rules
      const compatibleItems = allMenuItemsFlat.filter(item => {
        if (item.id === mainItem.id || item.unitCost === undefined || item.unitCost === null) return false;

        // If main item is fried, exclude toppings
        if (isFriedDish(mainItem.name) && item.name.includes('토핑')) return false;

        // Side dishes like '해물육교자' are always compatible
        if (item.name.includes('해물육교자')) return true;

        // General low-price items (e.g., small sides, other main dishes that could form a set)
        return item.price < 10; // Example: price < $10 for a second item
      }).sort((a, b) => a.price - b.price); // Sort by price ascending

      if (compatibleItems.length > 0) {
        return compatibleItems[0];
      }

      return null; // No suitable second item found
    };

    const targetablePuzzles = menuEngineeringResult.puzzles
      .filter(item => item.unitCost !== undefined && item.unitCost !== null) // unitCost 없는 메뉴 제외
      .sort((a, b) => (b.cm as number) - (a.cm as number) || (b.revenue_month as number) - (a.revenue_month as number));

    const targetableStars = menuEngineeringResult.stars
      .filter(item => item.unitCost !== undefined && item.unitCost !== null)
      .sort((a, b) => (b.revenue_month as number) - (a.revenue_month as number));

    const targetableCashCows = menuEngineeringResult.cashCows
      .filter(item => item.unitCost !== undefined && item.unitCost !== null)
      .sort((a, b) => (b.qty_month as number) - (a.qty_month as number));

    const analyzedDatesCount = menuEngineeringResult.analyzedDatesCount > 0 ? menuEngineeringResult.analyzedDatesCount : 1;

    const plans = [];
    const usedItemIds = new Set<string>(); // Track used item IDs across all categories

    // Helper to get a target item from a list, ensuring it hasn't been used
    const getUnusedTargetItem = (list: any[]) => {
      return list.find(item => !usedItemIds.has(item.id));
    };

    // 1. MENU_BOARD (노출/추천 강화) - Stars 또는 Cash Cows
    let menuBoardTarget = getUnusedTargetItem(targetableStars);
    if (!menuBoardTarget) {
      menuBoardTarget = getUnusedTargetItem(targetableCashCows);
    }

    if (menuBoardTarget) {
      usedItemIds.add(menuBoardTarget.id);
      const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(menuBoardTarget.qty_month || 0, analyzedDatesCount);
      const reason = `판매량이 높고 인기가 많은 메뉴입니다. 대표 메뉴로 노출을 강화하여 전체 매출을 견인해야 합니다. ${dailyTargetReason}`;
      plans.push({
        puzzleItemName: menuBoardTarget.name,
        setName: `${menuBoardTarget.name} 대표 추천 메뉴`,
        setComposition: `메뉴판 상단 배치, POP 부착, 카운터 추천 멘트`,
        discount: "NO DISCOUNT",
        dailyTargetQty,
        staffComment: `메뉴판 1번 위치, 카운터에서 ${menuBoardTarget.name} 적극 추천!`, 
        type: 'MENU_BOARD',
        reason,
      });
    }

    // 2. STAFF_UPSELL (무료 음료 제공) - Stars 또는 Cash Cows
    let staffUpsellTarget = getUnusedTargetItem(targetableStars);
    if (!staffUpsellTarget) {
      staffUpsellTarget = getUnusedTargetItem(targetableCashCows);
    }

    if (staffUpsellTarget) {
      usedItemIds.add(staffUpsellTarget.id);
      const randomSoftDrink = SOFT_DRINKS[Math.floor(Math.random() * SOFT_DRINKS.length)];
      const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(staffUpsellTarget.qty_month || 0, analyzedDatesCount);
      const reason = `판매량이 높은 메뉴에 무료 ${randomSoftDrink}를 제공하여 객단가를 높이고 고객 만족도를 향상시킬 수 있습니다. ${dailyTargetReason}`;
      plans.push({
        puzzleItemName: staffUpsellTarget.name,
        setName: `${staffUpsellTarget.name} 주문 시`,
        setComposition: `${staffUpsellTarget.name} (혜택) + ${randomSoftDrink} 1개 무료`,
        discount: "FREE DRINK",
        dailyTargetQty,
        staffComment: `손님께 ${staffUpsellTarget.name} 추천 시 ${randomSoftDrink} 무료 제공 안내.`, 
        type: 'STAFF_UPSELL',
        reason,
      });
    }

    // 3. SET_DISCOUNT (마진 50% 유지 할인) - Puzzles
    const setDiscountTarget = getUnusedTargetItem(targetablePuzzles);
    if (setDiscountTarget) {
      const secondItem = getSecondItemForSetDiscount(setDiscountTarget);
      if (secondItem) {
        const setPrice = setDiscountTarget.price + secondItem.price;
        const setUnitCost = (setDiscountTarget.unitCost || 0) + (secondItem.unitCost || 0);
        const setUnitProfit = setPrice - setUnitCost;

        // Calculate max discount to maintain 50% margin
        const maxDiscountToMaintainMargin = setPrice - (setUnitCost / 0.5); // (Price - Discount - UnitCost) / Price >= 0.5
        const minDiscount = setPrice * 0.1; // Minimum 10% discount

        let finalDiscountAmount = 0;
        if (maxDiscountToMaintainMargin > minDiscount) {
          // Round to nearest 5% for better user experience
          const maxDiscountPercentage = Math.floor((maxDiscountToMaintainMargin / setPrice) * 100 / 5) * 5;
          const chosenDiscountPercentage = clamp(maxDiscountPercentage, 10, maxDiscountPercentage); // Ensure at least 10%
          finalDiscountAmount = roundTo0_5(setPrice * (chosenDiscountPercentage / 100));
        } else {
          // If 50% margin cannot be maintained with 10% discount, just apply 10% if profit allows
          finalDiscountAmount = roundTo0_5(setPrice * 0.1);
          if ((setPrice - setUnitCost - finalDiscountAmount) < setUnitProfit * 0.5) {
            finalDiscountAmount = 0; // No discount if margin breaks even with 10%
          }
        }

        if (finalDiscountAmount > 0) {
          const discountPercentage = Math.round((finalDiscountAmount / setPrice) * 100 / 5) * 5; // Round to nearest 5%
          const { dailyTargetQty, dailyTargetReason } = calculateDailyTargetAndReason(setDiscountTarget.qty_month || 0, analyzedDatesCount);
          const reason = `수익성이 높지만 판매량이 낮은 메뉴입니다. ${setDiscountTarget.name}의 평균 이익은 $${setDiscountTarget.cm?.toFixed(2)}이며, 최근 7일 평균 판매량은 ${setDiscountTarget.qty_month}개입니다. 세트 할인 ${discountPercentage}%를 통해 판매량을 늘리고 객단가를 높여야 합니다. ${dailyTargetReason}`;

          plans.push({
            puzzleItemName: setDiscountTarget.name,
            setName: `${setDiscountTarget.name} + ${secondItem.name} 할인 세트`,
            setComposition: `${setDiscountTarget.name} + ${secondItem.name}`,
            discount: `${discountPercentage}% OFF`,
            dailyTargetQty,
            staffComment: `세트 할인 프로모션: ${setDiscountTarget.name} + ${secondItem.name} ${discountPercentage}% 할인 적용. 마진 50% 유지 확인 필수!`,
            type: 'SET_DISCOUNT',
            reason,
          });
        }
      }
    }

    return plans.slice(0, 3);
  }, [menuEngineeringResult, sortedMenuEngineering, INITIAL_CATEGORIES]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.APP_PASSWORD;
    if (!correctPassword) {
      setAuthError("환경변수 APP_PASSWORD가 설정되지 않았습니다. 관리자에게 문의하세요.");
      return;
    }
    if (password === correctPassword) {
      setIsLoggedIn(true);
      localStorage.setItem(AUTH_KEY, 'true');
    } else {
      setAuthError("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(AUTH_KEY);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    setReport('');
    fetchData();
    fetchPastData();
  }, [data.date, isLoggedIn]);

  const fetchData = async () => {
    setDbLoading(true);
    setSaveStatus('');
    try {
      // 1. Load Daily Data
      const dbData = await loadDaily(data.date);
      if (dbData) {
        setData(prev => ({
          ...prev,
          posSales: dbData.posSales,
          orders: dbData.orders,
          visitCount: dbData.visitCount,
          monthlyTarget: dbData.monthlyTarget,
          note: dbData.note,
          categories: dbData.categories,
          mtdSales: prev.mtdSales // Keep current MTD until stats refresh
        }));
      } else {
        setData(prev => ({
          ...prev,
          posSales: 0,
          orders: 0,
          visitCount: 0,
          note: '',
          categories: INITIAL_CATEGORIES.map(cat => ({
            ...cat,
            items: cat.items.map(item => ({ ...item, qty: 0 }))
          }))
        }));
      }

      // 2. Load Monthly Stats
      await refreshMonthlyStats(data.date.substring(0, 7));

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setDbLoading(false);
    }
  };

  const refreshMonthlyStats = async (yearMonth: string) => {
    const total = await getMonthlyTotal(yearMonth);
    const dates = await listDatesInMonth(yearMonth);
    
    setMonthlyStats({
      total,
      avg: dates.length > 0 ? total / dates.length : 0,
      rate: data.monthlyTarget > 0 ? (total / data.monthlyTarget) * 100 : 0
    });
    setDatesWithData(dates);
    setData(prev => ({ ...prev, mtdSales: total }));
  };

  const fetchPastData = async () => {
    // Simulate fetching past 30 days from LocalStorage
    const yearMonth = data.date.substring(0, 7);
    const dates = await listDatesInMonth(yearMonth);
    const list = [];
    for (const d of dates) {
      const item = await loadDaily(d);
      if (item) {
        list.push({
          date: d,
          total_sales: item.posSales,
          orders: item.orders,
          guests: item.visitCount
        });
      }
    }
    setPastData(list.sort((a, b) => b.date.localeCompare(a.date)));
  };

  const fetchPeriodStats = async () => {
    setPeriodLoading(true);
    // Simulate period stats from LocalStorage
    const list = [];
    const start = periodRange.start;
    const end = periodRange.end;
    
    // This is inefficient but works for LocalStorage demo
    const STORAGE_PREFIX = 'sales-coach-ai::hongkongbanjeom-cambodia::';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const d = key.replace(STORAGE_PREFIX, '');
        if (d >= start && d <= end) {
          const item = await loadDaily(d);
          if (item) {
            list.push({
              date: d,
              total_sales: item.posSales,
              orders: item.orders,
              guests: item.visitCount
            });
          }
        }
      }
    }

    if (list.length > 0) {
      const totalSales = list.reduce((acc, curr) => acc + Number(curr.total_sales), 0);
      const totalOrders = list.reduce((acc, curr) => acc + Number(curr.orders), 0);
      const totalVisitors = list.reduce((acc, curr) => acc + Number(curr.guests), 0);
      setPeriodStats({ totalSales, totalOrders, totalVisitors, list: list.sort((a, b) => a.date.localeCompare(b.date)) });
    }
    setPeriodLoading(false);
  };

  const handleMonthChange = async (month: Date) => {
    const yearMonth = format(month, 'yyyy-MM');
    await refreshMonthlyStats(yearMonth);
  };

  const results = useMemo((): CalculationResult => {
    let calcSales = 0;
    let addonSum = 0;
    
    data.categories.forEach(cat => {
      cat.items.forEach(item => {
        calcSales += item.price * (item.qty || 0);
        if (cat.name.includes("토핑")) {
          addonSum += item.qty || 0;
        }
      });
    });

    const gapUsd = data.posSales - calcSales;
    const gapRate = data.posSales > 0 ? (gapUsd / data.posSales) * 100 : 0;
    const absGapRate = Math.abs(gapRate);
    
    let status: '✅' | '🟡' | '🔴' = '✅';
    if (absGapRate > 3) status = '🔴';
    else if (absGapRate > 1) status = '🟡';

    return {
      calcSales: Math.round(calcSales * 100) / 100,
      gapUsd: Math.round(gapUsd * 100) / 100,
      gapRate: Math.round(gapRate * 100) / 100,
      status,
      aov: data.orders > 0 ? Math.round((calcSales / data.orders) * 100) / 100 : 0,
      conversionRate: data.visitCount > 0 ? Math.round((data.orders / data.visitCount) * 1000) / 10 : 0,
      addonPerOrder: data.orders > 0 ? Math.round((addonSum / data.orders) * 10) / 10 : 0
    };
  }, [data]);

  const monthlyRate = useMemo(() => {
    if (!data.monthlyTarget || data.monthlyTarget <= 0) return 0;
    return (monthlyStats.total / data.monthlyTarget) * 100;
  }, [monthlyStats.total, data.monthlyTarget]);

  const handleSave = async (silent = false) => {
    try {
      if (!silent) setSaveStatus('데이터 저장 중...');
      
      const payload = {
        ...data,
        totalSales: results.calcSales // explicitly save totalSales
      };

      await saveDaily(data.date, payload);

      if (!silent) {
        setSaveStatus('저장 완료');
        setToastMsg("매출 데이터 저장이 완료 되었습니다");
      }
      
      // Refresh monthly stats after save
      await refreshMonthlyStats(data.date.substring(0, 7));
      await fetchPastData(); // Also refresh the history table
      return true;
    } catch (error: any) {
      console.error("Save Error:", error);
      if (!silent) {
        setSaveStatus(`저장 실패: ${error.message || '알 수 없는 오류'}`);
        setToastMsg("저장에 실패했습니다. 다시 시도해 주세요.");
      }
      return false;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDaily(data.date);
      
      // Reset local state
      setData(prev => ({
        ...prev,
        posSales: 0,
        orders: 0,
        visitCount: 0,
        note: '',
        categories: INITIAL_CATEGORIES.map(cat => ({
          ...cat,
          items: cat.items.map(item => ({ ...item, qty: 0 }))
        }))
      }));
      setReport('');
      setSaveStatus('데이터 삭제됨');

      // Refresh UI components
      await refreshMonthlyStats(data.date.substring(0, 7));
      await fetchPastData();
      
      setToastMsg("데이터가 삭제되었습니다.");
    } catch (error: any) {
      console.error("Delete Error:", error);
      setToastMsg("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await handleSave(true); // 조용히 자동 저장
      const yearMonth = data.date.substring(0, 7);
      const selectedDate = data.date;
      const end = parseISO(selectedDate);
      const start = subDays(end, 6);
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      const meResult = await calculateMenuEngineeringForRange(startDate, endDate, INITIAL_CATEGORIES);
      setMenuEngineeringResult(meResult);

      const result = await generateCoachingReport(data, results, meResult);
      setReport(result);
    } catch (error: any) {
      console.error("Process Error:", error);
    } finally {
      setLoading(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <i className="fa-solid fa-lock text-white text-2xl"></i>
            </div>
            <h1 className="text-white font-black text-2xl uppercase tracking-tight">Sales Coach AI</h1>
            <p className="text-indigo-100 text-sm font-bold opacity-80 mt-1">비밀번호를 입력하세요</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg font-bold"
                autoFocus
              />
              {authError && <p className="text-rose-500 text-xs font-bold mt-3 text-center">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">

      <nav className="bg-indigo-600 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
              <i className="fa-solid fa-store font-black"></i>
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-none uppercase tracking-tight">홍콩반점 캄보디아</h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase mt-1 tracking-widest">Sales Coach AI (USD)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white font-bold text-sm bg-indigo-500/50 px-3 py-1 rounded-full border border-indigo-400 flex items-center gap-2">
              {dbLoading && <i className="fa-solid fa-spinner fa-spin text-xs"></i>}
              {data.date}
            </div>
            <button 
              onClick={handleLogout}
              className="text-white/60 hover:text-white transition-colors"
              title="로그아웃"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-12">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-between">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-indigo-500"></i>
              {data.date.substring(0, 7)} 월간 요약
            </h3>
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">월 목표</label>
              <div className="relative w-32">
                <input 
                  type="number" 
                  value={data.monthlyTarget || ''} 
                  onChange={e => setData(prev => ({ ...prev, monthlyTarget: Number(e.target.value) }))} 
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1 text-right text-sm font-bold focus:ring-1 focus:ring-indigo-400 outline-none"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 pointer-events-none">USD</span>
              </div>
            </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이번 달 누적 매출</p>
              <p className="text-3xl font-black text-slate-900">${monthlyStats.total.toLocaleString()}</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">일평균 매출</p>
              <p className="text-3xl font-black text-slate-900">${Math.round(monthlyStats.avg).toLocaleString()}</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">목표 달성률</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-indigo-600">{monthlyRate.toFixed(1)}%</p>
                <div className="flex-1 h-2 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(monthlyRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-calendar-check text-indigo-500"></i>
              오늘의 성과 요약 ({data.date})
            </h3>
          </div>
          <div className="p-8 grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">오늘 매출</p>
              <p className="text-2xl font-black text-slate-900">${results.calcSales.toLocaleString()}</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">오늘 주문수</p>
              <p className="text-2xl font-black text-slate-900">{data.orders.toLocaleString()}건</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">오늘 방문객</p>
              <p className="text-2xl font-black text-slate-900">{data.visitCount.toLocaleString()}명</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주문당 매출 (AOV)</p>
              <p className="text-2xl font-black text-slate-900">${results.aov.toFixed(2)}</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">POS 오차</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">${results.gapUsd}</span>
                <span className={`text-sm font-bold ${results.status === '🔴' ? 'text-rose-500' : results.status === '🟡' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {results.status}
                </span>
              </div>
            </div>
          </div>
        </section>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">매출 코치 리포트</h2>
            <p className="text-slate-500 font-medium">분석을 통해 객단가와 전환율을 높이는 부스트 전략을 제안합니다.</p>
          </div>
        </header>

        <div className="relative">
          <DataInput 
            data={data} 
            onChange={setData} 
            loading={loading}
            datesWithData={datesWithData}
            onMonthChange={handleMonthChange}
          />
          
          {saveStatus && (
            <div className="mt-4 text-center">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                saveStatus === '저장 완료' ? 'bg-emerald-50 text-emerald-600' : 
                saveStatus.startsWith('저장 실패') ? 'bg-rose-50 text-rose-600' : 
                'bg-slate-100 text-slate-500'
              }`}>
                {saveStatus}
              </span>
            </div>
          )}
        </div>

        <ReportDisplay 
          report={report} 
          loading={loading} 
          menuEngineeringResult={menuEngineeringResult}
          sortedMenuEngineering={sortedMenuEngineering}
          boostPlans={boostPlans}
        />

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-history text-indigo-500"></i>
              최근 30일 데이터 보기
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">날짜</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">매출</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">주문</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">방문</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pastData.map((row) => (
                  <tr 
                    key={row.date} 
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    onClick={() => {
                      setData(prev => ({ ...prev, date: row.date }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <td className="px-8 py-4 font-bold text-slate-700">{row.date}</td>
                    <td className="px-8 py-4 font-black text-slate-900">${row.total_sales.toLocaleString()}</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{row.orders}건</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{row.guests}명</td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs uppercase tracking-widest">수정하기</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-magnifying-glass-chart text-indigo-500"></i>
              기간별 성과 분석
            </h3>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={periodRange.start} 
                onChange={e => setPeriodRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <span className="text-slate-400">~</span>
              <input 
                type="date" 
                value={periodRange.end} 
                onChange={e => setPeriodRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button 
                onClick={fetchPeriodStats}
                disabled={periodLoading}
                className="bg-indigo-600 text-white px-4 py-1 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {periodLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "조회"}
              </button>
            </div>
          </div>
          {periodStats && (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">기간 총 매출</p>
                  <p className="text-2xl font-black text-slate-900">${periodStats.totalSales.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">기간 총 주문</p>
                  <p className="text-2xl font-black text-slate-900">{periodStats.totalOrders.toLocaleString()}건</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">기간 총 방문</p>
                  <p className="text-2xl font-black text-slate-900">{periodStats.totalVisitors.toLocaleString()}명</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">일별 추이</h4>
                <div className="space-y-2">
                  {periodStats.list.map((row: any) => (
                    <div key={row.date} className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="font-bold text-slate-600">{row.date}</span>
                      <div className="flex items-center gap-8">
                        <span className="font-black text-slate-900">${row.total_sales.toLocaleString()}</span>
                        <span className="text-slate-400 text-xs w-16 text-right">{row.orders}건</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating CTA - Moved to App root for better clickability */}
      <div className="fixed bottom-6 left-0 right-0 z-[9999] flex flex-col md:flex-row justify-center gap-4 px-6 pointer-events-none">
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="bg-white text-rose-600 border-2 border-rose-200 px-6 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-3 active:scale-95 ring-2 ring-red-400 pointer-events-auto"
        >
          <i className="fa-solid fa-trash-can"></i>
          일 데이터 리셋
        </button>
        <button
          type="button"
          onClick={() => {
            setToastMsg("SAVE CLICKED");
            handleSave();
          }}
          className="bg-white text-slate-900 border-2 border-slate-900 px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 pointer-events-auto"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          매출 데이터 저장
        </button>
        <button
          type="button"
          onClick={() => {
            setToastMsg("GENERATE CLICKED");
            handleGenerate();
          }}
          disabled={loading}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-300 pointer-events-auto"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
          코칭 리포트 생성
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]"
          onClick={() => setShowResetModal(false)} // Close on backdrop click
        >
          <div 
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()} // Prevent modal from closing when clicking inside
          >
            <h3 className="font-black text-slate-900 text-xl">일 데이터 리셋</h3>
            <p className="text-slate-700">해당일의 모든 데이터를 삭제 하겠습니까?</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResetModal(false);
                  await handleDelete();
                  setToastMsg("데이터가 삭제되었습니다.");
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-lg z-[10001] animate-fade-in-up">
          {toastMsg}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

};

export default App;
