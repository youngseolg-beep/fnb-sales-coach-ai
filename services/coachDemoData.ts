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

const PILOT_EMAIL = "JP_PN@THEBORN.CO.KR";
const DEMO_ANCHOR = new Date("2026-07-29T00:00:00");

const makeCategories = (sourceCategories: MenuCategory[], date: Date): MenuCategory[] => {
  const dayIndex = Math.round((date.getTime() - DEMO_ANCHOR.getTime()) / DAY_MS);
  const recentWeek = dayIndex >= 7;
  const weekend = date.getDay() === 0 || date.getDay() === 6;

  return sourceCategories
    .map((category) => ({
      ...category,
      items: category.items
        .filter((item) => Number(item.price || 0) > 0)
        .map((item, menuIndex) => {
          const baseline = 3 + ((menuIndex * 3 + category.name.length) % 7);
          const dailyVariation = ((dayIndex * (menuIndex + 2)) % 5) - 2;
          const recentLift = recentWeek && menuIndex % 3 !== 1 ? 1 : 0;
          const weekendLift = weekend ? 2 + (menuIndex % 2) : 0;
          return {
            ...item,
            qty: Math.max(1, baseline + dailyVariation + recentLift + weekendLift),
          };
        }),
    }))
    .filter((category) => category.items.length > 0);
};

/**
 * Development-only, deterministic data for Coach. It never writes to Supabase
 * or localStorage and is used only when the Coach range has no saved rows.
 */
export const getCoachDemoRows = (start: string, end: string, sourceCategories: MenuCategory[]): CoachDemoDailyRow[] => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [];

  const rows: CoachDemoDailyRow[] = [];
  for (let timestamp = startDate.getTime(); timestamp <= endDate.getTime(); timestamp += DAY_MS) {
    const date = new Date(timestamp);
    const categories = makeCategories(sourceCategories, date);
    if (categories.length === 0) continue;
    const menuSales = categories.flatMap((category) => category.items)
      .reduce((sum, item) => sum + item.price * item.qty, 0);
    const dayIndex = Math.round((timestamp - DEMO_ANCHOR.getTime()) / DAY_MS);
    const orders = Math.max(12, Math.round(menuSales / 9500) + ((dayIndex % 5) - 2));
    const visitors = orders + 18 + ((dayIndex * 3) % 13);

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

export const isCoachDemoFixtureEnabled = (userEmail?: string) =>
  (() => {
    const normalized = String(userEmail || "").trim().toUpperCase();
    return normalized === PILOT_EMAIL || normalized.split("@")[0] === "JP_PN";
  })();
