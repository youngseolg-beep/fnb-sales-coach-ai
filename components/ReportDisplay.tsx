import React from "react";
import { MenuEngineeringResult } from "../types";

interface ReportDisplayProps {
  report: string;
  loading: boolean;
  menuEngineeringResult: MenuEngineeringResult | null;
  sortedMenuEngineering: any;
  boostPlans: any[];
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({
  report,
  loading,
  menuEngineeringResult,
  sortedMenuEngineering,
  boostPlans,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-800 font-bold">코칭 리포트 작성 중...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
        <i className="fa-solid fa-bolt-lightning text-2xl mb-2 opacity-20"></i>
        <p className="text-sm font-medium">데이터를 입력하고 빠른 코칭을 받으세요.</p>
      </div>
    );
  }

  const sections = report.split(/(?=\d\)\s)/).filter(Boolean);

  const iconMap: Record<number, { icon: string; color: string; title: string }> = {
    0: { icon: "fa-chart-pie", color: "text-blue-600 bg-blue-50", title: "오늘 요약" },
    1: { icon: "fa-star", color: "text-amber-600 bg-amber-50", title: "핵심 포인트" },
    2: { icon: "fa-flag", color: "text-rose-600 bg-rose-50", title: "월 목표 관점" },
    3: { icon: "fa-rocket", color: "text-purple-600 bg-purple-50", title: "내일 액션 플랜" },
    4: { icon: "fa-list-check", color: "text-emerald-600 bg-emerald-50", title: "실행 체크리스트" },
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden mb-12">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-comment-dots text-indigo-400"></i>
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Coach Report</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-500/20 px-2 py-1 rounded text-[10px] font-bold text-indigo-300 uppercase">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
          AI Active
        </div>
      </div>

      <div className="p-6 space-y-6">
        {sections.map((sectionContent, idx) => {
          const config = iconMap[idx] || {
            icon: "fa-check",
            color: "text-slate-600 bg-slate-50",
            title: "정보",
          };

          const content = sectionContent.replace(/^\d\)\s[^\n]*\n?/, "").trim();

          return (
            <div key={idx} className="flex gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-lg border border-black/5`}
              >
                <i className={`fa-solid ${config.icon}`}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">
                  {config.title}
                </h3>
                <div className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Action based on real data leads to growth.
        </p>
      </div>
    </div>
  );
};

export default ReportDisplay;
