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
  const monthLabel = `${date.substring(0, 7)} 월간 요약`;

  const rateTone =
    monthlyRate >= 100
      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : monthlyRate >= 80
      ? "text-indigo-600 bg-indigo-50 border-indigo-100"
      : monthlyRate >= 50
      ? "text-amber-600 bg-amber-50 border-amber-100"
      : "text-rose-600 bg-rose-50 border-rose-100";

  const statusTitle =
    monthlyRate >= 100
      ? "목표 달성 중"
      : monthlyRate >= 80
      ? "목표 근접 구간"
      : monthlyRate >= 50
      ? "추가 관리 필요"
      : "집중 점검 필요";

  const statusDescription =
    monthlyRate >= 100
      ? "현재 페이스를 유지하면 이번 달 운영 흐름이 안정적으로 마무리될 가능성이 높습니다."
      : monthlyRate >= 80
      ? "월 목표에 근접하고 있습니다. 현재 흐름을 유지하면서 매출 피크 타임 관리에 집중하세요."
      : monthlyRate >= 50
      ? "중간 구간입니다. 매출 입력과 일별 흐름을 꾸준히 확인하면서 운영 상태를 점검하세요."
      : "현재 달성률이 낮습니다. Sales 페이지에서 입력 상태를 먼저 점검하고, Detail 페이지 분석을 이어서 확인하는 것이 좋습니다.";

  return (
    <div className="space-y-5 text-slate-900">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Summary
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                {monthLabel}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                이번 달 매출 흐름과 목표 달성 상태를 한눈에 확인합니다.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 md:w-auto md:min-w-[260px]">
              <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Monthly Target
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={monthlyTarget || ""}
                  onChange={(e) => onChangeTarget(Number(e.target.value))}
                  onBlur={onSaveTarget}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-base font-black text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 md:w-40"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={onSaveTarget}
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition-all hover:bg-indigo-600"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Monthly Sales
              </div>
              <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                ${monthlyStats.total.toLocaleString()}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-500">
                이번 달 누적 매출
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Daily Average
              </div>
              <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                ${Math.round(monthlyStats.avg).toLocaleString()}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-500">
                영업일 기준 일 평균 매출
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Target Rate
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-3xl font-black tracking-tight text-slate-900">
                  {monthlyRate.toFixed(1)}%
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${rateTone}`}>
                  {statusTitle}
                </span>
              </div>
              <div className="mt-2 text-sm font-medium text-slate-500">
                월 목표 대비 현재 달성률
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                Status Overview
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight">
                {statusTitle}
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-200">
                {statusDescription}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Next Action
              </div>
              <ul className="mt-4 space-y-3 text-sm font-medium text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                  <span>Sales 페이지에서 날짜별 입력 상태를 먼저 확인하세요.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                  <span>월 목표 수치를 점검하고 필요 시 즉시 수정하세요.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                  <span>상세 원인 분석은 Detail 페이지에서 이어서 확인하세요.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SummaryPage;
