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
    default:
      return "USD";
  }
};

export const generateCoachingReport = async (
  data: SalesReportData,
  results: CalculationResult,
  menuEngineeringResult: MenuEngineeringResult | null
): Promise<string> => {
  const country = data.country || "UNKNOWN";
  const currency = getCurrencyByCountry(country);

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
너는 홍콩반점(${country}, ${currency})의 매출 코치 AI다.
이 매장은 ${country}에 위치해 있으며, 현지 외식 시장 특성과 소비 패턴을 반영하여 분석해야 한다.

[오늘 데이터]
- 메뉴 합계 매출: ${currency}${Math.round(results.calcSales)}
- POS 입력값: ${currency}${Math.round(data.posSales)} (오차 ${currency}${Math.round(results.gapUsd)} / ${results.status})
- 주문 ${data.orders}건, 방문 ${data.visitCount}명, 객단가 ${currency}${results.aov.toFixed(2)}, 전환율 ${results.conversionRate.toFixed(1)}%
- TOP 메뉴: ${topItemsText}
- 월 목표 ${currency}${Math.round(data.monthlyTarget)} / 누적 ${currency}${Math.round(data.mtdSales)}
- 메모: ${data.note || "없음"}

${menuEngineeringSummary}

[리포트 목적]
- 점주가 바로 이해하고 실행할 수 있는 실무형 코칭

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, modelName, country }),
    });

    const json = await res.json();

    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || "AI 생성 실패");
    }

    return json.text;
  } catch (error: any) {
    console.error(error);
    return "AI 코칭 생성 중 오류 발생";
  }
};
