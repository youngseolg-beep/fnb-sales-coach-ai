import {
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

export type StoreOwnerPageKey = "summary" | "sales" | "detail" | "menu";

type Props = {
  currentPage: StoreOwnerPageKey;
  onChangePage: (page: StoreOwnerPageKey) => void;
  onChangeDate: (date: string) => void;
  datesWithData: string[];
  children: ReactNode;
  selectedDate: string;
  monthlyTarget: number;
  monthlyRate: number;
};

const MENU_ITEMS = [
  { key: "summary", label: "Summary", icon: "fa-house" },
  { key: "sales", label: "Sales", icon: "fa-pen" },
  { key: "detail", label: "Detail", icon: "fa-chart-line" },
  { key: "menu", label: "Menu", icon: "fa-utensils" },
];

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const parseDate = (d: string) => {
  const [y,m,day] = d.split("-").map(Number);
  return new Date(y, m-1, day);
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
};

export default function StoreOwnerShell({
  currentPage,
  onChangePage,
  onChangeDate,
  datesWithData,
  children,
  selectedDate,
  monthlyTarget,
  monthlyRate,
}: Props) {

  const selected = parseDate(selectedDate);

  const dates = useMemo(() => {
    return Array.from({length: 9}, (_,i)=>{
      const d = new Date(selected);
      d.setDate(d.getDate() + i - 4);
      return d;
    });
  }, [selectedDate]);

  const hasData = new Set(datesWithData || []);

  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    selectedRef.current?.scrollIntoView({inline:"center"});
  },[selectedDate]);

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">

          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-bold text-slate-600">
                {selected.toLocaleString("en-US",{month:"long"})} {selected.getFullYear()}
              </div>

              <div className="text-2xl font-black text-slate-900 mt-1 whitespace-nowrap">
                {selectedDate}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">TARGET</div>
              <div className="font-bold">${monthlyTarget}</div>

              <div className="text-xs text-slate-400 mt-1">RATE</div>
              <div className="font-bold text-indigo-600">{monthlyRate}%</div>
            </div>
          </div>

          {/* DATE STRIP */}
          <div className="flex gap-2 mt-4 overflow-x-auto">

            {dates.map(d=>{
              const str = formatDate(d);
              const active = str === selectedDate;

              return (
                <button
                  key={str}
                  ref={active ? selectedRef : undefined}
                  onClick={()=>onChangeDate(str)}
                  className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl shrink-0 ${
                    active ? "bg-indigo-500 text-white" : "bg-slate-200"
                  }`}
                >
                  <div className="text-[10px]">
                    {DAY_LABELS[d.getDay()]}
                  </div>

                  <div className="text-lg font-bold">
                    {d.getDate()}
                  </div>

                  {hasData.has(str) && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${
                      active ? "bg-white" : "bg-indigo-500"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 pb-24 mt-4">
        {children}
      </div>

      {/* TAB BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 grid grid-cols-4">

        {MENU_ITEMS.map(item=>{
          const active = item.key === currentPage;

          return (
            <button
              key={item.key}
              onClick={()=>onChangePage(item.key as any)}
              className="flex flex-col items-center text-xs"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                active ? "bg-indigo-500 text-white" : "bg-slate-200"
              }`}>
                <i className={`fa-solid ${item.icon}`} />
              </div>

              <div className={active ? "text-black" : "text-slate-400"}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
