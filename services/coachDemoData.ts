import type { MenuCategory } from "../types";

export type CoachDemoDailyRow = {
  date: string;
  sales: number;
  orders: number;
  visitors: number;
  categories: MenuCategory[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MENU = [
  { id: "demo-jjajang", name: "짜장면", price: 8500, unitCost: 2600, base: 13 },
  { id: "demo-jjamppong", name: "짬뽕", price: 9800, unitCost: 3400, base: 10 },
  { id: "demo-tangsuyuk", name: "탕수육", price: 21000, unitCost: 8300, base: 5 },
  { id: "demo-bokkeumbap", name: "볶음밥", price: 9000, unitCost: 3100, base: 7 },
  { id: "demo-gunmandu", name: "군만두", price: 6000, unitCost: 1900, base: 5 },
  { id: "demo-cola", name: "콜라", price: 3000, unitCost: 700, base: 8 },
  { id: "demo-sprite", name: "스프라이트", price: 3000, unitCost: 700, base: 5 },
  { id: "demo-beer", name: "맥주", price: 5000, unitCost: 1500, base: 6 },
];

const makeCategories = (index: number, weekend: boolean): MenuCategory[] => {
  const items = MENU.map((menu, menuIndex) => ({
    ...menu,
    qty: Math.max(0, menu.base + ((index * (menuIndex + 3)) % 7) - 3 + (weekend ? 3 : 0)),
  }));

  return [
    { name: "메인 메뉴", items: items.slice(0, 5) },
    { name: "음료", items: items.slice(5) },
  ];
};

/**
 * Development-only, deterministic data for Coach. It never writes to Supabase
 * or localStorage and is used only when the Coach range has no saved rows.
 */
export const getCoachDemoRows = (start: string, end: string): CoachDemoDailyRow[] => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [];

  const rows: CoachDemoDailyRow[] = [];
  for (let timestamp = startDate.getTime(); timestamp <= endDate.getTime(); timestamp += DAY_MS) {
    const date = new Date(timestamp);
    const index = Math.floor(timestamp / DAY_MS);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const categories = makeCategories(index, weekend);
    const menuSales = categories.flatMap((category) => category.items)
      .reduce((sum, item) => sum + item.price * item.qty, 0);
    const orders = Math.max(24, Math.round(menuSales / 11200) + ((index % 9) - 4));
    const visitors = orders + 28 + ((index * 3) % 21);

    rows.push({
      date: formatDate(date),
      sales: menuSales,
      orders,
      visitors,
      categories,
    });
  }
  return rows;
};

export const isCoachDemoFixtureEnabled = () => import.meta.env.DEV;
