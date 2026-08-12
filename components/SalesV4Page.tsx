import React, { useEffect, useState } from "react";
import type { CorrectedItem } from "../types";
import type { ReceiptCurrencyValidation, ReceiptDateValidation, ReceiptStoreValidation, SalesV4InputModel } from "./DataInput";
import { formatCurrencyValue } from "../utils2/currency";

type Props = { model: SalesV4InputModel; onReset: () => void; onSave: () => Promise<boolean> };
type Validation = ReceiptDateValidation | ReceiptStoreValidation | ReceiptCurrencyValidation;

const fileKey = (file: File) => `${file.name}__${file.size}__${file.lastModified}`;
const statusLabel: Record<string, string> = { pending: "대기", processing: "처리 중", retrying: "재시도 중", success: "완료", failed: "실패" };
const statusColor: Record<string, string> = { pending: "bg-slate-100 text-slate-600", processing: "bg-violet-50 text-violet-700", retrying: "bg-amber-50 text-amber-700", success: "bg-emerald-50 text-emerald-700", failed: "bg-rose-50 text-rose-700" };

const SalesV4Page: React.FC<Props> = ({ model, onReset, onSave }) => {
  const [openCategories, setOpenCategories] = useState<string[]>(() => model.data.categories.slice(0, 1).map((category) => category.name));
  const [saveFeedback, setSaveFeedback] = useState("");
  const country = (model.data as { country?: string }).country;
  const filled = [model.data.posSales, (model.data as { deliverySales?: number }).deliverySales, model.data.orders, model.data.visitCount].filter((value) => Number(value || 0) > 0).length;
  const progress = Math.round((filled / 4) * 100);
  const fields: Array<{ label: string; field: keyof typeof model.data; unit: string }> = [
    { label: "POS 매출", field: "posSales", unit: model.currency },
    { label: "배달 매출", field: "deliverySales" as keyof typeof model.data, unit: model.currency },
    { label: "주문수", field: "orders", unit: "건" },
    { label: "방문객", field: "visitCount", unit: "명" },
  ];
  const failedFileCount = model.ocrFiles.filter((file) => model.ocrFileStatuses[file.name]?.status === "failed").length;
  const validationStatus = model.salesGap === 0 ? "PASS" : "WARNING";

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = window.setTimeout(() => setSaveFeedback(""), 2600);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  const handleSaveClick = async () => {
    const saved = await onSave();
    if (saved) setSaveFeedback(`${model.selectedDate} 매출 데이터가 저장되었습니다.`);
  };

  return (
    <main className="mx-auto w-full max-w-[430px] space-y-3 pb-36 text-[#1f1f1f]">
      {saveFeedback && <div role="status" className="fixed left-1/2 top-[76px] z-[10020] w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-[10px] border border-[#cfe7d5] bg-[#f2fbf4] px-3 py-2 text-center text-[11px] font-semibold text-[#278a4d] shadow-[0_5px_16px_rgba(39,138,77,0.10)]"><i className="fa-solid fa-circle-check mr-1.5" />{saveFeedback}</div>}
      <section className="rounded-[14px] border border-[#e7dfd9] bg-white px-3.5 py-3 shadow-[0_2px_8px_rgba(70,54,42,0.025)]">
        <h2 className="text-[14px] font-bold tracking-[-0.035em]">오늘 요약</h2>
        <div className="mt-3 grid divide-x divide-[#e7e1dd]" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <SummaryCell label="오늘 매출" value={formatCurrencyValue(model.enteredSalesTotal, country)} />
          <SummaryCell label="주문 수" value={`${model.data.orders || 0}건`} />
          <SummaryCell label="방문객" value={`${model.data.visitCount || 0}명`} />
          <div className="min-w-0 px-2 last:pr-0"><p className="whitespace-nowrap text-[9px] text-[#766c66]">입력 진행률</p><b className="mt-1.5 block text-[14px] leading-none">{progress}%</b><div className="mt-2.5 h-1.5 w-full rounded-full bg-[#e9e4e0]"><div className="h-full rounded-full bg-[#8b5e3c]" style={{ width: `${progress}%` }} /></div></div>
        </div>
      </section>

      <div ref={model.manualSalesRef}>
        <section className="overflow-hidden rounded-[14px] border border-[#e7dfd9] bg-white shadow-[0_2px_8px_rgba(70,54,42,0.02)]">
        <SectionTitle icon="fa-calendar-day" title="기본 매출 정보" />
        <div className="space-y-2.5 p-3.5">
          {fields.map(({ label, field, unit }) => <label key={String(field)} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2.5 text-[11px] font-medium text-[#3a332e]"><span>{label}</span><span className="relative block"><input type="number" inputMode="decimal" value={Number(model.data[field]) || ""} onChange={(event) => model.updateBaseField(field, Number(event.target.value))} className="h-9 w-full rounded-[8px] border border-[#dcd7d3] bg-white px-3 pr-12 text-right text-[12px] outline-none focus:border-[#8b5e3c]" placeholder="0" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#6f6258]">{unit}</span></span></label>)}
          <label className="grid grid-cols-[84px_minmax(0,1fr)] items-start gap-2.5 text-[11px] font-medium text-[#3a332e]"><span className="pt-2.5">특이사항 (선택)</span><span><textarea value={model.data.note} maxLength={100} onChange={(event) => model.updateBaseField("note", event.target.value)} className="h-[74px] w-full resize-none rounded-[8px] border border-[#dcd7d3] p-2.5 text-[11px] leading-4 outline-none focus:border-[#8b5e3c]" placeholder="오늘 매장 특이사항을 입력하세요." /><span className="mt-0.5 block text-right text-[9px] text-[#8a8079]">{model.data.note.length} / 100</span></span></label>
        </div>
        </section>
      </div>

      <div ref={model.ocrUploadRef}>
        <section className="overflow-hidden rounded-[14px] border border-[#e7dfd9] bg-white p-3 shadow-[0_2px_8px_rgba(70,54,42,0.025)]">
        <div className="flex items-start gap-3"><span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#eee6e0] bg-[#faf7f4] text-[19px] text-[#6f4b36]"><i className="fa-regular fa-receipt" /><i className="fa-solid fa-camera absolute -bottom-1 -right-1 rounded-md bg-[#6f4b36] p-1 text-[8px] text-white" /></span><div className="min-w-0 flex-1"><h2 className="text-[13px] font-bold tracking-[-0.03em]">영수증 자동입력 (OCR)</h2><p className="mt-1 text-[10px] leading-4 text-[#665d57]">영수증을 스캔하거나 업로드하면 AI가 자동으로 인식하여 입력을 도와드립니다.</p><input ref={model.addInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { model.appendFiles(Array.from(event.currentTarget.files || [])); model.setShowOcr(true); event.currentTarget.value = ""; }} /><input ref={model.replaceInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { model.replaceAllFiles(Array.from(event.currentTarget.files || [])); model.setShowOcr(true); event.currentTarget.value = ""; }} /><button type="button" onClick={() => model.addInputRef.current?.click()} className="mt-2 h-8 rounded-[7px] bg-[#8b5e3c] px-3.5 text-[10px] font-semibold text-white shadow-[0_3px_7px_rgba(108,70,44,0.12)]"><i className="fa-solid fa-camera mr-1.5" />영수증 스캔 / 업로드</button></div></div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eee8e3] pt-2 text-[10px] text-[#625a55] sm:mt-4 sm:pt-3"><span>{model.ocrRawText ? "최근 OCR 결과를 확인할 수 있습니다." : "최근 OCR 결과가 없습니다."}</span><button type="button" onClick={() => model.setShowOcr(true)} className="h-7 shrink-0 rounded-[6px] border border-[#9a6749] px-2.5 text-[10px] font-semibold text-[#754c35]">결과 보기</button></div>
        {model.showOcr && <CompactOcrReview model={model} failedFileCount={failedFileCount} country={country} />}
        </section>
      </div>

      <section className={`rounded-[14px] border bg-white p-3.5 ${validationStatus === "PASS" ? "border-[#d6eadb]" : "border-[#eadfcf]"}`}><h2 className="mb-2.5 text-[13px] font-semibold">매출 맞춤 확인</h2><div className="grid grid-cols-3 divide-x divide-[#e5e0dc]"><ValidationCell label="입력 매출 합계" value={formatCurrencyValue(model.enteredSalesTotal, country)} /><ValidationCell label="메뉴 매출 합계" value={formatCurrencyValue(model.menuSalesTotal, country)} /><ValidationCell label="차이" value={formatCurrencyValue(model.salesGap, country)} green={validationStatus === "PASS"} /></div><p className={`mt-2.5 text-[10px] font-semibold ${validationStatus === "PASS" ? "text-[#22a55b]" : "text-[#a66a2c]"}`}><i className={`fa-solid ${validationStatus === "PASS" ? "fa-circle-check" : "fa-circle-exclamation"} mr-1`} />{validationStatus === "PASS" ? "정상 범위입니다." : "입력 매출과 메뉴 매출의 차이를 확인해 주세요."}</p></section>

      <section className="overflow-hidden rounded-[14px] border border-[#e8e1db] bg-white"><div className="flex justify-between border-b border-[#eee8e3] px-3.5 py-2.5"><h2 className="text-[13px] font-semibold">메뉴 판매량 입력</h2><span className="text-[9px] text-[#776b63]">{model.currency} 기준</span></div>{model.data.categories.map((category, categoryIndex) => { const isOpen = openCategories.includes(category.name); return <div key={category.name} className="border-b border-[#eee8e3] last:border-0"><button type="button" onClick={() => setOpenCategories((current) => isOpen ? current.filter((name) => name !== category.name) : [...current, category.name])} className="flex min-h-10 w-full items-center justify-between px-3.5 py-2 text-[12px] font-semibold"><span>{category.name} <small className="ml-1 font-normal text-[#9a9089]">{category.items.length}</small></span><i className={`fa-solid fa-chevron-${isOpen ? "up" : "down"} text-[9px] text-[#776b63]`} /></button>{isOpen && <div className="px-3.5 pb-1">{category.items.map((item, itemIndex) => <MenuQuantityRow key={item.id} item={item} categoryIndex={categoryIndex} itemIndex={itemIndex} model={model} country={country} />)}</div>}</div>; })}</section>

      <div className="fixed bottom-[76px] left-0 right-0 z-[9997] border-t border-[#eee8e3] bg-[#faf8f6]/95 p-2 backdrop-blur"><div className="mx-auto grid max-w-[430px] grid-cols-2 gap-2 rounded-[11px] border border-[#e8e1db] bg-white p-1.5 shadow-[0_3px_12px_rgba(70,54,42,0.05)]"><button type="button" onClick={onReset} className="h-9 rounded-[7px] border border-[#b99983] text-[11px] font-semibold text-[#754c35]">초기화</button><button type="button" onClick={() => void handleSaveClick()} className="h-9 rounded-[7px] bg-[#8b5e3c] text-[11px] font-semibold text-white">저장하기</button></div></div>
    </main>
  );
};

const CompactOcrReview: React.FC<{ model: SalesV4InputModel; failedFileCount: number; country?: string }> = ({ model, failedFileCount, country }) => {
  const currencyStatus = model.receiptCurrencyValidation.status;
  const canApply = !model.isOcrApplyBlocked;
  const currencySummary = currencyStatus === "PASS"
    ? `통화 일치 · ${model.currency}`
    : currencyStatus === "BLOCK"
      ? `통화 확인 필요 · ${model.currency}`
      : `통화 미확인 · ${model.currency}`;
  const totalSummary = model.receiptSubtotal === null
    ? "영수증 소계 미검출 · 메뉴 합계 기준 확인"
    : model.isTotalMatched
      ? "메뉴 합계와 영수증 소계 일치"
      : "메뉴 합계와 영수증 소계가 다릅니다 · 적용 전 확인해 주세요.";

  return <div className="mt-3 space-y-2.5 border-t border-[#eee8e3] pt-3">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[8px] bg-[#faf8f6] px-3 py-2 text-[10px] text-[#625a55]">
      <i className="fa-solid fa-location-dot text-[#8b5e3c]" />
      <span>적용 대상</span>
      <b className="font-semibold text-[#3d332d]">{model.storeName || "현재 매장"}</b>
      <span className="text-[#b1a7a0]">·</span>
      <b className="font-semibold text-[#3d332d]">{model.selectedDate}</b>
    </div>

    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => model.addInputRef.current?.click()} className="h-8 rounded-[7px] border border-[#cdbbaa] bg-white px-2.5 text-[10px] font-semibold text-[#754c35]">사진 추가</button>
      <button type="button" onClick={() => model.replaceInputRef.current?.click()} className="h-8 rounded-[7px] border border-[#cdbbaa] bg-white px-2.5 text-[10px] font-semibold text-[#754c35]">전체 교체</button>
      <button type="button" disabled={!model.ocrFiles.length || model.ocrLoading} onClick={() => void model.handleOcr()} className="h-8 rounded-[7px] bg-[#3d332d] px-3 text-[10px] font-semibold text-white disabled:opacity-40">{model.ocrLoading ? "인식 중..." : "OCR 분석하기"}</button>
      {failedFileCount > 0 && !model.ocrLoading && <button type="button" onClick={model.handleRetryFailed} className="h-8 rounded-[7px] bg-rose-600 px-2.5 text-[10px] font-semibold text-white">실패 파일 재시도</button>}
      <button type="button" onClick={model.resetOcr} className="h-8 rounded-[7px] px-1.5 text-[10px] font-medium text-rose-600">OCR 초기화</button>
    </div>

    {model.ocrFiles.length > 0 && <div className="space-y-1">{model.ocrFiles.map((file, index) => {
      const status = model.ocrFileStatuses[file.name];
      return <div key={fileKey(file)} className="flex min-h-8 items-center gap-2 rounded-[7px] border border-[#eee8e3] bg-[#fdfbf9] px-2 py-1.5">
        <span className="min-w-0 flex-1 truncate text-[10px]">{index + 1}. {file.name}</span>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${statusColor[status?.status || "pending"]}`}>{statusLabel[status?.status || "pending"]}</span>
        {status?.status === "failed" && status.error && <span className="max-w-[88px] truncate text-[9px] text-rose-600" title={status.error}>{status.error}</span>}
      </div>;
    })}</div>}

    {model.ocrLoading && <p className="rounded-[8px] bg-violet-50 px-3 py-2 text-[10px] font-medium text-violet-700">{model.ocrProgress ? `${model.ocrProgress.current}/${model.ocrProgress.total}개 영수증을 분석 중입니다.` : "OCR 분석을 준비하고 있습니다."}</p>}
    {model.ocrError && <div className="rounded-[8px] border border-rose-100 bg-rose-50 px-3 py-2 text-[10px] text-rose-700"><p>{model.ocrError}</p>{model.ocrErrorDetail && <details className="mt-1"><summary className="cursor-pointer font-semibold">오류 상세</summary><pre className="mt-1 whitespace-pre-wrap break-all text-[9px]">{model.ocrErrorDetail}</pre></details>}</div>}

    {model.ocrRawText && <>
      <div className="grid grid-cols-2 gap-1.5 rounded-[9px] border border-[#e7dfd9] bg-white p-2.5 text-[10px]">
        <ReviewMetric label="인식 메뉴" value={`${model.ocrItems.length}개`} />
        <ReviewMetric label="OCR 계산 합계" value={formatCurrencyValue(model.scanTotal, country)} />
        <ReviewMetric label="통화" value={currencySummary} />
        <ReviewMetric label="상태" value={canApply ? "적용 가능" : "확인 필요"} />
      </div>
      <p className={`rounded-[7px] px-2.5 py-1.5 text-[10px] ${model.receiptSubtotal === null ? "bg-slate-50 text-slate-600" : model.isTotalMatched ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{totalSummary}</p>
      {model.ocrPriceMismatches.length > 0 && <p className="rounded-[7px] bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-700">가격 확인 필요 {model.ocrPriceMismatches.length}건</p>}
      <ValidationCard title="통화 검증" value={model.receiptCurrencyValidation} details={model.receiptCurrencyFileValidations.map((item) => `${item.fileName}: ${item.receiptCurrency || "미인식"} · ${item.message}`)} />
      <details className="rounded-[8px] border border-[#eee8e3] bg-[#faf8f6] px-2.5 py-2">
        <summary className="cursor-pointer text-[10px] font-semibold text-[#4a413c]">OCR 결과 및 메뉴 매핑 상세 보기</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-[10px] font-semibold text-[#4a413c]">OCR 원문<textarea readOnly value={model.ocrRawText} className="mt-1 h-28 w-full resize-none rounded-[7px] border border-[#e5ddd7] bg-white p-2 font-mono text-[9px] font-normal text-[#5d544e]" /></label>
          <OcrItems model={model} />
        </div>
        {model.ocrPriceMismatches.length > 0 && <p className="mt-2 text-[10px] text-amber-700">가격 차이 메뉴: {model.ocrPriceMismatches.map((item) => item.name).join(", ")}</p>}
        <p className="mt-2 text-[10px] text-[#766c66]">영수증 소계: {model.receiptSubtotal === null ? "미검출" : formatCurrencyValue(model.receiptSubtotal, country)} · 서비스: {model.serviceCharge === null ? "-" : formatCurrencyValue(model.serviceCharge, country)} · 세금: {model.receiptTax === null ? "-" : formatCurrencyValue(model.receiptTax, country)} · 최종 결제: {model.receiptTotal === null ? "미검출" : formatCurrencyValue(model.receiptTotal, country)}</p>
      </details>
      <button type="button" disabled={model.isOcrApplyBlocked} onClick={model.applyOcr} className="h-9 w-full rounded-[8px] bg-[#8b5e3c] px-4 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#d8d1cb]">{model.isOcrApplyBlocked ? "메뉴 합계 또는 통화 확인 후 적용 가능" : "데이터 입력창에 적용하기"}</button>
    </>}
  </div>;
};

const OcrReview: React.FC<{ model: SalesV4InputModel; failedFileCount: number; country?: string }> = ({ model, failedFileCount, country }) => <div className="mt-4 space-y-3 border-t border-[#eee8e3] pt-4">
  <div className="flex flex-wrap gap-2"><button type="button" onClick={() => model.addInputRef.current?.click()} className="h-9 rounded-[7px] bg-[#8b5e3c] px-3 text-[11px] font-semibold text-white">사진 추가</button><button type="button" onClick={() => model.replaceInputRef.current?.click()} className="h-9 rounded-[7px] border border-[#cdbbaa] px-3 text-[11px] font-semibold text-[#754c35]">전체 교체</button><button type="button" disabled={!model.ocrFiles.length || model.ocrLoading} onClick={() => void model.handleOcr()} className="h-9 rounded-[7px] bg-[#3d332d] px-3 text-[11px] font-semibold text-white disabled:opacity-40">{model.ocrLoading ? "인식 중..." : "OCR 분석하기"}</button>{failedFileCount > 0 && !model.ocrLoading && <button type="button" onClick={model.handleRetryFailed} className="h-9 rounded-[7px] bg-rose-600 px-3 text-[11px] font-semibold text-white">실패 파일 재시도</button>}<button type="button" onClick={model.resetOcr} className="h-9 rounded-[7px] border border-rose-200 px-3 text-[11px] font-semibold text-rose-600">OCR 초기화</button></div>
  {model.ocrFiles.length > 0 && <div className="space-y-2">{model.ocrFiles.map((file, index) => { const status = model.ocrFileStatuses[file.name]; return <div key={fileKey(file)} className="flex items-center gap-3 rounded-[10px] border border-[#eee8e3] bg-[#fdfbf9] p-2"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-[7px] bg-[#f5eee8]">{model.ocrFilePreviewUrls[fileKey(file)] && <img src={model.ocrFilePreviewUrls[fileKey(file)]} alt="" className="h-full w-full object-cover" />}</div><span className="min-w-0 flex-1 truncate text-[11px]">{index + 1}. {file.name}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusColor[status?.status || "pending"]}`}>{statusLabel[status?.status || "pending"]}{status?.status === "retrying" && status.retryCount ? ` ${status.retryCount}/3` : ""}</span>{status?.status === "failed" && status.error && <span className="max-w-[105px] truncate text-[10px] text-rose-600" title={status.error}>{status.error}</span>}</div>; })}</div>}
  {model.ocrLoading && <p className="rounded-[9px] bg-violet-50 p-3 text-[11px] font-medium text-violet-700">{model.ocrProgress ? `${model.ocrProgress.current}/${model.ocrProgress.total}개 영수증을 분석 중입니다.` : "OCR 분석을 준비하고 있습니다."}</p>}
  {model.ocrError && <div className="rounded-[9px] border border-rose-100 bg-rose-50 p-3 text-[11px] text-rose-700"><p>{model.ocrError}</p>{model.ocrErrorDetail && <details className="mt-2"><summary className="cursor-pointer font-semibold">오류 상세</summary><pre className="mt-2 whitespace-pre-wrap break-all text-[9px]">{model.ocrErrorDetail}</pre></details>}</div>}
  {model.ocrRawText && <><div className="grid grid-cols-2 gap-2"><ReviewMetric label="OCR 계산 합계" value={formatCurrencyValue(model.scanTotal, country)} /><ReviewMetric label="영수증 소계" value={model.receiptSubtotal === null ? "미검출" : formatCurrencyValue(model.receiptSubtotal, country)} /><div className={`col-span-2 rounded-[8px] p-2 text-[11px] font-semibold ${model.isTotalMatched === true ? "bg-emerald-50 text-emerald-700" : model.isTotalMatched === false ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>소계 검증: {model.isTotalMatched === true ? "PASS — 메뉴 합계와 영수증 소계가 일치합니다." : model.isTotalMatched === false ? "WARNING — OCR 메뉴 합계와 영수증 소계가 다릅니다. 적용 전 메뉴를 검토하세요." : "WARNING — 영수증 소계를 찾지 못했습니다."}</div></div>{model.ocrPriceMismatches.length > 0 && <p className="text-[10px] text-amber-700">가격 차이 경고: {model.ocrPriceMismatches.map((item) => item.name).join(", ")}</p>}<ValidationCard title="영수증 날짜" value={model.receiptDateValidation} /><ValidationCard title="영수증 매장" value={model.receiptStoreValidation} details={model.receiptStoreFileValidations.map((item) => `${item.fileName}: ${item.receiptStoreName || "미인식"} · ${item.message}`)} /><ValidationCard title="영수증 통화" value={model.receiptCurrencyValidation} details={model.receiptCurrencyFileValidations.map((item) => `${item.fileName}: ${item.receiptCurrency || "미인식"} · ${item.message}`)} /><div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-[#4a413c]">OCR 원문<textarea readOnly value={model.ocrRawText} className="mt-1 h-40 w-full resize-none rounded-[9px] border border-[#e5ddd7] bg-[#faf8f6] p-3 font-mono text-[10px] font-normal text-[#5d544e]" /></label><OcrItems model={model} /></div><button type="button" disabled={model.isOcrApplyBlocked} onClick={model.applyOcr} className="h-10 w-full rounded-[8px] bg-[#8b5e3c] px-4 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#d8d1cb]">{model.isOcrApplyBlocked ? "검증 차단 또는 매핑 완료 후 적용 가능" : "데이터 입력창에 적용하기"}</button></>}
</div>;

const OcrItems: React.FC<{ model: SalesV4InputModel }> = ({ model }) => <div className="text-[11px] font-semibold text-[#4a413c]">인식 메뉴 ({model.ocrItems.length})<div className="mt-1 h-40 space-y-2 overflow-y-auto rounded-[9px] border border-[#e5ddd7] bg-[#faf8f6] p-3">{model.ocrItems.map((item, index) => <OcrItem key={`${item.item_original}-${index}`} item={item} index={index} model={model} />)}{model.ocrItems.length === 0 && <p className="pt-8 text-center font-normal text-[#766c66]">인식된 메뉴가 없습니다.</p>}</div></div>;

const OcrItem: React.FC<{ item: CorrectedItem; index: number; model: SalesV4InputModel }> = ({ item, index, model }) => <div className={`rounded-[7px] border p-2 ${item.needs_review ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-white"}`}><div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate">{item.item_original}</span><span className="shrink-0 text-[10px]">× {item.qty}</span></div>{item.needs_review ? <div className="mt-2 flex flex-wrap gap-1">{item.candidates?.map((candidate) => <button key={candidate.id} type="button" onClick={() => model.handleConfirmCorrection(index, candidate.id)} className="rounded border border-amber-200 bg-white px-1.5 py-1 text-[9px] text-[#754c35]">{candidate.name}</button>)}<select defaultValue="" onChange={(event) => event.target.value && model.handleConfirmCorrection(index, event.target.value)} className="h-6 rounded border border-amber-200 bg-white px-1 text-[9px]"><option value="" disabled>직접 선택</option>{model.availableMenus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}</select></div> : <p className="mt-1 text-[10px] font-normal text-emerald-700">매핑됨: {item.item_corrected}</p>}</div>;

const ValidationCard: React.FC<{ title: string; value: Validation; details?: string[] }> = ({ title, value, details }) => { const palette = value.status === "PASS" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : value.status === "BLOCK" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"; return <div className={`rounded-[8px] border p-2 text-[10px] ${palette}`}><b>{title}: {value.status}</b><span className="ml-2">{value.message}</span>{details?.map((detail) => <p key={detail} className="mt-1">{detail}</p>)}</div>; };

const MenuQuantityRow: React.FC<{ item: any; categoryIndex: number; itemIndex: number; model: SalesV4InputModel; country?: string }> = ({ item, categoryIndex, itemIndex, model, country }) => {
  const dineIn = model.getDineInQty(item);
  const takeout = model.getTakeoutQty(item);
  if (model.isJapanPilot) return <div className="border-t border-[#f3efec] py-1.5">
    <div className="flex min-w-0 items-center justify-between gap-2"><span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{item.name}</span><span className="shrink-0 text-[9px] text-[#8a8079]">{formatCurrencyValue(item.price, country)}</span></div>
    <div className="mt-1 grid grid-cols-[1fr_1fr_auto] items-end gap-1.5"><ChannelInput label="DINE-IN" value={dineIn} onChange={(value) => model.updateChannelQty(categoryIndex, itemIndex, "DINE_IN", value)} /><ChannelInput label="TAKEOUT" value={takeout} onChange={(value) => model.updateChannelQty(categoryIndex, itemIndex, "TAKEOUT", value)} /><span className="pb-1.5 text-[9px] font-semibold text-[#6f6258]">합계 {dineIn + takeout}</span></div>
  </div>;
  const quantity = Number(item.qty || 0);
  return <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-t border-[#f3efec] py-1.5"><span className="min-w-0 truncate text-[11px] font-semibold">{item.name}</span><span className="text-[9px] text-[#8a8079]">{formatCurrencyValue(item.price, country)}</span><div className="flex h-7 items-center overflow-hidden rounded-[6px] border border-[#dfd6d0]"><button type="button" onClick={() => model.updateQty(categoryIndex, itemIndex, Math.max(0, quantity - 1))} className="h-full w-7 text-[#8b5e3c]">−</button><span className="w-7 text-center text-[11px]">{quantity}</span><button type="button" onClick={() => model.updateQty(categoryIndex, itemIndex, quantity + 1)} className="h-full w-7 text-[#8b5e3c]">＋</button></div></div>;
};

const ChannelInput: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => <label className="grid grid-cols-[42px_1fr] items-center gap-1 text-[8px] font-semibold text-[#8a6b56]"><span>{label}</span><input type="number" inputMode="numeric" min="0" value={value || ""} onChange={(event) => onChange(Number(event.target.value))} className="h-7 min-w-0 rounded-[6px] border border-[#dfd6d0] text-center text-[11px] text-[#1f1f1f]" /></label>;

const ReviewMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-[8px] bg-[#faf8f6] p-2"><p className="text-[10px] text-[#766c66]">{label}</p><b className="mt-1 block text-[13px]">{value}</b></div>;
const SummaryCell: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="min-w-0 px-2 first:pl-0 last:pr-0"><p className="whitespace-nowrap text-[9px] text-[#766c66]">{label}</p><b className="mt-1.5 block truncate whitespace-nowrap text-[14px] leading-none tracking-[-0.05em]">{value}</b></div>;
const ValidationCell: React.FC<{ label: string; value: string; green?: boolean }> = ({ label, value, green }) => <div className="px-2 first:pl-0 last:pr-0"><p className="text-[10px] text-[#718178]">{label}</p><b className={`mt-1 block text-[13px] ${green ? "text-[#22a55b]" : ""}`}>{value}</b></div>;
const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => <h2 className="border-b border-[#eee8e3] bg-[#fdfaf8] px-3.5 py-2.5 text-[13px] font-semibold"><i className={`fa-solid ${icon} mr-2 text-[#8b5e3c]`} />{title}</h2>;

export default SalesV4Page;
