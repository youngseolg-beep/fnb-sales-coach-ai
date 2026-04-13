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
  title?: string;
  subtitle?: string;
  selectedDate: string;
  monthlyTarget: number;
  monthlyRate: number;
};

const MENU_ITEMS: MenuItem[] = [
  {
    key: "summary",
    label: "Summary",
    description: "오늘 요약 및 핵심 KPI",
    icon: "fa-solid fa-chart-line",
  },
  {
    key: "sales",
    label: "Sales",
    description: "일 매출 입력 및 캘린더",
    icon: "fa-solid fa-pen-to-square",
  },
  {
    key: "detail",
    label: "Detail",
    description: "리포트 및 상세 분석",
    icon: "fa-solid fa-chart-pie",
  },
  {
    key: "menu",
    label: "Menu",
    description: "메뉴 설정 및 가격 관리",
    icon: "fa-solid fa-utensils",
  },
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

const startOfMonthLocal = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatWeekdayShort = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
};

const formatDayNumber = (date: Date) => {
  return String(date.getDate());
};

export default function StoreOwnerShell({
  currentPage,
  onChangePage,
  onChangeDate,
  onMonthChange,
  datesWithData,
  onLogout,
  children,
  title = "Sales Coach AI",
  subtitle = "Store Owner Workspace",
  selectedDate,
  monthlyTarget,
  monthlyRate,
}: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseLocalDate(selectedDate));
  const [calendarRenderKey, setCalendarRenderKey] = useState(0);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

  const activeMenu = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === currentPage) ?? MENU_ITEMS[0];
  }, [currentPage]);

  const datesWithDataSet = useMemo(() => new Set(datesWithData || []), [datesWithData]);

  const selectedDateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);

  const visibleDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => addDaysLocal(selectedDateObj, idx - 3));
  }, [selectedDateObj]);

  const openCalendar = () => {
    if (!calendarButtonRef.current) return;

    const rect = calendarButtonRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const popupWidth = Math.min(360, windowWidth - 24);

    let left = rect.right - popupWidth;
    if (left < 12) left = 12;
    if (left + popupWidth > windowWidth - 12) left = windowWidth - popupWidth - 12;

    const currentMonth = parseLocalDate(selectedDate);

    setCalendarPos({
      top: rect.bottom + window.scrollY + 10,
      left,
    });
    setCalendarMonth(currentMonth);
    setCalendarRenderKey((prev) => prev + 1);
    onMonthChange(currentMonth);
    setShowCalendar(true);
  };

  const toggleCalendar = () => {
    if (showCalendar) {
      setShowCalendar(false);
      return;
    }
    openCalendar();
  };

  useEffect(() => {
    if (!showCalendar) return;

    const close = () => setShowCalendar(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [showCalendar]);

  useEffect(() => {
    const nextMonth = parseLocalDate(selectedDate);
    setCalendarMonth(nextMonth);

    if (showCalendar) {
      setCalendarRenderKey((prev) => prev + 1);
    }
  }, [selectedDate, showCalendar]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#f7f7fb]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-4 sm:px-6">
          <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  {title}
                </div>
                <div className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  {activeMenu.label}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  {activeMenu.description}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Goal
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    ${monthlyTarget.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                    Rate
                  </div>
                  <div className="text-sm font-black text-indigo-600">
                    {monthlyRate.toFixed(1)}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 sm:inline-flex"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  {formatMonthTitle(selectedDateObj)}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  POWERED BY <span className="text-slate-900">YOUNGSEOL</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = addDaysLocal(selectedDateObj, -1);
                    onChangeDate(formatLocalDate(prev));
                    onMonthChange(startOfMonthLocal(prev));
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
                >
                  <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>

                <button
                  ref={calendarButtonRef}
                  type="button"
                  onClick={toggleCalendar}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
                >
                  <i className="fa-solid fa-calendar-days text-xs text-slate-500"></i>
                  {selectedDate}
                  <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = addDaysLocal(selectedDateObj, 1);
                    onChangeDate(formatLocalDate(next));
                    onMonthChange(startOfMonthLocal(next));
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
                >
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2 sm:gap-3">
                {visibleDates.map((date) => {
                  const dateKey = formatLocalDate(date);
                  const active = dateKey === selectedDate;
                  const hasData = datesWithDataSet.has(dateKey);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => {
                        onChangeDate(dateKey);
                        onMonthChange(startOfMonthLocal(date));
                      }}
                      className={[
                        "relative flex h-[84px] w-[68px] shrink-0 flex-col items-center justify-center rounded-[24px] border transition-all sm:h-[92px] sm:w-[76px]",
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-[11px] font-bold uppercase tracking-wide",
                          active ? "text-slate-300" : "text-slate-400",
                        ].join(" ")}
                      >
                        {formatWeekdayShort(date)}
                      </span>

                      <span className="mt-2 text-xl font-black sm:text-2xl">
                        {formatDayNumber(date)}
                      </span>

                      <span
                        className={[
                          "mt-1 text-[10px] font-bold",
                          active ? "text-slate-400" : "text-slate-400",
                        ].join(" ")}
                      >
                        {dateKey.slice(5)}
                      </span>

                      <span
                        className={[
                          "absolute bottom-3 h-1.5 w-1.5 rounded-full",
                          hasData ? (active ? "bg-indigo-300" : "bg-indigo-500") : "bg-transparent",
                        ].join(" ")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showCalendar && (
        <div
          className="fixed z-[9998] w-[min(360px,calc(100vw-24px))] rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl"
          style={{
            top: `${calendarPos.top}px`,
            left: `${calendarPos.left}px`,
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Quick Calendar
              </div>
              <div className="mt-1 text-lg font-black text-slate-900">
                {formatMonthTitle(calendarMonth)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <DayPicker
            key={calendarRenderKey}
            mode="single"
            month={calendarMonth}
            selected={parseLocalDate(selectedDate)}
            onMonthChange={(month) => {
              setCalendarMonth(month);
              onMonthChange(month);
            }}
            onSelect={(date) => {
              if (!date) return;
              onChangeDate(formatLocalDate(date));
              setShowCalendar(false);
            }}
            modifiers={{
              hasData: (date) => datesWithDataSet.has(formatLocalDate(date)),
            }}
            modifiersClassNames={{
              hasData: "has-data-day",
            }}
          />

          <style>{`
            .has-data-day {
              position: relative;
            }
            .has-data-day::after {
              content: "";
              position: absolute;
              bottom: 6px;
              left: 50%;
              transform: translateX(-50%);
              width: 6px;
              height: 6px;
              border-radius: 9999px;
              background: #4f46e5;
            }
          `}</style>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-5 gap-2 px-3 py-3">
          {MENU_ITEMS.map((item) => {
            const active = item.key === currentPage;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangePage(item.key)}
                className={[
                  "flex h-14 flex-col items-center justify-center rounded-2xl transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                <i className={`${item.icon} text-sm`}></i>
                <span className="mt-1 text-[11px] font-bold">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onLogout}
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-all hover:bg-rose-100"
          >
            <i className="fa-solid fa-right-from-bracket text-sm"></i>
            <span className="mt-1 text-[11px] font-bold">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
