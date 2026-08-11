import { Fragment, useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { formatCurrencyValue } from "../utils2/currency";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu" | "more";

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
  country?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    key: "detail",
    label: "Coach",
    description: "AI 코치와 매장 분석",
    icon: "fa-solid fa-wand-magic",
  },
  {
    key: "sales",
    label: "Sales",
    description: "일 매출 입력 및 캘린더",
    icon: "fa-solid fa-pen-to-square",
  },
  {
    key: "summary",
    label: "Home",
    description: "오늘의 브리프와 매장 상태",
    icon: "fa-solid fa-house",
  },
  {
    key: "menu",
    label: "Menu",
    description: "메뉴 설정 및 가격 관리",
    icon: "fa-solid fa-utensils",
  },
  {
    key: "more",
    label: "More",
    description: "설정 및 도움말",
    icon: "fa-solid fa-ellipsis",
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
  country,
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

    let top = rect.bottom + 8;

    if (top + popupHeight > windowHeight - 12) {
      top = rect.top - popupHeight - 8;
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
    <div className="min-h-screen bg-[#faf8f6] pb-[calc(env(safe-area-inset-bottom)+96px)] text-[#1f1f1f] sm:pb-[calc(env(safe-area-inset-bottom)+100px)]">
      {currentPage !== "summary" && <header className="sticky top-0 z-40 border-b border-[#eee7e1] bg-[#faf8f6]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 sm:py-3">
          {currentPage === "sales" ? (
            <div className="flex h-14 items-center justify-between border-b border-[#eee8e3] bg-white px-2 sm:px-4">
              <div className="flex items-center gap-3"><i className="fa-solid fa-arrow-left text-[15px] text-[#2e2824]" /><span className="text-[18px] font-bold tracking-[-0.05em] text-[#1f1f1f]">매출 입력</span></div>
              <button ref={calendarButtonRef} type="button" onClick={toggleCalendar} className="relative z-[10000] inline-flex h-9 items-center gap-2 rounded-[9px] border border-[#e3d9d2] bg-white px-3 text-[11px] font-semibold text-[#3d342f]">
                <span>{selectedDate}</span><i className="fa-regular fa-calendar text-[12px] text-[#5d4b3e]" />
              </button>
            </div>
          ) : <>
          <div className="rounded-[16px] border border-[#ece5df] bg-white px-3 py-2.5 shadow-[0_4px_14px_rgba(79,60,45,0.035)] sm:rounded-[18px] sm:px-5 sm:py-3">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9b8d82] sm:text-[11px]">
                  {title}
                </div>
                <div className="mt-0.5 text-[19px] font-bold tracking-[-0.04em] text-[#1f1f1f] sm:mt-1 sm:text-2xl">
                  {activeMenu.label}
                </div>
                <div className="mt-0.5 text-[10px] font-medium leading-tight text-[#81766d] sm:mt-1 sm:text-sm">
                  {activeMenu.description}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="hidden rounded-xl bg-[#f5eee7] px-2 py-1.5 text-right sm:px-3 sm:py-2">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-[#9b7b65] sm:text-[10px]">
                    Goal
                  </div>
                  <div className="text-[13px] font-bold text-[#5f4737] sm:text-base">
                    {formatCurrencyValue(monthlyTarget, country)}
                  </div>
                </div>

                <div className="hidden rounded-xl bg-[#f3f0ff] px-2 py-1.5 text-right sm:px-3 sm:py-2">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-[#8270cf] sm:text-[10px]">
                    Rate
                  </div>
                  <div className="text-[13px] font-bold text-[#6857b6] sm:text-base">
                    {monthlyRate.toFixed(1)}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden h-11 items-center justify-center rounded-xl border border-[#eadbd1] bg-white px-4 text-sm font-semibold text-[#8b5146] transition-colors hover:bg-[#fbf4f0] sm:inline-flex"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-end justify-between gap-2 sm:mt-3 sm:gap-3">
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9b8d82] sm:text-[11px]">
                  {formatMonthTitle(selectedDateObj)}
                </div>
                <div className="mt-0.5 text-[9px] font-medium leading-tight text-[#81766d] sm:mt-1 sm:text-xs">
                  POWERED BY <span className="font-semibold text-[#1f1f1f]">YOUNGSEOL</span>
                </div>
              </div>

              <button
                ref={calendarButtonRef}
                type="button"
                onClick={toggleCalendar}
                className="relative z-[10000] inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#e7ddd5] bg-white px-2.5 text-[12px] font-semibold text-[#302a26] shadow-[0_4px_12px_rgba(79,60,45,0.05)] transition-colors hover:bg-[#fdfaf8] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
              >
                <i className="fa-solid fa-calendar-days text-[10px] text-[#8b6f5b] sm:text-[11px]"></i>
                <span className="leading-none">{selectedDate}</span>
                <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 sm:text-[10px]"></i>
              </button>
            </div>

            <div className="hidden mt-2.5 overflow-x-auto pb-1 sm:mt-4">
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
                        "relative flex h-[54px] w-[42px] shrink-0 flex-col items-center justify-center rounded-[16px] border transition-all sm:h-[76px] sm:w-[60px] sm:rounded-[20px]",
                        active
                          ? "border-[#1f1f1f] bg-[#1f1f1f] text-white shadow-sm"
                          : "border-[#e8dfd8] bg-[#fdfaf8] text-[#61574f] hover:bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-[7px] font-bold uppercase tracking-wide sm:text-[8px]",
                          active ? "text-[#ddd4cd]" : "text-[#9b8d82]",
                        ].join(" ")}
                      >
                        {formatWeekdayShort(date)}
                      </span>

                      <span className="mt-0.5 text-[19px] font-black leading-none sm:mt-1.5 sm:text-[26px]">
                        {date.getDate()}
                      </span>

                      <span
                        className={[
                          "absolute bottom-[4px] h-1 w-1 rounded-full sm:bottom-1.5 sm:h-1.5 sm:w-1.5",
                          hasData ? (active ? "bg-[#dcc2a1]" : "bg-[#8b6f5b]") : "bg-transparent",
                        ].join(" ")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </>}
        </div>
      </header>}

      {showCalendar && (
        <div
          ref={calendarLayerRef}
          className="fixed z-[9998] w-[min(360px,calc(100vw-24px))] rounded-[20px] border border-[#e8dfd8] bg-white p-4 shadow-[0_20px_50px_rgba(79,60,45,0.16)] sm:rounded-[24px]"
          style={{
            top: `${calendarPos.top}px`,
            left: `${calendarPos.left}px`,
          }}
        >
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e7ddd5] bg-white text-[#6f6258] hover:bg-[#f7f1ec]"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <Fragment key={calendarRenderKey}>
            <DayPicker
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
          </Fragment>

          <style>{`
            .has-data-day {
              position: relative;
            }
            .has-data-day::after {
              content: "";
              position: absolute;
              bottom: 8px;
              left: 50%;
              transform: translateX(-50%);
              width: 5px;
              height: 5px;
              border-radius: 9999px;
               background: #8b6f5b;
            }
          `}</style>
        </div>
      )}

      <main className={`mx-auto ${currentPage === "summary" ? "max-w-[430px] px-5 py-5 sm:px-5" : "max-w-7xl px-3 py-5 sm:px-6 sm:py-7"}`}>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[10001] bg-[#faf8f6]/96 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
        <div className="mx-auto grid h-[64px] max-w-[430px] grid-cols-5 items-end rounded-[18px] border border-[#eee8e3] bg-white px-2 py-2 shadow-[0_6px_20px_rgba(70,54,42,0.09)] sm:max-w-2xl">
          {MENU_ITEMS.map((item) => {
            const active = item.key === currentPage;
            const isHome = item.key === "summary";

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangePage(item.key)}
                className={[
                  "flex h-11 flex-col items-center justify-center rounded-xl text-[#796f68] transition-colors",
                  isHome
                    ? active
                      ? "-mt-4 h-[54px] rounded-[15px] bg-[#9b765c] text-white shadow-[0_6px_14px_rgba(126,92,67,0.18)] hover:bg-[#855f47]"
                      : "-mt-4 h-[54px] rounded-[15px] border border-[#e6ddd6] bg-[#f8f4f0] text-[#785e4d] shadow-[0_4px_10px_rgba(79,60,45,0.07)] hover:bg-[#f2ebe5]"
                    : active
                    ? "text-[#8b6f5b]"
                    : "hover:bg-[#faf7f4]",
                ].join(" ")}
              >
                <i className={`${item.icon} ${isHome ? "text-[15px]" : "text-[14px]"}`}></i>
                <span className={`mt-0.5 font-semibold ${isHome ? "text-[10px]" : "text-[10px]"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
