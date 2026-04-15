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
    <section className="rounded-[20px] border border-slate-200/80 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
      <div className="mb-3 md:mb-4">
        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
          Boost Plan
        </div>
        <h4 className="mt-1 text-base font-black tracking-tight text-slate-900 md:text-lg">
          바로 실행할 액션
        </h4>
        <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500 md:text-sm md:leading-6">
          분석 결과를 바탕으로 오늘 바로 적용할 수 있는 실행안을 정리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
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
              className={`rounded-[18px] border ${meta.ring} bg-white p-3 shadow-sm md:rounded-[22px] md:p-4`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${meta.bg} ${meta.tone} md:px-2.5 md:text-[11px]`}
                  >
                    {meta.badge}
                  </div>
                  <div className="mt-2 text-[13px] font-black leading-snug text-slate-900 md:text-sm">
                    {plan.setName}
                  </div>
                </div>

                <div className="shrink-0 rounded-xl bg-slate-100 px-2 py-1.5 text-right md:px-2.5 md:py-2">
                  <div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 md:text-[10px]">
                    목표
                  </div>
                  <div className="mt-0.5 text-[12px] font-black text-slate-900 md:text-sm">
                    {plan.dailyTargetQty}개/일
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[16px] bg-slate-50 p-3 md:rounded-[18px]">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">
                  구성
                </div>
                <div className="mt-1.5 text-[12px] font-bold leading-5 text-slate-700 md:text-sm md:leading-6">
                  {plan.setComposition}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">
                    혜택
                  </div>
                  <div
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${meta.bg} ${meta.tone} md:px-2.5 md:text-xs`}
                  >
                    {plan.discount}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[16px] border border-slate-200 bg-white p-3 md:rounded-[18px]">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">
                  직원 실행 멘트
                </div>
                <div className="mt-1.5 text-[12px] font-bold leading-5 text-slate-800 md:text-sm md:leading-6">
                  {plan.staffComment}
                </div>
              </div>

              <div className="mt-3 rounded-[16px] bg-slate-50 p-3 md:rounded-[18px]">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px]">
                  왜 이 액션인가
                </div>
                <div className="mt-1.5 text-[12px] font-medium leading-5 text-slate-600 md:text-sm md:leading-6">
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
