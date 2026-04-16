import { SalesReportData, CalculationResult, MenuEngineeringResult } from "../types";

const getCurrencyByCountry = (country: string) => {
  switch (country) {
    case "KH":
      return "USD";
    case "ID":
      return "IDR";
    case "PH":
      return "PHP";
    case "TW":
      return "TWD";
    case "SG":
      return "SGD";
    case "MY":
      return "MYR";
    case "MN":
      return "MNT";
    case "NL":
      return "EUR";
    case "AU":
      return "AUD";
    case "TH":
      return "THB";
    case "JP":
      return "JPY";
    case "CN":
      return "CNY";
    case "US":
      return "USD";
    default:
      return "USD";
  }
};

const getCountryLabel = (country: string) => {
  switch (country) {
    case "KH":
      return "캄보디아";
    case "ID":
      return "인도네시아";
    case "PH":
      return "필리핀";
    case "TW":
      return "대만";
    case "SG":
      return "싱가포르";
    case "MY":
      return "말레이시아";
    case "MN":
      return "몽골";
    case "NL":
      return "네덜란드";
    case "AU":
      return "호주";
    case "TH":
      return "태국";
    case "JP":
      return "일본";
    case "CN":
      return "중국";
    case "US":
      return "미국";
    default:
      return country || "미확인 국가";
  }
};

const getMarketGuideByCountry = (country: string) => {
  switch (country) {
    case "KH":
      return `
[국가별 운영 기준 - 캄보디아]
- 통화는 USD 기준으로 해석한다.
- 가격 부담을 크게 느낄 수 있으므로 객단가보다 회전율과 주문 전환을 우선 본다.
- 배달/포장 접근성과 대표 메뉴 노출이 중요하다.
- 복잡한 실행안보다 즉시 실행 가능한 단순한 업셀 멘트와 세트 제안이 효과적이다.
- 현장 인력 운영이 단순해야 하므로 액션 플랜은 짧고 명확하게 제시한다.
`;
    case "SG":
      return `
[국가별 운영 기준 - 싱가포르]
- 통화는 SGD 기준으로 해석한다.
- 객단가와 프리미엄 구성, 메뉴 완성도, 서비스 품질이 중요하다.
- 단순 할인보다 세트 구성의 설득력과 추천 멘트 품질을 더 중시한다.
- 깔끔한 운영, 빠른 제공 속도, 대표 메뉴 집중 전략을 우선 제안한다.
`;
    case "ID":
      return `
[국가별 운영 기준 - 인도네시아]
- 통화는 IDR 기준으로 해석한다.
- 가격 민감도와 배달 채널 활용도를 함께 고려한다.
- 저가 진입 메뉴와 재구매 유도 메뉴의 조합이 중요하다.
- 업셀은 부담 없는 사이드/음료 추가 중심으로 제안한다.
`;
    case "PH":
      return `
[국가별 운영 기준 - 필리핀]
- 통화는 PHP 기준으로 해석한다.
- 가족/그룹 수요와 배달 수요를 함께 고려한다.
- 대표 메뉴와 공유 메뉴의 조합, 세트 제안, 음료 추가 판매가 중요하다.
- 너무 복잡한 운영보다 직원이 쉽게 말할 수 있는 추천 멘트를 우선 제안한다.
`;
    case "TW":
      return `
[국가별 운영 기준 - 대만]
- 통화는 TWD 기준으로 해석한다.
- 메뉴 완성도와 반복 구매를 유도하는 안정적 운영이 중요하다.
- 과한 할인보다 대표 메뉴 집중, 사이드 조합, 추천 동선 최적화를 우선 제안한다.
`;
    case "TH":
      return `
[국가별 운영 기준 - 태국]
- 통화는 THB 기준으로 해석한다.
- 진입 장벽이 낮은 메뉴와 강한 첫 추천이 중요하다.
- 배달/포장 친화적 메뉴 구성을 고려하고, 업셀은 단순한 세트 중심으로 제안한다.
`;
    case "JP":
      return `
[국가별 운영 기준 - 일본]
- 통화는 JPY 기준으로 해석한다.
- 운영 정확도, 서비스 일관성, 메뉴 신뢰감이 중요하다.
- 과도한 멘트보다 정돈된 추천 흐름과 대표 메뉴 품질 유지가 우선이다.
`;
    case "US":
      return `
[국가별 운영 기준 - 미국]
- 통화는 USD 기준으로 해석한다.
- 객단가, 세트화, 사이드/음료 업셀, 명확한 추천 멘트가 중요하다.
- 대표 메뉴 중심 노출과 직원 업셀 스크립트 적용을 적극적으로 제안한다.
`;
    default:
      return `
[국가별 운영 기준 - 공통]
- 현지 외식 시장 특성, 소비 패턴, 가격 민감도, 배달 비중을 고려한다.
- 복잡한 전략보다 바로 실행 가능한 매장 운영 액션을 우선 제안한다.
`;
  }
};

export const generateCoachingReport = async (
  data: SalesReportData,
  results: CalculationResult,
  menuEngineeringResult: MenuEngineeringResult | null
): Promise<string> => {
  const country = String((data as any)?.country || "KH");
  const countryLabel = getCountryLabel(country);
  const currency = getCurrencyByCountry(country);
  const marketGuide = getMarketGuideByCountry(country);

  const allItems = data.categories.flatMap((c) => c.items).filter((i) => (i.qty || 0) > 0);
  const topItems = [...allItems].sort((a, b) => (b.qty || 0) - (a.qty || 0)).slice(0, 5);
  const topItemsText = topItems.length
    ? topItems.map((i) => `${i.name}(${i.qty}개)`).join(", ")
    : "없음";

  let menuEngineeringSummary = "";
  if (menuEngineeringResult) {
    const safeNum = (v: any) => (typeof v === "number" && isFinite(v) ? v : 0);

    const fmt = (it: any) => {
      const qty = safeNum(it.qty_month);
      const rev = safeNum(it.revenue_month);
      const cm = it.cm === null || it.cm === undefined ? null : safeNum(it.cm);
      return `${it.name} | 판매 ${qty}개 | 매출 ${currency}${rev.toFixed(0)} | CM ${
        cm === null ? "N/A" : `${currency}${cm.toFixed(2)}`
      }`;
    };

    const top3 = (arr: any[], sortFn: (a: any, b: any) => number) =>
      [...arr].filter(Boolean).sort(sortFn).slice(0, 3);

    const puzzlesTop3 = top3(
      menuEngineeringResult.puzzles || [],
      (a, b) => safeNum(b.cm) - safeNum(a.cm)
    );

    menuEngineeringSummary = `
[메뉴 엔지니어링 핵심 (Puzzles TOP3)]
- Puzzles: ${puzzlesTop3.length ? puzzlesTop3.map(fmt).join(" / ") : "없음"}
`;
  }

  const prompt = `
너는 홍콩반점(${countryLabel}, ${currency})의 매출 코치 AI다.
이 매장은 ${countryLabel}에 위치해 있으며, 반드시 해당 국가의 외식 시장 특성과 소비 패턴을 반영해서 분석해야 한다.

${marketGuide}

[오늘 데이터]
- 메뉴 합계 매출: ${currency}${Math.round(results.calcSales)}
- POS 입력값: ${currency}${Math.round(data.posSales)} (오차 ${currency}${Math.round(results.gapUsd)} / ${results.status})
- 주문 ${data.orders}건, 방문 ${data.visitCount}명, 객단가 ${currency}${results.aov.toFixed(2)}, 전환율 ${results.conversionRate.toFixed(1)}%
- TOP 메뉴: ${topItemsText}
- 월 목표 ${currency}${Math.round(data.monthlyTarget)} / 누적 ${currency}${Math.round(data.mtdSales)} / 잔여 ${currency}${Math.round(
    (data.monthlyTarget || 0) - (data.mtdSales || 0) - results.calcSales
  )}
- 메모: ${data.note || "없음"}

${menuEngineeringSummary}

[리포트 목적]
- 점주가 바로 이해하고
- 직원에게 바로 지시할 수 있고
- 오늘 문제와 내일 실행 우선순위를 빠르게 잡을 수 있게 작성할 것
- 반드시 ${countryLabel} 시장에 맞는 현실적인 실행안으로 작성할 것

[규칙]
- 인사말, 감탄, 장식 문장 금지
- 짧지만 구체적으로 작성
- 추상 표현 금지: “관리 필요”, “강화 필요”, “점검 필요”만 쓰지 말 것
- 반드시 “왜 중요한지” 또는 “어떻게 실행할지”가 포함되어야 함
- 4) 내일 액션 플랜에는 절대 수량 목표를 쓰지 말 것
- “+3”, “+5”, “3개”, “5개”, “목표 수량”, “판매 목표” 같은 표현 금지
- 임의 숫자 생성 금지
- 데이터가 부족하면 과장하지 말고 보수적으로 작성
- 각 항목은 짧게 쓰되, 기존보다 한 단계 더 디테일하게 작성
- 국가 특성과 맞지 않는 조언은 하지 말 것
- 통화 표기는 ${currency} 기준으로 해석할 것

[섹션별 작성 규칙]
1) 오늘 요약
- 오늘 매출 상황 + 가장 중요한 이상징후 1개를 함께 요약
- 1~2문장

2) 핵심 포인트
- 오늘 운영에서 가장 중요한 문제 1~2개 작성
- 반드시 원인 또는 영향이 드러나게 작성

3) 월 목표 관점
- 월 목표 대비 현재 상태를 해석
- 목표 초과면 유지/정확도/객단가/운영 품질 중심으로 방향 제시
- 목표 미달이면 남은 기간 동안 무엇을 우선해야 하는지 제시

4) 내일 액션 플랜
- 반드시 실행 행동 중심
- 메뉴명 + 행동 방식으로 작성
- 국가 시장 특성에 맞는 현실적인 액션만 작성
- 4~6개 작성
- 숫자 금지
- “판매 집중”만 쓰지 말고 어떻게 팔지까지 써야 함

5) 실행 체크리스트
- 실제 매장 운영 루틴처럼 작성
- 오픈 전 / 운영 중 / 마감 후 관점의 체크 행동 위주
- 정확히 3줄 작성
- 각 줄은 바로 실행 가능한 문장으로 작성

[출력 형식]
1) 오늘 요약
2) 핵심 포인트
3) 월 목표 관점
4) 내일 액션 플랜
5) 실행 체크리스트
`;

  try {
    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, modelName, country }),
    });

    const json = await res.json();

    if (!res.ok || !json?.ok) {
      const msg = json?.message || json?.error || "Unknown server error";
      throw new Error(msg);
    }

    return json.text;
  } catch (error: any) {
    console.error("Coach API Error Detail:", {
      message: error.message,
      stack: error.stack,
    });

    const errMsg = error.message || "";
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return "요청 한도를 초과했습니다(Rate Limit). 잠시 후 다시 시도해주세요.";
    }
    if (errMsg.includes("404") || errMsg.includes("NOT_FOUND")) {
      return "지원하지 않는 모델명이거나 엔드포인트를 찾을 수 없습니다.";
    }
    if (errMsg.includes("401") || errMsg.includes("API_KEY_INVALID")) {
      return "API 키가 유효하지 않습니다. 설정을 확인해주세요.";
    }
    if (errMsg.includes("fetch failed")) {
      return "네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    }

    return `통신 오류 발생 (${error.message || "Unknown"}). 데이터를 다시 확인해주세요.`;
  }
};
