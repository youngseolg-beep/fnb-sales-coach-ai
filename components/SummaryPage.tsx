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
  const monthLabel = `${date.substring(0, 7)}`;

  const status =
    monthlyRate >= 100
      ? { title: "Good Flow", color: "text-emerald-600", bg: "bg-emerald-50" }
      : monthlyRate >= 80
      ? { title: "Almost There", color: "text-indigo-600", bg: "bg-indigo-50" }
      : monthlyRate >= 50
      ? { title: "Need Attention", color: "text-amber-600", bg: "bg-amber-50" }
      : { title: "Critical", color: "text-rose-500", bg: "bg-rose-50" };

  return (
    <div className="space-y-6">

      {/* 헤더 느낌 카드 */}
      <section className="rounded-[30px] bg-gradient-to-br from-indigo-500 to-violet-500 p-6 text-white shadow-[0_12px_30px_rgba(99,102,241,0.25)]">
        <div className="text-sm font-bold opacity-80">Monthly Summary</div>
        <div className="mt-2 text-2xl font-black tracking-tight">
          {monthLabel}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-70">Total Sales</div>
            <div className="text-xl font-black">
              ${monthlyStats.total.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs opacity-70">Daily Avg</div>
            <div className="text-xl font-black">
              ${Math.round(monthlyStats.avg).toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* KPI 카드 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="text-xs text-slate-400 font-bold">Monthly Sales</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ${monthlyStats.total.toLocaleString()}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="text-xs text-slate-400 font-bold">Daily Average</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ${Math.round(monthlyStats.avg).toLocaleString()}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="text-xs text-slate-400 font-bold">Target Rate</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-2xl font-black text-slate-900">
              {monthlyRate.toFixed(1)}%
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${status.bg} ${status.color}`}>
              {status.title}
            </span>
          </div>
        </div>
      </section>

      {/* Target 입력 */}
      <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="text-xs font-bold text-slate-400">Monthly Target</div>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            value={monthlyTarget || ""}
            onChange={(e) => onChangeTarget(Number(e.target.value))}
            onBlur={onSaveTarget}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-right font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            onClick={onSaveTarget}
            className="rounded-2xl bg-indigo-500 px-5 text-white font-black shadow-md"
          >
            Save
          </button>
        </div>
      </section>

      {/* 상태 카드 */}
      <section className="rounded-[28px] bg-slate-900 p-6 text-white shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
        <div className="text-xs opacity-60">Status</div>
        <div className="mt-2 text-xl font-black">{status.title}</div>
        <div className="mt-2 text-sm opacity-80">
          현재 매출 흐름을 기반으로 운영 상태를 간단히 요약합니다.
        </div>
      </section>

      {/* 액션 */}
      <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="text-xs font-bold text-slate-400">Next Action</div>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex gap-2">
            <span>•</span>
            <span>Sales 페이지에서 데이터 입력 상태 확인</span>
          </div>
          <div className="flex gap-2">
            <span>•</span>
            <span>목표 수치 점검 및 수정</span>
          </div>
          <div className="flex gap-2">
            <span>•</span>
            <span>Detail 페이지에서 분석 확인</span>
          </div>
        </div>
      </section>

    </div>
  );
};

export default SummaryPage;
