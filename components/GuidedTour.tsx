import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { StoreOwnerPageKey } from "./StoreOwnerShell";

type TourStep = {
  id: string;
  page: StoreOwnerPageKey;
  target: string;
  title: string;
  description: string;
};

type TourContextValue = {
  startCurrentTour: () => void;
  startWorkflowTour: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

const currentPageSteps: Record<StoreOwnerPageKey, TourStep[]> = {
  summary: [
    { id: "home-summary", page: "summary", target: "home-today-summary", title: "오늘 상태", description: "오늘 매출과 입력 상태를 한눈에 확인합니다." },
    { id: "home-target", page: "summary", target: "home-month-target", title: "월 목표", description: "월 매출 목표와 현재 달성률을 확인합니다." },
    { id: "home-tasks", page: "summary", target: "home-tasks", title: "오늘 해야 할 일", description: "입력이 필요한 항목과 최근 운영 상태를 확인합니다." },
    { id: "home-sales", page: "summary", target: "nav-sales", title: "Sales 이동", description: "매출과 메뉴 판매량은 Sales에서 입력합니다." },
    { id: "home-coach", page: "summary", target: "nav-coach", title: "Coach 이동", description: "입력된 데이터를 바탕으로 분석을 확인합니다." },
  ],
  sales: [
    { id: "sales-date", page: "sales", target: "sales-date", title: "날짜 선택", description: "입력할 영업일을 먼저 확인합니다." },
    { id: "sales-basic", page: "sales", target: "sales-basic-input", title: "기본 매출", description: "POS·배달 매출, 주문 수, 방문객을 입력합니다." },
    { id: "sales-ocr", page: "sales", target: "sales-ocr", title: "영수증 OCR", description: "영수증을 올리면 메뉴와 수량을 자동 인식합니다." },
    { id: "sales-menu", page: "sales", target: "sales-menu-qty", title: "메뉴 판매량", description: "메뉴별 실제 판매 수량을 확인하거나 수정합니다." },
    { id: "sales-match", page: "sales", target: "sales-reconciliation", title: "매출 맞춤", description: "입력 매출과 메뉴 매출 차이를 확인합니다." },
    { id: "sales-save", page: "sales", target: "sales-save", title: "저장", description: "모든 값을 확인한 뒤 해당 날짜 데이터를 저장합니다." },
  ],
  detail: [
    { id: "coach-period", page: "detail", target: "coach-period", title: "분석 기간", description: "분석할 기간과 비교 기간을 선택합니다." },
    { id: "coach-performance", page: "detail", target: "coach-performance", title: "핵심 성과", description: "매출·주문·방문객·객단가 변화를 확인합니다." },
    { id: "coach-flow", page: "detail", target: "coach-analysis", title: "흐름 분석", description: "기간 내 변화와 주요 운영 포인트를 확인합니다." },
    { id: "coach-engineering", page: "detail", target: "coach-menu-engineering", title: "메뉴 엔지니어링", description: "메뉴를 STAR / CASH_COW / PUZZLE / DOG로 분석합니다." },
    { id: "coach-strategy", page: "detail", target: "coach-menu-engineering", title: "AI 메뉴 전략", description: "계산 결과를 기반으로 AI가 실행 우선순위를 설명합니다." },
    { id: "coach-boost", page: "detail", target: "coach-boost-plan", title: "AI 부스트 플랜", description: "유효 후보를 기반으로 최대 3개의 실행안을 제안합니다." },
    { id: "coach-errors", page: "detail", target: "coach-ai-errors", title: "AI 오류 안내", description: "분석이 제한되면 실제 사유가 화면에 표시됩니다." },
  ],
  menu: [
    { id: "menu-list", page: "menu", target: "menu-list", title: "메뉴 목록", description: "등록된 메뉴와 현재 가격 정보를 확인합니다." },
    { id: "menu-price", page: "menu", target: "menu-price-cost", title: "판매가", description: "메뉴 판매가를 관리합니다." },
    { id: "menu-cost", page: "menu", target: "menu-price-cost", title: "원가", description: "수익성 분석을 위해 원가를 최신 상태로 유지합니다." },
    { id: "menu-impact", page: "menu", target: "menu-price-cost", title: "변경 영향", description: "저장된 가격과 원가는 이후 메뉴 분석에 반영됩니다." },
    { id: "menu-save", page: "menu", target: "menu-save", title: "저장", description: "수정이 끝나면 변경 내용을 저장합니다." },
  ],
  more: [
    { id: "more-store", page: "more", target: "more-store-info", title: "매장 정보", description: "현재 연결된 매장과 브랜드·국가·통화를 확인합니다." },
    { id: "more-help", page: "more", target: "more-quick-help", title: "빠른 도움말", description: "기능별 사용 방법을 필요할 때 바로 찾아볼 수 있습니다." },
    { id: "more-ai", page: "more", target: "more-ai-notice", title: "AI 분석 안내", description: "AI 결과의 기준과 주의사항을 확인합니다." },
    { id: "more-tour", page: "more", target: "more-onboarding", title: "전체 둘러보기", description: "처음 사용하는 경우 전체 흐름을 순서대로 확인할 수 있습니다." },
    { id: "more-logout", page: "more", target: "more-logout", title: "로그아웃", description: "사용이 끝나면 계정에서 안전하게 로그아웃합니다." },
  ],
};

const workflowSteps: TourStep[] = [
  currentPageSteps.summary[0], currentPageSteps.summary[1], currentPageSteps.sales[1], currentPageSteps.sales[2],
  currentPageSteps.detail[1], currentPageSteps.detail[5], currentPageSteps.menu[1], currentPageSteps.more[1],
];

export const useGuidedTour = () => {
  const value = useContext(TourContext);
  if (!value) throw new Error("useGuidedTour must be used within GuidedTourProvider");
  return value;
};

const isVisibleTarget = (element: Element) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
};

export function GuidedTourProvider({ currentPage, onChangePage, children }: { currentPage: StoreOwnerPageKey; onChangePage: (page: StoreOwnerPageKey) => void; children: ReactNode }) {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const launcherRef = useRef<HTMLElement | null>(null);
  const retryRef = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const step = steps?.[stepIndex] ?? null;

  const close = () => {
    if (retryRef.current) window.clearTimeout(retryRef.current);
    retryRef.current = null;
    setSteps(null);
    setTargetRect(null);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  };

  const start = (nextSteps: TourStep[]) => {
    launcherRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStepIndex(0);
    setSteps(nextSteps);
  };

  const moveToAvailableStep = (direction: 1 | -1) => {
    if (!steps) return;
    const next = stepIndex + direction;
    if (next < 0) return;
    if (next >= steps.length) { close(); return; }
    setTargetRect(null);
    setStepIndex(next);
  };

  useEffect(() => {
    if (!step) return;
    if (step.page !== currentPage) onChangePage(step.page);
  }, [step, currentPage, onChangePage]);

  useEffect(() => {
    if (!step || step.page !== currentPage) return;
    setTargetRect(null);
    let cancelled = false;
    let attempts = 0;
    let removeListeners: (() => void) | undefined;
    const resolveTarget = () => {
      if (cancelled) return;
      const element = document.querySelector(`[data-tour="${step.target}"]`);
      if (element && isVisibleTarget(element)) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        const update = () => setTargetRect(element.getBoundingClientRect());
        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        removeListeners = () => {
          window.removeEventListener("resize", update);
          window.removeEventListener("scroll", update, true);
        };
        return;
      }
      if (attempts++ < 10) retryRef.current = window.setTimeout(resolveTarget, 100);
      else moveToAvailableStep(1);
    };
    resolveTarget();
    return () => {
      cancelled = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      removeListeners?.();
    };
  }, [step, currentPage]);

  useEffect(() => {
    if (!step) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  const tooltipStyle = useMemo(() => {
    if (!targetRect) return { left: 12, top: 12, width: "calc(100vw - 24px)" };
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(targetRect.left + targetRect.width / 2 - width / 2, window.innerWidth - width - 12));
    const below = targetRect.bottom + 12;
    const top = below + 164 <= window.innerHeight ? below : Math.max(12, targetRect.top - 176);
    return { left, top, width };
  }, [targetRect]);

  return <TourContext.Provider value={{ startCurrentTour: () => start(currentPageSteps[currentPage]), startWorkflowTour: () => start(workflowSteps) }}>
    {children}
    {step && targetRect && <>
      <div className="fixed inset-0 z-[10029]" aria-hidden="true" />
      <div className="pointer-events-none fixed z-[10030] rounded-xl border-2 border-white/90" style={{ top: targetRect.top - 6, left: targetRect.left - 6, width: targetRect.width + 12, height: targetRect.height + 12, boxShadow: "0 0 0 9999px rgba(31, 26, 22, 0.46)" }} />
      <div role="dialog" aria-modal="true" aria-label={`${step.title} 화면 가이드`} className="fixed z-[10031] rounded-[16px] border border-[#e6ddd5] bg-[#fffdfb] p-4 text-[#302a26] shadow-[0_16px_36px_rgba(46,33,24,0.22)]" style={tooltipStyle}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.08em] text-[#9a755d]">화면 가이드 · {stepIndex + 1} / {steps!.length}</p><h2 className="mt-1 text-[15px] font-bold">{step.title}</h2></div><button ref={closeRef} type="button" onClick={close} className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#756860] hover:bg-[#f5eee9]" aria-label="화면 가이드 닫기"><i className="fa-solid fa-xmark" /></button></div>
        <p className="mt-2 text-[12px] leading-5 text-[#655a53]">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2"><button type="button" disabled={stepIndex === 0} onClick={() => moveToAvailableStep(-1)} className="h-8 rounded-lg px-2.5 text-[11px] font-semibold text-[#77685e] disabled:opacity-35">이전</button><button type="button" onClick={() => moveToAvailableStep(1)} className="h-8 rounded-lg bg-[#8b5e3c] px-3 text-[11px] font-semibold text-white">{stepIndex === steps!.length - 1 ? "완료" : "다음"}</button></div>
      </div>
    </>}
  </TourContext.Provider>;
}
