import React from 'react';

type KPI = {
  label: string;
  value: string;
  sub?: string;
};

type SummaryPageV2Props = {
  totalSales?: number;
  posSales?: number;
  deliverySales?: number;
  orders?: number;
  aov?: number;
  target?: number;
};

function formatCurrency(num?: number) {
  if (!num) return '0';
  return num.toLocaleString();
}

export default function SummaryPageV2({
  totalSales = 0,
  posSales = 0,
  deliverySales = 0,
  orders = 0,
  aov = 0,
  target = 0,
}: SummaryPageV2Props) {
  const achievement = target > 0 ? (totalSales / target) * 100 : 0;

  const kpis: KPI[] = [
    {
      label: '총 매출',
      value: `₩ ${formatCurrency(totalSales)}`,
      sub: `목표 ${achievement.toFixed(1)}%`,
    },
    {
      label: 'POS 매출',
      value: `₩ ${formatCurrency(posSales)}`,
    },
    {
      label: '배달 매출',
      value: `₩ ${formatCurrency(deliverySales)}`,
    },
    {
      label: '주문 수',
      value: `${formatCurrency(orders)} 건`,
    },
    {
      label: '객단가',
      value: `₩ ${formatCurrency(aov)}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 핵심 KPI */}
      <section className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="text-xs text-slate-500">{kpi.label}</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {kpi.value}
            </div>
            {kpi.sub && (
              <div className="mt-1 text-xs text-blue-500">{kpi.sub}</div>
            )}
          </div>
        ))}
      </section>

      {/* 상태 메시지 */}
      <section className="rounded-3xl bg-slate-900 p-4 text-white">
        <div className="text-sm font-semibold">오늘 상태</div>
        <div className="mt-2 text-xs text-slate-300">
          {totalSales === 0
            ? '아직 데이터가 없습니다'
            : achievement >= 100
            ? '목표 달성 👍'
            : '목표까지 조금 더 필요합니다'}
        </div>
      </section>

      {/* 빠른 인사이트 */}
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="text-sm font-semibold text-slate-900">
          빠른 인사이트
        </div>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          <li>• 배달 vs 홀 비중 확인</li>
          <li>• 객단가 추이 체크</li>
          <li>• 주문 수 변동 체크</li>
        </ul>
      </section>
    </div>
  );
}
