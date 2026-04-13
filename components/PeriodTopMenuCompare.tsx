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

function getDeltaClass(value: number) {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-500";
  return "text-slate-500";
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

  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[24px] md:p-4">
      <div className="mb-3 flex flex-col gap-3 md:mb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 md:text-lg">
            Top10 메뉴 기간 비교
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">
            현재 기간과 비교 기간의 메뉴 변화를 바로 확인합니다.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMetric("qty")}
            className={`rounded-xl px-3 py-2 text-xs font-black transition-all md:text-sm ${
              metric === "qty"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            판매수량
          </button>

          <button
            type="button"
            onClick={() => setMetric("sales")}
            className={`rounded-xl px-3 py-2 text-xs font-black transition-all md:text-sm ${
              metric === "sales"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            매출
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 md:mb-4 md:grid-cols-4 md:gap-3">
        <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-2">
          <div className="truncate text-[9px] font-black text-slate-400">
            현재 메뉴
          </div>
          <div className="mt-1 text-base font-black leading-none text-slate-900">
            {numberFmt.format(currentMenus.length)}
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-2">
          <div className="truncate text-[9px] font-black text-slate-400">
            비교 메뉴
          </div>
          <div className="mt-1 text-base font-black leading-none text-slate-900">
            {numberFmt.format(comparisonMenus.length)}
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-2">
          <div className="truncate text-[9px] font-black text-slate-400">
            현재 기간
          </div>
          <div className="mt-1 text-base font-black leading-none text-slate-900">
            {numberFmt.format(currentDays)}일
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-2">
          <div className="truncate text-[9px] font-black text-slate-400">
            비교 기간
          </div>
          <div className="mt-1 text-base font-black leading-none text-slate-900">
            {numberFmt.format(comparisonDays)}일
          </div>
        </div>
      </div>

      {!canShow ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600">
          Top10 기간 비교는 현재 기간과 비교 기간이 각각 최소 {minDays}일 이상일 때 표시됩니다.
        </div>
      ) : top10.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600">
          비교할 메뉴 데이터가 없습니다.
        </div>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {top10.map((row, idx) => {
              const currentValue =
                metric === "qty"
                  ? numberFmt.format(row.currentQty)
                  : `$${currencyFmt.format(row.currentSales)}`;

              const compareValue =
                metric === "qty"
                  ? numberFmt.format(row.previousQty)
                  : `$${currencyFmt.format(row.previousSales)}`;

              const deltaValue = metric === "qty" ? row.diffQty : row.diffSales;

              return (
                <div
                  key={row.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      #{idx + 1}
                    </div>

                    <div className="mt-1 truncate text-sm font-black text-slate-900">
                      {row.name}
                    </div>

                    <div className="mt-1.5 flex items-start gap-1.5">
                      <div className="inline-flex min-w-[64px] flex-col items-start rounded-md bg-white px-2 py-1">
                        <div className="text-[8px] font-black uppercase tracking-[0.06em] leading-none text-slate-400">
                          현재
                        </div>
                        <div className="mt-0.5 text-[12px] font-black leading-none text-slate-900">
                          {currentValue}
                        </div>
                      </div>

                      <div className="inline-flex min-w-[64px] flex-col items-start rounded-md bg-white px-2 py-1">
                        <div className="text-[8px] font-black uppercase tracking-[0.06em] leading-none text-slate-400">
                          비교
                        </div>
                        <div className="mt-0.5 text-[12px] font-black leading-none text-slate-900">
                          {compareValue}
                        </div>
                      </div>

                      <div
                        className={`inline-flex min-w-[56px] flex-col items-start rounded-md bg-white px-2 py-1 ${getDeltaClass(
                          deltaValue
                        )}`}
                      >
                        <div className="text-[8px] font-black uppercase tracking-[0.06em] leading-none text-slate-400">
                          차이
                        </div>
                        <div className="mt-0.5 text-[12px] font-black leading-none">
                          {getDeltaText(deltaValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] table-fixed text-sm">
              <colgroup>
                <col className="w-[64px]" />
                <col className="w-[220px]" />
                <col className="w-[96px]" />
                <col className="w-[96px]" />
                <col className="w-[96px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-3 py-2">순위</th>
                  <th className="px-3 py-2">메뉴</th>
                  <th className="px-3 py-2 text-right">현재 수량</th>
                  <th className="px-3 py-2 text-right">비교 수량</th>
                  <th className="px-3 py-2 text-right">수량 증감</th>
                  <th className="px-3 py-2 text-right">현재 매출</th>
                  <th className="px-3 py-2 text-right">비교 매출</th>
                  <th className="px-3 py-2 text-right">매출 증감</th>
                </tr>
              </thead>

              <tbody>
                {top10.map((row, idx) => (
                  <tr
                    key={row.name}
                    className="border-b border-slate-100 text-sm text-slate-800 last:border-b-0"
                  >
                    <td className="px-3 py-3 font-black text-slate-900">
                      {idx + 1}
                    </td>

                    <td className="truncate px-3 py-3 font-bold text-slate-900">
                      {row.name}
                    </td>

                    <td className="px-3 py-3 text-right">
                      {numberFmt.format(row.currentQty)}
                    </td>

                    <td className="px-3 py-3 text-right">
                      {numberFmt.format(row.previousQty)}
                    </td>

                    <td className={`px-3 py-3 text-right font-black ${getDeltaClass(row.diffQty)}`}>
                      {getDeltaText(row.diffQty)}
                    </td>

                    <td className="px-3 py-3 text-right">
                      ${currencyFmt.format(row.currentSales)}
                    </td>

                    <td className="px-3 py-3 text-right">
                      ${currencyFmt.format(row.previousSales)}
                    </td>

                    <td className={`px-3 py-3 text-right font-black ${getDeltaClass(row.diffSales)}`}>
                      {getDeltaText(row.diffSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default PeriodTopMenuCompare;
