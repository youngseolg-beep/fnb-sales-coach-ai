import React from "react";

interface Props {
  boostPlans: any[];
}

const TYPE_META: Record<
  string,
  { badge: string; tone: string; bg: string }
> = {
  MENU_BOARD: { badge: "대표 노출", tone: "text-blue-600", bg: "bg-blue-50" },
  STAFF_UPSELL: { badge: "직원 추천", tone: "text-emerald-600", bg: "bg-emerald-50" },
  SET_DISCOUNT: { badge: "세트 할인", tone: "text-amber-600", bg: "bg-amber-50" },
};

const PeriodBoostPlan: React.FC<Props> = ({ boostPlans }) => {
  if (!boostPlans || boostPlans.length === 0) return null;

  return (
    <div className="w-full">
      <p className="mb-3 text-[11px] text-slate-500">
        분석 결과를 바탕으로 즉시 적용 가능한 매출 증대 실행안입니다.
      </p>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {boostPlans.map((plan: any, idx: number) => {
          const meta = TYPE_META[plan.type] ?? {
            badge: plan.type,
            tone: "text-slate-600",
            bg: "bg-slate-100",
          };

          return (
            <article
              key={`${plan.type}-${idx}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
            >
              {/* 타이틀 & 목표 */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${meta.bg} ${meta.tone}`}>
                    {meta.badge}
                  </span>
                  <div className="mt-1.5 text-[13px] font-bold leading-tight text-slate-900">
                    {plan.setName}
                  </div>
                </div>
                <div className="shrink-0 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-right">
                  <div className="text-[8px] font-bold text-slate-400">목표</div>
                  <div className="text-[11px] font-black text-slate-800">{plan.dailyTargetQty}개/일</div>
                </div>
              </div>

              {/* 구성 및 혜택 */}
              <div className="rounded-lg bg-slate-50 p-2.5">
                <div className="text-[9px] font-bold text-slate-400">구성 & 혜택</div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-700">
                  {plan.setComposition}
                  <span className={`ml-1.5 inline-flex rounded-sm px-1 py-0.5 text-[8px] font-bold ${meta.bg} ${meta.tone}`}>
                    {plan.discount}
                  </span>
                </div>
              </div>

              {/* 직원 멘트 */}
              <div className="rounded-lg border border-slate-100 bg-white p-2.5">
                <div className="text-[9px] font-bold text-slate-400">직원 실행 멘트</div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-800">
                  "{plan.staffComment}"
                </div>
              </div>

              {/* 이유 (WHY) */}
              <div className="mt-auto text-[10px] leading-relaxed text-slate-500">
                <span className="mr-1 font-bold text-slate-400">WHY?</span>
                {plan.reason}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default PeriodBoostPlan;
