// 핵심만 보여주는 압축 버전 (모바일 최적화)

<div className="space-y-4">

  {/* KPI */}
  <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
    {summaryCards.map((card) => (
      <div
        key={card.label}
        className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="text-xs font-black text-slate-500">{card.label}</div>
          <div className={`text-[10px] px-2 py-1 rounded-full ${rateTone(card.rate)}`}>
            {card.rate >= 0 ? "+" : ""}
            {card.rate.toFixed(1)}%
          </div>
        </div>

        <div className="mt-2 text-xl font-black text-slate-900">
          {card.current}
        </div>

        <div className="mt-1 text-[11px] text-slate-400">
          {card.compare}
        </div>
      </div>
    ))}
  </section>

  {/* Boost Plan */}
  <section className="rounded-[22px] border border-slate-200 bg-white p-4">
    <div className="mb-3 flex justify-between items-center">
      <div className="text-xs font-black text-slate-400">Action</div>
      <div className="text-[10px] text-indigo-500 font-bold">
        {boostPlans.length}개
      </div>
    </div>

    <PeriodBoostPlan boostPlans={boostPlans} />
  </section>

  {/* Top 메뉴 */}
  <section className="rounded-[22px] border border-slate-200 bg-white p-4">
    <div className="mb-3 text-xs font-black text-slate-400">
      Top Menu
    </div>

    <PeriodTopMenuCompare
      currentMenus={currentPeriodMenus}
      comparisonMenus={comparisonPeriodMenus}
      minDays={1}
      currentDays={currentPeriodDays}
      comparisonDays={comparisonPeriodDays}
    />
  </section>

  {/* 메뉴 엔지니어링 */}
  <section className="rounded-[22px] border border-slate-200 bg-white p-4">
    <div className="mb-3 text-xs font-black text-slate-400">
      Menu Structure
    </div>

    <PeriodMenuEngineering sortedMenuEngineering={sortedMenuEngineering} />
  </section>

</div>
