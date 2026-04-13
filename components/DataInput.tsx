<div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
  <div className="text-[11px] font-black text-slate-500">
    기본 정보
  </div>

  <div className="mt-2 grid grid-cols-2 gap-2">
    <div>
      <div className="text-[10px] font-black text-slate-400">POS</div>
      <input
        type="number"
        value={posSales}
        onChange={(e) => setPosSales(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12px] font-black text-slate-900"
      />
    </div>

    <div>
      <div className="text-[10px] font-black text-slate-400">배달</div>
      <input
        type="number"
        value={deliverySales}
        onChange={(e) => setDeliverySales(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12px] font-black text-slate-900"
      />
    </div>

    <div>
      <div className="text-[10px] font-black text-slate-400">방문객</div>
      <input
        type="number"
        value={visitCount}
        onChange={(e) => setVisitCount(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12px] font-black text-slate-900"
      />
    </div>

    <div>
      <div className="text-[10px] font-black text-slate-400">주문</div>
      <input
        type="number"
        value={orders}
        onChange={(e) => setOrders(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12px] font-black text-slate-900"
      />
    </div>
  </div>

  <div className="mt-2">
    <div className="text-[10px] font-black text-slate-400">특이사항</div>
    <input
      type="text"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]"
    />
  </div>
</div>
