import { getAuthenticatedApiHeaders } from "./apiAuth";

export const OCR_REQUEST_TIMEOUT_MS = 45_000;
export const OCR_MAX_IMAGES = 8;
export const OCR_MAX_ORIGINAL_IMAGE_BYTES = 12 * 1024 * 1024;
export const OCR_MAX_PROCESSED_IMAGE_BYTES = 4 * 1024 * 1024;
export const OCR_MAX_TOTAL_IMAGE_BYTES = 16 * 1024 * 1024;
export const OCR_ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const OCR_TIMEOUT_MESSAGE = "영수증 분석 시간이 초과되었습니다. 다시 시도해 주세요.";
const OCR_NETWORK_ERROR_MESSAGE = "영수증 분석 중 네트워크 오류가 발생했습니다. 다시 시도해 주세요.";
const OCR_SERVER_ERROR_MESSAGE = "영수증 분석 서버 응답을 처리하지 못했습니다. 다시 시도해 주세요.";

export type OcrMenuCandidate =
  | string
  | {
      name: string;
      jp_name?: string | null;
    };

export type OcrItem = {
  receipt_name?: string;
  matched_name?: string;
  qty?: number;
  price?: number;
  line_total?: number;
  order_type?: string;
  confidence?: number;
  needs_review?: boolean;
};

export type OcrResponse = {
  ok: true;
  mode: string;
  rawText: string;
  items: OcrItem[];
  totals: Record<string, unknown>;
  model_used: string;
  receipt_store_name: string | null;
  receipt_currency: string | null;
};

const SUPPORTED_RECEIPT_CURRENCIES = new Set([
  "USD",
  "IDR",
  "PHP",
  "TWD",
  "SGD",
  "MYR",
  "MNT",
  "EUR",
  "AUD",
  "THB",
  "JPY",
  "CNY",
  "KRW",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeOcrItems(value: unknown): OcrItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    receipt_name: typeof item.receipt_name === "string" ? item.receipt_name : undefined,
    matched_name: typeof item.matched_name === "string" ? item.matched_name : undefined,
    qty: typeof item.qty === "number" ? item.qty : undefined,
    price: typeof item.price === "number" ? item.price : undefined,
    line_total: typeof item.line_total === "number" ? item.line_total : undefined,
    order_type: typeof item.order_type === "string" ? item.order_type : undefined,
    confidence: typeof item.confidence === "number" ? item.confidence : undefined,
    needs_review: typeof item.needs_review === "boolean" ? item.needs_review : undefined,
  }));
}

function normalizeOcrResponse(value: unknown): OcrResponse {
  const response = isRecord(value) ? value : {};
  const receiptStoreName =
    typeof response.receipt_store_name === "string" && response.receipt_store_name.trim()
      ? response.receipt_store_name.trim()
      : null;
  const receiptCurrency =
    typeof response.receipt_currency === "string"
      ? response.receipt_currency.trim().toUpperCase()
      : "";

  return {
    ok: true,
    mode: typeof response.mode === "string" ? response.mode : "raw_text",
    rawText: typeof response.rawText === "string" ? response.rawText : "",
    items: normalizeOcrItems(response.items),
    totals: isRecord(response.totals) ? response.totals : {},
    model_used: typeof response.model_used === "string" ? response.model_used : "",
    receipt_store_name: receiptStoreName,
    receipt_currency: SUPPORTED_RECEIPT_CURRENCIES.has(receiptCurrency)
      ? receiptCurrency
      : null,
  };
}

type OcrImagePayload = { imageBase64: string; mimeType: string; fileName?: string };

function normalizeBase64Payload(value: string): string | null {
  const raw = value.trim();
  const dataUrl = raw.match(/^data:[^;,]+;base64,([\s\S]+)$/i);
  const base64 = (dataUrl?.[1] ?? raw).replace(/\s+/g, "");
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) return null;
  const firstPadding = base64.indexOf("=");
  if (firstPadding !== -1 && firstPadding < base64.length - (base64.endsWith("==") ? 2 : 1)) return null;
  return base64;
}

export function estimateBase64DecodedBytes(value: string): number | null {
  const base64 = normalizeBase64Payload(value);
  if (!base64) return null;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function validateClientImages(images: OcrImagePayload[]) {
  if (images.length === 0) throw new Error("영수증 이미지를 선택해 주세요.");
  if (images.length > OCR_MAX_IMAGES) {
    throw new Error("영수증 이미지는 한 번에 최대 8장까지 업로드할 수 있습니다.");
  }

  let totalBytes = 0;
  for (const image of images) {
    const mimeType = image.mimeType.trim().toLowerCase();
    if (!OCR_ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as typeof OCR_ALLOWED_IMAGE_MIME_TYPES[number])) {
      throw new Error("지원하지 않는 이미지 형식입니다. JPEG, PNG 또는 WebP 이미지를 사용해 주세요.");
    }
    const bytes = estimateBase64DecodedBytes(image.imageBase64);
    if (bytes === null) throw new Error("이미지 데이터가 올바르지 않습니다. 다른 이미지를 사용해 주세요.");
    if (bytes > OCR_MAX_PROCESSED_IMAGE_BYTES) {
      throw new Error("이미지 최적화 후에도 용량이 너무 큽니다. 다른 이미지를 사용해 주세요.");
    }
    totalBytes += bytes;
  }

  if (totalBytes > OCR_MAX_TOTAL_IMAGE_BYTES) {
    throw new Error("영수증 이미지 전체 용량이 너무 큽니다. 다른 이미지를 사용해 주세요.");
  }
}

async function parseOcrResponse(res: Response): Promise<OcrResponse> {
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(OCR_SERVER_ERROR_MESSAGE);
  }

  if (!res.ok || !isRecord(json) || !json.ok) {
    throw new Error(
      isRecord(json) && typeof json.message === "string"
        ? json.message
        : res.status === 413
          ? "업로드한 이미지 용량이 제한을 초과했습니다. 다른 이미지를 사용해 주세요."
          : isRecord(json) && typeof json.error === "string"
            ? json.error
            : "OCR server error"
    );
  }

  return normalizeOcrResponse(json);
}

async function fetchOcr(body: Record<string, unknown>): Promise<OcrResponse> {
  const headers = await getAuthenticatedApiHeaders();
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OCR_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch("/api/ocr", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await parseOcrResponse(res);
  } catch (error) {
    if (timedOut) throw new Error(OCR_TIMEOUT_MESSAGE);
    if (error instanceof TypeError) throw new Error(OCR_NETWORK_ERROR_MESSAGE);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function callOcr(
  imageBase64: string,
  mimeType = "image/jpeg",
  options?: {
    userEmail?: string;
    storeId?: number;
    country?: string;
    brand?: string;
    menuCandidates?: OcrMenuCandidate[];
  }
) {
  validateClientImages([{ imageBase64, mimeType }]);
  return fetchOcr({
    imageBase64,
    mimeType,
    storeId: options?.storeId,
    userEmail: options?.userEmail || "",
    country: options?.country || "",
    brand: options?.brand || "",
    menuCandidates: options?.menuCandidates || [],
  });
}

export async function callOcrBatch(
  images: Array<{ imageBase64: string; mimeType: string; fileName?: string }>,
  options?: {
    userEmail?: string;
    storeId?: number;
    country?: string;
    brand?: string;
    menuCandidates?: OcrMenuCandidate[];
  }
) {
  validateClientImages(images);
  return fetchOcr({
    images,
    storeId: options?.storeId,
    userEmail: options?.userEmail || "",
    country: options?.country || "",
    brand: options?.brand || "",
    menuCandidates: options?.menuCandidates || [],
  });
}
