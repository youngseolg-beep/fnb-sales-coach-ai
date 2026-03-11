import React, { useMemo } from "react";

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

  metric: "qty" | "sales";
  onMetricChange: (m: "qty" | "sales") => void;
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
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

const PeriodTopMenuCompare: React.FC<PeriodTopMenuCompareProps> = ({
  currentMenus,
  comparisonMenus,
  minDays = 1,
  currentDays = 0,
  comparisonDays = 0,
  metric,
  onMetricChange,
}) => {
  const comparedRows = useMemo(() => {
    const rows = mergeMenus(currentMenus, comparisonMenus);

    return rows.sort((a, b) => {
      if (metric === "qty") {
        if (b.currentQty !== a.currentQty) return b.currentQty - a.currentQty;
        return b.currentSales - a.currentSales;
      }

      if (b.currentSales !== a.currentSales)
        return b.currentSales - a.currentSales;

      return b.currentQty - a.currentQty;
    });
  }, [currentMenus, comparisonMenus, metric]);

  const top10 = comparedRows.slice(0, 10);

  const canShow = currentDays >= minDays && comparisonDays >= minDays;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Top10 메뉴 기간 비교
          </h3>
          <p className="text-sm text-gray-500">
            현재 기간 vs 비교 기간 기준으로 메뉴 판매량/매출 변화를 확인합니다.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => onMetricChange("qty")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              metric === "qty"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            판매수량 기준
          </button>

          <button
            type="button"
            onClick={() => onMetricChange("sales")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              metric === "sales"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            매출 기준
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">현재 기간 메뉴 수</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {numberFmt.format(currentMenus.length)}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">비교 기간 메뉴 수</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {numberFmt.format(comparisonMenus.length)}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">현재 기간 일수</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {numberFmt.format(currentDays)}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">비교 기간 일수</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {numberFmt.format(comparisonDays)}
          </div>
        </div>
      </div>

      {!canShow ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          Top10 기간 비교는 현재 기간과 비교 기간이 각각 최소 {minDays}
          일 이상일 때 표시됩니다.
        </div>
      ) : top10.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          비교할 메뉴 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2">순위</th>
                <th className="px-3 py-2">메뉴</th>
                <th className="px-3 py-2">현재 수량</th>
                <th className="px-3 py-2">비교 수량</th>
                <th className="px-3 py-2">수량 증감</th>
                <th className="px-3 py-2">현재 매출</th>
                <th className="px-3 py-2">비교 매출</th>
                <th className="px-3 py-2">매출 증감</th>
              </tr>
            </thead>

            <tbody>
              {top10.map((row, idx) => (
                <tr
                  key={row.name}
                  className="rounded-xl bg-gray-50 text-sm text-gray-800"
                >
                  <td className="rounded-l-xl px-3 py-3 font-semibold text-gray-900">
                    {idx + 1}
                  </td>

                  <td className="px-3 py-3 font-medium text-gray-900">
                    {row.name}
                  </td>

                  <td className="px-3 py-3">
                    {numberFmt.format(row.currentQty)}
                  </td>

                  <td className="px-3 py-3">
                    {numberFmt.format(row.previousQty)}
                  </td>

                  <td
                    className={`px-3 py-3 font-semibold ${getDeltaClass(
                      row.diffQty
                    )}`}
                  >
                    {getDeltaText(row.diffQty)}
                  </td>

                  <td className="px-3 py-3">
                    {currencyFmt.format(row.currentSales)}
                  </td>

                  <td className="px-3 py-3">
                    {currencyFmt.format(row.previousSales)}
                  </td>

                  <td
                    className={`rounded-r-xl px-3 py-3 font-semibold ${getDeltaClass(
                      row.diffSales
                    )}`}
                  >
                    {getDeltaText(row.diffSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PeriodTopMenuCompare;
