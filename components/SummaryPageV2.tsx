import React from "react";

type Props = {
  totalSales: number;
  posSales: number;
  deliverySales: number;
  orders: number;
  aov: number;
};

export default function SummaryPageV2({
  totalSales,
  posSales,
  deliverySales,
  orders,
  aov,
}: Props) {
  return (
    <div className="space-y-4">

      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="text-xs text-slate-400">총 매출</div>
          <div className="text-xl font-bold mt-1">₩ {totalSales}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="text-xs text-slate-400">POS 매출</div>
          <div className="text-xl font-bold mt-1">₩ {posSales}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="text-xs text-slate-400">배달 매출</div>
          <div className="text-xl font-bold mt-1">₩ {deliverySales}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="text-xs text-slate-400">주문 수</div>
          <div className="text-xl font-bold mt-1">{orders} 건</div>
        </div>
      </div>

      {/* AOV */}
      <div className="bg-white rounded-2xl p-4 shadow">
        <div className="text-xs text-slate-400">객단가</div>
        <div className="text-xl font-bold mt-1">₩ {aov}</div>
      </div>

      {/* STATUS */}
      <div className="bg-slate-900 text-white rounded-2xl p-4">
        <div className="text-sm font-semibold">오늘 상태</div>
        <div className="text-xs mt-1 opacity-70">
          아직 데이터가 없습니다
        </div>
      </div>

      {/* INSIGHT */}
      <div className="bg-white rounded-2xl p-4 shadow">
        <div className="text-sm font-semibold mb-2">빠른 인사이트</div>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• 배달 vs 홀 비중 확인</li>
          <li>• 객단가 추이 체크</li>
          <li>• 주문 수 변동 체크</li>
        </ul>
      </div>

    </div>
  );
}
