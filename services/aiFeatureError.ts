export type AiFeatureErrorCode =
  | "INSUFFICIENT_DATA"
  | "NO_MENU_DATA"
  | "INVALID_MODEL_RESPONSE"
  | "UNSAFE_COMMERCIAL_TERM"
  | "MODEL_REQUEST_FAILED"
  | "MODEL_TIMEOUT"
  | "AUTH_ERROR"
  | "CONFIG_ERROR"
  | "SERVER_ERROR";

const messages: Record<AiFeatureErrorCode, string> = {
  INSUFFICIENT_DATA: "분석 데이터가 부족합니다. 최소 7일 이상의 매출 데이터를 확인해 주세요.",
  NO_MENU_DATA: "분석할 메뉴 판매 데이터가 없습니다.",
  INVALID_MODEL_RESPONSE: "AI 응답 형식을 확인하지 못했습니다. 다시 시도해 주세요.",
  UNSAFE_COMMERCIAL_TERM: "안전 기준을 충족하는 실행안을 만들지 못했습니다. 다시 시도해 주세요.",
  MODEL_REQUEST_FAILED: "AI 서비스 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  MODEL_TIMEOUT: "AI 서비스 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
  AUTH_ERROR: "로그인 권한을 다시 확인해 주세요.",
  CONFIG_ERROR: "AI 서비스 설정을 확인할 수 없습니다.",
  SERVER_ERROR: "AI 서비스 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

export class AiFeatureError extends Error {
  constructor(
    public readonly feature: "menu_engineering" | "boost_plan",
    public readonly code: AiFeatureErrorCode,
    public readonly status: number,
    public readonly userMessage = messages[code],
    public readonly technicalMessage?: string
  ) {
    super(userMessage);
    this.name = "AiFeatureError";
  }
}

export const getAiFeatureUserMessage = (code: AiFeatureErrorCode) => messages[code];

export const toAiFeatureError = (error: unknown, feature: "menu_engineering" | "boost_plan") => {
  if (error instanceof AiFeatureError) return error;
  return new AiFeatureError(feature, "MODEL_REQUEST_FAILED", 0, messages.MODEL_REQUEST_FAILED, String((error as Error)?.message || error));
};

export const formatStoredAiError = (value: unknown, feature: "menu_engineering" | "boost_plan") => {
  const raw = String(value || "");
  const code = (Object.keys(messages) as AiFeatureErrorCode[]).find((candidate) => raw.startsWith(`${candidate}:`) || raw === candidate);
  if (code) return messages[code];
  if (/unsupported commercial condition/i.test(raw)) return messages.UNSAFE_COMMERCIAL_TERM;
  if (/invalid Menu Engineering strategy response/i.test(raw)) return messages.INVALID_MODEL_RESPONSE;
  return feature === "boost_plan" ? "AI 부스트 플랜을 생성하지 못했습니다." : "AI 메뉴 분석을 생성하지 못했습니다.";
};

export const isRetryableAiFeatureError = (code: AiFeatureErrorCode) =>
  code !== "INSUFFICIENT_DATA" && code !== "NO_MENU_DATA";
