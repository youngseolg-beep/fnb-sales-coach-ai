import React from "react";
import type { ComparisonMode } from "../utils2/periodComparison";

interface Props {
  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;
  periodRange: {
    start: string;
    end: string;
  };
  comparisonRange: {
    start: string;
    end: string;
  } | null;
  setComparisonRange: React.Dispatch<
    React.SetStateAction<{ start: string; end: string } | null>
  >;
  canRunPeriodAnalysis: boolean;
}

const PeriodComparisonPanel: React.FC<Props> = ({
  comparisonMode,
  setComparisonMode,
  periodRange,
  comparisonRange,
  setComparisonRange,
  canRunPeriodAnalysis,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          비교 방식
        </p>
        <p className="text-sm font-bold text-slate-700">
          {comparisonMode === "WOW"
            ? "전주 비교"
            : comparisonMode === "MOM"
            ? "전월 비교"
            : comparisonMode === "YOY"
            ? "전년 동기 비교"
            : "직접 비교"}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setComparisonMode("WOW")}
          className={`h-10 rounded-xl text-sm font-bold border transition-all ${
            comparisonMode === "WOW"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          전주
        </button>

        <button
          type="button"
          onClick={() => setComparisonMode("MOM")}
          className={`h-10 rounded-xl text-sm font-bold border transition-all ${
            comparisonMode === "MOM"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          전월
        </button>

        <button
          type="button"
          onClick={() => setComparisonMode("YOY")}
          className={`h-10 rounded-xl text-sm font-bold border transition-all ${
            comparisonMode === "YOY"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          전년
        </button>

        <button
          type="button"
          onClick={() => setComparisonMode("MANUAL")}
          className={`h-10 rounded-xl text-sm font-bold border transition-all ${
            comparisonMode === "MANUAL"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          직접선택
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="font-bold text-slate-500 mb-2">현재 기간</div>
          <div className="text-slate-900 font-semibold">
            {periodRange.start} ~ {periodRange.end}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="font-bold text-slate-500 mb-2">비교 기간</div>

          {comparisonMode === "MANUAL" ? (
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={comparisonRange?.start ?? ""}
                onChange={(e) =>
                  setComparisonRange((prev) => ({
                    start: e.target.value,
                    end: prev?.end ?? e.target.value,
                  }))
                }
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <span className="text-slate-400 text-center text-sm font-bold">~</span>
              <input
                type="date"
                value={comparisonRange?.end ?? ""}
                onChange={(e) =>
                  setComparisonRange((prev) => ({
                    start: prev?.start ?? e.target.value,
                    end: e.target.value,
                  }))
                }
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          ) : (
            <div className="text-slate-900 font-semibold">
              {comparisonRange?.start ?? "-"} ~ {comparisonRange?.end ?? "-"}
            </div>
          )}
        </div>
      </div>

      {!canRunPeriodAnalysis && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          메뉴 엔지니어링 / 부스트 플랜 분석은 최소 7일 이상의 기간이 필요합니다.
        </div>
      )}
    </div>
  );
};

export default PeriodComparisonPanel;
