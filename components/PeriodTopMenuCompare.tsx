import React, { useMemo, useState } from "react";
import { formatCurrencyValue } from "../utils2/currency";

export type PeriodMenuRow = { name: string; qty: number; sales: number };

type ComparedMenuRow = {
  name: string;
  currentQty: number;
  previousQty: number;
  diffQty: number;
  currentSales: number;
  previousSales: number;
  diffSales: number;
};

interface Props {
  currentMenus: PeriodMenuRow[];
  comparisonMenus: PeriodMenuRow[];
  minDays?: number;
  currentDays?: number;
  comparisonDays?: number;
  country?: string;
}

const numberFmt = new Intl.NumberFormat("en-US");

const mergeMenus = (currentMenus: PeriodMenuRow[], comparisonMenus: PeriodMenuRow[]) => {
  const map = new Map<string, ComparedMenuRow>();
  const getRow = (name: string) => {
    const key = name.trim();
    const existing = map.get(key);
    if (existing) return existing;
    const row = { name: key, currentQty: 0, previousQty: 0, diffQty: 0, currentSales: 0, previousSales: 0, diffSales: 0 };
    map.set(key, row);
    return row;
  };

  currentMenus.forEach((item) => {
    const row = getRow(item.name);
    row.currentQty += Number(item.qty || 0);
    row.currentSales += Number(item.sales || 0);
  });
  comparisonMenus.forEach((item) => {
    const row = getRow(item.name);
    row.previousQty += Number(item.qty || 0);
    row.previousSales += Number(item.sales || 0);
  });

  return Array.from(map.values()).map((row) => ({
    ...row,
    diffQty: row.currentQty - row.previousQty,
    diffSales: row.currentSales - row.previousSales,
  }));
};

const PeriodTopMenuCompare: React.FC<Props> = ({
  currentMenus,
  comparisonMenus,
  minDays = 1,
  currentDays = 0,
  comparisonDays = 0,
  country,
}) => {
  const [metric, setMetric] = useState<"qty" | "sales">("qty");
  const top5 = useMemo(() => mergeMenus(currentMenus, comparisonMenus).sort((a, b) => {
    if (metric === "qty") return b.currentQty - a.currentQty || b.currentSales - a.currentSales;
    return b.currentSales - a.currentSales || b.currentQty - a.currentQty;
  }).slice(0, 5), [currentMenus, comparisonMenus, metric]);
  const canShow = currentDays >= minDays && comparisonDays >= minDays;
  const absoluteMax = Math.max(1, ...top5.flatMap((row) => metric === "qty"
    ? [row.currentQty, row.previousQty]
    : [row.currentSales, row.previousSales]));

  return <div className="w-full">
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <div className="flex gap-1.5">
        {[["현재", currentMenus.length], ["비교", comparisonMenus.length]].map(([label, count]) => <div key={String(label)} className="rounded-lg border border-[#eee8e3] bg-[#faf8f6] px-2.5 py-1.5 text-center"><span className="block text-[9px] font-bold text-[#8a8079]">{label}</span><b className="text-[12px] text-[#302a26]">{numberFmt.format(Number(count))}<small className="ml-0.5 font-medium text-[#9a9089]">종</small></b></div>)}
      </div>
      <div className="flex rounded-lg bg-[#f3efeb] p-0.5">
        {[["qty", "판매수량"], ["sales", "매출"]].map(([key, label]) => <button key={key} type="button" onClick={() => setMetric(key as "qty" | "sales")} className={`w-[66px] rounded-md py-1.5 text-[10px] font-bold ${metric === key ? "bg-white text-[#8b5e3c] shadow-sm" : "text-[#837870]"}`}>{label}</button>)}
      </div>
    </div>

    {!canShow ? <Empty>Top5 기간 비교는 현재 기간과 비교 기간이 각각 최소 {minDays}일 이상일 때 표시됩니다.</Empty>
      : !top5.length ? <Empty>비교할 메뉴 데이터가 없습니다.</Empty>
      : <div className="space-y-1.5">{top5.map((row, index) => {
        const current = metric === "qty" ? row.currentQty : row.currentSales;
        const previous = metric === "qty" ? row.previousQty : row.previousSales;
        const difference = metric === "qty" ? row.diffQty : row.diffSales;
        const positive = difference >= 0;
        const isNew = previous === 0 && current > 0;
        const percent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
        const format = (value: number) => metric === "qty" ? numberFmt.format(value) : formatCurrencyValue(value, country);

        return <article key={row.name} className="rounded-[10px] border border-[#eee8e3] bg-white px-2.5 py-2">
          <div className="mb-1.5 flex min-w-0 items-center gap-2">
            <b className="shrink-0 text-[12px] italic text-[#9b765c]">#{index + 1}</b>
            <h4 className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#302a26]">{row.name}</h4>
            {isNew ? <Badge className="bg-[#f3ece6] text-[#8b5e3c]">NEW</Badge> : <Badge className={positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}>{positive ? "↑" : "↓"} {Math.abs(percent).toFixed(1)}%</Badge>}
          </div>
          <div className="grid grid-cols-[28px_1fr] items-center gap-x-2 gap-y-1">
            <span className="text-[9px] font-semibold text-[#9a9089]">이전</span><Bar width={(previous / absoluteMax) * 100} color="#c9bdb4" />
            <span className="text-[9px] font-semibold text-[#8b5e3c]">현재</span><Bar width={(current / absoluteMax) * 100} color="#8b5e3c" />
          </div>
          <p className="mt-1.5 text-right text-[10px] font-semibold text-[#665d57]">{format(previous)} → {format(current)}</p>
        </article>;
      })}</div>}
  </div>;
};

const Empty: React.FC<React.PropsWithChildren> = ({ children }) => <div className="rounded-lg border border-dashed border-[#e3ddd7] bg-[#faf8f6] px-3 py-5 text-center text-[11px] text-[#857a72]">{children}</div>;
const Badge: React.FC<React.PropsWithChildren<{ className: string }>> = ({ className, children }) => <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${className}`}>{children}</span>;
const Bar: React.FC<{ width: number; color: string }> = ({ width, color }) => <div className="h-1.5 rounded-full bg-[#f0ece8]"><div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} /></div>;

export default PeriodTopMenuCompare;
