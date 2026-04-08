import React, { useEffect, useState } from "react";
import ReportDisplay from "./ReportDisplay";

const DETAIL_REPORT_STORAGE_KEY = "sales-coach-detail-report";

type StoredReport = {
  report: string;
  date: string;
  generatedAt: string;
};

const DetailPage: React.FC = () => {
  const [storedReport, setStoredReport] = useState<StoredReport | null>(null);

  useEffect(() => {
    const loadStoredReport = () => {
      try {
        const raw = localStorage.getItem(DETAIL_REPORT_STORAGE_KEY);
        if (!raw) {
          setStoredReport(null);
          return;
        }

        const parsed = JSON.parse(raw) as StoredReport;
        if (!parsed?.report) {
          setStoredReport(null);
          return;
        }

        setStoredReport(parsed);
      } catch (error) {
        console.error("DetailPage localStorage parse error:", error);
        setStoredReport(null);
      }
    };

    loadStoredReport();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === DETAIL_REPORT_STORAGE_KEY) {
        loadStoredReport();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div className="space-y-5 text-slate-900">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          Detail
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          매출 분석 & 코칭
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          리포트, 기간 분석, 메뉴 성과를 기반으로 매장 운영 개선 포인트를 확인합니다.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              AI Report
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              코칭 리포트
            </div>
          </div>

          {storedReport && (
            <div className="text-right text-xs font-bold text-slate-400">
              <div>기준일: {storedReport.date}</div>
              <div>최근 생성 리포트</div>
            </div>
          )}
        </div>

        <div className="mt-4">
          {storedReport ? (
            <ReportDisplay
              report={storedReport.report}
              loading={false}
              menuEngineeringResult={null}
              sortedMenuEngineering={null}
              boostPlans={[]}
            />
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
              아직 생성된 AI 코칭 리포트가 없습니다. Sales 페이지에서 데이터를 저장한 뒤
              코칭 리포트를 먼저 생성하세요.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Period Analysis
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          기간별 매출 분석
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (다음 단계에서 기간 분석 영역을 이 페이지로 이동)
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Menu Engineering
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          메뉴 성과 분석
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (다음 단계에서 메뉴 엔지니어링 / Top 메뉴 분석 영역 이동)
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Action Plan
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          추천 액션
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (다음 단계에서 Boost Plan 영역 이동)
        </div>
      </section>
    </div>
  );
};

export default DetailPage;
