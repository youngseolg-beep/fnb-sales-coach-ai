import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu";

type MenuItem = {
  key: StoreOwnerPageKey;
  label: string;
  description: string;
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
  },
  {
    key: "sales",
    label: "Sales",
    description: "일 매출 입력 및 캘린더",
  },
  {
    key: "detail",
    label: "Detail",
    description: "리포트 및 상세 분석",
  },
  {
    key: "menu",
    label: "Menu",
    description: "메뉴 설정 및 가격 관리",
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
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseLocalDate(selectedDate));
  const [calendarRenderKey, setCalendarRenderKey] = useState(0);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const activeMenu = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === currentPage) ?? MENU_ITEMS[0];
  }, [currentPage]);

  const datesWithDataSet = useMemo(() => new Set(datesWithData || []), [datesWithData]);

  const handleMove = (page: StoreOwnerPageKey) => {
    onChangePage(page);
    setOpen(false);
  };

  const toggleCalendar = () => {
    if (!showCalendar && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const popupWidth = 320;

      let left = rect.left;
      if (left + popupWidth > windowWidth) left = windowWidth - popupWidth - 20;
      if (left < 20) left = 20;

      const currentMonth = parseLocalDate(selectedDate);

      setCalendarPos({
        top: rect.bottom + window.scrollY + 8,
        left,
      });
      setCalendarMonth(currentMonth);
      setCalendarRenderKey((prev) => prev + 1);
      onMonthChange(currentMonth);
      setShowCalendar(true);
      return;
    }

    setShowCalendar(false);
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            >
              ☰
            </button>

            <div>
              <button
                ref={dateButtonRef}
                type="button"
                onClick={toggleCalendar}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                  <i className="fa-solid fa-calendar-days text-sm"></i>
                </div>

                <div className="text-left leading-tight">
                  <div className="text-sm font-black text-slate-900 group-hover:text-indigo-700">
                    {selectedDate}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500">
                    날짜 변경
                  </div>
                </div>

                <div className="ml-1 text-slate-400 transition-colors group-hover:text-indigo-500">
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </div>
              </button>

              <div className="mt-1 pl-1 text-[10px] font-black text-slate-400 tracking-widest">
                POWERED BY <span className="text-slate-900">YOUNGSEOL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">월 목표</div>
              <div className="text-sm font-black text-slate-900">
                ${monthlyTarget.toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400">달성률</div>
              <div className="text-sm font-black text-indigo-600">
                {monthlyRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </header>

      {showCalendar && (
        <div
          className="fixed z-[9998] w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
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

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <aside className="absolute left-0 top-0 h-full w-[84%] max-w-sm border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                <div className="text-sm text-slate-500">{subtitle}</div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <nav className="px-3 py-3">
              <div className="mb-3 px-2 text-xs font-semibold uppercase text-slate-400">
                Navigation
              </div>

              <div className="space-y-2">
                {MENU_ITEMS.map((item) => {
                  const active = item.key === currentPage;

                  return (
                    <button
                      key={item.key}
                      onClick={() => handleMove(item.key)}
                      className={[
                        "w-full rounded-2xl border px-4 py-3 text-left",
                        active
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-900",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-rose-600 hover:bg-rose-100"
                >
                  <div className="text-sm font-semibold">Logout</div>
                  <div className="mt-1 text-xs text-rose-400">현재 계정에서 로그아웃</div>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}
