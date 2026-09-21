import { useState } from "react";
import { useGuidedTour } from "./GuidedTour";

type Props = {
  onLogout: () => void;
  storeName?: string | null;
  brand?: string | null;
  country?: string | null;
  currency?: string | null;
};

type GuideItem = {
  title: string;
  description: string;
  icon: string;
  details: string[];
};

const guideItems: GuideItem[] = [
  { title: "매출 입력", description: "일일 매출과 메뉴 판매량을 기록합니다.", icon: "fa-pen-to-square", details: ["POS 매출, 배달 매출, 주문 수, 방문객을 입력합니다.", "메뉴별 판매 수량을 입력합니다.", "입력 매출과 메뉴 매출 차이를 확인한 뒤 저장합니다.", "과거 날짜도 캘린더에서 선택해 입력할 수 있습니다."] },
  { title: "영수증 OCR", description: "영수증 이미지에서 메뉴와 수량을 인식합니다.", icon: "fa-camera", details: ["영수증 이미지를 업로드하면 메뉴와 수량을 자동 인식합니다.", "인식 결과와 메뉴 매칭을 확인한 뒤 입력창에 적용합니다.", "매장명 차이는 경고만 표시됩니다.", "메뉴 미확정, 통화 불일치, 미래 날짜, 합계 불일치는 적용이 제한될 수 있습니다.", "OCR 실패 시에도 수동 입력은 계속 사용할 수 있습니다."] },
  { title: "AI Coach", description: "선택 기간의 흐름과 운영 인사이트를 확인합니다.", icon: "fa-robot", details: ["선택 기간의 매출, 주문, 방문객, 객단가 흐름을 분석합니다.", "기간 비교와 운영 인사이트를 확인할 수 있습니다.", "AI 분석이 실패해도 기본 데이터 분석은 계속 볼 수 있습니다."] },
  { title: "메뉴 엔지니어링", description: "메뉴별 판매량과 수익성을 분석합니다.", icon: "fa-chart-pie", details: ["메뉴 판매량과 수익성을 기준으로 메뉴 상태를 분석합니다.", "STAR / CASH_COW / PUZZLE / DOG 분류를 제공합니다.", "AI 전략은 이 계산 결과를 바탕으로 개선 방법을 설명합니다.", "충분한 기간과 메뉴 데이터가 필요할 수 있습니다."] },
  { title: "AI 부스트 플랜", description: "분석 결과를 바탕으로 다음 실행 방법을 정리합니다.", icon: "fa-rocket", details: ["매출과 메뉴 분석 결과를 바탕으로 최대 3개의 실행 방법을 제안합니다.", "추천할 내용이 2개면 2개, 1개면 1개만 표시될 수 있습니다.", "할인율, 쿠폰, 증정, 세트 가격 등은 근거 없이 자동 확정하지 않습니다.", "가격 또는 세트 관련 제안은 원가와 공헌이익 확인을 우선합니다.", "AI가 실행안을 만들지 못하면 화면에 실패 사유가 표시됩니다."] },
  { title: "메뉴 관리", description: "판매가와 원가를 최신 상태로 관리합니다.", icon: "fa-utensils", details: ["메뉴 판매가와 원가를 관리합니다.", "변경된 가격과 원가는 이후 분석에 반영됩니다.", "정확한 수익성 분석을 위해 원가를 최신 상태로 유지하는 것이 좋습니다."] },
];

const StoreDetail = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0 rounded-xl bg-[#faf7f4] px-3 py-2.5">
    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9b8d82]">{label}</dt>
    <dd className="mt-1 truncate text-[13px] font-semibold text-[#3d332d]">{value || "-"}</dd>
  </div>
);

export default function MorePage({ onLogout, storeName, brand, country, currency }: Props) {
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const { startCurrentTour, startWorkflowTour } = useGuidedTour();

  return (
    <div className="mx-auto max-w-[430px] space-y-7 pb-28 pt-3 lg:max-w-[680px] lg:pb-8">
      <section className="px-2">
        <h1 className="text-[28px] font-bold tracking-[-0.055em] text-[#1f1f1f]">More</h1>
        <div data-tour="more-store-info" className="mt-4 rounded-[20px] border border-[#e9e1da] bg-white p-4 shadow-[0_5px_16px_rgba(70,54,42,0.035)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ead6bd_0%,#9d7254_100%)] text-white"><i className="fa-solid fa-store text-base" /></span>
            <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b6f5b]">Store Owner</p><p className="mt-0.5 truncate text-[18px] font-semibold tracking-[-0.03em] text-[#27211e]">{storeName || "-"}</p></div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2"><StoreDetail label="브랜드" value={brand} /><StoreDetail label="국가" value={country} /><StoreDetail label="통화" value={currency} /></dl>
        </div>
      </section>

      <section>
        <div data-tour="more-onboarding" className="rounded-[18px] border border-[#e9e1da] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(70,54,42,0.035)]"><p className="text-[14px] font-semibold text-[#3d3028]">Sales Coach AI 둘러보기</p><p className="mt-1 text-[11px] leading-4 text-[#786e67]">처음 사용한다면 주요 화면과 업무 흐름을 따라가며 확인해 보세요.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={startCurrentTour} className="h-8 rounded-lg border border-[#d9c6b8] bg-[#fffdfb] px-3 text-[10px] font-semibold text-[#76503c]">현재 화면 가이드</button><button type="button" onClick={startWorkflowTour} className="h-8 rounded-lg bg-[#8b5e3c] px-3 text-[10px] font-semibold text-white">처음부터 둘러보기</button></div></div>
        <h2 className="mt-7 px-2 text-[16px] font-semibold tracking-[-0.03em] text-[#654633]">빠른 도움말</h2>
        <div data-tour="more-quick-help" className="mt-3 divide-y divide-[#f0ebe6] overflow-hidden rounded-[18px] border border-[#ece7e1] bg-white shadow-[0_5px_16px_rgba(70,54,42,0.035)]">
          {guideItems.map((item) => {
            const isOpen = openGuide === item.title;
            return <div key={item.title}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpenGuide((current) => current === item.title ? null : item.title)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#fffaf7]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6eee8] text-[#765039]"><i className={`fa-solid ${item.icon} text-sm`} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-[#28221e]">{item.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-[#857970]">{item.description}</span></span>
                <i className={`fa-solid fa-chevron-down shrink-0 text-[11px] text-[#9a8b81] transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {isOpen ? <div className="border-t border-[#f4efeb] bg-[#fdfaf8] px-4 py-3.5 pl-16"><ul className="space-y-1.5 text-[12px] leading-5 text-[#665c55]">{item.details.map((detail) => <li key={detail} className="relative pl-3 before:absolute before:left-0 before:top-[0.5rem] before:h-1 before:w-1 before:rounded-full before:bg-[#a8795c]">{detail}</li>)}</ul></div> : null}
            </div>;
          })}
        </div>
      </section>

      <button type="button" data-tour="more-logout" onClick={onLogout} className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border border-[#f1d8d3] bg-white text-[15px] font-semibold text-[#d83a32] transition hover:bg-[#fff7f5]"><i className="fa-solid fa-right-from-bracket" /> 로그아웃</button>
    </div>
  );
}
