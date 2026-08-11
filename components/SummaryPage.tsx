import React, { useEffect, useState } from "react";
import { formatCurrencyValue } from "../utils2/currency";

type CompareStats = {
  selectedSales: number;
  prevSales: number;
  selectedOrders: number;
  prevOrders: number;
  selectedAov: number;
  prevAov: number;
  avg7Sales: number;
  hasPrevData: boolean;
  avg7Count: number;
};

type InputStatus = { posSales: number; deliverySales: number; orders: number };
type ChecklistKey = "sales" | "receipt" | "insight" | "report";

type Props = {
  date: string;
  storeName: string;
  monthlyStats: { total: number; avg: number };
  monthlyRate: number;
  monthlyTarget: number;
  compareStats: CompareStats;
  inputStatus: InputStatus;
  hasSavedSalesData: boolean;
  onChangeTarget: (value: number) => void;
  onSaveTarget: () => void;
  onGoToSales: (target: "sales:manual" | "sales:ocr") => void;
  onViewCoach: (target: "coach:insight" | "coach:report") => void;
  country?: string;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요,";
  if (hour < 18) return "좋은 오후예요,";
  return "좋은 저녁이에요,";
};

const getComparison = (current: number, previous: number, unit = "") => {
  if (previous <= 0) return { primary: "비교 데이터 없음", secondary: "", tone: "text-[#8e8580]" };
  const rate = ((current - previous) / previous) * 100;
  return {
    primary: `${rate >= 0 ? "▲" : "▼"} ${Math.abs(rate).toFixed(0)}%`,
    secondary: `(${previous.toLocaleString()}${unit})`,
    tone: rate >= 0 ? "text-[#22a55b]" : "text-[#ef4444]",
  };
};

const SummaryPage: React.FC<Props> = ({
  date,
  storeName,
  monthlyStats,
  monthlyRate,
  monthlyTarget,
  compareStats,
  inputStatus,
  hasSavedSalesData,
  onChangeTarget,
  onSaveTarget,
  onGoToSales,
  onViewCoach,
  country,
}) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<ChecklistKey, boolean>>({
    sales: hasSavedSalesData,
    receipt: false,
    insight: false,
    report: false,
  });
  const hasInput = inputStatus.posSales > 0 || inputStatus.deliverySales > 0 || inputStatus.orders > 0;
  const isComplete = inputStatus.posSales > 0 && inputStatus.deliverySales > 0 && inputStatus.orders > 0;
  const goalProgress = monthlyTarget > 0 ? Math.min(Math.max(monthlyRate, 0), 100) : 0;
  const salesComparison = getComparison(compareStats.selectedSales, compareStats.prevSales);
  const orderComparison = getComparison(compareStats.selectedOrders, compareStats.prevOrders, "건");
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).format(new Date(`${date}T00:00:00`));

  useEffect(() => {
    setCompletedTasks({ sales: hasSavedSalesData, receipt: false, insight: false, report: false });
  }, [date, hasSavedSalesData]);

  const insightTitle = !hasInput
    ? "오늘 매출을 입력하면 매장에 맞는 다음 행동을 바로 제안해드려요."
    : compareStats.hasPrevData && compareStats.selectedSales < compareStats.prevSales
      ? "어제보다 매출이 감소했어요. 점심시간 메뉴와 주문 흐름을 먼저 확인해보세요."
      : "오늘의 데이터를 바탕으로 다음 매출 행동을 제안해드려요.";

  const actions: Array<{ key: ChecklistKey; title: string; subtitle: string; onNavigate: () => void }> = [
    { key: "sales", title: isComplete ? "매출 입력 확인하기" : "매출 입력하기", subtitle: "POS, 배달, 주문 정보를 입력하세요", onNavigate: () => onGoToSales("sales:manual") },
    { key: "receipt", title: "영수증 스캔하기", subtitle: "AI가 영수증을 자동으로 인식합니다", onNavigate: () => onGoToSales("sales:ocr") },
    { key: "insight", title: "AI 코치 자세히 보기", subtitle: "상세 분석과 맞춤 제안을 확인하세요", onNavigate: () => onViewCoach("coach:insight") },
    { key: "report", title: "전체 코치 리포트 보기", subtitle: "오늘의 전체 분석 리포트를 확인하세요", onNavigate: () => onViewCoach("coach:report") },
  ];

  return (
    <div className="mx-auto w-full max-w-[390px] pb-[108px] pt-[3px] text-[#1f1f1f]">
      <header className="px-[3px] pt-[5px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-medium leading-5 tracking-[-0.035em] text-[#38312d]">{getGreeting()}</p>
            <h1 className="mt-0.5 text-[24px] font-bold leading-[1.18] tracking-[-0.065em]">{storeName || "내 매장"}</h1>
          </div>
          <div className="flex items-center gap-3 pt-2 text-[#1f1f1f]"><i className="fa-regular fa-bell text-[17px]" /><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0ebe6] text-[#8b6f5b]"><i className="fa-regular fa-user text-[15px]" /></span></div>
        </div>
        <p className="mt-1.5 text-[12px] font-medium tracking-[-0.03em] text-[#4d4540]">{dateLabel}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium tracking-[-0.025em] text-[#5d554f]"><i className="fa-solid fa-store text-[10px]" /><span>{storeName || "Sales Coach AI"}</span></div>
      </header>

      <section className="mt-[14px] rounded-[20px] border border-[#e5ded9] bg-white px-[18px] py-[16px] shadow-[0_3px_12px_rgba(63,42,30,0.045)]">
        <div className="flex items-center justify-between"><h2 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.045em] text-[#24201e]">오늘 한눈에 보기 <i className="fa-regular fa-circle-question text-[12px] text-[#605850]" /></h2><button type="button" onClick={() => setEditingGoal((value) => !value)} className="h-7 rounded-[7px] border border-[#d9c9bb] bg-[#fffdfb] px-2.5 text-[10px] font-semibold text-[#8b5e3c]">목표 수정</button></div>
        <div className="mt-[15px] grid grid-cols-2 divide-x divide-[#e7e0db]">
          <div className="pr-4"><p className="text-[11px] font-medium text-[#5d554f]">오늘 매출</p><p className="mt-1 text-[20px] font-bold leading-none tracking-[-0.055em] text-[#141210]">{formatCurrencyValue(compareStats.selectedSales, country)}</p><p className={`mt-2 text-[10px] font-semibold ${salesComparison.tone}`}>{salesComparison.primary} <span className="font-medium text-[#6e655f]">{salesComparison.secondary}</span></p></div>
          <div className="pl-4"><p className="text-[11px] font-medium text-[#5d554f]">주문 수</p><p className="mt-1 text-[20px] font-bold leading-none tracking-[-0.055em] text-[#141210]">{compareStats.selectedOrders.toLocaleString()}건</p><p className={`mt-2 text-[10px] font-semibold ${orderComparison.tone}`}>{orderComparison.primary} <span className="font-medium text-[#6e655f]">{orderComparison.secondary}</span></p></div>
        </div>
        <div className="mt-[14px] border-t border-[#ddd5cf] pt-[14px]"><div className="grid grid-cols-2 divide-x divide-[#e7e0db]"><div className="pr-4"><p className="text-[11px] font-medium text-[#5d554f]">이번 달 누적 매출</p><p className="mt-1 text-[17px] font-bold leading-none tracking-[-0.045em] text-[#141210]">{formatCurrencyValue(monthlyStats.total, country)}</p><p className="mt-2 text-[10px] font-semibold text-[#735bf3]">목표 대비 {monthlyTarget > 0 ? `${monthlyRate.toFixed(0)}%` : "—"}</p></div><div className="pl-4"><p className="text-[11px] font-medium text-[#5d554f]">목표 달성률</p><p className="mt-1 text-[20px] font-bold leading-none tracking-[-0.05em] text-[#141210]">{monthlyTarget > 0 ? `${monthlyRate.toFixed(0)}%` : "—"}</p><div className="mt-[11px] h-[6px] overflow-hidden rounded-full bg-[#ece9e7]"><div className="h-full rounded-full bg-[#7654ee] transition-[width] duration-200" style={{ width: `${goalProgress}%` }} /></div><p className="mt-1.5 text-right text-[9px] font-medium text-[#6e655f]">목표 {monthlyTarget > 0 ? formatCurrencyValue(monthlyTarget, country) : "미설정"}</p></div></div></div>
        {editingGoal && <div className="mt-4 flex items-center gap-2 border-t border-[#eee8e3] pt-3"><label htmlFor="monthly-target" className="shrink-0 text-[11px] font-medium text-[#5d554f]">월 목표</label><input id="monthly-target" type="number" value={monthlyTarget || ""} onChange={(event) => onChangeTarget(Number(event.target.value))} className="h-9 min-w-0 flex-1 rounded-[8px] border border-[#ddd5cf] px-2.5 text-right text-[12px] font-semibold outline-none focus:border-[#8b5e3c]" /><button type="button" onClick={() => { onSaveTarget(); setEditingGoal(false); }} className="h-9 rounded-[8px] bg-[#8b5e3c] px-3 text-[11px] font-semibold text-white">저장</button></div>}
      </section>

      <section className="relative mt-[15px] min-h-[157px] overflow-hidden rounded-[17px] border border-[#e5ded9] bg-white px-[18px] py-[16px] shadow-[0_3px_12px_rgba(63,42,30,0.045)]"><i className="fa-solid fa-sparkles absolute right-[19px] top-[18px] text-[22px] text-[#7654ee]" /><p className="text-[12px] font-semibold tracking-[-0.035em] text-[#8b5e3c]">AI Coach Insight <i className="fa-regular fa-circle-question ml-0.5 text-[11px]" /></p><p className="mt-[9px] max-w-[265px] text-[16px] font-semibold leading-[1.43] tracking-[-0.055em] text-[#211c19]">{insightTitle}</p><button type="button" onClick={() => onViewCoach("coach:insight")} className="mt-[11px] h-[29px] rounded-[5px] bg-[#8b5e3c] px-3 text-[10px] font-semibold text-white shadow-[0_2px_5px_rgba(76,44,25,0.16)]">자세히 보기</button><span className="absolute bottom-[16px] right-[18px] text-[9px] font-medium text-[#8d847e]">어제 대비 분석 기반</span></section>

      <section className="mt-[15px] rounded-[17px] border border-[#e5ded9] bg-white px-[18px] py-[14px] shadow-[0_3px_12px_rgba(63,42,30,0.045)]">
        <h2 className="text-[15px] font-semibold tracking-[-0.045em] text-[#24201e]">오늘 해야 할 일</h2>
        <div className="mt-[7px] divide-y divide-[#eee8e3]">
          {actions.map((action) => {
            const checked = completedTasks[action.key];
            return <div key={action.key} className="flex items-center gap-3 py-[10px]"><button type="button" aria-label={`${action.title} 완료 상태 변경`} aria-pressed={checked} onClick={() => setCompletedTasks((current) => ({ ...current, [action.key]: !current[action.key] }))} className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${checked ? "border-[#8b5e3c] bg-[#8b5e3c] text-white" : "border-[#b5aaa2] bg-white text-transparent"}`}><i className="fa-solid fa-check text-[9px]" /></button><button type="button" onClick={action.onNavigate} className="flex min-w-0 flex-1 items-center text-left"><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold leading-4 tracking-[-0.04em] text-[#2a2522]">{action.title}</span><span className="mt-0.5 block truncate text-[10px] leading-4 tracking-[-0.03em] text-[#756c66]">{action.subtitle}</span></span><i className="fa-solid fa-chevron-right text-[12px] text-[#171412]" /></button></div>;
          })}
        </div>
      </section>
    </div>
  );
};

export default SummaryPage;
