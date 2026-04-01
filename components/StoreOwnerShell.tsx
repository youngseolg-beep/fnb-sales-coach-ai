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
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            <div>
              <div className="text-base font-semibold leading-tight">{title}</div>
              <div className="text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right sm:block">
            <div className="text-xs text-slate-500">Current Page</div>
            <div className="text-sm font-semibold text-slate-900">
              {activeMenu.label}
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
            aria-label="Close menu overlay"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="px-3 py-3">
              <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Navigation
              </div>

              <div className="space-y-2">
                {MENU_ITEMS.map((item) => {
                  const active = item.key === currentPage;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleMove(item.key)}
                      className={[
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div
                        className={[
                          "mt-1 text-xs",
                          active ? "text-slate-200" : "text-slate-500",
                        ].join(" ")}
                      >
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
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Active Workspace
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {activeMenu.label}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {activeMenu.description}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
