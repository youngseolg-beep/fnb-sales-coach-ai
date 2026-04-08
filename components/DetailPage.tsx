import React, { useEffect, useMemo, useState } from "react";
import ReportDisplay from "./ReportDisplay";
import { generateCoachingReport } from "../services/geminiService";
import type { SalesReportData, CalculationResult } from "../types";

const DETAIL_REPORT_STORAGE_KEY = "sales-coach-detail-report-by-date";

type StoredReport = {
  report: string;
  date: string;
  generatedAt: string;
};

type StoredReportMap = Record<string, StoredReport>;

type Props = {
  selectedDate: string;
  data: SalesReportData;
  showToast: (msg: string) => void;
};

const DetailPage: React.FC<Props> = ({ selectedDate, data, showToast }) => {
  const [storedReport, setStoredReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStoredReport = () => {
    try {
      const raw = localStorage.getItem(DETAIL_REPORT_STORAGE_KEY);
      if (!raw) {
        setStoredReport(null);
        return;
      }

      const parsed = JSON.parse(raw) as StoredReportMap;
      const reportForDate = parsed?.[selectedDate];

      if (!reportForDate?.report) {
        setStoredReport(null);
        return;
      }

      setStoredReport(reportForDate);
    } catch (error) {
      console.error("DetailPage localStorage parse error:", error);
      setStoredReport(null);
    }
  };

  useEffect(() => {
    loadStoredReport();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === DETAIL_REPORT_STORAGE_KEY) {
        loadStoredReport();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [selectedDate]);

  const results = useMemo((): CalculationResult => {
    const deliverySales = Number(data.deliverySales || 0);
    const totalSales = Number(data.posSales || 0) + deliverySales;

    let menuSales = 0;
    let addonSum = 0;

    data.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        menuSales += item.price * (item.qty || 0);
        if (cat.name.includes("토핑")) addonSum += item.qty || 0;
      });
    });

    const gapUsd = data.posSales - menuSales;
    const gapRate = data.posSales > 0 ? (gapUsd / data.posSales) * 100 : 0;
    const absGapRate = Math.abs(gapRate);

    let status: "✅" | "🟡" | "🔴" = "✅";
    if (absGapRate > 3) status = "🔴";
    else if (absGapRate > 1) status = "🟡";

    return {
      calcSales: Math.round(totalSales * 100) / 100,
      gapUsd: Math.round(gapUsd * 100) / 100,
      gapRate: Math.round(gapRate * 100) / 100,
      status,
      aov: data.orders > 0 ? Math.round((totalSales / data.orders) * 100) / 100 : 0,
      conversionRate: data.visitCount > 0 ? Math.round((data.orders / data.visitCount) * 1000) / 10 : 0,
      addonPerOrder: data.orders > 0 ? Math.round((addonSum / data.orders) * 10) / 10 : 0,
    };
  }, [data]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const coachOnlyMenuEngineering = null;
      const result = await generateCoachingReport(data, results, coachOnlyMenuEngineering);

      const raw = localStorage.getItem(DETAIL_REPORT_STORAGE_KEY);
      const prevMap: StoredReportMap = raw ? JSON.parse(raw) : {};

      const nextMap: StoredReportMap = {
        ...prevMap,
        [selectedDate]: {
          report: result,
          date: selectedDate,
          generatedAt: new Date().toISOString(),
        },
      };

      localStorage.setItem(DETAIL_REPORT_STORAGE_KEY, JSON.stringify(nextMap));
      setStoredReport(nextMap[selectedDate]);
      showToast("코칭 리포트 생성 완료");
    } catch (error) {
      console.error("DetailPage generate report error:", error);
      showToast("코칭 리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              AI Report
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              코칭 리포트
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="text-right text-xs font-bold text-slate-400">
              <div>기준일: {selectedDate}</div>
              {storedReport && <div>저장된 리포트 표시중</div>}
            </div>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition-all hover:bg-indigo-600 disabled:bg-slate-300"
            >
              {loading ? "코칭 리포트 생성 중..." : "코칭 리포트 생성"}
            </button>
          </div>
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
              해당 날짜에 저장된 코칭 리포트가 없습니다.
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
