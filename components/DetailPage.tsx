import React, { useMemo, useState } from "react";
import ReportDisplay from "./ReportDisplay";
import { generateCoachingReport } from "../services/geminiService";
import type { SalesReportData, CalculationResult } from "../types";

type Props = {
  selectedDate: string;
  data: SalesReportData;
  showToast: (msg: string) => void;
};

const DetailPage: React.FC<Props> = ({ selectedDate, data, showToast }) => {
  const [report, setReport] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(false);

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

  const hasMeaningfulData = useMemo(() => {
    const hasBase =
      Number(data.posSales || 0) > 0 ||
      Number(data.deliverySales || 0) > 0 ||
      Number(data.orders || 0) > 0 ||
      Number(data.visitCount || 0) > 0 ||
      String(data.note || "").trim().length > 0;

    const hasMenu = data.categories.some((cat) =>
      cat.items.some((item) => Number(item.qty || 0) > 0)
    );

    return hasBase || hasMenu;
  }, [data]);

  const handleGenerateReport = async () => {
    if (!hasMeaningfulData) {
      showToast("해당 날짜에 생성할 매출 데이터가 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const coachOnlyMenuEngineering = null;
      const result = await generateCoachingReport(data, results, coachOnlyMenuEngineering);
      setReport(result);
      setReportDate(selectedDate);
      showToast("코칭 리포트 생성 완료");
    } catch (error) {
      console.error("DetailPage generate report error:", error);
      showToast("코칭 리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isShowingCurrentDateReport = reportDate === selectedDate && !!report;

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
              {isShowingCurrentDateReport && <div>현재 날짜 리포트 표시중</div>}
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
          {isShowingCurrentDateReport ? (
            <ReportDisplay
              report={report}
              loading={false}
              menuEngineeringResult={null}
              sortedMenuEngineering={null}
              boostPlans={[]}
            />
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
              아직 이 날짜의 코칭 리포트가 생성되지 않았습니다. 코칭 리포트 생성 버튼을 눌러 바로 확인하세요.
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
