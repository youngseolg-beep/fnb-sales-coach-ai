// /src/components/DataInput.tsx
import React from "react";
import { SalesReportData, CorrectedItem } from "../types";
import { format, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import { callOcr } from "../services/services/ocrService";

interface DataInputProps {
  data: SalesReportData;
  onChange: (newData: SalesReportData) => void;
  loading: boolean;
  datesWithData?: string[];
  onMonthChange?: (month: Date) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 파일을 base64로 변환 */
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

/** OCR용 이미지 압축 */
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

/** OCR rawText에서 메뉴 라인 파싱 */
function extractMenuItemsFromRawText(rawText: string): { name: string; price: number; qty: number }[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: { name: string; price: number; qty: number }[] = [];

  const r1 = /^(.+?)\s*\(\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*\)\s*.*?\bx\s*([0-9]+)\b/i;
  const r2 = /^(.+?)\s+.*?\bx\s*([0-9]+)\b/i;
  const r3 = /^(.+?)\s+([0-9]+)\s+\$?\s*([0-9]+(?:\.[0-9]+)?)$/i;

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
  ];

  for (const line of lines) {
    const up = line.toUpperCase();
    if (skipKeywords.some((k) => up.includes(k))) continue;
    if (line.length < 2) continue;

    let m = line.match(r1);
    if (m) {
      const name = m[1].replace(/\.+/g, " ").trim();
      const price = parseFloat(m[2] || "0") || 0;
      const qty = parseInt(m[3] || "0", 10) || 0;
      if (name && qty > 0) items.push({ name, price, qty });
      continue;
    }

    m = line.match(r3);
    if (m) {
      const name = m[1].replace(/\.+/g, " ").trim();
      const qty = parseInt(m[2] || "0", 10) || 0;
      const price = parseFloat(m[3] || "0") || 0;
      if (name && qty > 0) items.push({ name, price, qty });
      continue;
    }

    m = line.match(r2);
    if (m) {
      const name = m[1].replace(/\.+/g, " ").trim();
      const qty = parseInt(m[2] || "0", 10) || 0;
      if (name && qty > 0) items.push({ name, price: 0, qty });
      continue;
    }
  }

  const merged: Record<string, { name: string; price: number; qty: number }> = {};
  for (const it of items) {
    const key = `${it.name}||${it.price}`;
    if (!merged[key]) merged[key] = { ...it };
    else merged[key].qty += it.qty;
  }

  return Object.values(merged);
}

type FileStatus = {
  status: "pending" | "processing" | "success" | "failed" | "retrying";
  error?: string;
  retryCount?: number;
};

const DataInput: React.FC<DataInputProps> = ({ data, onChange, loading, datesWithData, onMonthChange }) => {
  const updateBaseField = (field: keyof SalesReportData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateQty = (catIdx: number, itemIdx: number, qty: number) => {
    const newCategories = [...data.categories];
    newCategories[catIdx].items[itemIdx].qty = qty;
    onChange({ ...data, categories: newCategories });
  };

  const inputClasses =
    "w-full bg-white text-[#111827] placeholder-[#9CA3AF] border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-400 outline-none transition-all";
  const numericInputClasses = `${inputClasses} text-right pr-12`;

  // OCR state
  const [ocrFiles, setOcrFiles] = React.useState<File[]>([]);
  const [ocrFileStatuses, setOcrFileStatuses] = React.useState<Record<string, FileStatus>>({});
  const [thumbUrls, setThumbUrls] = React.useState<Record<string, string>>({});

  const [ocrRawText, setOcrRawText] = React.useState<string>("");
  const [ocrItemsAccumulated, setOcrItemsAccumulated] = React.useState<CorrectedItem[]>([]);
  const [manualMappings, setManualMappings] = React.useState<Record<string, string>>({});
  const [ocrLoading, setOcrLoading] = React.useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [ocrOptimizing, setOcrOptimizing] = React.useState<boolean>(false);
  const [ocrError, setOcrError] = React.useState<string>("");
  const [ocrErrorDetail, setOcrErrorDetail] = React.useState<string>("");
  const [showOcr, setShowOcr] = React.useState<boolean>(false);

  const addInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  // Calendar state
  const [showCalendar, setShowCalendar] = React.useState(false);
  const calendarButtonRef = React.useRef<HTMLButtonElement>(null);
  const [calendarPos, setCalendarPos] = React.useState({ top: 0, left: 0 });

  const toggleCalendar = () => {
    if (!showCalendar && calendarButtonRef.current) {
      const rect = calendarButtonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const popupWidth = 320;

      let left = rect.left;
      if (left + popupWidth > windowWidth) left = windowWidth - popupWidth - 20;
      if (left < 20) left = 20;

      setCalendarPos({
        top: rect.bottom + window.scrollY + 8,
        left,
      });
    }
    setShowCalendar(!showCalendar);
  };

  React.useEffect(() => {
    if (!showCalendar) return;
    const close = () => setShowCalendar(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [showCalendar]);

  // 파일 키(중복 방지)
  const fileKey = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;

  // 썸네일 URL 관리
  React.useEffect(() => {
    // 새로 생긴 파일만 URL 생성
    const next: Record<string, string> = { ...thumbUrls };
    for (const f of ocrFiles) {
      const k = fileKey(f);
      if (!next[k]) next[k] = URL.createObjectURL(f);
    }

    // 제거된 파일 URL revoke
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrFiles]);

  // 메뉴명 정규화/유사도
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

  const allMenus = React.useMemo(() => {
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

  /** OCR 파싱 결과를 실제 메뉴로 자동 교정 */
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

  /** 서버 OCR 호출 (429 재시도 포함) */
  const callOcrWithRetry = async (imageBase64: string, mimeType: string, fileName: string) => {
    const delays = [2000, 5000, 10000];
    let lastErr: any;

    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        return await callOcr(imageBase64, mimeType);
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || "");
        const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Rate");

        if (is429 && attempt < 3) {
          const delay = delays[attempt] + Math.random() * 800;
          setOcrFileStatuses((prev) => ({
            ...prev,
            [fileName]: { ...(prev[fileName] || { status: "pending" }), status: "retrying", retryCount: attempt + 1 },
          }));
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  };

  // ✅ OCR 파일 추가(누적) - 기존 결과 유지
  const appendFiles = (files: File[]) => {
    if (!files || files.length === 0) return;

    setOcrFiles((prev) => {
      const prevKeys = new Set(prev.map((f) => fileKey(f)));
      const next = [...prev];

      for (const f of files) {
        const k = fileKey(f);
        if (prevKeys.has(k)) continue; // 완전 동일 파일(이름/사이즈/시간) 중복 방지
        next.push(f);
        prevKeys.add(k);
      }
      return next;
    });

    // 신규 파일 status만 pending 추가
    setOcrFileStatuses((prev) => {
      const next = { ...prev };
      for (const f of files) {
        if (!next[f.name]) next[f.name] = { status: "pending" };
      }
      return next;
    });
  };

  // ✅ 전체 교체(리셋)
  const replaceAllFiles = (files: File[]) => {
    setOcrFiles(files);
    const nextStatus: Record<string, FileStatus> = {};
    files.forEach((f) => (nextStatus[f.name] = { status: "pending" }));
    setOcrFileStatuses(nextStatus);

    // 교체는 “새로 시작”으로 간주 → OCR 결과 초기화
    setOcrRawText("");
    setOcrItemsAccumulated([]);
    setOcrError("");
    setOcrErrorDetail("");
    setOcrProgress(null);
  };

  // ✅ OCR 실행: 기본은 "미분석/실패 파일만"
  const handleOcr = async (filesToProcessOverride?: File[]) => {
    const statuses = ocrFileStatuses || {};
    const defaultTargets = ocrFiles.filter((f) => {
      const s = statuses[f.name]?.status;
      return s !== "success"; // 성공한 건 재스캔 안 함
    });

    const filesToProcess = filesToProcessOverride || defaultTargets;
    if (filesToProcess.length === 0) return;

    setOcrLoading(true);
    setOcrError("");
    setOcrErrorDetail("");
    setOcrProgress({ current: 0, total: filesToProcess.length });

    // 상태 초기화(대상만)
    setOcrFileStatuses((prev) => {
      const next = { ...prev };
      filesToProcess.forEach((f) => (next[f.name] = { status: "pending" }));
      return next;
    });

    for (let i = 0; i < filesToProcess.length; i++) {
      const currentFile = filesToProcess[i];
      setOcrProgress({ current: i + 1, total: filesToProcess.length });

      setOcrFileStatuses((prev) => ({
        ...prev,
        [currentFile.name]: { status: "processing" },
      }));

      if (i > 0) await sleep(1800 + Math.random() * 1000);

      try {
        setOcrOptimizing(true);

        const optimizedFile = await compressForOcr(currentFile, 1024, 0.6);
        const { base64, mimeType } = await fileToBase64(optimizedFile);

        setOcrOptimizing(false);

        const ocrResult = await callOcrWithRetry(base64, mimeType, currentFile.name);

        const extractedText = String(ocrResult?.rawText || "").trim();
        if (!extractedText) throw new Error("텍스트를 추출하지 못했습니다.");

        // rawText 누적 표시
        setOcrRawText((prev) => prev + (prev ? "\n\n" : "") + `--- File: ${currentFile.name} ---\n` + extractedText);

        // 메뉴 파싱
        const parsedItems = extractMenuItemsFromRawText(extractedText);

        // 메뉴명 자동교정
        const correctedNewItems = parsedItems.map((it) => autoCorrectItem(it));

        // ✅ 누적 반영(중복 누적은 “apply 단계에서 해결” / 현재 단계는 raw 인식 누적)
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
          [currentFile.name]: { status: "failed", error: err?.message || "알 수 없는 오류" },
        }));

        setOcrError((prev) => prev + (prev ? "\n" : "") + `${currentFile.name}: 인식 실패`);
        setOcrErrorDetail(errorDetail);
      } finally {
        setOcrOptimizing(false);
      }
    }

    setOcrLoading(false);
    setOcrProgress(null);
  };

  const handleRetryFailed = () => {
    const failedFiles = ocrFiles.filter((f) => ocrFileStatuses[f.name]?.status === "failed");
    if (failedFiles.length > 0) handleOcr(failedFiles);
  };

  const resetOcr = () => {
    setOcrFiles([]);
    setOcrFileStatuses({});
    setOcrRawText("");
    setOcrItemsAccumulated([]);
    setOcrError("");
    setOcrErrorDetail("");
    setOcrProgress(null);
  };

  // ✅ apply 시 “중복 메뉴 방지”는 이미 해결한 버전 기준(‘최대값’ 적용 로직)
  // - 같은 메뉴가 여러 장에서 반복되면 합산이 아니라 "최대값"으로 반영
  //   (영수증 분할 촬영에서 동일 라인이 겹쳐 찍히는 케이스 대비)
  const applyOcr = () => {
    if (ocrItemsAccumulated.length === 0) return;

    const newCategories = data.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((it) => ({ ...it })),
    }));

    // ✅ 메뉴별 qty를 “최대값”으로 결정
    const qtyMaxById = new Map<string, number>();

    for (const item of ocrItemsAccumulated) {
      if (item.needs_review || !item.matched_id) continue;
      const prev = qtyMaxById.get(item.matched_id) || 0;
      qtyMaxById.set(item.matched_id, Math.max(prev, Number(item.qty || 0)));
    }

    let appliedCount = 0;
    newCategories.forEach((cat) => {
      cat.items.forEach((menuItem) => {
        const v = qtyMaxById.get(menuItem.id);
        if (v !== undefined && v > 0) {
          menuItem.qty = v; // ✅ 최대값으로 “세팅”
          appliedCount++;
        }
      });
    });

    onChange({ ...data, categories: newCategories });
    alert(`${appliedCount}개의 메뉴가 중복 제거(최대값 기준)로 적용되었습니다.`);
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
          item_corrected: matched.name,
          needs_review: false,
          confidence: 1.0,
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

  // 합계 비교
  const scanTotal = React.useMemo(() => {
    return ocrItemsAccumulated.reduce((sum, item) => {
      const menuPrice = item.matched_id ? allMenus.find((m) => m.id === item.matched_id)?.price : null;
      const priceToUse = menuPrice !== null && menuPrice !== undefined ? menuPrice : item.unit_price;
      return sum + priceToUse * item.qty;
    }, 0);
  }, [ocrItemsAccumulated, allMenus]);

  // 영수증 TOTAL 추출
  const extractReceiptTotal = (text: string): number | null => {
    if (!text) return null;
    const keywords = ["TOTAL", "합계", "총액", "GRAND TOTAL", "AMOUNT", "NET TOTAL", "G.TOTAL"];
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

  const receiptTotal = React.useMemo(() => extractReceiptTotal(ocrRawText), [ocrRawText]);

  const isTotalMatched = React.useMemo(() => {
    if (receiptTotal === null) return null;
    const diff = Math.abs(scanTotal - receiptTotal);
    const tolerance = Math.max(receiptTotal * 0.01, 1);
    return diff <= tolerance;
  }, [scanTotal, receiptTotal]);

  // ✅ 상태 배지 텍스트
  const statusBadge = (s?: FileStatus) => {
    const st = s?.status;
    if (st === "success") return { text: "성공", cls: "bg-emerald-600" };
    if (st === "failed") return { text: "실패", cls: "bg-rose-600" };
    if (st === "processing") return { text: "처리중", cls: "bg-indigo-600" };
    if (st === "retrying") return { text: `재시도`, cls: "bg-amber-600" };
    return { text: "대기", cls: "bg-slate-500" };
  };

  const notSuccessCount = ocrFiles.filter((f) => ocrFileStatuses[f.name]?.status !== "success").length;

  return (
    <div className="space-y-8">
      {/* OCR Toggle Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowOcr(!showOcr)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black border border-indigo-100 hover:bg-indigo-100 transition-all"
        >
          <i className="fa-solid fa-receipt"></i>
          {showOcr ? "OCR 닫기" : "영수증 업로드로 자동 입력"}
        </button>
      </div>

      {/* OCR Receipt Upload Section */}
      {showOcr && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 overflow-visible animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-receipt text-indigo-500"></i>
              영수증 OCR 분석
            </h2>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Beta</span>
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

            {/* Hidden inputs */}
            <input
              ref={addInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                appendFiles(files);
                // 같은 파일 다시 선택 가능하도록 reset
                e.currentTarget.value = "";
              }}
              className="hidden"
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                replaceAllFiles(files);
                e.currentTarget.value = "";
              }}
              className="hidden"
            />

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i>
                    사진 추가
                  </button>

                  <button
                    type="button"
                    onClick={() => replaceInputRef.current?.click()}
                    className="px-4 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-rotate"></i>
                    전체 교체(리셋)
                  </button>

                  {ocrFiles.length > 0 && !ocrLoading && (
                    <button
                      type="button"
                      onClick={() => handleOcr()}
                      className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                      {notSuccessCount > 0 ? `분석 (미분석 ${notSuccessCount}장)` : "분석 (변경 없음)"}
                    </button>
                  )}

                  {Object.values(ocrFileStatuses).some((s) => s.status === "failed") && !ocrLoading && (
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

            {/* Thumbnail list */}
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">스캔 합계 (메뉴 합계)</p>
                        <p className="text-lg font-black text-indigo-600">
                          {scanTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">영수증 총액 (Total)</p>
                        <p className="text-lg font-black text-slate-800">
                          {receiptTotal !== null ? receiptTotal.toLocaleString() : "미검출"}
                          {receiptTotal !== null && <span className="text-xs font-normal text-slate-400 ml-1">USD</span>}
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
                      * 차이: {(scanTotal - receiptTotal).toLocaleString()} USD. 메뉴 수량/가격을 다시 확인해 주세요.
                    </p>
                  )}
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
                                    <span className="text-indigo-600 font-black">{item.qty}</span>
                                    <button
                                      onClick={() => {
                                        setOcrItemsAccumulated((prev) => {
                                          const next = [...prev];
                                          next[idx].needs_review = true;
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
                    disabled={ocrItemsAccumulated.length === 0}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:bg-slate-200 flex items-center gap-2"
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

      {/* 1. Basic Info & Monthly Target */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-calendar-day text-indigo-500"></i>
            기본 정보 및 목표
          </h2>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Field */}
          <div className="lg:col-span-1 relative">
            <label className="block text-xs font-bold text-slate-500 mb-1">날짜 선택</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <button
                  ref={calendarButtonRef}
                  onClick={toggleCalendar}
                  className={`${inputClasses} w-full text-left flex items-center justify-between`}
                >
                  {data.date}
                  <i className="fa-solid fa-calendar text-slate-400"></i>
                </button>

                {showCalendar && (
                  <div
                    style={{
                      position: "fixed",
                      top: calendarPos.top - window.scrollY,
                      left: calendarPos.left,
                      zIndex: 9999,
                    }}
                    className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200 min-w-[320px]"
                  >
                    <DayPicker
                      mode="single"
                      selected={parseISO(data.date)}
                      onSelect={(date) => {
                        if (date) {
                          updateBaseField("date", format(date, "yyyy-MM-dd"));
                          setShowCalendar(false);
                        }
                      }}
                      onMonthChange={onMonthChange}
                      modifiers={{
                        hasData: (datesWithData || []).map((d) => parseISO(d)),
                      }}
                      modifiersClassNames={{
                        hasData: "has-data",
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  updateBaseField("date", today);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 transition-colors uppercase"
              >
                Today
              </button>
            </div>
          </div>

          {/* POS Total Sales */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">POS 총매출</label>
            <div className="relative">
              <input
                type="number"
                value={data.posSales || ""}
                onChange={(e) => updateBaseField("posSales", Number(e.target.value))}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                USD
              </span>
            </div>
          </div>

          {/* Visitor Count */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">방문객 수 (유입)</label>
            <div className="relative">
              <input
                type="number"
                value={data.visitCount || ""}
                onChange={(e) => updateBaseField("visitCount", Number(e.target.value))}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                명
              </span>
            </div>
          </div>

          {/* Orders */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">주문수 (영수증)</label>
            <div className="relative">
              <input
                type="number"
                value={data.orders || ""}
                onChange={(e) => updateBaseField("orders", Number(e.target.value))}
                className={numericInputClasses}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                건
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 mb-1">특이사항 (날씨, 인력, 품절 등)</label>
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

      {/* 2. Menu Quantities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.categories.map((cat, catIdx) => (
          <div key={cat.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-3">
              <h3 className="font-bold text-indigo-900 text-sm">{cat.name}</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {cat.items.map((item, itemIdx) => (
                <div key={item.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-700 truncate flex-1">
                    {item.name} <span className="text-[10px] text-slate-400 font-normal">(${item.price})</span>
                  </span>
                  <div className="relative w-16">
                    <input
                      type="number"
                      min="0"
                      value={item.qty || ""}
                      onChange={(e) => updateQty(catIdx, itemIdx, Number(e.target.value))}
                      className="w-full bg-white text-[#111827] placeholder-[#9CA3AF] border border-slate-200 rounded-lg px-2 py-1 text-right text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataInput;
