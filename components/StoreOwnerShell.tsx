import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu";

type MenuItem = {
  key: StoreOwnerPageKey;
  label: string;
  description: string;
  icon: string;
};

type Props = {
  currentPage: StoreOwnerPageKey;
  onChangePage: (page: StoreOwnerPageKey) => void;
  onChangeDate: (date: string) => void;
  onMonthChange: (month: Date) => void;
  datesWithData: string[];
  onLogout: () => void;
  children: ReactNode;
  selectedDate: string;
  monthlyTarget: number;
  monthlyRate: number;
};

const MENU_ITEMS: MenuItem[] = [
  { key: "summary", label: "Summary", description: "", icon: "fa-chart-line" },
  { key: "sales", label: "Sales", description: "", icon: "fa-pen-to-square" },
  { key: "detail", label: "Detail", description: "", icon: "fa-chart-pie" },
  { key: "menu", label: "Menu", description: "", icon: "fa-utensils" },
];

const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDaysLocal = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const formatWeekdayShort = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);

export default function StoreOwnerShell({
  currentPage,
  onChangePage,
  onChangeDate,
  onMonthChange,
  datesWithData,
  onLogout,
  children,
  selectedDate,
  monthlyTarget,
  monthlyRate,
}: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

  const selectedDateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const datesSet = useMemo(() => new Set(datesWithData || []), [datesWithData]);

  const visibleDates = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => addDaysLocal(selectedDateObj, i - 5));
  }, [selectedDateObj]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-3 py-3 sm:px-6 sm:py-4">

          {/* TOP ROW */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-[16px] sm:text-[20px] md:text-[24px] font-black">
              Sales
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[10px] sm:text-xs">
                ${monthlyTarget}
              </div>
              <div className="text-[10px] sm:text-xs text-indigo-600 font-bold">
                {monthlyRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* DATE ROW */}
          <div className="flex justify-between items-center">
            <button
              ref={calendarButtonRef}
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-xs sm:text-sm font-bold border px-3 py-2 rounded-xl"
            >
              {selectedDate}
            </button>
          </div>

          {/* DATE SCROLL */}
          <div className="mt-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">

              {visibleDates.map((date) => {
                const key = formatLocalDate(date);
                const active = key === selectedDate;
                const hasData = datesSet.has(key);

                return (
                  <button
                    key={key}
                    onClick={() => onChangeDate(key)}
                    className={`
                      relative flex flex-col items-center justify-center
                      h-[58px] w-[46px]
                      sm:h-[64px] sm:w-[52px]
                      md:h-[72px] md:w-[58px]
                      rounded-2xl border
                      ${active ? "bg-slate-900 text-white" : "bg-white"}
                    `}
                  >
                    <span className="text-[8px] sm:text-[9px] text-slate-400">
                      {formatWeekdayShort(date)}
                    </span>

                    <span className="text-[18px] sm:text-[22px] md:text-[26px] font-black">
                      {date.getDate()}
                    </span>

                    {hasData && (
                      <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    )}
                  </button>
                );
              })}

            </div>
          </div>

        </div>
      </header>

      {/* BODY */}
      <main className="px-3 py-4 sm:px-6">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">

          {MENU_ITEMS.map((item) => {
            const active = item.key === currentPage;

            return (
              <button
                key={item.key}
                onClick={() => onChangePage(item.key)}
                className={`
                  flex flex-col items-center justify-center
                  h-12 rounded-xl
                  ${active ? "bg-slate-900 text-white" : "text-slate-500"}
                `}
              >
                <i className={`fa-solid ${item.icon} text-xs`} />
                <span className="text-[10px] font-bold mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center h-12 text-rose-500"
          >
            <i className="fa-solid fa-right-from-bracket text-xs" />
            <span className="text-[10px] font-bold mt-1">Logout</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
