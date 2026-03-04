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
[메뉴 엔지니어링 TOP3 (월 누적 기준)]
- Stars: ${starsTop3.length ? starsTop3.map(fmt).join(" / ") : "없음"}
- CashCows: ${cashCowsTop3.length ? cashCowsTop3.map(fmt).join(" / ") : "없음"}
- Puzzles: ${puzzlesTop3.length ? puzzlesTop3.map(fmt).join(" / ") : "없음"}
- Dogs: ${dogsTop3.length ? dogsTop3.map(fmt).join(" / ") : "없음"}
`;
  }

  // Prompt — shorter + stricter headings
  const prompt = `
너는 홍콩반점(캄보디아, USD)의 “매출 코치 AI”다.
아래 데이터를 바탕으로 점주가 바로 실행할 “짧고 명확한 데일리 코칭 리포트”만 작성하라.

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

[규칙]
- 인사말/감탄/설명 금지. “숫자 + 행동”만.
- 각 섹션 1~2줄 (짧게).
- 반드시 아래 5개 제목을 그대로 포함해서 출력.

[출력 형식]
1) 오늘 요약
2) 핵심 포인트
3) 월 목표 관점
4) 내일 액션 플랜 (메뉴 +추가목표 4~6개: 예 “깐풍기 +3”)
5) 실행 체크리스트 (3줄)
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
