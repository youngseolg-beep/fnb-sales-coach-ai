import React from "react";

const DetailPage: React.FC = () => {
  return (
    <div className="space-y-5 text-slate-900">

      {/* 헤더 */}
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

      {/* AI 리포트 영역 */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          AI Report
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          코칭 리포트
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (이 영역에 AI 코칭 리포트가 들어갈 예정)
        </div>
      </section>

      {/* 기간 분석 */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Period Analysis
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          기간별 매출 분석
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (이 영역에 기간 분석 그래프 / 비교 데이터 들어갈 예정)
        </div>
      </section>

      {/* 메뉴 엔지니어링 */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Menu Engineering
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          메뉴 성과 분석
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (Top 메뉴 / 저성과 메뉴 분석 영역)
        </div>
      </section>

      {/* 액션 플랜 */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Action Plan
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          추천 액션
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          (Boost Plan / 실행 전략 영역)
        </div>
      </section>

    </div>
  );
};

export default DetailPage;
