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

const SummaryPage: React.FC<Props> = ({
  date,
  monthlyStats,
  monthlyRate,
  monthlyTarget,
  onChangeTarget,
  onSaveTarget,
}) => {
  return (
    <div className="space-y-4 text-slate-900">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm md:text-base">
            {date.substring(0, 7)} 월간 요약
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">월 목표</span>
            <input
              type="number"
              value={monthlyTarget || ""}
              onChange={(e) => onChangeTarget(Number(e.target.value))}
              onBlur={onSaveTarget}
              className="w-24 border border-slate-200 rounded px-2 py-1 text-sm text-right text-slate-800 bg-white"
            />
          </div>
        </div>

        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">누적 매출</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ${monthlyStats.total.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">일 평균</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ${Math.round(monthlyStats.avg)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">달성률</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">
              {monthlyRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SummaryPage;
