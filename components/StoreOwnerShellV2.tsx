import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export type StoreOwnerPageKey = 'summary' | 'sales' | 'detail' | 'menu';

type Props = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  activePage: StoreOwnerPageKey;
  onChangePage: (page: StoreOwnerPageKey) => void;
  datesWithData?: string[];
  children: React.ReactNode;
};

export default function StoreOwnerShellV2({
  selectedDate,
  onDateChange,
  activePage,
  onChangePage,
  datesWithData = [],
  children,
}: Props) {
  const isDesktop =
    typeof window !== 'undefined' && window.innerWidth >= 768;

  const pages: { key: StoreOwnerPageKey; label: string }[] = [
    { key: 'summary', label: '홈' },
    { key: 'sales', label: '입력' },
    { key: 'detail', label: '분석' },
    { key: 'menu', label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        className={
          isDesktop
            ? 'w-full px-8 py-6'
            : 'mx-auto flex min-h-screen w-full max-w-md flex-col pb-[80px]'
        }
      >
        {/* HEADER */}
        <div className="mb-4">
          <div className="rounded-3xl bg-slate-900 p-4 text-white">
            <div className="text-sm font-bold mb-2">Sales Coach AI</div>
            <div className="text-sm">
              {selectedDate.toLocaleDateString()}
            </div>
          </div>

          <div className="mt-3 bg-white rounded-3xl p-3 shadow-sm">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && onDateChange(d)}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1">{children}</div>

        {/* MOBILE NAV ONLY */}
        {!isDesktop && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-2 grid grid-cols-4 gap-2">
            {pages.map((p) => (
              <button
                key={p.key}
                onClick={() => onChangePage(p.key)}
                className={`py-2 rounded-xl text-sm ${
                  activePage === p.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
