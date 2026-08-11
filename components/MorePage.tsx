import React from "react";

type Props = {
  onLogout: () => void;
};

const supportItems = [
  { title: "시작하기", description: "Sales Coach AI 사용 흐름을 확인하세요.", icon: "fa-book-open" },
  { title: "매출 입력 방법", description: "일일 매출과 메뉴 판매량 입력 안내", icon: "fa-pen-to-square" },
  { title: "영수증 스캔 방법", description: "OCR 결과를 검토하고 적용하는 방법", icon: "fa-camera" },
  { title: "AI Coach 사용 방법", description: "분석 결과와 추천을 읽는 방법", icon: "fa-sparkles" },
  { title: "메뉴 관리 방법", description: "가격과 원가를 최신 상태로 유지하세요.", icon: "fa-utensils" },
  { title: "FAQ", description: "자주 묻는 질문", icon: "fa-circle-question" },
];

const StaticRow = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6eee8] text-[#765039]">
      <i className={`fa-solid ${icon} text-sm`} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[14px] font-semibold text-[#28221e]">{title}</span>
      <span className="mt-0.5 block text-[11px] leading-4 text-[#857970]">{description}</span>
    </span>
  </div>
);

export default function MorePage({ onLogout }: Props) {
  return (
    <div className="mx-auto max-w-[430px] space-y-7 pb-28 pt-3">
      <section className="px-2">
        <h1 className="text-[28px] font-bold tracking-[-0.055em] text-[#1f1f1f]">More</h1>
        <div className="mt-6 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ead6bd_0%,#9d7254_100%)] text-white shadow-[0_5px_13px_rgba(119,75,47,0.16)]">
            <i className="fa-solid fa-user text-2xl" />
          </span>
          <div>
            <p className="text-[18px] font-semibold tracking-[-0.03em] text-[#27211e]">Sales Coach AI</p>
            <p className="mt-1 text-[13px] text-[#746b64]">Sales Coach AI</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="px-2 text-[16px] font-semibold tracking-[-0.03em] text-[#654633]">환경 설정</h2>
        <div className="mt-3 overflow-hidden rounded-[18px] border border-[#ece7e1] bg-white shadow-[0_5px_16px_rgba(70,54,42,0.035)]">
          <StaticRow title="언어" description="현재 설정 기능은 준비 중입니다." icon="fa-globe" />
          <div className="mx-4 border-t border-[#f0ebe6]" />
          <StaticRow title="화면 표시" description="현재 설정 기능은 준비 중입니다." icon="fa-display" />
        </div>
      </section>

      <section>
        <h2 className="px-2 text-[16px] font-semibold tracking-[-0.03em] text-[#654633]">도움말</h2>
        <div className="mt-3 divide-y divide-[#f0ebe6] overflow-hidden rounded-[18px] border border-[#ece7e1] bg-white shadow-[0_5px_16px_rgba(70,54,42,0.035)]">
          {supportItems.map((item) => (
            <div key={item.title}>
              <StaticRow {...item} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="px-2 text-[16px] font-semibold tracking-[-0.03em] text-[#654633]">앱 정보</h2>
        <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-[#ece7e1] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(70,54,42,0.035)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#a8866b_0%,#6f4027_100%)] text-white"><i className="fa-solid fa-chart-simple" /></span>
          <span><span className="block text-[14px] font-semibold text-[#28221e]">Sales Coach AI</span><span className="mt-0.5 block text-[11px] text-[#857970]">앱 정보는 업데이트 예정입니다.</span></span>
        </div>
      </section>

      <button type="button" onClick={onLogout} className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border border-[#f1d8d3] bg-white text-[15px] font-semibold text-[#d83a32] transition hover:bg-[#fff7f5]">
        <i className="fa-solid fa-right-from-bracket" /> 로그아웃
      </button>
    </div>
  );
}
