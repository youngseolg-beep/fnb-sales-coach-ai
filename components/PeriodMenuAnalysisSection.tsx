export type ComparisonMode = "WOW" | "MOM" | "YOY" | "MANUAL";

export interface DateRange {
  start: string;
  end: string;
}

const toDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getLastDayOfMonth = (year: number, monthIndexZeroBased: number) => {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
};

const addMonthsClamped = (date: Date, months: number) => {
  const originalDay = date.getDate();

  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;

  const base = new Date(targetYear, targetMonth, 1);
  const lastDay = getLastDayOfMonth(base.getFullYear(), base.getMonth());
  const clampedDay = Math.min(originalDay, lastDay);

  const result = new Date(base.getFullYear(), base.getMonth(), clampedDay);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addYearsClamped = (date: Date, years: number) => {
  const originalDay = date.getDate();
  const originalMonth = date.getMonth();

  const targetYear = date.getFullYear() + years;
  const lastDay = getLastDayOfMonth(targetYear, originalMonth);
  const clampedDay = Math.min(originalDay, lastDay);

  const result = new Date(targetYear, originalMonth, clampedDay);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getInclusiveDays = (start: Date, end: Date) => {
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const getComparisonRange = (
  currentRange: DateRange,
  mode: ComparisonMode
): DateRange => {
  const start = toDate(currentRange.start);
  const end = toDate(currentRange.end);

  if (mode === "WOW") {
    return {
      start: formatDate(addDays(start, -7)),
      end: formatDate(addDays(end, -7)),
    };
  }

  if (mode === "MOM") {
    return {
      start: formatDate(addMonthsClamped(start, -1)),
      end: formatDate(addMonthsClamped(end, -1)),
    };
  }

  if (mode === "YOY") {
    return {
      start: formatDate(addYearsClamped(start, -1)),
      end: formatDate(addYearsClamped(end, -1)),
    };
  }

  const days = getInclusiveDays(start, end);

  return {
    start: formatDate(addDays(start, -days)),
    end: formatDate(addDays(start, -1)),
  };
};
