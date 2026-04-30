import React from "react";

interface Props {
  sortedMenuEngineering: any;
}

const BOX_META = {
  stars: {
    title: "⭐ Stars (인기 높음 / 수익 높음)",
    border: "border-l-emerald-500",
    titleColor: "text-emerald-700",
  },
  cash: {
    title: "💰 Cash Cows (인기 높음 / 수익 낮음)",
    border: "border-l-blue-500",
    titleColor: "text-blue-700",
  },
  puzzles: {
    title: "🧩 Puzzles (인기 낮음 / 수익 높음)",
    border: "border-l-amber-500",
    titleColor: "text-amber-700",
  },
  dogs: {
    title: "🐶 Dogs (인기 낮음 / 수익 낮음)",
    border: "border-l-rose-500",
    titleColor: "text-rose-700",
  },
};

const PeriodMenuEngineering: React.FC<Props> = ({ sortedMenuEngineering }) => {
  if (!sortedMenuEngineering) return null;

  return (
    <div className="w-full">
      <p className="mb-3 text-[11px] text-slate-500">
        판매량과 마진율을 기준으로 메뉴를 4가지 전략 그룹으로 분류합니다.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          { key: "stars", data: sortedMenuEngineering.starsTop3 },
          { key: "cash", data: sortedMenuEngineering.cashCowsTop3 },
          { key: "puzzles", data: sortedMenuEngineering.puzzlesTop3 },
          { key: "dogs", data: sortedMenuEngineering.dogsTop3 },
        ].map(({ key, data }) => {
          const meta = BOX_META[key as keyof typeof BOX_META];
          return (
            <div
              key={key}
              className={`rounded-xl border border-slate-200 border-l-4 ${meta.border} bg-white p-3 shadow-sm`}
            >
              <div className={`mb-2 text-[12px] font-bold ${meta.titleColor}`}>
                {meta.title}
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-700">
                {data && data.length > 0 ? (
                  data.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="border-b border-slate-50 pb-1.5 leading-relaxed last:border-0 last:pb-0"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">데이터 없음</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sortedMenuEngineering.noCostItemsList && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-0.5 text-[11px] font-bold text-slate-600">
            원가 미입력 메뉴 (정확한 분석을 위해 원가를 입력해 주세요)
          </div>
          <div className="text-[10px] text-slate-500">
            {sortedMenuEngineering.noCostItemsList}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodMenuEngineering;
