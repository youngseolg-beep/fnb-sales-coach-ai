import React from "react";

interface Props {
  sortedMenuEngineering: any;
}

const BOX_META = {
  stars: {
    title: "⭐ Stars",
    ring: "border-emerald-200",
    bg: "bg-emerald-50",
    titleColor: "text-emerald-700",
  },
  cash: {
    title: "💰 Cash Cows",
    ring: "border-blue-200",
    bg: "bg-blue-50",
    titleColor: "text-blue-700",
  },
  puzzles: {
    title: "🧩 Puzzles",
    ring: "border-amber-200",
    bg: "bg-amber-50",
    titleColor: "text-amber-700",
  },
  dogs: {
    title: "🐶 Dogs",
    ring: "border-rose-200",
    bg: "bg-rose-50",
    titleColor: "text-rose-700",
  },
};

const PeriodMenuEngineering: React.FC<Props> = ({ sortedMenuEngineering }) => {
  if (!sortedMenuEngineering) return null;

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-[28px] md:p-5">
      <div className="mb-3 md:mb-4">
        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
          Menu Structure
        </div>
        <h4 className="mt-1 text-base font-black tracking-tight text-slate-900 md:text-lg">
          메뉴 엔지니어링 분석
        </h4>
        <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500 md:text-sm md:leading-6">
          최근 분석 기간 기준으로 Star / Cash Cow / Puzzle / Dog 메뉴를 요약합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <div
          className={`rounded-[18px] border ${BOX_META.stars.ring} ${BOX_META.stars.bg} p-3 md:rounded-[22px] md:p-4`}
        >
          <div className={`mb-2 text-[13px] font-black ${BOX_META.stars.titleColor} md:text-sm`}>
            {BOX_META.stars.title}
          </div>
          <div className="space-y-1.5 text-[12px] text-slate-800 md:space-y-2 md:text-sm">
            {sortedMenuEngineering.starsTop3.length > 0 ? (
              sortedMenuEngineering.starsTop3.map((item: string, idx: number) => (
                <div key={`stars-${idx}`} className="font-medium leading-5 md:leading-6">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>

        <div
          className={`rounded-[18px] border ${BOX_META.cash.ring} ${BOX_META.cash.bg} p-3 md:rounded-[22px] md:p-4`}
        >
          <div className={`mb-2 text-[13px] font-black ${BOX_META.cash.titleColor} md:text-sm`}>
            {BOX_META.cash.title}
          </div>
          <div className="space-y-1.5 text-[12px] text-slate-800 md:space-y-2 md:text-sm">
            {sortedMenuEngineering.cashCowsTop3.length > 0 ? (
              sortedMenuEngineering.cashCowsTop3.map((item: string, idx: number) => (
                <div key={`cash-${idx}`} className="font-medium leading-5 md:leading-6">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>

        <div
          className={`rounded-[18px] border ${BOX_META.puzzles.ring} ${BOX_META.puzzles.bg} p-3 md:rounded-[22px] md:p-4`}
        >
          <div className={`mb-2 text-[13px] font-black ${BOX_META.puzzles.titleColor} md:text-sm`}>
            {BOX_META.puzzles.title}
          </div>
          <div className="space-y-1.5 text-[12px] text-slate-800 md:space-y-2 md:text-sm">
            {sortedMenuEngineering.puzzlesTop3.length > 0 ? (
              sortedMenuEngineering.puzzlesTop3.map((item: string, idx: number) => (
                <div key={`puzzle-${idx}`} className="font-medium leading-5 md:leading-6">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>

        <div
          className={`rounded-[18px] border ${BOX_META.dogs.ring} ${BOX_META.dogs.bg} p-3 md:rounded-[22px] md:p-4`}
        >
          <div className={`mb-2 text-[13px] font-black ${BOX_META.dogs.titleColor} md:text-sm`}>
            {BOX_META.dogs.title}
          </div>
          <div className="space-y-1.5 text-[12px] text-slate-800 md:space-y-2 md:text-sm">
            {sortedMenuEngineering.dogsTop3.length > 0 ? (
              sortedMenuEngineering.dogsTop3.map((item: string, idx: number) => (
                <div key={`dog-${idx}`} className="font-medium leading-5 md:leading-6">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>
      </div>

      {sortedMenuEngineering.noCostItemsList && (
        <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3 md:mt-4 md:rounded-[22px] md:p-4">
          <div className="mb-1 text-[12px] font-black text-slate-700 md:text-sm">
            원가 미입력 메뉴
          </div>
          <div className="text-[12px] leading-5 text-slate-600 md:text-sm md:leading-6">
            {sortedMenuEngineering.noCostItemsList}
          </div>
        </div>
      )}
    </section>
  );
};

export default PeriodMenuEngineering;
