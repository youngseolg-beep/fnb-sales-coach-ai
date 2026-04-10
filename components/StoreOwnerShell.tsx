import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu";

type MenuItem = {
  key: StoreOwnerPageKey;
  label: string;
  icon: string; // 아이콘 추가
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

// 2026 트렌드에 맞는 간결한 아이콘 셋업
const MENU_ITEMS: MenuItem[] = [
  { key: "summary", label: "요약", icon: "fa-solid fa-chart-pie" },
  { key: "sales", label: "매출", icon: "fa-solid fa-file-invoice-dollar" },
  { key: "detail", label: "분석", icon: "fa-solid fa-magnifying-glass-chart" },
  { key: "menu", label: "설정", icon: "fa-solid fa-utensils" },
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
  selectedDate,
  monthlyTarget,
  monthlyRate,
}: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseLocalDate(selectedDate));
  const [calendarRenderKey, setCalendarRenderKey] = useState(0);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const datesWithDataSet = useMemo(() => new Set(datesWithData || []), [datesWithData]);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-0 lg:pl-20">
      {/* --- 상단 헤더: 날짜 선택 및 로그아웃 --- */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              ref={dateButtonRef}
              type="button"
              onClick={toggleCalendar}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-2 transition-all hover:bg-indigo-50"
            >
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Selected Date</div>
                <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600">{selectedDate}</div>
              </div>
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-300 group-hover:text-indigo-400"></i>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Target</div>
              <div className="text-sm font-black text-slate-900">${monthlyTarget.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Rate</div>
              <div className="text-sm font-black text-indigo-600">{monthlyRate.toFixed(1)}%</div>
            </div>
            <button 
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket text-sm"></i>
            </button>
          </div>
        </div>
      </header>

      {/* --- 달력 팝업 --- */}
      {showCalendar && (
        <div
          className="fixed z-[9999] w-[320px] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in duration-200"
          style={{ top: `${calendarPos.top}px`, left: `${calendarPos.left}px` }}
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
            modifiers={{ hasData: (date) => datesWithDataSet.has(formatLocalDate(date)) }}
            modifiersClassNames={{ hasData: "has-data-day" }}
          />
          <style>{`
            .has-data-day { position: relative; font-weight: 800; color: #4f46e5; }
            .has-data-day::after {
              content: ""; position: absolute; bottom: 4px; left: 50%;
              transform: translateX(-50%); width: 4px; height: 4px;
              border-radius: 50%; background: #4f46e5;
            }
          `}</style>
        </div>
      )}

      {/* --- 메인 콘텐츠 --- */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </main>

      {/* --- 하단 네비게이션 탭 (Mobile/Desktop 최적화) --- */}
      <nav className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-slate-900/90 px-2 py-2 text-white shadow-2xl backdrop-blur-xl sm:gap-2">
        {MENU_ITEMS.map((item) => {
          const active = item.key === currentPage;
          return (
            <button
              key={item.key}
              onClick={() => onChangePage(item.key)}
              className={[
                "flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-300",
                active 
                  ? "bg-white text-slate-900 shadow-lg scale-105" 
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              ].join(" ")}
            >
              <i className={`${item.icon} text-lg mb-0.5`}></i>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
