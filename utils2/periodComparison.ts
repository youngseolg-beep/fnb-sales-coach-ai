export type ComparisonMode = "WOW" | "MOM" | "YOY";

export interface DateRange {
  start: string;
  end: string;
}

const toDate = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
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

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addYears = (date: Date, years: number) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
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
      start: formatDate(addMonths(start, -1)),
      end: formatDate(addMonths(end, -1)),
    };
  }

  return {
    start: formatDate(addYears(start, -1)),
    end: formatDate(addYears(end, -1)),
  };
};
