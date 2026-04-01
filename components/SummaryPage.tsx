import React from "react";

type Props = {
  date: string;
  monthlyStats: {
    total: number;
    avg: number;
  };
  monthlyRate: number;
};

const SummaryPage: React.FC<Props> = ({ date, monthlyStats, monthlyRate }) => {
  return (
    <div className="space-y-4">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm md:text-base">
            {date.substring(0, 7)} 월간 요약
          </h3>
        </div>

        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div>
            <p className="text-xs text-slate-400">누적 매출</p>
            <p className="text-2xl font-black">
              ${monthlyStats.total.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">일 평균</p>
            <p className="text-2xl font-black">
              ${Math.round(monthlyStats.avg)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">달성률</p>
            <p className="text-2xl font-black text-indigo-600">
              {monthlyRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SummaryPage;
