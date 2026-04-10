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
  const [open, setOpen] = React.useState(false);

  const pages: { key: StoreOwnerPageKey; label: string }[] = [
    { key: 'summary', label: '홈' },
    { key: 'sales', label: '입력' },
    { key: 'detail', label: '분석' },
    { key: 'menu', label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 가운데 컨테이너 */}
      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">

        {/* HEADER CARD */}
        <div className="rounded-3xl bg-slate-900 p-5 text-white shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-70">Sales Coach AI</div>
              <div className="text-lg font-bold mt-1">
                {selectedDate.toLocaleDateString()}
              </div>
            </div>

            <button
              onClick={() => setOpen(!open)}
              className="bg-white/10 px-3 py-2 rounded-xl text-sm"
            >
              날짜 선택
            </button>
          </div>
        </div>

        {/* CALENDAR */}
        {open && (
          <div className="mt-3 bg-white rounded-3xl p-3 shadow">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (!d) return;
                onDateChange(d);
                setOpen(false);
              }}
            />
          </div>
        )}

        {/* CONTENT */}
        <div className="mt-4">
          {children}
        </div>
      </div>

      {/* MOBILE TAB ONLY */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t md:hidden">
        <div className="grid grid-cols-4">
          {pages.map((p) => (
            <button
              key={p.key}
              onClick={() => onChangePage(p.key)}
              className={`py-3 text-sm ${
                activePage === p.key
                  ? 'text-white bg-slate-900'
                  : 'text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
