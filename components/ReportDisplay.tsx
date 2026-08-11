import React from "react";
import { MenuEngineeringResult } from "../types";

interface ReportDisplayProps {
  report: string;
  loading: boolean;
  menuEngineeringResult: MenuEngineeringResult | null;
  sortedMenuEngineering: any;
  boostPlans: any[];
  sectionTitles?: string[];
}

const renderInlineMarkdown = (value: string) => value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
  part.startsWith("**") && part.endsWith("**")
    ? <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
    : <React.Fragment key={index}>{part}</React.Fragment>
);

const renderMarkdownText = (value: string) => value.split("\n").map((line, index) => {
  const text = line.replace(/^#{1,3}\s+/, "").replace(/^\d+[.)]\s*/, "").trim();
  if (!text) return <div key={index} className="h-2" />;
  if (/^[-*•]\s+/.test(line)) return <div key={index} className="flex gap-2"><span aria-hidden>•</span><span>{renderInlineMarkdown(line.replace(/^[-*•]\s+/, ""))}</span></div>;
  return <p key={index}>{renderInlineMarkdown(text)}</p>;
});

const ReportDisplay: React.FC<ReportDisplayProps> = ({
  report,
  loading,
  menuEngineeringResult,
  sortedMenuEngineering,
  boostPlans,
  sectionTitles,
}) => {
  void menuEngineeringResult;
  void sortedMenuEngineering;
  void boostPlans;

  if (loading) {
    return (
      <div className="rounded-[20px] border border-[#e8e1db] bg-white p-8 shadow-[0_6px_18px_rgba(70,54,42,0.04)] md:rounded-[24px] md:p-10">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e8e2ff] border-t-[#7c6cf6] md:h-12 md:w-12"></div>
          <p className="text-sm font-bold text-slate-800 md:text-base">
            코칭 리포트 작성 중...
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#e8e1db] bg-[#fdfaf8] p-8 text-center text-[#8b817a] md:rounded-[24px] md:p-10">
        <i className="fa-solid fa-bolt-lightning mb-2 text-xl opacity-20 md:text-2xl"></i>
        <p className="text-[12px] font-medium md:text-sm">
          데이터를 입력하고 빠른 코칭을 받으세요.
        </p>
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
    <div className="overflow-hidden rounded-[20px] border border-[#e8e1db] bg-white shadow-[0_7px_20px_rgba(70,54,42,0.045)] md:rounded-[24px]">
      <div className="border-b border-slate-100 px-3 py-3 md:px-5 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
              Coach Report
            </div>
            <h2 className="mt-1 text-base font-black tracking-tight text-slate-900 md:text-lg">
              AI 코칭 리포트
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-indigo-600 md:px-3 md:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            AI Active
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-[#fdfaf8] px-3 py-3 md:space-y-4 md:px-5 md:py-5">
        {sections.map((sectionContent, idx) => {
          const config = iconMap[idx] || {
            icon: "fa-check",
            color: "text-slate-600 bg-slate-50",
            title: "정보",
          };

          const content = sectionContent.replace(/^\d\)\s[^\n]*\n?/, "").trim();

          return (
            <div
              key={idx}
              className="rounded-[16px] border border-[#ece7e1] bg-white p-3 shadow-[0_3px_10px_rgba(70,54,42,0.025)] md:rounded-[18px] md:p-4"
            >
              <div className="flex gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5 text-sm ${config.color} md:h-10 md:w-10 md:text-base`}
                >
                  <i className={`fa-solid ${config.icon}`}></i>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.14em]">
                    {sectionTitles?.[idx] || config.title}
                  </h3>
                  <div className="space-y-2 break-words text-[13px] font-medium leading-6 text-slate-800 md:text-sm md:leading-7">
                    {renderMarkdownText(content)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5 text-center md:px-5 md:py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 md:text-[10px] md:tracking-[0.16em]">
          Action based on real data leads to growth.
        </p>
      </div>
    </div>
  );
};

export default ReportDisplay;
