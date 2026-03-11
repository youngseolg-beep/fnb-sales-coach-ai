import React from "react";

interface Props {
  sortedMenuEngineering: any;
}

const PeriodMenuEngineering: React.FC<Props> = ({ sortedMenuEngineering }) => {
  if (!sortedMenuEngineering) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <div className="mb-4">
        <h4 className="text-lg font-black text-slate-900">메뉴 엔지니어링 분석</h4>
        <p className="text-sm text-slate-500 mt-1">
          최근 분석 기간 기준으로 Star / Cash Cow / Puzzle / Dog 메뉴를 요약합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-black text-emerald-700 mb-2">⭐ Stars</div>
          <div className="space-y-2 text-sm text-slate-800">
            {sortedMenuEngineering.starsTop3.length > 0 ? (
              sortedMenuEngineering.starsTop3.map((item: string, idx: number) => (
                <div key={`stars-${idx}`} className="font-medium">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-black text-blue-700 mb-2">💰 Cash Cows</div>
          <div className="space-y-2 text-sm text-slate-800">
            {sortedMenuEngineering.cashCowsTop3.length > 0 ? (
              sortedMenuEngineering.cashCowsTop3.map((item: string, idx: number) => (
                <div key={`cash-${idx}`} className="font-medium">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-black text-amber-700 mb-2">🧩 Puzzles</div>
          <div className="space-y-2 text-sm text-slate-800">
            {sortedMenuEngineering.puzzlesTop3.length > 0 ? (
              sortedMenuEngineering.puzzlesTop3.map((item: string, idx: number) => (
                <div key={`puzzle-${idx}`} className="font-medium">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-slate-500">데이터 없음</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm font-black text-rose-700 mb-2">🐶 Dogs</div>
          <div className="space-y-2 text-sm text-slate-800">
            {sortedMenuEngineering.dogsTop3.length > 0 ? (
              sortedMenuEngineering.dogsTop3.map((item: string, idx: number) => (
                <div key={`dog-${idx}`} className="font-medium">
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
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-black text-slate-700 mb-1">원가 미입력 메뉴</div>
          <div className="text-sm text-slate-600">
            {sortedMenuEngineering.noCostItemsList}
          </div>
        </div>
      )}
    </section>
  );
};

export default PeriodMenuEngineering;
