import React from "react";

interface Props {
  boostPlans: any[];
}

const PeriodBoostPlan: React.FC<Props> = ({ boostPlans }) => {
  if (!boostPlans || boostPlans.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <div className="mb-4">
        <h4 className="text-lg font-black text-slate-900">Boost Plan</h4>
        <p className="text-sm text-slate-500 mt-1">
          분석 결과를 바탕으로 매출 개선 액션을 제안합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {boostPlans.map((plan: any, idx: number) => (
          <div
            key={`${plan.type}-${idx}`}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-black text-indigo-700">
                {plan.type}
              </div>
              <div className="text-xs font-bold text-slate-500">
                목표 {plan.dailyTargetQty}개/일
              </div>
            </div>

            <div className="text-base font-black text-slate-900 mb-2">
              {plan.setName}
            </div>

            <div className="text-sm text-slate-700 mb-2">
              {plan.setComposition}
            </div>

            <div className="text-sm font-semibold text-slate-800 mb-2">
              {plan.discount}
            </div>

            <div className="rounded-xl bg-white/80 p-3 text-sm text-slate-700 mb-2">
              <div className="font-bold text-slate-900 mb-1">직원 실행 멘트</div>
              <div>{plan.staffComment}</div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              {plan.reason}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PeriodBoostPlan;
