import React, { useMemo, useState, useEffect, useRef } from "react";
import { SalesReportData, CorrectedItem } from "../types";
import { DayPicker } from "react-day-picker";
import { callOcr, callOcrBatch } from "../services/ocrService";
import { formatLocalDate, parseLocalDate } from "../utils2/date";
import { getCurrencyByCountry, formatCurrencyValue } from "../utils2/currency";
import { supabase } from "../services/supabaseClient";

interface DataInputProps {
  data: SalesReportData;
  onChange: (newData: SalesReportData) => void;
  loading: boolean;
  datesWithData?: string[];
  onMonthChange?: (month: Date) => void;
  storeName?: string;
  homeLandingTarget?: "sales:manual" | "sales:ocr" | null;
  onHomeLandingHandled?: () => void;
  renderV4?: (model: SalesV4InputModel) => React.ReactNode;
}

export type SalesV4InputModel = {
  data: SalesReportData;
  currency: string;
  selectedDate: string;
  storeName: string;
  enteredSalesTotal: number;
  menuSalesTotal: number;
  salesGap: number;
  updateBaseField: (field: keyof SalesReportData, value: any) => void;
  updateQty: (categoryIndex: number, itemIndex: number, qty: number) => void;
  getDineInQty: (item: any) => number;
  getTakeoutQty: (item: any) => number;
  updateChannelQty: (categoryIndex: number, itemIndex: number, channel: "DINE_IN" | "TAKEOUT", value: number) => void;
  showOcr: boolean;
  setShowOcr: React.Dispatch<React.SetStateAction<boolean>>;
  manualSalesRef: React.RefObject<HTMLDivElement | null>;
  ocrUploadRef: React.RefObject<HTMLDivElement | null>;
  addInputRef: React.RefObject<HTMLInputElement | null>;
  replaceInputRef: React.RefObject<HTMLInputElement | null>;
  appendFiles: (files: File[]) => void;
  replaceAllFiles: (files: File[]) => void;
  handleOcr: () => Promise<void>;
  resetOcr: () => void;
  applyOcr: () => void;
  ocrFiles: File[];
  ocrFileStatuses: Record<string, FileStatus>;
  ocrFilePreviewUrls: Record<string, string>;
  ocrLoading: boolean;
  ocrProgress: { current: number; total: number } | null;
  ocrError: string;
  ocrErrorDetail: string;
  ocrRawText: string;
  ocrItems: CorrectedItem[];
  needsReviewItems: CorrectedItem[];
  confirmedItems: CorrectedItem[];
  handleRetryFailed: () => void;
  handleConfirmCorrection: (index: number, matchedId: string) => void;
  availableMenus: Array<{ id: string; name: string }>;
  receiptDateValidation: ReceiptDateValidation;
  receiptStoreValidation: ReceiptStoreValidation;
  receiptStoreFileValidations: ReceiptStoreFileValidation[];
  receiptCurrencyValidation: ReceiptCurrencyValidation;
  receiptCurrencyFileValidations: ReceiptCurrencyFileValidation[];
  ocrPriceMismatches: Array<{ name: string; ocrPrice: number; menuPrice: number }>;
  isOcrApplyBlocked: boolean;
  isJapanPilot: boolean;
  scanTotal: number;
  receiptSubtotal: number | null;
  serviceCharge: number | null;
  receiptTax: number | null;
  receiptTotal: number | null;
  isTotalMatched: boolean | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ReceiptDateValidation = {
  status: "PASS" | "WARNING" | "BLOCK";
  date: Date | null;
  message: string;
};

type ReceiptDateCandidate = {
  date: Date;
  position: number;
  hasReceiptDateLabel: boolean;
  isUnrelatedDate: boolean;
};

export type ReceiptStoreValidation = {
  status: "PASS" | "WARNING" | "BLOCK";
  message: string;
};

export type ReceiptStoreFileValidation = ReceiptStoreValidation & {
  fileKey: string;
  fileName: string;
  receiptStoreName: string | null;
};

export type ReceiptCurrencyValidation = {
  status: "PASS" | "WARNING" | "BLOCK";
  message: string;
};

export type ReceiptCurrencyFileValidation = ReceiptCurrencyValidation & {
  fileKey: string;
  fileName: string;
  receiptCurrency: string | null;
};

type OcrReceiptStore = {
  fileName: string;
  receiptStoreName: string | null;
  receiptCurrency: string | null;
};

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 0,
  jan: 0,
  februari: 1,
  feb: 1,
  maret: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mei: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  agustus: 7,
  agu: 7,
  ags: 7,
  aug: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  oct: 9,
  november: 10,
  nov: 10,
  desember: 11,
  des: 11,
  dec: 11,
};

function createReceiptDate(year: number, monthIndex: number, day: number): Date | null {
  const date = new Date(year, monthIndex, day);
  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day
    ? date
    : null;
}

function collectReceiptDateCandidates(rawText: string): ReceiptDateCandidate[] {
  const candidates: ReceiptDateCandidate[] = [];
  const receiptDateLabelPattern = /\b(date|tanggal|tgl|transaction\s+date|order\s+date)\b/i;
  const unrelatedDatePattern = /\b(expiry|expired|valid\s+thru|berlaku\s+sampai|promo|promotion|print\s+date|printed|reference\s+date)\b/i;

  const addCandidate = (date: Date | null, position: number) => {
    if (!date) return;

    const lineStart = rawText.lastIndexOf("\n", position) + 1;
    const lineEnd = rawText.indexOf("\n", position);
    const line = rawText.slice(lineStart, lineEnd === -1 ? rawText.length : lineEnd);

    candidates.push({
      date,
      position,
      hasReceiptDateLabel: receiptDateLabelPattern.test(line),
      isUnrelatedDate: unrelatedDatePattern.test(line),
    });
  };

  for (const match of rawText.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    addCandidate(
      createReceiptDate(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
      match.index
    );
  }

  for (const match of rawText.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g)) {
    const year = Number(match[3]);
    addCandidate(
      createReceiptDate(year < 100 ? 2000 + year : year, Number(match[2]) - 1, Number(match[1])),
      match.index
    );
  }

  const monthPattern = Object.keys(INDONESIAN_MONTHS).join("|");
  const namedMonthPattern = new RegExp(
    `\\b(\\d{1,2})\\s+(${monthPattern})\\.?\\s+(\\d{2,4})\\b`,
    "gi"
  );
  for (const match of rawText.matchAll(namedMonthPattern)) {
    const year = Number(match[3]);
    const monthIndex = INDONESIAN_MONTHS[match[2].toLowerCase()];
    addCandidate(
      monthIndex === undefined
        ? null
        : createReceiptDate(year < 100 ? 2000 + year : year, monthIndex, Number(match[1])),
      match.index
    );
  }

  return candidates;
}

function parseReceiptDate(rawText: string): Date | null {
  const usableCandidates = collectReceiptDateCandidates(rawText).filter(
    (candidate) => !candidate.isUnrelatedDate
  );

  const selectedCandidate = usableCandidates.sort((a, b) => {
    if (a.hasReceiptDateLabel !== b.hasReceiptDateLabel) {
      return a.hasReceiptDateLabel ? -1 : 1;
    }
    return a.position - b.position;
  })[0];

  return selectedCandidate?.date ?? null;
}

function validateReceiptDate(rawText: string): ReceiptDateValidation {
  const receiptDate = parseReceiptDate(rawText);
  if (!receiptDate) {
    return { status: "WARNING", date: null, message: "영수증 날짜를 확인할 수 없습니다." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (receiptDate > today) {
    return { status: "BLOCK", date: receiptDate, message: "영수증 날짜가 미래입니다. 날짜를 확인해 주세요." };
  }

  const ageInDays = Math.floor((today.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24));
  if (ageInDays > 90) {
    return { status: "WARNING", date: receiptDate, message: "영수증 날짜가 90일을 초과했습니다. 확인 후 적용해 주세요." };
  }

  return { status: "PASS", date: receiptDate, message: "영수증 날짜가 정상입니다." };
}

function formatReceiptDate(date: Date | null): string {
  if (!date) return "미검출";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeStoreName(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function getStoreNameTokens(value: string): string[] {
  return Array.from(
    new Set(value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1))
  );
}

function getLevenshteinDistance(first: string, second: string): number {
  const previousRow = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex++) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = firstIndex;

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex++) {
      const previousValue = previousRow[secondIndex];
      previousRow[secondIndex] = Math.min(
        previousRow[secondIndex] + 1,
        previousRow[secondIndex - 1] + 1,
        previousDiagonal + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1)
      );
      previousDiagonal = previousValue;
    }
  }

  return previousRow[second.length];
}

function isAbbreviationOf(shortToken: string, longToken: string): boolean {
  if (shortToken.length < 3 || shortToken.length >= longToken.length) return false;

  let shortIndex = 0;
  for (const character of longToken) {
    if (character === shortToken[shortIndex]) shortIndex++;
  }
  return shortIndex === shortToken.length;
}

function areStronglyEquivalentStoreTokens(first: string, second: string): boolean {
  return (
    getLevenshteinDistance(first, second) <= 1 ||
    isAbbreviationOf(first, second) ||
    isAbbreviationOf(second, first)
  );
}

function haveSameStoreTokens(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((token) => second.includes(token));
}

function isShorterStoreRepresentation(
  receiptStoreName: string,
  selectedStoreName: string
): boolean {
  const normalizedReceiptStoreName = normalizeStoreName(receiptStoreName);
  const normalizedSelectedStoreName = normalizeStoreName(selectedStoreName);
  if (
    normalizedReceiptStoreName.length >= normalizedSelectedStoreName.length ||
    !normalizedSelectedStoreName.startsWith(normalizedReceiptStoreName)
  ) {
    return false;
  }

  const receiptTokens = getStoreNameTokens(receiptStoreName);
  const selectedTokens = getStoreNameTokens(selectedStoreName);
  return (
    receiptTokens.length >= 2 &&
    receiptTokens.length < selectedTokens.length &&
    receiptTokens.every((token, index) => selectedTokens[index] === token)
  );
}

function hasStrongPartialStoreMatch(selectedTokens: string[], candidateTokens: string[]): boolean {
  const sharedTokens = selectedTokens.filter((token) => candidateTokens.includes(token));
  if (sharedTokens.length === 0) return false;

  const unmatchedSelectedTokens = selectedTokens.filter((token) => !candidateTokens.includes(token));
  const unmatchedCandidateTokens = candidateTokens.filter((token) => !selectedTokens.includes(token));

  if (unmatchedSelectedTokens.length === 0 && unmatchedCandidateTokens.length === 0) return true;
  if (unmatchedSelectedTokens.length === 0) return unmatchedCandidateTokens.length === 1;
  if (unmatchedCandidateTokens.length === 0) return unmatchedSelectedTokens.length === 1;

  return (
    unmatchedSelectedTokens.length === unmatchedCandidateTokens.length &&
    unmatchedSelectedTokens.every((selectedToken) =>
      unmatchedCandidateTokens.some((candidateToken) =>
        areStronglyEquivalentStoreTokens(selectedToken, candidateToken)
      )
    )
  );
}

function validateReceiptStore(
  receiptStoreName: string | null,
  selectedStoreName: string
): ReceiptStoreValidation {
  const normalizedSelectedStoreName = normalizeStoreName(selectedStoreName);
  if (!normalizedSelectedStoreName) {
    return { status: "WARNING", message: "현재 선택된 매장 정보를 확인할 수 없습니다." };
  }

  const normalizedReceiptStoreName = normalizeStoreName(receiptStoreName || "");
  if (!normalizedReceiptStoreName) {
    return { status: "WARNING", message: "OCR에서 영수증 매장명을 인식하지 못했습니다." };
  }

  if (normalizedReceiptStoreName === normalizedSelectedStoreName) {
    return { status: "PASS", message: "영수증 매장이 현재 선택된 매장과 일치합니다." };
  }

  if (isShorterStoreRepresentation(receiptStoreName || "", selectedStoreName)) {
    return { status: "PASS", message: "영수증 매장이 현재 선택된 매장의 축약 표기와 일치합니다." };
  }

  if (!/\p{L}/u.test(receiptStoreName || "")) {
    return { status: "WARNING", message: "영수증 매장명이 불확실합니다. 확인 후 적용해 주세요." };
  }

  const selectedTokens = getStoreNameTokens(selectedStoreName);
  const receiptTokens = getStoreNameTokens(receiptStoreName || "");
  if (haveSameStoreTokens(receiptTokens, selectedTokens)) {
    return { status: "PASS", message: "영수증 매장이 현재 선택된 매장과 일치합니다." };
  }

  if (hasStrongPartialStoreMatch(selectedTokens, receiptTokens)) {
    return { status: "WARNING", message: "영수증 매장명이 현재 선택된 매장과 유사합니다. 확인 후 적용해 주세요." };
  }

  return { status: "BLOCK", message: "영수증 매장이 현재 선택된 매장과 다릅니다." };
}

function validateReceiptCurrency(
  receiptCurrency: string | null,
  expectedCurrency: string
): ReceiptCurrencyValidation {
  if (!receiptCurrency) {
    return { status: "WARNING", message: "OCR에서 영수증 통화를 인식하지 못했습니다." };
  }

  if (receiptCurrency === expectedCurrency) {
    return { status: "PASS", message: "영수증 통화가 예상 통화와 일치합니다." };
  }

  return { status: "BLOCK", message: "영수증 통화가 예상 통화와 다릅니다." };
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const [meta, data] = result.split(",");
      const mimeMatch = meta.match(/data:(.*);base64/);
      resolve({
        base64: data,
        mimeType: mimeMatch?.[1] || file.type || "image/jpeg",
      });
    };
    reader.readAsDataURL(file);
  });
}

async function compressForOcr(file: File, maxW = 1024, quality = 0.6): Promise<File> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const scale = Math.min(1, maxW / w);
  const outW = Math.round(w * scale);
  const outH = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, outW, outH);
  URL.revokeObjectURL(url);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
  });

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

function extractMenuItemsFromRawText(rawText: string): { name: string; price: number; qty: number }[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.replace(/\t/g, " ").trim())
    .filter(Boolean);

  const items: { name: string; price: number; qty: number }[] = [];

  const skipKeywords = [
    "DATE",
    "ORDER",
    "TOTAL",
    "SUBTOTAL",
    "TAX",
    "SERVICE",
    "AMOUNT",
    "GRAND",
    "CASH",
    "CARD",
    "CHANGE",
    "TEL",
    "ADDRESS",
    "주문합계",
    "합계",
    "총액",
    "현금",
    "카드",
    "할인",
    "봉사료",
    "부가세",
    "테이블",
    "포장",
  ];

  const cleanMenuName = (name: string) =>
    name
      .replace(/[\/|]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

  for (const line of lines) {
    const up = line.toUpperCase();

    if (skipKeywords.some((k) => up.includes(k))) continue;
    if (/^[\d\s.,/:-]+$/.test(line)) continue;
    if (line.length < 2) continue;

    let m: RegExpMatchArray | null = null;

    // 한글/일문 메뉴명 + "/" + 가격 + 수량 + 합계
    // 예: 짜장면 / 7 1 7
    m = line.match(/^(.+?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)\s+([0-9]+)\s+([0-9]+(?:\.[0-9]+)?)$/);
    if (m) {
      const name = cleanMenuName(m[1]);
      const price = parseFloat(m[2] || "0") || 0;
      const qty = parseInt(m[3] || "0", 10) || 0;
      if (name && qty > 0) {
        items.push({ name, price, qty });
        continue;
      }
    }

    // 한글/일문 메뉴명 + 가격 + 수량 + 합계
    // 예: 고추짜장 9 2 18 / 굴짜장 18 1 18
    m = line.match(/^(.+?)\s+([0-9]+(?:\.[0-9]+)?)\s+([0-9]+)\s+([0-9]+(?:\.[0-9]+)?)$/);
    if (m) {
      const name = cleanMenuName(m[1]);
      const price = parseFloat(m[2] || "0") || 0;
      const qty = parseInt(m[3] || "0", 10) || 0;
      if (name && qty > 0) {
        items.push({ name, price, qty });
        continue;
      }
    }

    // 메뉴명 + x 수량
    m = line.match(/^(.+?)\s+.*?\bx\s*([0-9]+)\b/i);
    if (m) {
      const name = cleanMenuName(m[1]);
      const qty = parseInt(m[2] || "0", 10) || 0;
      if (name && qty > 0) {
        items.push({ name, price: 0, qty });
        continue;
      }
    }

    // 메뉴명 + 수량 + 가격
    m = line.match(/^(.+?)\s+([0-9]+)\s+\$?\s*([0-9]+(?:\.[0-9]+)?)$/i);
    if (m) {
      const name = cleanMenuName(m[1]);
      const qty = parseInt(m[2] || "0", 10) || 0;
      const price = parseFloat(m[3] || "0") || 0;
      if (name && qty > 0) {
        items.push({ name, price, qty });
        continue;
      }
    }
  }

  const merged: Record<string, { name: string; price: number; qty: number }> = {};
  for (const it of items) {
    const key = `${it.name}||${it.price}`;
    if (!merged[key]) {
      merged[key] = { ...it };
    } else {
      merged[key].qty += it.qty;
    }
  }

  return Object.values(merged);
}

export type FileStatus = {
  status: "pending" | "processing" | "success" | "failed" | "retrying";
  error?: string;
  retryCount?: number;
};

const DataInput: React.FC<DataInputProps> = ({
  data,
  onChange,
  loading,
  datesWithData,
  onMonthChange,
  storeName = "",
  homeLandingTarget = null,
  onHomeLandingHandled,
  renderV4,
}) => {
  const currency = getCurrencyByCountry((data as any).country);

  const updateBaseField = (field: keyof SalesReportData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateQty = (catIdx: number, itemIdx: number, qty: number) => {
    const newCategories = data.categories.map((cat, cIdx) => ({
      ...cat,
      items: cat.items.map((item, iIdx) =>
        cIdx === catIdx && iIdx === itemIdx ? { ...item, qty } : { ...item }
      ),
    }));
    onChange({ ...data, categories: newCategories });
  };

  const getDineInQty = (item: any) => Number(item?.dine_in_qty ?? item?.qty ?? 0);
  const getTakeoutQty = (item: any) => Number(item?.takeout_qty ?? 0);

  const updateChannelQty = (catIdx: number, itemIdx: number, channel: "DINE_IN" | "TAKEOUT", value: number) => {
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    const newCategories = data.categories.map((cat, cIdx) => ({
      ...cat,
      items: cat.items.map((item, iIdx) => {
        if (cIdx !== catIdx || iIdx !== itemIdx) return { ...item };
        const currentDineIn = getDineInQty(item);
        const currentTakeout = getTakeoutQty(item);
        const nextDineIn = channel === "DINE_IN" ? safeValue : currentDineIn;
        const nextTakeout = channel === "TAKEOUT" ? safeValue : currentTakeout;
        return { ...item, dine_in_qty: nextDineIn, takeout_qty: nextTakeout, qty: nextDineIn + nextTakeout } as any;
      }),
    }));
    onChange({ ...data, categories: newCategories });
  };

  const focusNextMenuQtyInput = (currentFlatIndex: number) => {
    requestAnimationFrame(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('[data-menu-qty-input="true"]')
      );
      const nextInput = inputs[currentFlatIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    });
  };

  const focusNextBaseInput = (currentKey: string) => {
    requestAnimationFrame(() => {
      const baseInputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('[data-base-input="true"]')
      );
      const currentIndex = baseInputs.findIndex((input) => input.dataset.baseKey === currentKey);
      const nextBaseInput = baseInputs[currentIndex + 1];

      if (nextBaseInput) {
        nextBaseInput.focus();
        nextBaseInput.select();
        return;
      }

      const firstMenuInput = document.querySelector<HTMLInputElement>(
        '[data-menu-qty-input="true"]'
      );

      if (firstMenuInput) {
        firstMenuInput.focus();
        firstMenuInput.select();
      }
    });
  };

  const inputClasses =
    "h-12 w-full rounded-[12px] border border-[#e5ddd7] bg-white px-3 text-[14px] text-[#1f1f1f] placeholder:text-[#aaa19a] outline-none transition focus:border-[#a8866b] focus:ring-4 focus:ring-[#f7eee8]";
  const numericInputClasses = `${inputClasses} text-right pr-10`;

  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrFileStatuses, setOcrFileStatuses] = useState<Record<string, FileStatus>>({});
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  const [ocrRawText, setOcrRawText] = useState<string>("");
  const [ocrItemsAccumulated, setOcrItemsAccumulated] = useState<CorrectedItem[]>([]);
  const [ocrTotals, setOcrTotals] = useState<Record<string, unknown>>({});
  const [ocrReceiptStoresByFile, setOcrReceiptStoresByFile] = useState<
    Record<string, OcrReceiptStore>
  >({});
  const [manualMappings, setManualMappings] = useState<Record<string, string>>({});
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<{ current: number; total: number } | null>(null);
  const [ocrOptimizing, setOcrOptimizing] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string>("");
  const [ocrErrorDetail, setOcrErrorDetail] = useState<string>("");
  const [showOcr, setShowOcr] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [ocrUserEmail, setOcrUserEmail] = useState<string>("");

  useEffect(() => {
    if (expandedCategories.length === 0 && data.categories.length > 0) {
      setExpandedCategories([data.categories[0].name]);
    }
  }, [data.categories, expandedCategories.length]);
  useEffect(() => {
    if (homeLandingTarget === "sales:ocr") setShowOcr(true);
  }, [homeLandingTarget]);

  useEffect(() => {
    if (!homeLandingTarget) return;
    const target = homeLandingTarget === "sales:manual" ? manualSalesRef.current : ocrUploadRef.current;
    if (!target) return;

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      onHomeLandingHandled?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [homeLandingTarget, onHomeLandingHandled, showOcr]);

  const isJapanPilot = ocrUserEmail.trim().toUpperCase() === "JP_PN@THEBORN.CO.KR";
  const getMenuGrossSales = (item: any) => {
    const price = Number(item?.price || 0);

    if (!isJapanPilot) {
      return price * Number(item?.qty || 0);
    }

    const dineInQty = getDineInQty(item);
    const takeoutQty = getTakeoutQty(item);
    const fallbackQty = Number(item?.qty || 0);
    const totalQty = dineInQty + takeoutQty || fallbackQty;

    return price * totalQty;
  };

  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const manualSalesRef = useRef<HTMLDivElement>(null);
  const ocrUploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data: sessionData }) => {
        if (!mounted) return;
        setOcrUserEmail(sessionData?.session?.user?.email || "");
      })
      .catch((err) => console.error("Failed to read session for DataInput:", err));
    return () => {
      mounted = false;
    };
  }, []);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseLocalDate(data.date));
  const [calendarRenderKey, setCalendarRenderKey] = useState(0);

  const toggleCalendar = () => {
    if (!showCalendar && calendarButtonRef.current) {
      const rect = calendarButtonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const popupWidth = 320;
      const currentMonth = parseLocalDate(data.date);

      let left = rect.left;
      if (left + popupWidth > windowWidth) left = windowWidth - popupWidth - 20;
      if (left < 20) left = 20;

      setCalendarPos({
        top: rect.bottom + window.scrollY + 8,
        left,
      });

      setCalendarMonth(currentMonth);
      setCalendarRenderKey((prev) => prev + 1);
      onMonthChange?.(currentMonth);
      setShowCalendar(true);
      return;
    }

    setShowCalendar(false);
  };

  useEffect(() => {
    if (!showCalendar) return;
    const close = () => setShowCalendar(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [showCalendar]);

  useEffect(() => {
    const nextMonth = parseLocalDate(data.date);
    setCalendarMonth(nextMonth);
    if (showCalendar) {
      setCalendarRenderKey((prev) => prev + 1);
    }
  }, [data.date, showCalendar]);

  const fileKey = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;

  useEffect(() => {
    const next: Record<string, string> = { ...thumbUrls };
    for (const f of ocrFiles) {
      const k = fileKey(f);
      if (!next[k]) next[k] = URL.createObjectURL(f);
    }

    for (const k of Object.keys(next)) {
      const stillExists = ocrFiles.some((f) => fileKey(f) === k);
      if (!stillExists) {
        try {
          URL.revokeObjectURL(next[k]);
        } catch {}
        delete next[k];
      }
    }

    setThumbUrls(next);
  }, [ocrFiles]);

  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\wㄱ-ㅎ가-힣0-9]/g, "")
      .replace(/\(.*\)/g, "")
      .replace(/[0-9]+(원|usd|\$)/g, "")
      .trim();
  };

  const getLevenshteinDistance = (s1: string, s2: string): number => {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[len1][len2];
  };

  const getSimilarity = (s1: string, s2: string): number => {
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0;
    const distance = getLevenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  };

  const allMenus = useMemo(() => {
    const flattened: { id: string; name: string; price: number; normalizedName: string }[] = [];
    data.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        flattened.push({
          id: item.id,
          name: item.name,
          price: item.price,
          normalizedName: normalizeName(item.name),
        });
      });
    });
    return flattened;
  }, [data.categories]);

  const autoCorrectItem = (ocrItem: { name: string; price: number; qty: number }): CorrectedItem => {
    const originalName = ocrItem.name;
    const normalizedOcrName = normalizeName(originalName);

    if (manualMappings[originalName]) {
      const matched = allMenus.find((m) => m.id === manualMappings[originalName]);
      if (matched) {
        return {
          matched_id: matched.id,
          item_original: originalName,
          item_corrected: matched.name,
          unit_price: ocrItem.price || matched.price,
          qty: ocrItem.qty,
          confidence: 1.0,
          needs_review: false,
        };
      }
    }

    const exactMatch = allMenus.find((m) => m.normalizedName === normalizedOcrName);
    if (exactMatch) {
      return {
        matched_id: exactMatch.id,
        item_original: originalName,
        item_corrected: exactMatch.name,
        unit_price: ocrItem.price || exactMatch.price,
        qty: ocrItem.qty,
        confidence: 1.0,
        needs_review: false,
      };
    }

    const scores = allMenus
      .map((m) => ({
        ...m,
        score: getSimilarity(normalizedOcrName, m.normalizedName),
      }))
      .sort((a, b) => b.score - a.score);

    const bestMatch = scores[0];
    const secondMatch = scores[1];

    let confidence = bestMatch?.score ?? 0;
    let needsReview = true;

    if (bestMatch && bestMatch.score >= 0.88) {
      const scoreGap = secondMatch ? bestMatch.score - secondMatch.score : bestMatch.score;
      if (scoreGap >= 0.08) needsReview = false;
    }

    const usedPrice = ocrItem.price || bestMatch?.price || 0;
    if (!needsReview && usedPrice > 0 && bestMatch?.price) {
      const priceDiff = Math.abs(bestMatch.price - usedPrice);
      const ratio = bestMatch.price > 0 ? priceDiff / bestMatch.price : 0;
      if (ratio > 0.2) needsReview = true;
    }

    if (ocrItem.qty <= 0) needsReview = true;

    return {
      matched_id: needsReview ? undefined : bestMatch?.id,
      item_original: originalName,
      item_corrected: bestMatch?.name || originalName,
      unit_price: usedPrice,
      qty: ocrItem.qty,
      confidence,
      needs_review: needsReview,
      candidates: scores.slice(0, 3).map((s) => ({ name: s.name, id: s.id, score: s.score })),
    };
  };

 const callOcrBatchWithRetry = async (
  images: Array<{ imageBase64: string; mimeType: string; fileName: string }>,
  fileNames: string[],
  options?: {
    userEmail?: string;
    country?: string;
    brand?: string;
    menuCandidates?: { name: string; jp_name?: string | null }[];
  }
) => {
  const delays = [2000, 5000, 10000];
  let lastErr: any;

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      return await callOcrBatch(images, {
        userEmail: options?.userEmail || "",
        country: options?.country || "",
        brand: options?.brand || "",
        menuCandidates: options?.menuCandidates || [],
      });
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || "");
      const is429 =
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("Rate");

      if (is429 && attempt < 3) {
        const delay = delays[attempt] + Math.random() * 800;
        setOcrFileStatuses((prev) => ({
          ...prev,
          ...Object.fromEntries(fileNames.map((fileName) => [fileName, {
            ...(prev[fileName] || { status: "pending" }), status: "retrying", retryCount: attempt + 1,
          }])),
        }));
        await sleep(delay);
        continue;
      }

      throw err;
    }
  }

  throw lastErr;
};

const callOcrWithRetry = async (
  imageBase64: string,
  mimeType: string,
  _fileName: string,
  options?: { userEmail?: string; country?: string; brand?: string; menuCandidates?: { name: string; jp_name?: string | null }[] }
) => callOcr(imageBase64, mimeType, options);

  const appendFiles = (files: File[]) => {
    if (!files || files.length === 0) return;

    setOcrFiles((prev) => {
      const prevKeys = new Set(prev.map((f) => fileKey(f)));
      const next = [...prev];

      for (const f of files) {
        const k = fileKey(f);
        if (prevKeys.has(k)) continue;
        next.push(f);
        prevKeys.add(k);
      }
      return next;
    });

    setOcrFileStatuses((prev) => {
      const next = { ...prev };
      for (const f of files) {
        if (!next[f.name]) next[f.name] = { status: "pending" };
      }
      return next;
    });
  };

  const replaceAllFiles = (files: File[]) => {
    setOcrFiles(files);
    const nextStatus: Record<string, FileStatus> = {};
    files.forEach((f) => (nextStatus[f.name] = { status: "pending" }));
    setOcrFileStatuses(nextStatus);

    setOcrRawText("");
    setOcrItemsAccumulated([]);
    setOcrTotals({});
    setOcrReceiptStoresByFile({});
    setOcrError("");
    setOcrErrorDetail("");
    setOcrProgress(null);
  };

  const handleOcr = async (_filesToProcessOverride?: File[]) => {
  const filesToProcess = ocrFiles;
  if (filesToProcess.length === 0) return;

  setOcrLoading(true);
  setOcrError("");
  setOcrErrorDetail("");
  setOcrProgress({ current: 0, total: filesToProcess.length });

  setOcrFileStatuses((prev) => {
    const next = { ...prev };
    filesToProcess.forEach((f) => (next[f.name] = { status: "pending" }));
    return next;
  });

  let currentUserEmail = "";
  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      currentUserEmail = sessionData?.session?.user?.email || "";
    } catch (err) {
      console.error("Failed to read session for OCR:", err);
    }
  }

  if (!currentUserEmail) currentUserEmail = ocrUserEmail;
  setOcrUserEmail(currentUserEmail);

 const menuCandidates = allMenus.map((m) => ({
  name: m.name,
  jp_name: (m as any).jp_name || null,
}));
  const ocrCountry = String((data as any)?.country || "").trim();
  const ocrBrand = String((data as any)?.brand || "").trim();

  let completedCount = 0;

  const processSingleFile = async (currentFile: File) => {
    setOcrFileStatuses((prev) => ({
      ...prev,
      [currentFile.name]: { status: "processing" },
    }));

    try {
      setOcrOptimizing(true);

      const optimizedFile = await compressForOcr(currentFile, 1024, 0.6);
      const { base64, mimeType } = await fileToBase64(optimizedFile);

      setOcrOptimizing(false);

      const ocrResult = await callOcrWithRetry(base64, mimeType, currentFile.name, {
        userEmail: currentUserEmail,
        country: ocrCountry,
        brand: ocrBrand,
        menuCandidates,
      });

      const extractedText = String(ocrResult?.rawText || "").trim();
      const structuredItems = Array.isArray(ocrResult?.items) ? ocrResult.items : [];

      if (!extractedText && structuredItems.length === 0) {
        throw new Error("텍스트 또는 메뉴를 추출하지 못했습니다.");
      }

      setOcrReceiptStoresByFile((prev) => ({
        ...prev,
        [fileKey(currentFile)]: {
          fileName: currentFile.name,
          receiptStoreName: ocrResult.receipt_store_name,
          receiptCurrency: ocrResult.receipt_currency,
        },
      }));

      if (extractedText) {
        setOcrRawText((prev) => {
          return (
            prev +
            (prev ? "\n\n" : "") +
            `--- File: ${currentFile.name} ---\n` +
            extractedText
          );
        });
      }

      let correctedNewItems: CorrectedItem[] = [];

      if (structuredItems.length > 0) {
        correctedNewItems = structuredItems
          .map((item: any) => {
            const receiptName = String(
              item?.receipt_name || item?.matched_name || ""
            ).trim();

            const matchedName = String(item?.matched_name || "").trim();
            const matchedMenu = allMenus.find((m) => m.name === matchedName);

            const qty = Number(item?.qty || 0);
            const unitPrice = Number(item?.price || 0);
            const confidenceRaw = Number(item?.confidence || 0);
            const confidence =
              Number.isFinite(confidenceRaw) && confidenceRaw >= 0
                ? Math.min(1, confidenceRaw)
                : 0;

            const isTakeout = /[※★]/.test(receiptName);
            const orderChannel = isTakeout ? "TAKEOUT" : "DINE_IN";
            const dineInQty = isTakeout ? 0 : qty;
            const takeoutQty = isTakeout ? qty : 0;

            const needsReview = Boolean(item?.needs_review ?? !matchedMenu);

            return {
              matched_id: matchedMenu?.id,
              item_original: receiptName,
              item_corrected: matchedMenu?.name || matchedName || receiptName,
              unit_price: unitPrice || matchedMenu?.price || 0,
              qty: Number.isFinite(qty) ? qty : 0,
              order_channel: orderChannel,
              dine_in_qty: Number.isFinite(dineInQty) ? dineInQty : 0,
              takeout_qty: Number.isFinite(takeoutQty) ? takeoutQty : 0,
              confidence,
              needs_review: needsReview,
              candidates: needsReview
                ? allMenus.slice(0, 5).map((m) => ({
                    name: m.name,
                    id: m.id,
                    score: m.name === matchedName ? 1 : 0,
                  }))
                : undefined,
            } as CorrectedItem;
          })
          .filter((item) => item.item_original && Number(item.qty || 0) > 0);
      } else {
        const parsedItems = extractMenuItemsFromRawText(extractedText);
        correctedNewItems = parsedItems.map((it) => autoCorrectItem(it));
      }

      setOcrItemsAccumulated((prev) => [...prev, ...correctedNewItems]);

      setOcrFileStatuses((prev) => ({
        ...prev,
        [currentFile.name]: { status: "success" },
      }));
    } catch (err: any) {
      console.error(`Error processing file ${currentFile.name}:`, err);
      const errorDetail = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);

      setOcrFileStatuses((prev) => ({
        ...prev,
        [currentFile.name]: {
          status: "failed",
          error: err?.message || "알 수 없는 오류",
        },
      }));

      setOcrError(
        (prev) => prev + (prev ? "\n" : "") + `${currentFile.name}: 인식 실패`
      );
      setOcrErrorDetail((prev) => (prev ? `${prev}\n\n${errorDetail}` : errorDetail));
    } finally {
      completedCount += 1;
      setOcrProgress({ current: completedCount, total: filesToProcess.length });
      setOcrOptimizing(false);
    }
  };

  try {
    setOcrFileStatuses((prev) => ({
      ...prev,
      ...Object.fromEntries(filesToProcess.map((file) => [file.name, { status: "processing" }])),
    }));
    setOcrOptimizing(true);
    const images = await Promise.all(filesToProcess.map(async (file) => {
      const optimizedFile = await compressForOcr(file, 1024, 0.6);
      const { base64, mimeType } = await fileToBase64(optimizedFile);
      return { imageBase64: base64, mimeType, fileName: file.name };
    }));
    setOcrOptimizing(false);
    const ocrResult = await callOcrBatchWithRetry(images, filesToProcess.map((file) => file.name), {
      userEmail: currentUserEmail,
      country: ocrCountry,
      brand: ocrBrand,
      menuCandidates,
    });
    const extractedText = String(ocrResult.rawText || "").trim();
    const structuredItems = Array.isArray(ocrResult.items) ? ocrResult.items : [];
    if (!extractedText && structuredItems.length === 0) throw new Error("OCR did not return receipt text or menu items.");
    setOcrRawText(extractedText ? `--- Receipt batch: ${filesToProcess.map((file) => file.name).join(" | ")} ---\n${extractedText}` : "");
    setOcrTotals(ocrResult.totals || {});
    setOcrReceiptStoresByFile(Object.fromEntries(filesToProcess.map((file) => [fileKey(file), {
      fileName: file.name,
      receiptStoreName: ocrResult.receipt_store_name,
      receiptCurrency: ocrResult.receipt_currency,
    }])));
    const correctedBatchItems = structuredItems.length > 0
      ? structuredItems.map((item: any) => {
          const receiptName = String(item?.receipt_name || item?.matched_name || "").trim();
          const matchedName = String(item?.matched_name || "").trim();
          const matchedMenu = allMenus.find((menu) => menu.name === matchedName);
          const qty = Number(item?.qty || 0);
          const unitPrice = Number(item?.price || 0);
          const confidenceRaw = Number(item?.confidence || 0);
          const confidence = Number.isFinite(confidenceRaw) && confidenceRaw >= 0 ? Math.min(1, confidenceRaw) : 0;
          const isTakeout = /[?삘쁾]/.test(receiptName);
          const needsReview = Boolean(item?.needs_review) || !matchedMenu || confidence < 0.88 || !Number.isFinite(unitPrice) || unitPrice <= 0;
          return {
            matched_id: matchedMenu?.id,
            item_original: receiptName,
            item_corrected: matchedMenu?.name || matchedName || receiptName,
            unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
            qty: Number.isFinite(qty) ? qty : 0,
            order_channel: isTakeout ? "TAKEOUT" : "DINE_IN",
            dine_in_qty: isTakeout ? 0 : qty,
            takeout_qty: isTakeout ? qty : 0,
            confidence,
            needs_review: needsReview,
            candidates: needsReview ? allMenus.slice(0, 5).map((menu) => ({ name: menu.name, id: menu.id, score: menu.name === matchedName ? 1 : 0 })) : undefined,
          } as CorrectedItem;
        }).filter((item) => item.item_original && Number(item.qty || 0) > 0)
      : extractMenuItemsFromRawText(extractedText).map((item) => autoCorrectItem(item));
    setOcrItemsAccumulated(correctedBatchItems);
    setOcrFileStatuses((prev) => ({
      ...prev,
      ...Object.fromEntries(filesToProcess.map((file) => [file.name, { status: "success" }])),
    }));
    setOcrProgress({ current: filesToProcess.length, total: filesToProcess.length });
  } catch (err: any) {
    const errorDetail = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    setOcrFileStatuses((prev) => ({
      ...prev,
      ...Object.fromEntries(filesToProcess.map((file) => [file.name, { status: "failed", error: err?.message || "OCR processing failed" }])),
    }));
    setOcrError("영수증 묶음 인식에 실패했습니다.");
    setOcrErrorDetail(errorDetail);
  } finally {
    setOcrOptimizing(false);
  }

  setOcrLoading(false);
  setOcrProgress(null);
};

  const handleRetryFailed = () => {
    const failedFiles = ocrFiles.filter((f) => ocrFileStatuses[f.name]?.status === "failed");
    if (failedFiles.length > 0) void handleOcr();
  };

  const resetOcr = () => {
    setOcrFiles([]);
    setOcrFileStatuses({});
    setOcrRawText("");
    setOcrItemsAccumulated([]);
    setOcrTotals({});
    setOcrReceiptStoresByFile({});
    setOcrError("");
    setOcrErrorDetail("");
    setOcrProgress(null);
  };

  const applyOcr = () => {
    if (ocrItemsAccumulated.length === 0) return;

    const newCategories = data.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((it) => ({ ...it })),
    }));

    if (isJapanPilot) {
      const qtyById = new Map<string, { dineIn: number; takeout: number }>();

      for (const item of ocrItemsAccumulated) {
        if (item.needs_review || !item.matched_id) continue;
        const rawQty = Number(item.qty || 0);
        const dineInQty = Number((item as any).dine_in_qty || 0);
        const takeoutQty = Number((item as any).takeout_qty || 0);
        const fallbackDineInQty = dineInQty + takeoutQty > 0 ? dineInQty : rawQty;
        const prev = qtyById.get(item.matched_id) || { dineIn: 0, takeout: 0 };
        qtyById.set(item.matched_id, {
          dineIn: prev.dineIn + fallbackDineInQty,
          takeout: prev.takeout + takeoutQty,
        });
      }

      let appliedCount = 0;
      newCategories.forEach((cat) => {
        cat.items.forEach((menuItem) => {
          const v = qtyById.get(menuItem.id);
          if (!v) return;
          const totalQty = Number(v.dineIn || 0) + Number(v.takeout || 0);
          if (totalQty <= 0) return;
          (menuItem as any).dine_in_qty = Number(v.dineIn || 0);
          (menuItem as any).takeout_qty = Number(v.takeout || 0);
          menuItem.qty = totalQty;
          appliedCount++;
        });
      });

      onChange({ ...data, categories: newCategories });
      alert(appliedCount + "개의 메뉴가 홀/포장 분리 적용되었습니다.");
      return;
    }

    const qtyById = new Map<string, number>();
    for (const item of ocrItemsAccumulated) {
      if (item.needs_review || !item.matched_id) continue;
      const prev = qtyById.get(item.matched_id) || 0;
      qtyById.set(item.matched_id, prev + Number(item.qty || 0));
    }

    let appliedCount = 0;
    newCategories.forEach((cat) => {
      cat.items.forEach((menuItem) => {
        const v = qtyById.get(menuItem.id);
        if (v !== undefined && v > 0) {
          menuItem.qty = v;
          appliedCount++;
        }
      });
    });

    onChange({ ...data, categories: newCategories });
    alert(appliedCount + "개의 메뉴가 적용되었습니다.");
  };

  const handleConfirmCorrection = (idx: number, matchedId: string) => {
    setOcrItemsAccumulated((prev) => {
      const next = [...prev];
      const item = next[idx];
      const matched = allMenus.find((m) => m.id === matchedId);
      if (matched) {
        next[idx] = {
          ...item,
          matched_id: matched.id,
          item_original: item.item_original,
          item_corrected: matched.name,
          unit_price: item.unit_price,
          qty: item.qty,
          confidence: 1.0,
          needs_review: false,
          candidates: item.candidates,
        };
        setManualMappings((prevMap) => ({
          ...prevMap,
          [item.item_original]: matched.id,
        }));
      }
      return next;
    });
  };

  const needsReviewItems = ocrItemsAccumulated.filter((item) => item.needs_review);
  const confirmedItems = ocrItemsAccumulated.filter((item) => !item.needs_review);

  const scanTotal = useMemo(() => {
    return ocrItemsAccumulated.reduce(
      (sum, item) => sum + item.unit_price * item.qty,
      0
    );
  }, [ocrItemsAccumulated]);

  const ocrPriceMismatches = useMemo(
    () =>
      ocrItemsAccumulated.flatMap((item) => {
        const menuPrice = item.matched_id
          ? allMenus.find((menu) => menu.id === item.matched_id)?.price
          : undefined;

        return menuPrice !== undefined && menuPrice !== item.unit_price
          ? [{ name: item.item_corrected, ocrPrice: item.unit_price, menuPrice }]
          : [];
      }),
    [ocrItemsAccumulated, allMenus]
  );

  const extractReceiptAmount = (text: string, keywords: string[]): number | null => {
    if (!text) return null;
    const lines = text.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].toUpperCase();
      if (!keywords.some((k) => line.includes(k))) continue;
      const matches = line.match(/[\d,.]+/g);
      if (!matches) continue;
      let maxInLine = 0;
      for (const match of matches) {
        const cleaned = match.replace(/,/g, "");
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > maxInLine) maxInLine = val;
      }
      if (maxInLine > 0) return maxInLine;
    }
    return null;
  };

  const getOcrTotal = (key: string): number | null => {
    const value = ocrTotals[key];
    const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/,/g, "")) : Number.NaN;
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  };
  const receiptSubtotal = useMemo(
    () => getOcrTotal("receipt_subtotal") ?? extractReceiptAmount(ocrRawText, ["SUBTOTAL", "SUB TOTAL", "小計", "상품합계"]),
    [ocrTotals, ocrRawText]
  );
  const serviceCharge = useMemo(
    () => getOcrTotal("service_charge") ?? extractReceiptAmount(ocrRawText, ["SERVICE CHARGE", "SERVICE"]),
    [ocrTotals, ocrRawText]
  );
  const receiptTax = useMemo(
    () => getOcrTotal("tax") ?? extractReceiptAmount(ocrRawText, ["TAX", "VAT", "消費税"]),
    [ocrTotals, ocrRawText]
  );
  const receiptTotal = useMemo(
    () => getOcrTotal("receipt_total") ?? extractReceiptAmount(ocrRawText, ["GRAND TOTAL", "NET TOTAL", "G.TOTAL", "TOTAL", "AMOUNT"]),
    [ocrTotals, ocrRawText]
  );
  const receiptDateValidation = useMemo(
    () => validateReceiptDate(ocrRawText),
    [ocrRawText]
  );
  const receiptStoreFileValidations = useMemo<ReceiptStoreFileValidation[]>(
    () =>
      ocrFiles
        .filter((file) => ocrFileStatuses[file.name]?.status === "success")
        .map((file) => {
          const key = fileKey(file);
          const receiptStoreName = ocrReceiptStoresByFile[key]?.receiptStoreName ?? null;
          return {
            ...validateReceiptStore(receiptStoreName, storeName),
            fileKey: key,
            fileName: file.name,
            receiptStoreName,
          };
        }),
    [ocrFiles, ocrFileStatuses, ocrReceiptStoresByFile, storeName]
  );
  const receiptStoreValidation = useMemo<ReceiptStoreValidation>(() => {
    if (receiptStoreFileValidations.some((validation) => validation.status === "BLOCK")) {
      return { status: "BLOCK", message: "현재 선택된 매장과 다른 영수증이 있습니다." };
    }
    if (receiptStoreFileValidations.some((validation) => validation.status === "WARNING")) {
      return { status: "WARNING", message: "영수증 매장명을 확인한 후 적용해 주세요." };
    }
    if (receiptStoreFileValidations.length > 0) {
      return { status: "PASS", message: "모든 영수증 매장이 현재 선택된 매장과 일치합니다." };
    }
    return { status: "WARNING", message: "OCR에서 영수증 매장명을 인식하지 못했습니다." };
  }, [receiptStoreFileValidations]);
  const receiptCurrencyFileValidations = useMemo<ReceiptCurrencyFileValidation[]>(
    () =>
      ocrFiles
        .filter((file) => ocrFileStatuses[file.name]?.status === "success")
        .map((file) => {
          const key = fileKey(file);
          const receiptCurrency = ocrReceiptStoresByFile[key]?.receiptCurrency ?? null;
          return {
            ...validateReceiptCurrency(receiptCurrency, currency),
            fileKey: key,
            fileName: file.name,
            receiptCurrency,
          };
        }),
    [ocrFiles, ocrFileStatuses, ocrReceiptStoresByFile, currency]
  );
  const receiptCurrencyValidation = useMemo<ReceiptCurrencyValidation>(() => {
    if (receiptCurrencyFileValidations.some((validation) => validation.status === "BLOCK")) {
      return { status: "BLOCK", message: "예상 통화와 다른 영수증이 있습니다." };
    }
    if (receiptCurrencyFileValidations.some((validation) => validation.status === "WARNING")) {
      return { status: "WARNING", message: "영수증 통화를 확인한 후 적용해 주세요." };
    }
    if (receiptCurrencyFileValidations.length > 0) {
      return { status: "PASS", message: "모든 영수증 통화가 예상 통화와 일치합니다." };
    }
    return { status: "WARNING", message: "OCR에서 영수증 통화를 인식하지 못했습니다." };
  }, [receiptCurrencyFileValidations]);

  const isTotalMatched = useMemo(() => {
    if (receiptSubtotal === null) return null;
    const diff = Math.abs(scanTotal - receiptSubtotal);
    const tolerance = Math.max(receiptSubtotal * 0.01, 1);
    return diff <= tolerance;
  }, [scanTotal, receiptSubtotal]);
  const isOcrApplyBlocked =
    ocrItemsAccumulated.length === 0 ||
    receiptCurrencyValidation.status === "BLOCK";

  const statusBadge = (s?: FileStatus) => {
    const st = s?.status;
    if (st === "success") return { text: "성공", cls: "bg-emerald-600" };
    if (st === "failed") return { text: "실패", cls: "bg-rose-600" };
    if (st === "processing") return { text: "처리중", cls: "bg-indigo-600" };
    if (st === "retrying") return { text: `재시도`, cls: "bg-amber-600" };
    return { text: "대기", cls: "bg-slate-500" };
  };

  const notSuccessCount = ocrFiles.filter((f) => ocrFileStatuses[f.name]?.status !== "success").length;
  const hasDataDateSet = useMemo(() => new Set(datesWithData || []), [datesWithData]);

  const menuSalesTotal = useMemo(() => {
    return data.categories.reduce((sum, category) => {
      return (
        sum +
        category.items.reduce((catSum, item) => {
          return catSum + getMenuGrossSales(item);
        }, 0)
      );
    }, 0);
  }, [data.categories, isJapanPilot]);

  const menuSalesTotalWithVat = menuSalesTotal;
  const menuVatTotal = 0;

  const enteredSalesTotal =
    Number(data.posSales || 0) + Number((data as any).deliverySales || 0);

  const salesGap = enteredSalesTotal - menuSalesTotal;

  if (renderV4) {
    return renderV4({
      data,
      currency,
      selectedDate: data.date,
      storeName,
      enteredSalesTotal,
      menuSalesTotal,
      salesGap,
      updateBaseField,
      updateQty,
      getDineInQty,
      getTakeoutQty,
      updateChannelQty,
      showOcr,
      setShowOcr,
      manualSalesRef,
      ocrUploadRef,
      addInputRef,
      replaceInputRef,
      appendFiles,
      replaceAllFiles,
      handleOcr,
      resetOcr,
      applyOcr,
      ocrFiles,
      ocrFileStatuses,
      ocrFilePreviewUrls: thumbUrls,
      ocrLoading,
      ocrProgress,
      ocrError,
      ocrErrorDetail,
      ocrRawText,
      ocrItems: ocrItemsAccumulated,
      needsReviewItems,
      confirmedItems,
      handleRetryFailed,
      handleConfirmCorrection,
      availableMenus: allMenus.map(({ id, name }) => ({ id, name })),
      receiptDateValidation,
      receiptStoreValidation,
      receiptStoreFileValidations,
      receiptCurrencyValidation,
      receiptCurrencyFileValidations,
      ocrPriceMismatches,
      isOcrApplyBlocked,
      isJapanPilot,
      scanTotal,
      receiptSubtotal,
      serviceCharge,
      receiptTax,
      receiptTotal,
      isTotalMatched,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="order-2 overflow-hidden rounded-[16px] border border-[#e8e1db] bg-white shadow-[0_4px_14px_rgba(70,54,42,0.04)]">
        <div className="flex items-center gap-4 px-4 py-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#f8f1eb] text-[25px] text-[#8b5e3c]"><i className="fa-regular fa-receipt" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[14px] font-semibold tracking-[-0.04em] text-[#302722]">영수증 자동입력 (OCR)</h2><p className="mt-1 text-[11px] leading-4 text-[#766c65]">영수증을 스캔하거나 업로드하면 AI가 자동으로 인식해 드려요.</p></div>
        </div>
        <div className="border-t border-[#eee8e3] px-4 py-3"><button type="button" onClick={() => setShowOcr(!showOcr)} className="mx-auto flex h-9 min-w-[170px] items-center justify-center gap-2 rounded-[7px] bg-[#8b5e3c] px-4 text-[11px] font-semibold text-white shadow-[0_3px_8px_rgba(111,64,39,0.16)]"><i className="fa-solid fa-camera" />{showOcr ? "OCR 닫기" : "영수증 스캔 모드"}</button></div>
      </section>

      {showOcr && (
        <div id="ocr-workflow" className="order-3 overflow-visible rounded-[20px] border border-[#e8e1db] bg-white shadow-[0_8px_22px_rgba(70,54,42,0.05)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-[#eee7f7] bg-[#faf9ff] px-5 py-4">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#302a37]">
              <i className="fa-solid fa-receipt text-[#7c6cf6]"></i>
              영수증 OCR 분석
            </h2>
            <span className="rounded-full bg-[#efeaff] px-2 py-1 text-[10px] font-semibold text-[#6857b6]">AI OCR</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-slate-700">
              <p className="font-bold text-sm mb-2 flex items-center gap-2">📌 OCR 사용 안내</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">📄</span>
                  <span>영수증이 길면 여러 장으로 나눠 촬영/스캔해 주세요.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔁</span>
                  <span>여러 장 처리 시 겹쳐 찍힌 라인이 있을 수 있어요(최종 확인 필수).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>OCR 결과는 100% 정확하지 않으니 반드시 더블 체크해 주세요.</span>
                </li>
              </ul>
            </div>

            <input
              ref={addInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const files = Array.from<File>(e.currentTarget.files ?? []);
                appendFiles(files);
                e.currentTarget.value = "";
              }}
              className="hidden"
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const files = Array.from<File>(e.currentTarget.files ?? []);
                replaceAllFiles(files);
                e.currentTarget.value = "";
              }}
              className="hidden"
            />

            <div ref={ocrUploadRef} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-bold text-slate-500">
                    영수증 사진 (카메라/갤러리)
                    {ocrFiles.length > 0 && (
                      <span className="ml-2 text-indigo-600 font-black">선택된 사진: {ocrFiles.length}장</span>
                    )}
                  </label>

                  {(ocrItemsAccumulated.length > 0 || ocrFiles.length > 0) && (
                    <button
                      onClick={resetOcr}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      🧹 전체 초기화
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addInputRef.current?.click()}
                    className="flex h-10 items-center gap-2 rounded-[8px] bg-[#8b5e3c] px-4 text-xs font-semibold text-white shadow-[0_3px_8px_rgba(111,64,39,0.16)] transition hover:bg-[#745846]"
                  >
                    <i className="fa-solid fa-plus"></i>
                    사진 추가
                  </button>

                  <button
                    type="button"
                    onClick={() => replaceInputRef.current?.click()}
                    className="flex h-10 items-center gap-2 rounded-[8px] border border-[#cdbbaa] bg-white px-4 text-xs font-semibold text-[#6f4932] transition hover:bg-[#faf5f1]"
                  >
                    <i className="fa-solid fa-rotate"></i>
                    전체 교체(리셋)
                  </button>

                  {ocrFiles.length > 0 && !ocrLoading && (
                    <button
                      type="button"
                      onClick={() => handleOcr()}
                      className="flex h-10 items-center gap-2 rounded-[8px] bg-[#3d332d] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2d2521]"
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                      {notSuccessCount > 0 ? `분석 (미분석 ${notSuccessCount}장)` : "분석 (변경 없음)"}
                    </button>
                  )}

                  {Object.values<FileStatus>(ocrFileStatuses).some((s) => s.status === "failed") && !ocrLoading && (
                    <button
                      type="button"
                      onClick={handleRetryFailed}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-rose-700 transition-all flex items-center gap-2"
                    >
                      <i className="fa-solid fa-rotate-right"></i>
                      실패 파일만 재시도
                    </button>
                  )}
                </div>
              </div>
            </div>

            {ocrFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  촬영/선택한 사진 리스트
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {ocrFiles.map((f, idx) => {
                    const k = fileKey(f);
                    const s = ocrFileStatuses[f.name];
                    const badge = statusBadge(s);
                    return (
                      <div key={k} className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={thumbUrls[k]} alt={f.name} className="w-full h-full object-cover" />
                        <div className={`absolute top-2 left-2 text-[9px] px-2 py-1 rounded-lg text-white font-black ${badge.cls}`}>
                          {badge.text}
                          {s?.status === "retrying" && s.retryCount ? ` ${s.retryCount}/3` : ""}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[9px] px-2 py-1 font-bold truncate">
                          {idx + 1}. {f.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {ocrLoading && (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <i className="fa-solid fa-receipt absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600"></i>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-800">
                    {ocrProgress ? `${ocrProgress.current}/${ocrProgress.total} 사진 분석 중...` : "준비 중..."}
                  </p>
                  <p className="text-xs font-bold text-indigo-600 mt-1">{ocrOptimizing ? "이미지 최적화 중..." : "서버 OCR 호출 중..."}</p>
                </div>
              </div>
            )}

            {ocrError && (
              <div className="space-y-2">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {ocrError}
                </div>
                {ocrErrorDetail && (
                  <div className="p-3 bg-rose-900/5 border border-rose-200 rounded-xl">
                    <p className="text-[10px] font-bold text-rose-800 mb-1 uppercase tracking-wider">Error Details:</p>
                    <pre className="text-[9px] text-rose-700 font-mono whitespace-pre-wrap break-all leading-relaxed">{ocrErrorDetail}</pre>
                  </div>
                )}
              </div>
            )}

            {ocrRawText && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isJapanPilot ? "스캔 합계 (VAT 포함)" : "스캔 합계 (메뉴 합계)"}</p>
                        <p className="text-lg font-black text-indigo-600">
                          {formatCurrencyValue(scanTotal, (data as any).country)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">영수증 총액 (Total)</p>
                        <p className="text-lg font-black text-slate-800">
                          {receiptTotal !== null ? formatCurrencyValue(receiptTotal, (data as any).country) : "미검출"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {receiptTotal !== null ? (
                        <div
                          className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black ${
                            isTotalMatched ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                          }`}
                        >
                          <i className={`fa-solid ${isTotalMatched ? "fa-circle-check" : "fa-circle-exclamation"}`}></i>
                          {isTotalMatched ? "총액 일치 (정확 가능성 높음)" : "총액 불일치 (재확인 필요)"}
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-black">
                          <i className="fa-solid fa-circle-info"></i>
                          영수증 총액 미검출 (메뉴 합계만 표시)
                        </div>
                      )}
                    </div>
                  </div>

                  {receiptTotal !== null && !isTotalMatched && (
                    <p className="mt-3 text-[10px] text-rose-500 font-medium italic">
                      * 차이: {formatCurrencyValue(scanTotal - receiptTotal, (data as any).country)}. 메뉴 수량/가격을 다시 확인해 주세요.
                    </p>
                  )}
                  {ocrPriceMismatches.length > 0 && (
                    <p className="mt-3 text-[10px] text-amber-600 font-medium">
                      OCR 인식 가격과 메뉴 마스터 가격이 다른 메뉴: {ocrPriceMismatches
                        .map((item) => item.name)
                        .join(", ")}. OCR 총액은 영수증 인식 가격으로 계산됩니다.
                    </p>
                  )}
                  <div
                    className={`mt-3 rounded-lg border px-3 py-2 text-[10px] font-medium ${
                      receiptDateValidation.status === "PASS"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : receiptDateValidation.status === "BLOCK"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className="font-black">
                      영수증 날짜 검증: {receiptDateValidation.status === "PASS"
                        ? "정상"
                        : receiptDateValidation.status === "BLOCK"
                        ? "차단"
                        : "경고"}
                    </span>
                    <span className="ml-2">검출 날짜: {formatReceiptDate(receiptDateValidation.date)}</span>
                    <span className="ml-2">{receiptDateValidation.message}</span>
                  </div>
                  <div
                    className={`mt-3 rounded-lg border px-3 py-2 text-[10px] font-medium ${
                      receiptStoreValidation.status === "PASS"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : receiptStoreValidation.status === "BLOCK"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className="font-black">
                      영수증 매장 검증: {receiptStoreValidation.status === "PASS"
                        ? "정상"
                        : receiptStoreValidation.status === "BLOCK"
                        ? "차단"
                        : "경고"}
                    </span>
                    <span className="ml-2">현재 매장: {storeName || "미확인"}</span>
                    <span className="ml-2">{receiptStoreValidation.message}</span>
                    {receiptStoreFileValidations.map((validation) => (
                      <div key={validation.fileKey} className="mt-1">
                        <span className="font-black">{validation.fileName}</span>
                        <span className="ml-2">
                          OCR 매장명: {validation.receiptStoreName || "미인식"}
                        </span>
                        <span className="ml-2">
                          {validation.status === "PASS"
                            ? "정상"
                            : validation.status === "BLOCK"
                            ? "차단"
                            : "경고"}
                        </span>
                        <span className="ml-2">{validation.message}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className={`mt-3 rounded-lg border px-3 py-2 text-[10px] font-medium ${
                      receiptCurrencyValidation.status === "PASS"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : receiptCurrencyValidation.status === "BLOCK"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className="font-black">
                      영수증 통화 검증: {receiptCurrencyValidation.status === "PASS"
                        ? "정상"
                        : receiptCurrencyValidation.status === "BLOCK"
                        ? "차단"
                        : "경고"}
                    </span>
                    <span className="ml-2">예상 통화: {currency}</span>
                    <span className="ml-2">{receiptCurrencyValidation.message}</span>
                    {receiptCurrencyFileValidations.map((validation) => (
                      <div key={validation.fileKey} className="mt-1">
                        <span className="font-black">{validation.fileName}</span>
                        <span className="ml-2">
                          OCR 인식 통화: {validation.receiptCurrency || "미인식"}
                        </span>
                        <span className="ml-2">
                          {validation.status === "PASS"
                            ? "정상"
                            : validation.status === "BLOCK"
                            ? "차단"
                            : "경고"}
                        </span>
                        <span className="ml-2">{validation.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500">추출 텍스트(누적)</label>
                    <textarea
                      readOnly
                      value={ocrRawText}
                      className="w-full h-48 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 font-mono focus:ring-1 focus:ring-indigo-400 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500">인식된 메뉴 (누적 {ocrItemsAccumulated.length}개)</label>
                    <div className="h-48 p-4 bg-slate-50 rounded-xl border border-slate-100 overflow-y-auto space-y-4">
                      {needsReviewItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            확인 필요 ({needsReviewItems.length})
                          </p>
                          {ocrItemsAccumulated.map((item, idx) => {
                            if (!item.needs_review) return null;
                            return (
                              <div key={idx} className="p-2 bg-rose-50 border border-rose-100 rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] text-rose-400 font-bold">인식 원문: {item.item_original}</p>
                                    <p className="text-xs font-black text-slate-700">추천: {item.item_corrected}</p>
                                  </div>
                                  <span className="text-[9px] font-bold text-rose-400">{(item.confidence * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.candidates?.map((cand) => (
                                    <button
                                      key={cand.id}
                                      onClick={() => handleConfirmCorrection(idx, cand.id)}
                                      className="px-2 py-1 bg-white border border-rose-200 rounded-md text-[9px] font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                      {cand.name}
                                    </button>
                                  ))}
                                  <select
                                    onChange={(e) => handleConfirmCorrection(idx, e.target.value)}
                                    className="px-2 py-1 bg-white border border-rose-200 rounded-md text-[9px] font-bold text-rose-600 outline-none"
                                    value=""
                                  >
                                    <option value="" disabled>
                                      직접 선택...
                                    </option>
                                    {allMenus.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {confirmedItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <i className="fa-solid fa-circle-check"></i>
                            자동 교정 완료 ({confirmedItems.length})
                          </p>
                          <ul className="space-y-1">
                            {ocrItemsAccumulated.map((item, idx) => {
                              if (item.needs_review) return null;
                              return (
                                <li key={idx} className="text-xs flex justify-between border-b border-slate-200 py-1 group">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">{item.item_corrected}</span>
                                    <span className="text-[9px] text-slate-400 italic">원문: {item.item_original}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end leading-tight">
                                      <span className="text-indigo-600 font-black">{item.qty}</span>
                                      <span
                                        className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                                          (item as any).order_channel === "TAKEOUT"
                                            ? "bg-amber-50 text-amber-600"
                                            : "bg-sky-50 text-sky-600"
                                        }`}
                                      >
                                        {(item as any).order_channel === "TAKEOUT" ? "포장" : "홀"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setOcrItemsAccumulated((prev) => {
                                          const next = [...prev];
                                          next[idx] = {
                                            ...next[idx],
                                            needs_review: true,
                                          };
                                          return next;
                                        });
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 hover:text-rose-500 transition-all"
                                    >
                                      수정
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {ocrItemsAccumulated.length === 0 && (
                        <p className="text-xs text-slate-400 text-center mt-10">
                          인식된 메뉴가 없습니다. (영수증 형식이 다르면 파싱 규칙을 추가해야 함)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button
                    onClick={resetOcr}
                    className="px-4 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-black hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    🧹 OCR 데이터 초기화
                  </button>

                  <button
                    onClick={applyOcr}
                    disabled={
                      ocrItemsAccumulated.length === 0 ||
                      receiptDateValidation.status === "BLOCK" ||
                      receiptStoreValidation.status === "BLOCK" ||
                      receiptCurrencyValidation.status === "BLOCK"
                    }
                    className="flex items-center gap-2 rounded-xl bg-[#8b6f5b] px-6 py-3 text-sm font-semibold text-white shadow-[0_7px_16px_rgba(111,64,39,0.16)] transition hover:bg-[#745846] active:scale-95 disabled:bg-[#d8d1cb]"
                  >
                    <i className="fa-solid fa-check"></i>
                    ✅ 데이터 입력창에 적용하기
                  </button>

                  <button
                    onClick={() => setShowOcr(false)}
                    className="px-4 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-xmark"></i>✕ OCR 닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={manualSalesRef} className="order-1 overflow-visible rounded-[16px] border border-[#e8e1db] bg-white shadow-[0_4px_14px_rgba(70,54,42,0.04)]">
        <div className="border-b border-[#eee8e3] bg-[#fdfaf8] px-4 py-3">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#302a27]">
            <i className="fa-solid fa-calendar-day text-[#8b6f5b]"></i>
            기본 정보 및 목표
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">POS 총매출</label>
            <div className="relative">
              <input
                data-base-input="true"
                data-base-key="posSales"
                type="number"
                value={data.posSales || ""}
                onChange={(e) => updateBaseField("posSales", Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextBaseInput("posSales");
                  }
                }}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">배달 매출</label>
            <div className="relative">
              <input
                data-base-input="true"
                data-base-key="deliverySales"
                type="number"
                value={(data as any).deliverySales || ""}
                onChange={(e) =>
                  updateBaseField("deliverySales" as any, Number(e.target.value))
                }
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextBaseInput("deliverySales");
                  }
                }}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">방문객 수 (유입)</label>
            <div className="relative">
              <input
                data-base-input="true"
                data-base-key="visitCount"
                type="number"
                value={data.visitCount || ""}
                onChange={(e) => updateBaseField("visitCount", Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextBaseInput("visitCount");
                  }
                }}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                명
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">주문수 (영수증)</label>
            <div className="relative">
              <input
                data-base-input="true"
                data-base-key="orders"
                type="number"
                value={data.orders || ""}
                onChange={(e) => updateBaseField("orders", Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextBaseInput("orders");
                  }
                }}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                건
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">특이사항 (날씨, 인력, 품절 등)</label>
            <input
              type="text"
              value={data.note}
              onChange={(e) => updateBaseField("note", e.target.value)}
              placeholder="예: 비 옴, 짜장면 품절 등"
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <section className="order-3 rounded-[16px] border border-[#dce9df] bg-white p-4 shadow-[0_4px_14px_rgba(70,54,42,0.04)]">
       <div>
  <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[12px] border border-[#dfe7f0] sm:grid-cols-3 sm:gap-0">
    <div className="bg-[#f8fbff] px-3 py-3 sm:border-r sm:border-[#dfe7f0]">
      <div className="text-[10px] font-black text-slate-400">입력 매출 합계</div>
      <div className="mt-1 text-[15px] font-black text-slate-900">
        {formatCurrencyValue(enteredSalesTotal, (data as any).country)}
      </div>
      <div className="mt-0.5 text-[10px] text-slate-400">
        {isJapanPilot ? "소비세 포함 기준" : "POS + 배달"}
      </div>
    </div>

    <div className="border-t border-[#dfe7f0] bg-[#f8fbff] px-3 py-3 sm:border-t-0 sm:border-r">
      <div className="text-[10px] font-black text-slate-400">
        메뉴 매출 합계
      </div>

      <div className="mt-1 text-[15px] font-black text-slate-900">
        {formatCurrencyValue(
          isJapanPilot ? menuSalesTotalWithVat : menuSalesTotal,
          (data as any).country
        )}
      </div>

      <div className="mt-0.5 text-[10px] text-slate-400">
        {isJapanPilot ? "음식 홀 10% / 포장·음료 8% 포함" : "수량 × 메뉴가격"}
      </div>
    </div>

    <div
      className={`border-t px-3 py-3 sm:border-t-0 ${
        salesGap === 0
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="text-[10px] font-black text-slate-400">오차</div>

      <div
        className={`mt-1 text-[15px] font-black ${
          salesGap === 0 ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {salesGap > 0 ? "+" : ""}
        {formatCurrencyValue(salesGap, (data as any).country)}
      </div>

      <div className="mt-0.5 text-[10px] text-slate-400">
        입력 매출 - 메뉴 매출
      </div>
    </div>
  </div>
</div>
      </section>
      <section className="order-4 overflow-hidden rounded-[16px] border border-[#e8e1db] bg-white shadow-[0_4px_14px_rgba(70,54,42,0.04)]">
        <div className="flex items-center justify-between border-b border-[#eee8e3] bg-[#fdfaf8] px-4 py-3"><h2 className="text-[14px] font-semibold text-[#302a27]">메뉴 판매량 입력</h2><span className="text-[10px] font-medium text-[#857a73]">모든 금액은 원 기준</span></div>
      <div className="divide-y divide-[#eee8e3]">
        {(() => {
          let flatInputIndex = 0;

          return data.categories.map((cat, catIdx) => (
            <div key={cat.name}>
              <button type="button" onClick={() => setExpandedCategories((current) => current.includes(cat.name) ? current.filter((name) => name !== cat.name) : [...current, cat.name])} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <h3 className="text-[13px] font-semibold text-[#302a27]">{cat.name}</h3><i className={`fa-solid fa-chevron-${expandedCategories.includes(cat.name) ? "up" : "down"} text-[11px] text-[#766b64]`} />
              </button>
              {expandedCategories.includes(cat.name) && <div className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-[#f0ebe7] px-4 pb-3 pt-1 sm:grid-cols-2">
                {cat.items.map((item, itemIdx) => {
                  const currentFlatIndex = flatInputIndex;
                  flatInputIndex += isJapanPilot ? 2 : 1;

                  if (isJapanPilot) {
                    const dineInQty = getDineInQty(item);
                    const takeoutQty = getTakeoutQty(item);
                    return (
                      <div key={item.id} className="grid grid-cols-[1fr_58px_58px] items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                        <span className="text-[13px] font-medium text-slate-700 truncate">
                          {item.name}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({formatCurrencyValue(item.price, (data as any).country)})
                          </span>
                        </span>
                        <div>
                          <div className="mb-0.5 text-center text-[8px] font-black text-sky-500">홀</div>
                          <input
                            data-menu-qty-input="true"
                            type="number"
                            min="0"
                            value={dineInQty || ""}
                            onChange={(e) => updateChannelQty(catIdx, itemIdx, "DINE_IN", Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                focusNextMenuQtyInput(currentFlatIndex);
                              }
                            }}
                            className="w-full rounded-[8px] border border-[#e3dad3] bg-white px-2 py-2 text-right text-[14px] font-semibold text-[#332923] outline-none focus:border-[#a8866b] focus:ring-2 focus:ring-[#f5ece5]"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <div className="mb-0.5 text-center text-[8px] font-black text-amber-500">포장</div>
                          <input
                            data-menu-qty-input="true"
                            type="number"
                            min="0"
                            value={takeoutQty || ""}
                            onChange={(e) => updateChannelQty(catIdx, itemIdx, "TAKEOUT", Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                focusNextMenuQtyInput(currentFlatIndex + 1);
                              }
                            }}
                            className="w-full rounded-[8px] border border-[#e3dad3] bg-white px-2 py-2 text-right text-[14px] font-semibold text-[#332923] outline-none focus:border-[#a8866b] focus:ring-2 focus:ring-[#f5ece5]"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
                      <span className="text-[13px] font-medium text-slate-700 truncate flex-1">
                        {item.name}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({formatCurrencyValue(item.price, (data as any).country)})
                        </span>
                      </span>
                      <div className="relative w-14">
                        <input
                          data-menu-qty-input="true"
                          type="number"
                          min="0"
                          value={item.qty || ""}
                          onChange={(e) => updateQty(catIdx, itemIdx, Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              focusNextMenuQtyInput(currentFlatIndex);
                            }
                          }}
                          className="w-full rounded-[8px] border border-[#e3dad3] bg-white px-2 py-2 text-right text-[14px] font-semibold text-[#332923] outline-none focus:border-[#a8866b] focus:ring-2 focus:ring-[#f5ece5]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>}
            </div>
          ));
               })()}
      </div>
      </section>
  </div>
  );
};

export default DataInput;
