<section className="rounded-[16px] border border-slate-200 bg-white px-3 py-3 shadow-sm md:rounded-[22px] md:px-4 md:py-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
        Period Analysis
      </div>
      <div className="mt-0.5 text-sm font-black text-slate-900">
        기간 분석
      </div>
    </div>
  </div>

  {/* 기간 선택 */}
  <div className="mt-2 flex flex-wrap gap-1.5">
    {[
      { key: "today", label: "Today" },
      { key: "thisWeek", label: "Week" },
      { key: "thisMonth", label: "Month" },
      { key: "last30Days", label: "30D" },
    ].map((item) => (
      <button
        key={item.key}
        type="button"
        onClick={() => setPreset(item.key as any)}
        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-all ${
          preset === item.key
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {item.label}
      </button>
    ))}

    <button
      type="button"
      onClick={() => setPreset("custom")}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${
        preset === "custom"
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      Custom
    </button>
  </div>

  {/* 날짜 범위 */}
  {preset === "custom" && (
    <div className="mt-2 flex gap-1.5">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]"
      />
    </div>
  )}

  {/* KPI 요약 */}
  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="text-[9px] font-black text-slate-400">매출</div>
      <div className="mt-1 text-[15px] font-black text-slate-900">
        ${Number(summary.totalSales || 0).toLocaleString()}
      </div>
    </div>

    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="text-[9px] font-black text-slate-400">주문</div>
      <div className="mt-1 text-[15px] font-black text-slate-900">
        {Number(summary.orders || 0).toLocaleString()}
      </div>
    </div>

    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="text-[9px] font-black text-slate-400">방문객</div>
      <div className="mt-1 text-[15px] font-black text-slate-900">
        {Number(summary.guests || 0).toLocaleString()}
      </div>
    </div>

    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="text-[9px] font-black text-slate-400">객단가</div>
      <div className="mt-1 text-[15px] font-black text-slate-900">
        ${Number(summary.aov || 0).toFixed(1)}
      </div>
    </div>
  </div>
</section>
