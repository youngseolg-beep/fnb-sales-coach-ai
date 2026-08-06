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
};

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

  return {
    ok: true,
    mode: typeof response.mode === "string" ? response.mode : "raw_text",
    rawText: typeof response.rawText === "string" ? response.rawText : "",
    items: normalizeOcrItems(response.items),
    totals: isRecord(response.totals) ? response.totals : {},
    model_used: typeof response.model_used === "string" ? response.model_used : "",
    receipt_store_name: receiptStoreName,
  };
}

export async function callOcr(
  imageBase64: string,
  mimeType = "image/jpeg",
  options?: {
    userEmail?: string;
    country?: string;
    brand?: string;
    menuCandidates?: OcrMenuCandidate[];
  }
) {
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      userEmail: options?.userEmail || "",
      country: options?.country || "",
      brand: options?.brand || "",
      menuCandidates: options?.menuCandidates || [],
    }),
  });

  const json: unknown = await res.json();
  if (!res.ok || !isRecord(json) || !json.ok) {
    throw new Error(
      isRecord(json) && typeof json.message === "string"
        ? json.message
        : isRecord(json) && typeof json.error === "string"
        ? json.error
        : "OCR server error"
    );
  }

  return normalizeOcrResponse(json);
}
