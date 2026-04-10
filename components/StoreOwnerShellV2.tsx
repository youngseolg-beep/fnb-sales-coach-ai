import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export type StoreOwnerPageKey = 'summary' | 'sales' | 'detail' | 'menu';

type StoreOwnerShellV2Props = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  activePage: StoreOwnerPageKey;
  onChangePage: (page: StoreOwnerPageKey) => void;
  datesWithData?: string[];
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const PAGE_META: Array<{
  key: StoreOwnerPageKey;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { key: 'summary', label: 'Summary', shortLabel: '홈', icon: '🏠' },
  { key: 'sales', label: 'Sales', shortLabel: '입력', icon: '💰' },
  { key: 'detail', label: 'Detail', shortLabel: '분석', icon: '📈' },
  { key: 'menu', label: 'Menu', shortLabel: '설정', icon: '🍽️' },
];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHeaderDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${year}.${month}.${day} (${weekday})`;
}

export default function StoreOwnerShellV2({
  selectedDate,
  onDateChange,
  activePage,
  onChangePage,
  datesWithData = [],
  children,
  title = 'Sales Coach AI',
  subtitle = '매장 운영을 더 쉽게 확인하세요',
}: StoreOwnerShellV2Props) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const modifiers = React.useMemo(() => {
    const dataDates = datesWithData
      .map((dateString) => {
        const date = new Date(`${dateString}T00:00:00`);
        return Number.isNaN(date.getTime()) ? null : date;
      })
      .filter((date): date is Date => date instanceof Date);

    return {
      hasData: dataDates,
    };
  }, [datesWithData]);

  const footerSafePadding = 'pb-[88px]';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className={`mx-auto flex min-h-screen w-full max-w-md flex-col ${footerSafePadding}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-4 pb-4 pt-4">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-4 text-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    {title}
                  </p>
                  <h1 className="mt-1 text-lg font-bold leading-tight">
                    {PAGE_META.find((page) => page.key === activePage)?.shortLabel ?? '홈'}
                  </h1>
                  <p className="mt-1 text-xs text-slate-300">{subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-left transition active:scale-[0.98]"
                >
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300">
                    Selected Date
                  </div>
                  <div className="mt-1 whitespace-nowrap text-sm font-semibold">
                    {formatHeaderDate(selectedDate)}
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {PAGE_META.map((page) => {
                const isActive = activePage === page.key;

                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => onChangePage(page.key)}
                    className={[
                      'rounded-2xl px-3 py-3 text-center transition active:scale-[0.98]',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200',
                    ].join(' ')}
                  >
                    <div className="text-base leading-none">{page.icon}</div>
                    <div className="mt-1 text-[11px] font-semibold">{page.shortLabel}</div>
                  </button>
                );
              })}
            </div>

            {isCalendarOpen && (
              <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    onDateChange(date);
                    setIsCalendarOpen(false);
                  }}
                  month={selectedDate}
                  onMonthChange={() => {}}
                  showOutsideDays
                  modifiers={modifiers}
                  modifiersClassNames={{
                    hasData: 'has-data',
                  }}
                  className="store-owner-daypicker mx-auto"
                />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-4">
          <div className="min-h-[calc(100vh-240px)]">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
            {PAGE_META.map((page) => {
              const isActive = activePage === page.key;

              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => onChangePage(page.key)}
                  className={[
                    'rounded-2xl px-2 py-2 transition active:scale-[0.98]',
                    isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  <div className="text-base leading-none">{page.icon}</div>
                  <div className="mt-1 text-[11px] font-semibold">{page.shortLabel}</div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <style>{`
        .store-owner-daypicker {
          --rdp-accent-color: rgb(15 23 42);
          --rdp-background-color: rgb(241 245 249);
          margin: 0;
        }

        .store-owner-daypicker .rdp-months {
          justify-content: center;
        }

        .store-owner-daypicker .rdp-month {
          width: 100%;
        }

        .store-owner-daypicker .rdp-caption_label {
          font-size: 15px;
          font-weight: 700;
          color: rgb(15 23 42);
        }

        .store-owner-daypicker .rdp-head_cell {
          font-size: 12px;
          font-weight: 600;
          color: rgb(100 116 139);
        }

        .store-owner-daypicker .rdp-cell {
          padding: 2px;
        }

        .store-owner-daypicker .rdp-day {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          color: rgb(15 23 42);
        }

        .store-owner-daypicker .rdp-day_selected {
          background-color: rgb(15 23 42);
          color: white;
        }

        .store-owner-daypicker .rdp-day_today:not(.rdp-day_selected) {
          background-color: rgb(241 245 249);
          color: rgb(15 23 42);
          border: 1px solid rgb(203 213 225);
        }

        .store-owner-daypicker .has-data:not(.rdp-day_outside)::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 5px;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          transform: translateX(-50%);
          background: rgb(59 130 246);
        }

        .store-owner-daypicker .rdp-day_selected.has-data::after {
          background: white;
        }
      `}</style>
    </div>
  );
}
