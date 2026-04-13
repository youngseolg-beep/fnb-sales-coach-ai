import React from "react";

interface Props {
  boostPlans: any[];
}

const TYPE_META: Record<
  string,
  {
    badge: string;
    tone: string;
    ring: string;
    bg: string;
  }
> = {
  MENU_BOARD: {
    badge: "대표 노출",
    tone: "text-indigo-600",
    ring: "border-indigo-100",
    bg: "bg-indigo-50",
  },
  STAFF_UPSELL: {
    badge: "직원 추천",
    tone: "text-emerald-600",
    ring: "border-emerald-100",
    bg: "bg-emerald-50",
  },
  SET_DISCOUNT: {
    badge: "세트 할인",
    tone: "text-amber-600",
    ring: "border-amber-100",
    bg: "bg-amber-50",
  },
};

const PeriodBoostPlan: React.FC<Props> = ({ boostPlans }) => {
  if (!boostPlans || boostPlans.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:p-6">
      <div className="mb-5">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          Boost Plan
        </div>
        <h4 className="mt-2 text-xl font-black tracking-tight text-slate-900">
          바로 실행할 액션
        </h4>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          분석 결과를 바탕으로 오늘 바로 적용할 수 있는 실행안을 정리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {boostPlans.map((plan: any, idx: number) => {
          const meta = TYPE_META[plan.type] ?? {
            badge: plan.type,
            tone: "text-slate-600",
            ring: "border-slate-200",
            bg: "bg-slate-100",
          };

          return (
            <article
              key={`${plan.type}-${idx}`}
              className={`rounded-[26px] border ${meta.ring} bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${meta.bg} ${meta.tone}`}
                  >
                    {meta.badge}
                  </div>
                  <div className="mt-3 text-sm font-black leading-snug text-slate-900">
                    {plan.setName}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    목표
                  </div>
                  <div className="mt-1 text-sm font-black text-slate-900">
                    {plan.dailyTargetQty}개/일
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  구성
                </div>
                <div className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {plan.setComposition}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                    혜택
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-black ${meta.bg} ${meta.tone}`}>
                    {plan.discount}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  직원 실행 멘트
                </div>
                <div className="mt-2 text-sm font-bold leading-6 text-slate-800">
                  {plan.staffComment}
                </div>
              </div>

              <div className="mt-4 rounded-[22px] bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  왜 이 액션인가
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {plan.reason}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default PeriodBoostPlan;
