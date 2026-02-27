
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const STORAGE_PREFIX = 'sales-coach-ai::hongkongbanjeom-cambodia::';

export interface SalesReportDataLike {
  date: string;
  posSales: number;
  totalSales?: number; // Added for explicit total sales tracking
  orders: number;
  visitCount: number;
  note: string;
  monthlyTarget: number;
  categories: any[];
}

export const saveDaily = async (date: string, payload: SalesReportDataLike): Promise<void> => {
  const key = `${STORAGE_PREFIX}${date}`;
  // Ensure totalSales is explicitly set if not present (fallback to posSales)
  const record = {
    ...payload,
    totalSales: payload.totalSales ?? payload.posSales
  };
  localStorage.setItem(key, JSON.stringify(record));
};

export const loadDaily = async (date: string): Promise<SalesReportDataLike | null> => {
  const key = `${STORAGE_PREFIX}${date}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    // Ensure totalSales is present for backward compatibility during load
    return {
      ...parsed,
      totalSales: parsed.totalSales ?? parsed.posSales
    };
  } catch (e) {
    console.error('Failed to parse sales data', e);
    return null;
  }
};

export const listDatesInMonth = async (yearMonth: string): Promise<string[]> => {
  const matchedDates: string[] = [];
  const dateRegex = /(\d{4}-\d{2}-\d{2})$/;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const m = key.match(dateRegex);
      if (m) {
        const dateStr = m[1];
        if (dateStr.startsWith(yearMonth)) {
          matchedDates.push(dateStr);
        }
      }
    }
  }
  return matchedDates.sort();
};

export const listDatesInRange = async (startDate: string, endDate: string): Promise<string[]> => {
  const matchedDates: string[] = [];
  const dateRegex = /(\d{4}-\d{2}-\d{2})$/;

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const m = key.match(dateRegex);
      if (m) {
        const dateStr = m[1];
        const date = parseISO(dateStr);
        if (isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) })) {
          matchedDates.push(dateStr);
        }
      }
    }
  }
  return matchedDates.sort();
};

export const getMonthlyTotal = async (yearMonth: string): Promise<number> => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const datePart = key.replace(STORAGE_PREFIX, '');
      if (datePart.startsWith(yearMonth)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Use totalSales as the primary source for monthly total
            total += Number(parsed.totalSales ?? parsed.posSales ?? 0);
          } catch (e) {
            // ignore
          }
        }
      }
    }
  }
  return total;
};

export const deleteDaily = async (date: string): Promise<void> => {
  const key = `${STORAGE_PREFIX}${date}`;
  localStorage.removeItem(key);
};
