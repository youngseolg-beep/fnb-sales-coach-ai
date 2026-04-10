import React from 'react';

type DetailPageV2Props = {
  report?: string;
  isLoadingReport?: boolean;
  onGenerateReport?: () => void;
  periodAnalysisSection?: React.ReactNode;
  topMenuCompareSection?: React.ReactNode;
  boostPlanSection?: React.ReactNode;
};

export default function DetailPageV2({
  report = '',
  isLoadingReport = false,
  onGenerateReport,
  periodAnalysisSection,
  topMenuCompareSection,
  boostPlanSection,
}: DetailPageV2Props) {
  const hasReport = report.trim().length > 0;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-slate-900 p-4 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Detail
            </div>
            <h2 className="mt-1 text-lg font-bold">AI 코칭 리포트</h2>
            <p className="mt-1 text-xs text-slate-300">
              오늘 데이터를 바탕으로 매장 운영 인사이트를 확인합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateReport}
            disabled={isLoadingReport}
            className="shrink-0 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingReport ? '생성 중...' : hasReport ? '다시 생성' : '리포트 생성'}
          </button>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">코칭 결과</div>
            <div className="mt-1 text-xs text-slate-500">
              저장하지 않고 현재 화면에서만 보여줍니다.
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          {isLoadingReport ? (
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
            </div>
          ) : hasReport ? (
            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {report}
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              아직 생성된 리포트가 없습니다. 상단 버튼을 눌러 오늘의 코칭 리포트를 확인하세요.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">기간 분석</div>
            <div className="mt-1 text-xs text-slate-500">
              기간별 매출 흐름과 메뉴 성과를 확인합니다.
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          {periodAnalysisSection ?? (
            <div className="text-sm text-slate-500">기간 분석 섹션이 연결되지 않았습니다.</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Top Menu 비교</div>
            <div className="mt-1 text-xs text-slate-500">
              기간별 상위 메뉴 성과를 비교합니다.
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          {topMenuCompareSection ?? (
            <div className="text-sm text-slate-500">Top Menu 비교 섹션이 연결되지 않았습니다.</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Boost Plan</div>
            <div className="mt-1 text-xs text-slate-500">
              실행 우선순위가 높은 액션을 확인합니다.
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          {boostPlanSection ?? (
            <div className="text-sm text-slate-500">Boost Plan 섹션이 연결되지 않았습니다.</div>
          )}
        </div>
      </section>
    </div>
  );
}
