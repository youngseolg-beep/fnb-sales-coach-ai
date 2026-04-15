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

const formatMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatWeekdayShort = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
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
  const [visibleStartDate, setVisibleStartDate] = useState<Date>(() =>
    addDaysLocal(parseLocalDate(selectedDate), -4)
  );

  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const calendarLayerRef = useRef<HTMLDivElement>(null);

  const activeMenu = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === currentPage) ?? MENU_ITEMS[0];
  }, [currentPage]);

  const datesWithDataSet = useMemo(() => new Set(datesWithData || []), [datesWithData]);
  const selectedDateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);

  const visibleDates = useMemo(() => {
    return Array.from({ length: 9 }, (_, idx) => addDaysLocal(visibleStartDate, idx));
  }, [visibleStartDate]);

 const openCalendar = () => {
  if (!calendarButtonRef.current) return;

  const rect = calendarButtonRef.current.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const popupWidth = Math.min(360, windowWidth - 24);
  const popupHeight = 420;

  let left = rect.right - popupWidth;
  if (left < 12) left = 12;
  if (left + popupWidth > windowWidth - 12) {
    left = windowWidth - popupWidth - 12;
  }

  let top = rect.bottom + 10;

  if (top + popupHeight > windowHeight - 12) {
    top = rect.top - popupHeight - 10;
  }

  if (top < 12) {
    top = 12;
  }

  const currentMonth = parseLocalDate(selectedDate);

  setCalendarPos({
    top,
    left,
  });
  setCalendarMonth(currentMonth);
  setCalendarRenderKey((prev) => prev + 1);
  onMonthChange(currentMonth);
  setShowCalendar(true);
};

  const toggleCalendar = () => {
    setShowCalendar((prev) => {
      if (prev) return false;
      openCalendar();
      return true;
    });
  };

  useEffect(() => {
    if (!showCalendar) return;

    const handleOutsidePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedButton = calendarButtonRef.current?.contains(target);
      const clickedPopup = calendarLayerRef.current?.contains(target);

      if (clickedButton || clickedPopup) return;
      setShowCalendar(false);
    };

    document.addEventListener("mousedown", handleOutsidePointerDown);
    document.addEventListener("touchstart", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsidePointerDown);
      document.removeEventListener("touchstart", handleOutsidePointerDown);
    };
  }, [showCalendar]);

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

  useEffect(() => {
    const current = parseLocalDate(selectedDate);

    const rangeStart = new Date(visibleStartDate);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = addDaysLocal(visibleStartDate, 8);
    rangeEnd.setHours(0, 0, 0, 0);

    const currentOnly = new Date(current);
    currentOnly.setHours(0, 0, 0, 0);

    if (currentOnly < rangeStart || currentOnly > rangeEnd) {
      setVisibleStartDate(addDaysLocal(currentOnly, -4));
    }
  }, [selectedDate, visibleStartDate]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f8f9fc]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-2 pb-2 pt-2 sm:px-6 sm:pb-4 sm:pt-4 sm:px-6 sm:pb-4 sm:pt-4">
          <div className="rounded-[24px] border border-slate-200/80 bg-white px-2 py-1.5 sm:px-3 sm:py-2.5 sm:px-5 sm:py-4 shadow-sm sm:rounded-[28px] sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 sm:text-[10px]">
                  {title}
                </div>
                <div className="mt-1 text-[18px] sm:text-2xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  {activeMenu.label}
                </div>
                <div className="mt-1 text-[10px] font-medium leading-tight text-slate-500 sm:text-xs sm:text-sm">
                  {activeMenu.description}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-[18px] bg-slate-50 px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:px-3">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
                    Goal
                  </div>
                  <div className="text-[13px] font-black text-slate-900 sm:text-base">
                    ${monthlyTarget.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-[18px] bg-indigo-50 px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:px-3">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-400 sm:text-[10px]">
                    Rate
                  </div>
                  <div className="text-[13px] font-black text-indigo-600 sm:text-base">
                    {monthlyRate.toFixed(1)}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden h-11 items-center justify-center rounded-[18px] border border-rose-200 bg-rose-50 px-4 text-xs sm:text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 sm:inline-flex"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 sm:mt-4">
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 sm:text-[10px]">
                  {formatMonthTitle(selectedDateObj)}
                </div>
                <div className="mt-1 text-[9px] font-bold leading-tight text-slate-500 sm:text-xs">
                  POWERED BY <span className="text-slate-900">YOUNGSEOL</span>
                </div>
              </div>

              <button
                ref={calendarButtonRef}
                type="button"
                onClick={toggleCalendar}
                className="relative z-[10000] inline-flex h-10 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-3 text-[13px] font-black text-slate-900 shadow-sm transition-colors hover:bg-slate-50 sm:h-10 sm:px-4 sm:text-xs sm:text-sm"
              >
                <i className="fa-solid fa-calendar-days text-[10px] text-slate-500 sm:text-[10px]"></i>
                <span className="leading-none">{selectedDate}</span>
                <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 sm:text-[10px]"></i>
              </button>
            </div>

            <div className="mt-3 overflow-x-auto pb-1 sm:mt-4">
              <div className="flex min-w-max gap-1.5 sm:gap-2.5">
                {visibleDates.map((date) => {
                  const dateKey = formatLocalDate(date);
                  const active = dateKey === selectedDate;
                  const hasData = datesWithDataSet.has(dateKey);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => onChangeDate(dateKey)}
                      className={[
                        "relative flex h-[54px] w-[42px] sm:h-[76px] sm:w-[60px] shrink-0 flex-col items-center justify-center rounded-[20px] border transition-all sm:h-[76px] sm:w-[60px] sm:rounded-[22px]",
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-[8px] font-bold uppercase tracking-wide",
                          active ? "text-slate-300" : "text-slate-400",
                        ].join(" ")}
                      >
                        {formatWeekdayShort(date)}
                      </span>

                      <span className="mt-1 text-[19px] sm:text-[26px] font-black leading-none sm:mt-1.5 sm:text-[26px]">
                        {date.getDate()}
                      </span>

                      <span
                        className={[
                          "absolute bottom-1.5 h-1.5 w-1.5 rounded-full",
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
          ref={calendarLayerRef}
          className="fixed z-[9998] w-[min(360px,calc(100vw-24px))] rounded-[24px] border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-[28px]"
          style={{
            top: `${calendarPos.top}px`,
            left: `${calendarPos.left}px`,
          }}
        >
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <i className="fa-solid fa-xmark text-xs sm:text-sm"></i>
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

      <main className="mx-auto max-w-7xl px-2 py-2 sm:py-3 sm:px-6 sm:px-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2 px-3 py-2 sm:py-3">
          {MENU_ITEMS.map((item) => {
            const active = item.key === currentPage;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangePage(item.key)}
                className={[
                  "flex h-11 sm:h-14 flex-col items-center justify-center rounded-[18px] transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                <i className={`${item.icon} text-xs sm:text-sm`}></i>
                <span className="mt-1 text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
