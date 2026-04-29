import React, { useMemo, useState } from "react";

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
}

const numberFmt = new Intl.NumberFormat("en-US");

const currencyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

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

function getDeltaText(value: number) {
  if (value > 0) return `+${numberFmt.format(value)}`;
  if (value < 0) return `${numberFmt.format(value)}`;
  return "0";
}

const PeriodTopMenuCompare: React.FC<PeriodTopMenuCompareProps> = ({
  currentMenus,
  comparisonMenus,
  minDays = 1,
  currentDays = 0,
  comparisonDays = 0,
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

  const top10 = comparedRows.slice(0, 10);
  const canShow = currentDays >= minDays && comparisonDays >= minDays;

  // 막대그래프 너비 계산을 위한 최대값 추출
  const maxCurrent = Math.max(0, ...top10.map((r) => (metric === "qty" ? r.currentQty : r.currentSales)));
  const maxPrevious = Math.max(0, ...top10.map((r) => (metric === "qty" ? r.previousQty : r.previousSales)));
  const absoluteMax = Math.max(maxCurrent, maxPrevious, 1);

  return (
    <div className="w-full">
      {/* 1. 상단 헤더 & 토글 스위치 (프리미엄 SaaS 스타일) */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 px-4 py-3 text-center border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">현재</span>
            <span className="text-[14px] font-black text-slate-800">{numberFmt.format(currentMenus.length)}<span className="text-[11px] font-medium text-slate-400 ml-1">종</span></span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 px-4 py-3 text-center border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">비교</span>
            <span className="text-[14px] font-black text-slate-800">{numberFmt.format(comparisonMenus.length)}<span className="text-[11px] font-medium text-slate-400 ml-1">종</span></span>
          </div>
        </div>

        <div className="flex w-fit items-center rounded-xl bg-slate-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setMetric("qty")}
            className={`flex w-24 items-center justify-center rounded-lg py-1.5 text-[12px] font-black transition-all ${
              metric === "qty" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            판매수량
          </button>
          <button
            type="button"
            onClick={() => setMetric("sales")}
            className={`flex w-24 items-center justify-center rounded-lg py-1.5 text-[12px] font-black transition-all ${
              metric === "sales" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            매출
          </button>
        </div>
      </div>

      {/* 2. 데이터 리스트 영역 */}
      {!canShow ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-[13px] font-medium text-slate-500">
          Top10 기간 비교는 현재 기간과 비교 기간이 각각 최소 {minDays}일 이상일 때 표시됩니다.
        </div>
      ) : top10.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-[13px] font-medium text-slate-500">
          비교할 메뉴 데이터가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 리스트 헤더 (PC에서만 표시) */}
          <div className="hidden grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-slate-100 px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid">
            <div className="w-8 text-center">Rank</div>
            <div>Menu & Trend</div>
            <div className="w-[200px] text-right">Performance</div>
          </div>

          {/* Top 10 메뉴 렌더링 */}
          {top10.map((row, idx) => {
            const isQty = metric === "qty";
            
            // 수치 포맷팅
            const currentVal = isQty ? row.currentQty : row.currentSales;
            const prevVal = isQty ? row.previousQty : row.previousSales;
            const diffVal = isQty ? row.diffQty : row.diffSales;
            
            const formattedCurrent = isQty ? numberFmt.format(currentVal) : `$${currencyFmt.format(currentVal)}`;
            const formattedPrev = isQty ? numberFmt.format(prevVal) : `$${currencyFmt.format(prevVal)}`;
            
            // 증감률 계산 (%)
            const diffPercent = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
            const isPositive = diffVal >= 0;
            const isNew = prevVal === 0 && currentVal > 0;

            // 바 너비 계산
            const currentWidth = absoluteMax === 0 ? 0 : (currentVal / absoluteMax) * 100;
            const prevWidth = absoluteMax === 0 ? 0 : (prevVal / absoluteMax) * 100;

            // 순위 색상
            let rankColor = "text-slate-300";
            if (idx === 0) rankColor = "text-amber-500";
            else if (idx === 1) rankColor = "text-slate-400";
            else if (idx === 2) rankColor = "text-orange-400";

            return (
              <div
                key={row.name}
                className="group flex flex-col gap-3 rounded-2xl bg-white p-4 transition-colors hover:bg-slate-50 border border-slate-100 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4 md:border-transparent md:border-b md:rounded-none md:pb-4 md:pt-3 md:px-4 md:hover:bg-slate-50/50"
              >
                {/* 랭킹 */}
                <div className={`text-center text-[16px] font-black italic md:w-8 md:text-[18px] ${rankColor}`}>
                  #{idx + 1}
                </div>

                {/* 메뉴명 및 시각적 바 차트 */}
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="truncate text-[14px] font-bold text-slate-800 md:text-[15px]">
                    {row.name}
                  </div>
                  {/* 가로형 비교 바 */}
                  <div className="flex flex-col gap-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-[9px] font-black text-slate-400 uppercase">Prev</span>
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-300 transition-all duration-700" style={{ width: `${prevWidth}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-[9px] font-black text-indigo-400 uppercase">Curr</span>
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-indigo-500' : 'bg-rose-400'}`} style={{ width: `${currentWidth}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 수치 및 증감률 배지 */}
                <div className="flex items-end justify-between border-t border-slate-100 pt-3 md:w-[200px] md:flex-col md:border-0 md:pt-0">
                  <div className="flex flex-col md:items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-black text-slate-900 md:text-[18px]">{formattedCurrent}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">vs {formattedPrev}</div>
                  </div>
                  
                  {/* 퍼센트 배지 */}
                  <div className="flex items-center">
                    {isNew ? (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-600">NEW</span>
                    ) : (
                      <div className={`flex items-center gap-0.5 rounded px-2 py-0.5 text-[11px] font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
