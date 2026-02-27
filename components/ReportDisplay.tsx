
import React, { useState } from 'react';
import { MenuEngineeringResult } from '../types'; // Assuming types.ts is in the root or accessible

interface ReportDisplayProps {
  report: string;
  loading: boolean;
  menuEngineeringResult: MenuEngineeringResult | null;
  sortedMenuEngineering: any; // Use a more specific type if available
  boostPlans: any[]; // Use a more specific type if available
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, loading, menuEngineeringResult, sortedMenuEngineering, boostPlans }) => {
  const [isMeSummaryOpen, setIsMeSummaryOpen] = useState(false);

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

  // Parse the 5-point structure: 1) 2) 3) 4) 5)
  const sections = report.split(/(?=\d\)\s)/).filter(Boolean);
  
  const iconMap: Record<number, { icon: string; color: string; title: string }> = {
    0: { icon: 'fa-chart-pie', color: 'text-blue-600 bg-blue-50', title: '오늘 요약' },
    1: { icon: 'fa-star', color: 'text-amber-600 bg-amber-50', title: '핵심 포인트' },
    2: { icon: 'fa-flag', color: 'text-rose-600 bg-rose-50', title: '월 목표 관점' },
    3: { icon: 'fa-rocket', color: 'text-purple-600 bg-purple-50', title: '내일 액션 플랜' },
    4: { icon: 'fa-list-check', color: 'text-emerald-600 bg-emerald-50', title: '실행 체크리스트' },
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
          const config = iconMap[idx] || { icon: 'fa-check', color: 'text-slate-600 bg-slate-50', title: '정보' };
          const content = sectionContent.replace(/^\d\)\s[^\n]*\n?/, '').trim();
          
          return (
            <div key={idx} className="flex gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-lg border border-black/5`}>
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

        {/* Menu Engineering & Boost Plans Section */}
        {menuEngineeringResult && menuEngineeringResult.analyzedDatesCount < 7 ? (
          <div className="bg-slate-50 p-6 rounded-xl text-center text-slate-500 border border-slate-200 mt-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-2">
              📊 데이터 수집 중
            </h3>
            <p className="text-sm font-medium">선택한 날짜 기준 최근 7일 데이터가 필요합니다.</p>
            <p className="text-xs mt-1">현재 {menuEngineeringResult.analyzedDatesCount}일치 데이터가 있습니다.</p>
            <p className="text-xs text-slate-400 mt-2">※ 데이터가 많을수록 추천 정확도가 올라갑니다.</p>
          </div>
        ) : (
          menuEngineeringResult && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200">
              <button 
                onClick={() => setIsMeSummaryOpen(!isMeSummaryOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-t-xl border-b border-slate-200 text-slate-800 font-black text-sm uppercase tracking-tight"
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-utensils text-indigo-500"></i>
                  메뉴 엔지니어링 요약 (최근 7일)
                </span>
                <i className={`fa-solid ${isMeSummaryOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-slate-500`}></i>
              </button>
              {isMeSummaryOpen && (
                <div className="p-4 space-y-6">
                  {/* Menu Engineering Summary Card Content */}
                  {sortedMenuEngineering && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 p-4 border-b border-slate-100">
                        ※ 선택한 날짜 기준 최근 7일 / 인기도 기준: 최근 7일 평균 판매수량 {sortedMenuEngineering.popularityThreshold}개 / 수익성 기준: 평균 1개당 이익(판매가-원가) ${sortedMenuEngineering.profitabilityThreshold}
                      </p>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Stars */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <h4 className="font-black text-slate-900 text-md mb-2">Stars (고인기, 고수익)</h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {sortedMenuEngineering.starsTop3.length > 0 ? (
                              sortedMenuEngineering.starsTop3.map((item, index) => <li key={index}>{item}</li>)
                            ) : (
                              <li>없음</li>
                            )}
                          </ul>
                        </div>

                        {/* Cash Cows */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <h4 className="font-black text-slate-900 text-md mb-2">Cash Cows (고인기, 저수익)</h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {sortedMenuEngineering.cashCowsTop3.length > 0 ? (
                              sortedMenuEngineering.cashCowsTop3.map((item, index) => <li key={index}>{item}</li>)
                            ) : (
                              <li>없음</li>
                            )}
                          </ul>
                        </div>

                        {/* Puzzles */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <h4 className="font-black text-slate-900 text-md mb-2">Puzzles (저인기, 고수익)</h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {sortedMenuEngineering.puzzlesTop3.length > 0 ? (
                              sortedMenuEngineering.puzzlesTop3.map((item, index) => <li key={index}>{item}</li>)
                            ) : (
                              <li>없음</li>
                            )}
                          </ul>
                        </div>

                        {/* Dogs */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <h4 className="font-black text-slate-900 text-md mb-2">Dogs (저인기, 저수익)</h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {sortedMenuEngineering.dogsTop3.length > 0 ? (
                              sortedMenuEngineering.dogsTop3.map((item, index) => <li key={index}>{item}</li>)
                            ) : (
                              <li>없음</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      {sortedMenuEngineering.noCostItemsList && ( 
                        <div className="bg-amber-50 border-t border-amber-200 p-4 text-xs text-amber-800 font-medium rounded-b-xl">
                          <strong>원가 미입력 메뉴:</strong> {sortedMenuEngineering.noCostItemsList}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* Boost Plans Section Content (Always visible if analyzedDatesCount >= 7) */}
        {menuEngineeringResult && menuEngineeringResult.analyzedDatesCount >= 7 && boostPlans.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-4">
            <div className="bg-slate-50 border-b border-slate-100 p-4">
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-rocket text-indigo-500"></i>
                이번 달 부스트 플랜 (세트/프로모션)
              </h4>
              <p className="text-xs text-slate-500 mt-1">Puzzles (저인기, 고수익) 메뉴를 위한 추천 세트 구성 및 일일 목표입니다.</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {boostPlans.map((plan, index) => (
                <div key={index} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-2">
                  <p className="text-xs font-black text-indigo-500 uppercase">프로모션 타입: {plan.type}</p>
                  <h5 className="font-black text-indigo-800 text-md">{plan.setName}</h5>
                  <p className="text-xs text-indigo-700"><strong>구성:</strong> {plan.setComposition}</p>
                  <p className="text-xs text-indigo-700"><strong>할인:</strong> {plan.discount}</p>
                  <p className="text-xs text-indigo-700"><strong>하루 목표 수량:</strong> {plan.dailyTargetQty}개</p>
                  {plan.reason && <p className="text-xs text-indigo-700"><strong>이유:</strong> {plan.reason}</p>}
                  <p className="text-xs text-indigo-600 font-medium">"{plan.staffComment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
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
