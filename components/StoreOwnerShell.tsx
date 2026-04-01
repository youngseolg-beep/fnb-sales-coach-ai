import { useMemo, useState, type ReactNode } from "react";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu";

type MenuItem = {
  key: StoreOwnerPageKey;
  label: string;
  description: string;
};

type Props = {
  currentPage: StoreOwnerPageKey;
  onChangePage: (page: StoreOwnerPageKey) => void;
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

export default function StoreOwnerShell({
  currentPage,
  onChangePage,
  children,
  title = "Sales Coach AI",
  subtitle = "Store Owner Workspace",
  selectedDate,
  monthlyTarget,
  monthlyRate,
}: Props) {
  const [open, setOpen] = useState(false);

  const activeMenu = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === currentPage) ?? MENU_ITEMS[0];
  }, [currentPage]);

  const handleMove = (page: StoreOwnerPageKey) => {
    onChangePage(page);
    setOpen(false);
  };

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
              <div className="text-sm font-black text-slate-900">
                {selectedDate}
              </div>
              <div className="text-[10px] font-black text-slate-400 tracking-widest">
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
