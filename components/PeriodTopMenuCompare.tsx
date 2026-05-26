import React, { useMemo, useState } from "react";
import { formatCurrencyValue } from "../utils2/currency";

export type PeriodMenuRow = {
  name: string;
  qty: number;
  sales: number;
};

type ComparedMenuRow = {
  name: string;
  currentQty: number;
  previousQty: number;
  diffQty: number;
  currentSales: number;
  previousSales: number;
  diffSales: number;
};

interface PeriodTopMenuCompareProps {
  currentMenus: PeriodMenuRow[];
  comparisonMenus: PeriodMenuRow[];
  minDays?: number;
  currentDays?: number;
  comparisonDays?: number;
  country?: string;
}

const numberFmt = new Intl.NumberFormat("en-US");

function mergeMenus(
  currentMenus: PeriodMenuRow[],
  comparisonMenus: PeriodMenuRow[]
): ComparedMenuRow[] {
  const map = new Map<string, ComparedMenuRow>();

  for (const item of currentMenus) {
    const key = item.name.trim();
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        currentQty: 0,
        previousQty: 0,
        diffQty: 0,
        currentSales: 0,
        previousSales: 0,
        diffSales: 0,
      });
    }
    const row = map.get(key)!;
    row.currentQty += Number(item.qty || 0);
    row.currentSales += Number(item.sales || 0);
  }

  for (const item of comparisonMenus) {
    const key = item.name.trim();
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        currentQty: 0,
        previousQty: 0,
        diffQty: 0,
        currentSales: 0,
        previousSales: 0,
        diffSales: 0,
      });
    }
    const row = map.get(key)!;
    row.previousQty += Number(item.qty || 0);
    row.previousSales += Number(item.sales || 0);
  }

  return Array.from(map.values()).map((row) => ({
    ...row,
    diffQty: row.currentQty - row.previousQty,
    diffSales: row.currentSales - row.previousSales,
  }));
}

const PeriodTopMenuCompare: React.FC<PeriodTopMenuCompareProps> = ({
  currentMenus,
  comparisonMenus,
  minDays = 1,
  currentDays = 0,
  comparisonDays = 0,
  country,
}) => {
  const [metric, setMetric] = useState<"qty" | "sales">("qty");

  const comparedRows = useMemo(() => {
    const rows = mergeMenus(currentMenus, comparisonMenus);
    return rows.sort((a, b) => {
      if (metric === "qty") {
        if (b.currentQty !== a.currentQty) return b.currentQty - a.currentQty;
        return b.currentSales - a.currentSales;
      }
      if (b.currentSales !== a.currentSales) return b.currentSales - a.currentSales;
      return b.currentQty - a.currentQty;
    });
  }, [currentMenus, comparisonMenus, metric]);

  // Top 10에서 Top 5로 변경
  const top5 = comparedRows.slice(0, 5);
  const canShow = currentDays >= minDays && comparisonDays >= minDays;

  const maxCurrent = Math.max(0, ...top5.map((r) => (metric === "qty" ? r.currentQty : r.currentSales)));
  const maxPrevious = Math.max(0, ...top5.map((r) => (metric === "qty" ? r.previousQty : r.previousSales)));
  const absoluteMax = Math.max(maxCurrent, maxPrevious, 1);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-2 text-center border border-slate-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">현재</span>
            <span className="text-[13px] font-black text-slate-800">{numberFmt.format(currentMenus.length)}<span className="text-[10px] font-medium text-slate-400 ml-0.5">종</span></span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-2 text-center border border-slate-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">비교</span>
            <span className="text-[13px] font-black text-slate-800">{numberFmt.format(comparisonMenus.length)}<span className="text-[10px] font-medium text-slate-400 ml-0.5">종</span></span>
          </div>
        </div>

        <div className="flex w-fit items-center rounded-xl bg-slate-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setMetric("qty")}
            className={`flex w-20 md:w-24 items-center justify-center rounded-lg py-1.5 text-[11px] md:text-[12px] font-black transition-all ${
              metric === "qty" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            판매수량
          </button>
          <button
            type="button"
            onClick={() => setMetric("sales")}
            className={`flex w-20 md:w-24 items-center justify-center rounded-lg py-1.5 text-[11px] md:text-[12px] font-black transition-all ${
              metric === "sales" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            매출
          </button>
        </div>
      </div>

      {!canShow ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-[12px] font-medium text-slate-500">
          Top5 기간 비교는 현재 기간과 비교 기간이 각각 최소 {minDays}일 이상일 때 표시됩니다.
        </div>
      ) : top5.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-[12px] font-medium text-slate-500">
          비교할 메뉴 데이터가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="hidden grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-slate-100 px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid">
            <div className="w-8 text-center">Rank</div>
            <div>Menu & Trend</div>
            <div className="w-[180px] text-right">Performance</div>
          </div>

          {top5.map((row, idx) => {
            const isQty = metric === "qty";
            const currentVal = isQty ? row.currentQty : row.currentSales;
            const prevVal = isQty ? row.previousQty : row.previousSales;
            const diffVal = isQty ? row.diffQty : row.diffSales;
            
            const formattedCurrent = isQty
              ? numberFmt.format(currentVal)
              : formatCurrencyValue(currentVal, country);
            const formattedPrev = isQty
              ? numberFmt.format(prevVal)
              : formatCurrencyValue(prevVal, country);
            
            const diffPercent = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
            const isPositive = diffVal >= 0;
            const isNew = prevVal === 0 && currentVal > 0;

            const currentWidth = absoluteMax === 0 ? 0 : (currentVal / absoluteMax) * 100;
            const prevWidth = absoluteMax === 0 ? 0 : (prevVal / absoluteMax) * 100;

            let rankColor = "text-slate-300";
            if (idx === 0) rankColor = "text-amber-500";
            else if (idx === 1) rankColor = "text-slate-400";
            else if (idx === 2) rankColor = "text-orange-400";

            return (
              <div
                key={row.name}
                className="group flex flex-col gap-2.5 rounded-xl bg-white p-3 transition-colors hover:bg-slate-50 border border-slate-100 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4 md:border-transparent md:border-b md:rounded-none md:pb-4 md:pt-3 md:px-4"
              >
                <div className={`text-[15px] font-black italic md:text-center md:w-8 md:text-[18px] ${rankColor}`}>
                  #{idx + 1}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <div className="truncate text-[13px] font-bold text-slate-800 md:text-[15px]">
                    {row.name}
                  </div>
                  <div className="flex flex-col gap-1 pr-2 md:pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-[8px] font-black text-slate-400 uppercase">Prev</span>
                      <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-300 transition-all duration-700" style={{ width: `${prevWidth}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-[8px] font-black text-indigo-400 uppercase">Curr</span>
                      <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-indigo-500' : 'bg-rose-400'}`} style={{ width: `${currentWidth}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-slate-50 pt-2 md:w-[180px] md:flex-col md:border-0 md:pt-0">
                  <div className="flex flex-col md:items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-slate-900 md:text-[16px]">{formattedCurrent}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 md:text-[11px]">vs {formattedPrev}</div>
                  </div>
                  
                  <div className="flex items-center">
                    {isNew ? (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-600">NEW</span>
                    ) : (
                      <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-black md:text-[11px] md:px-2 ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isPositive ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        ) : (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        )}
                        {Math.abs(diffPercent).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PeriodTopMenuCompare;
