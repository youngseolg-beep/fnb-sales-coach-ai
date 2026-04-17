import React from "react";
import { formatCurrencyValue } from "../utils2/currency";

type CompareStats = {
  selectedSales: number;
  prevSales: number;
  selectedOrders: number;
  prevOrders: number;
  selectedAov: number;
  prevAov: number;
  avg7Sales: number;
  hasPrevData: boolean;
  avg7Count: number;
};

type InputStatus = {
  posSales: number;
  deliverySales: number;
  orders: number;
};

type Props = {
  date: string;
  monthlyStats: {
    total: number;
    avg: number;
  };
  monthlyRate: number;
  monthlyTarget: number;
  compareStats: CompareStats;
  inputStatus: InputStatus;
  onChangeTarget: (value: number) => void;
  onSaveTarget: () => void;
  country?: string;
};

const formatSignedCurrency = (value: number, country?: string) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatCurrencyValue(
    Math.abs(value),
    country
  )}`;

const formatSignedNumber = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(value).toLocaleString()}`;

const getDiffColor = (value: number) => {
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-blue-500";
  return "text-slate-900";
};

const SummaryPage: React.FC<Props> = ({
  date,
  monthlyStats,
  monthlyRate,
  monthlyTarget,
  compareStats,
  inputStatus,
  onChangeTarget,
  onSaveTarget,
  country,
}) => {
  const monthLabel = date.substring(0, 7);
  const salesDiff = compareStats.selectedSales - compareStats.prevSales;
  const ordersDiff = compareStats.selectedOrders - compareStats.prevOrders;
  const aovDiff = compareStats.selectedAov - compareStats.prevAov;
  const avg7Diff = compareStats.selectedSales - compareStats.avg7Sales;

  const hasPos = inputStatus.posSales > 0;
  const hasDelivery = inputStatus.deliverySales > 0;
  const hasOrders = inputStatus.orders > 0;

  const inputStatusText =
    hasPos && hasDelivery && hasOrders
      ? "POS / 배달 / 주문 입력 완료"
      : hasPos || hasDelivery || hasOrders
      ? "일부 값 입력됨"
      : "입력 전";

  const inputStatusBadgeClass =
    hasPos && hasDelivery && hasOrders
      ? "bg-emerald-50 text-emerald-600"
      : hasPos || hasDelivery || hasOrders
      ? "bg-amber-50 text-amber-600"
      : "bg-slate-100 text-slate-500";

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold text-slate-400">오늘 입력 상태</div>
            <div className="mt-1 text-base font-black text-slate-900">{inputStatusText}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${inputStatusBadgeClass}`}>
            {inputStatusText}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-[24px] bg-white p-4 shadow">
          <div className="text-[11px] text-slate-400">전일 대비 매출</div>
          <div className="mt-2 text-2xl font-black">
            {formatCurrencyValue(compareStats.selectedSales, country)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {compareStats.hasPrevData
              ? `전일 ${formatCurrencyValue(compareStats.prevSales, country)}`
              : "전일 데이터 없음"}
          </div>
          <div className={`mt-1 text-sm font-bold ${getDiffColor(salesDiff)}`}>
            {compareStats.hasPrevData ? formatSignedCurrency(salesDiff, country) : "-"}
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow">
          <div className="text-[11px] text-slate-400">전일 대비 주문</div>
          <div className="mt-2 text-2xl font-black">
            {compareStats.selectedOrders.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {compareStats.hasPrevData
              ? `전일 ${compareStats.prevOrders.toLocaleString()}건`
              : "전일 데이터 없음"}
          </div>
          <div className={`mt-1 text-sm font-bold ${getDiffColor(ordersDiff)}`}>
            {compareStats.hasPrevData ? `${formatSignedNumber(ordersDiff)}건` : "-"}
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow">
          <div className="text-[11px] text-slate-400">전일 대비 객단가</div>
          <div className="mt-2 text-2xl font-black">
            {formatCurrencyValue(compareStats.selectedAov, country)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {compareStats.hasPrevData
              ? `전일 ${formatCurrencyValue(compareStats.prevAov, country)}`
              : "전일 데이터 없음"}
          </div>
          <div className={`mt-1 text-sm font-bold ${getDiffColor(aovDiff)}`}>
            {compareStats.hasPrevData ? formatSignedCurrency(aovDiff, country) : "-"}
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow">
          <div className="text-[11px] text-slate-400">7일 평균 대비 매출</div>
          <div className="mt-2 text-2xl font-black">
            {formatCurrencyValue(compareStats.selectedSales, country)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {compareStats.avg7Count > 0
              ? `7일 평균 ${formatCurrencyValue(compareStats.avg7Sales, country)}`
              : "최근 7일 데이터 없음"}
          </div>
          <div className={`mt-1 text-sm font-bold ${getDiffColor(avg7Diff)}`}>
            {compareStats.avg7Count > 0 ? formatSignedCurrency(avg7Diff, country) : "-"}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-indigo-500 p-5 text-white">
        <div className="text-xs opacity-80">월 요약</div>
        <div className="mt-1 text-2xl font-black">{monthLabel}</div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] opacity-70">월 매출</div>
            <div className="mt-1 text-lg font-black">
              {formatCurrencyValue(monthlyStats.total, country)}
            </div>
          </div>

          <div>
            <div className="text-[11px] opacity-70">일평균</div>
            <div className="mt-1 text-lg font-black">
              {formatCurrencyValue(monthlyStats.avg, country)}
            </div>
          </div>

          <div>
            <div className="text-[11px] opacity-70">목표 달성률</div>
            <div className="mt-1 text-lg font-black">{monthlyRate.toFixed(1)}%</div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow">
        <div className="text-xs text-slate-400">월 목표</div>

        <div className="mt-3 flex gap-2">
          <input
            type="number"
            value={monthlyTarget || ""}
            onChange={(e) => onChangeTarget(Number(e.target.value))}
            onBlur={onSaveTarget}
            className="flex-1 rounded-2xl border px-4 py-3 text-right font-black"
          />
          <button onClick={onSaveTarget} className="rounded-2xl bg-indigo-500 px-2 text-white">
            저장
          </button>
        </div>
      </section>
    </div>
  );
};

export default SummaryPage;
