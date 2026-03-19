import { SalesReportData, CalculationResult, MenuEngineeringResult } from "../types";

export const generateCoachingReport = async (
  data: SalesReportData,
  results: CalculationResult,
  menuEngineeringResult: MenuEngineeringResult | null
): Promise<string> => {
  // Top items (today) — keep short
  const allItems = data.categories.flatMap((c) => c.items).filter((i) => (i.qty || 0) > 0);
  const topItems = [...allItems].sort((a, b) => (b.qty || 0) - (a.qty || 0)).slice(0, 5);
  const topItemsText = topItems.length
    ? topItems.map((i) => `${i.name}(${i.qty}개)`).join(", ")
    : "없음";

  // Menu engineering summary — TOP3 only (very important for speed)
  let menuEngineeringSummary = "";
  if (menuEngineeringResult) {
    const safeNum = (v: any) => (typeof v === "number" && isFinite(v) ? v : 0);

    const fmt = (it: any) => {
      const qty = safeNum(it.qty_month);
      const rev = safeNum(it.revenue_month);
      const cm = it.cm === null || it.cm === undefined ? null : safeNum(it.cm);
      return `${it.name} | 판매 ${qty}개 | 매출 $${rev.toFixed(0)} | CM ${cm === null ? "N/A" : `$${cm.toFixed(2)}`}`;
    };

    const top3 = (arr: any[], sortFn: (a: any, b: any) => number) =>
      [...arr].filter(Boolean).sort(sortFn).slice(0, 3);

    const starsTop3 = top3(
      menuEngineeringResult.stars || [],
      (a, b) => safeNum(b.revenue_month) - safeNum(a.revenue_month)
    );
    const cashCowsTop3 = top3(
      menuEngineeringResult.cashCows || [],
      (a, b) => safeNum(b.qty_month) - safeNum(a.qty_month)
    );
    const puzzlesTop3 = top3(
      menuEngineeringResult.puzzles || [],
      (a, b) => safeNum(b.cm) - safeNum(a.cm)
    );
    const dogsTop3 = top3(
      menuEngineeringResult.dogs || [],
      (a, b) => safeNum(a.revenue_month) - safeNum(b.revenue_month)
    );

menuEngineeringSummary = `
[메뉴 엔지니어링 핵심 (Puzzles TOP3)]
- Puzzles: ${puzzlesTop3.length ? puzzlesTop3.map(fmt).join(" / ") : "없음"}
`;
  }

  // Prompt — shorter + stricter headings
const prompt = `
너는 홍콩반점(캄보디아, USD)의 “매출 코치 AI”다.
아래 데이터를 바탕으로 점주가 매장에서 바로 실행할 수 있는 “짧지만 실무적인 데일리 코칭 리포트”를 작성하라.

[오늘 데이터]
- 메뉴 합계 매출: $${Math.round(results.calcSales)}
- POS 입력값: $${Math.round(data.posSales)} (오차 $${Math.round(results.gapUsd)} / ${results.status})
- 주문 ${data.orders}건, 방문 ${data.visitCount}명, 객단가 $${results.aov.toFixed(2)}, 전환율 ${results.conversionRate.toFixed(1)}%
- TOP 메뉴: ${topItemsText}
- 월 목표 $${Math.round(data.monthlyTarget)} / 누적 $${Math.round(data.mtdSales)} / 잔여 $${Math.round(
  (data.monthlyTarget || 0) - (data.mtdSales || 0) - results.calcSales
)}
- 메모: ${data.note || "없음"}

${menuEngineeringSummary}

[리포트 목적]
- 점주가 바로 이해하고
- 직원에게 바로 지시할 수 있고
- 오늘 문제와 내일 실행 우선순위를 빠르게 잡을 수 있게 작성할 것

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

[섹션별 작성 규칙]
1) 오늘 요약
- 오늘 매출 상황 + 가장 중요한 이상징후 1개를 함께 요약
- 1~2문장

2) 핵심 포인트
- 오늘 운영에서 가장 중요한 문제 1~2개 작성
- 반드시 “원인 또는 영향”이 드러나게 작성
- 예: POS 오차가 크면 “데이터 신뢰도 저하”, 방문은 많은데 주문이 낮으면 “전환 문제”처럼 해석

3) 월 목표 관점
- 월 목표 대비 현재 상태를 해석
- 목표 초과면 “지금은 매출 확대보다 데이터 정확도/객단가 유지가 중요”처럼 방향 제시
- 목표 미달이면 “남은 기간 동안 무엇을 우선해야 하는지” 제시

4) 내일 액션 플랜
- 반드시 실행 행동 중심
- 메뉴명 + 행동 방식으로 작성
- 예:
  - 짜장면 주문 시 곱빼기 또는 토핑 멘트 적용
  - 짬뽕 주문 고객에게 탕수육 S 세트 제안
  - 고추짜장 주문 시 음료 업셀 멘트 적용
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
    console.log(`[Coach] Calling /api/coach with model: ${modelName}`);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, modelName }),
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
