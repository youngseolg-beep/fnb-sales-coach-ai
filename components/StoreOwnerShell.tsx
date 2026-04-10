import {
  useMemo,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu";

type MenuItem = {
  key: StoreOwnerPageKey;
  label: string;
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
  { key: "summary", label: "Summary", icon: "fa-solid fa-house" },
  { key: "sales", label: "Sales", icon: "fa-solid fa-pen-to-square" },
  { key: "detail", label: "Detail", icon: "fa-solid fa-chart-line" },
  { key: "menu", label: "Menu", icon: "fa-solid fa-utensils" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const formatMonthLabel = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const addDaysLocal = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

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
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    parseLocalDate(selectedDate)
  );
  const [calendarRenderKey, setCalendarRenderKey] = useState(0);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });

  const monthButtonRef = useRef<HTMLButtonElement>(null);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const selectedDateRef = useRef<HTMLButtonElement>(null);

  const selectedDateObj = useMemo(
    () => parseLocalDate(selectedDate),
    [selectedDate]
  );

  const datesWithDataSet = useMemo(
    () => new Set(datesWithData || []),
    [datesWithData]
  );

  const visibleDates = useMemo(() => {
    return Array.from({ length: 21 }, (_, index) =>
      addDaysLocal(selectedDateObj, index - 10)
    );
  }, [selectedDateObj]);

  const openCalendar = () => {
    if (!monthButtonRef.current) return;

    const rect = monthButtonRef.current.getBoundingClientRect();
    const popupWidth = 328;
    const windowWidth = window.innerWidth;

    let left = rect.left;
    if (left + popupWidth > windowWidth) left = windowWidth - popupWidth - 16;
    if (left < 16) left = 16;

    const currentMonth = parseLocalDate(selectedDate);

    setCalendarPos({
      top: rect.bottom + window.scrollY + 8,
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
    onMonthChange(nextMonth);
    if (showCalendar) {
      setCalendarRenderKey((prev) => prev + 1);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDateRef.current || !dateStripRef.current) return;
    selectedDateRef.current.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f7f8fc]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-[30px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <button
                  ref={monthButtonRef}
                  type="button"
                  onClick={toggleCalendar}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition-all hover:bg-slate-200"
                >
                  <span>{formatMonthLabel(selectedDateObj)}</span>
                  <i className="fa-solid fa-chevron-down text-[10px]"></i>
                </button>

                <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Selected date
                </div>
                <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  {selectedDate}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Target
                  </div>
                  <div className="mt-1 text-sm font-black text-slate-900">
                    ${monthlyTarget.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Rate
                  </div>
                  <div className="mt-1 text-sm font-black text-indigo-600">
                    {monthlyRate.toFixed(1)}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-500"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
                </button>
              </div>
            </div>

            <div
              ref={dateStripRef}
              className="mt-5 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleDates.map((date) => {
                const dateStr = formatLocalDate(date);
                const active = dateStr === selectedDate;
                const hasData = datesWithDataSet.has(dateStr);

                return (
                  <button
                    key={dateStr}
                    ref={active ? selectedDateRef : undefined}
                    type="button"
                    onClick={() => onChangeDate(dateStr)}
                    className={[
                      "relative flex min-w-[72px] shrink-0 flex-col items-center rounded-[26px] px-3 py-3 transition-all",
                      active
                        ? "bg-indigo-500 text-white shadow-[0_10px_24px_rgba(99,102,241,0.28)]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "text-[11px] font-black uppercase tracking-[0.14em]",
                        active ? "text-white/80" : "text-slate-400",
                      ].join(" ")}
                    >
                      {DAY_LABELS[date.getDay()]}
                    </div>

                    <div className="mt-1 text-lg font-black leading-none">
                      {date.getDate()}
                    </div>

                    <div className="mt-2 h-1.5">
                      {hasData && (
                        <span
                          className={[
                            "block h-1.5 w-1.5 rounded-full",
                            active ? "bg-white" : "bg-indigo-500",
                          ].join(" ")}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pl-1 text-[10px] font-black tracking-[0.18em] text-slate-400">
              POWERED BY <span className="text-slate-900">YOUNGSEOL</span>
            </div>
          </div>
        </div>
      </header>

      {showCalendar && (
        <div
          className="fixed z-[9998] w-[328px] rounded-[28px] border border-slate-200 bg-white p-3 shadow-2xl"
          style={{
            top: `${calendarPos.top}px`,
            left: `${calendarPos.left}px`,
          }}
        >
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
              hasData: "store-owner-has-data-day",
            }}
          />

          <style>{`
            .store-owner-has-data-day {
              position: relative;
            }
            .store-owner-has-data-day::after {
              content: "";
              position: absolute;
              bottom: 6px;
              left: 50%;
              transform: translateX(-50%);
              width: 6px;
              height: 6px;
              border-radius: 9999px;
              background: #6366f1;
            }
          `}</style>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {MENU_ITEMS.map((item) => {
            const active = item.key === currentPage;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangePage(item.key)}
                className="flex flex-col items-center justify-center gap-1 rounded-[22px] py-2"
              >
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                    active
                      ? "bg-indigo-500 text-white shadow-[0_10px_20px_rgba(99,102,241,0.24)]"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  <i className={`${item.icon} text-sm`}></i>
                </div>
                <div
                  className={[
                    "text-[11px] font-black",
                    active ? "text-slate-900" : "text-slate-400",
                  ].join(" ")}
                >
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
