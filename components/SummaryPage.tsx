import React from "react";

type Props = {
  date: string;
  monthlyStats: {
    total: number;
    avg: number;
  };
  monthlyRate: number;
  monthlyTarget: number;
  onChangeTarget: (value: number) => void;
  onSaveTarget: () => void;
};

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString()}`;
};

const SummaryPage: React.FC<Props> = ({
  date,
  monthlyStats,
  monthlyRate,
  monthlyTarget,
  onChangeTarget,
  onSaveTarget,
}) => {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Monthly Summary
            </div>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {date.substring(0, 7)} Overview
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Monthly Target</span>
            <input
              type="number"
              value={monthlyTarget || ""}
              onChange={(e) => onChangeTarget(Number(e.target.value))}
              onBlur={onSaveTarget}
              className="w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-right text-white outline-none"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10 hover:shadow-xl">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Total Sales
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {formatCurrency(monthlyStats.total)}
          </div>
          <div className="mt-2 text-xs text-slate-500">누적 매출</div>
        </div>

        <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10 hover:shadow-xl">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Daily Avg
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {formatCurrency(Math.round(monthlyStats.avg))}
          </div>
          <div className="mt-2 text-xs text-slate-500">일 평균 매출</div>
        </div>

        <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10 hover:shadow-xl">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Achievement
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-indigo-400">
            {monthlyRate.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500">목표 대비 달성률</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
