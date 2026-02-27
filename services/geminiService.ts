
import { GoogleGenAI } from "@google/genai";
import { SalesReportData, CalculationResult, MenuEngineeringResult } from "../types";

export const generateCoachingReport = async (data: SalesReportData, results: CalculationResult, menuEngineeringResult: MenuEngineeringResult | null): Promise<string> => {
  // Use import.meta.env for Vite environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in environment variables.");
    return "API 키가 설정되지 않았습니다. AI Studio Secrets에서 GEMINI_API_KEY를 확인해주세요.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract top selling items for context
  const allItems = data.categories.flatMap(c => c.items).filter(i => i.qty > 0);
  const topItems = [...allItems].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topItemsText = topItems.map(i => `${i.name}(${i.qty}개)`).join(", ");

  let menuEngineeringSummary = "";
  if (menuEngineeringResult) {
    const formatItem = (item: any) => 
      `${item.name} (판매: ${item.qty_month}개, 매출: $${item.revenue_month.toFixed(2)}, CM: $${item.cm !== null ? item.cm.toFixed(2) : 'N/A'})`;

    const puzzlesTop3 = menuEngineeringResult.puzzles
      .filter(item => item.cm !== null && item.revenue_month !== null)
      .sort((a, b) => (b.cm as number) - (a.cm as number) || (b.revenue_month as number) - (a.revenue_month as number))
      .slice(0, 3);

    const cashCowsTop3 = menuEngineeringResult.cashCows
      .filter(item => item.cm !== null && item.qty_month !== null)
      .sort((a, b) => (b.qty_month as number) - (a.qty_month as number) || (a.cm as number) - (b.cm as number))
      .slice(0, 3);

    const dogsTop3 = menuEngineeringResult.dogs
      .filter(item => item.revenue_month !== null && item.gp_month !== null)
      .sort((a, b) => (a.revenue_month as number) - (b.revenue_month as number) || (a.gp_month as number) - (b.gp_month as number))
      .slice(0, 3);

    const noCostItemsList = menuEngineeringResult.noCostItems.map(item => item.name).join(", ");

    menuEngineeringSummary = `
※ 아래 메뉴 엔지니어링은 ‘월 누적 기준’입니다.

[메뉴 엔지니어링 요약]
- 인기도 기준: 월 평균 ${menuEngineeringResult.popularityThreshold.toFixed(1)}개 이상
- 수익성 기준: 월 평균 CM $${menuEngineeringResult.profitabilityThreshold.toFixed(2)} 이상

- Stars (고인기, 고수익): ${menuEngineeringResult.stars.length > 0 ? menuEngineeringResult.stars.map(formatItem).join(", ") : "없음"}
- Cash Cows (고인기, 저수익): ${menuEngineeringResult.cashCows.length > 0 ? menuEngineeringResult.cashCows.map(formatItem).join(", ") : "없음"}
- Puzzles (저인기, 고수익): ${menuEngineeringResult.puzzles.length > 0 ? menuEngineeringResult.puzzles.map(formatItem).join(", ") : "없음"}
- Dogs (저인기, 저수익): ${menuEngineeringResult.dogs.length > 0 ? menuEngineeringResult.dogs.map(formatItem).join(", ") : "없음"}

[원가 미입력 메뉴]
${noCostItemsList || "없음"}

[이번 달 부스트 추천 (Puzzles)]
${puzzlesTop3.length > 0 ? puzzlesTop3.map(item => `- ${item.name}: 프로모션, 세트 메뉴 구성으로 인지도 높이기`).join("\n") : "없음"}

[마진 개선 추천 (Cash Cows)]
${cashCowsTop3.length > 0 ? cashCowsTop3.map(item => `- ${item.name}: 원가 절감 방안 모색 또는 가격 인상 검토`).join("\n") : "없음"}

[정리/개편 후보 (Dogs)]
${dogsTop3.length > 0 ? dogsTop3.map(item => `- ${item.name}: 메뉴 퇴출, 레시피 개선, 재료 변경 고려`).join("\n") : "없음"}
`;
  }

  const prompt = `
너는 홍콩반점(캄보디아 매장, 통화 USD)의 “매출 코치 AI”다.
아래 데이터를 바탕으로 점주가 바로 행동할 수 있는 “짧고 명확한 데일리 코칭 리포트”를 작성하라.

[데이터 요약]
- 오늘 매출: $${results.calcSales} (메뉴 합계)
- POS 입력값: $${data.posSales} (오차: $${results.gapUsd} / ${results.status})
- 지표: 주문 ${data.orders}건, 방문 ${data.visitCount}명, 객단가 $${results.aov}, 전환율 ${results.conversionRate}%
- 토핑: 주문당 ${results.addonPerOrder}개
- 현황: ${topItemsText}
- 월 목표: $${data.monthlyTarget}, 누적: $${data.mtdSales}, 잔여: $${data.monthlyTarget - data.mtdSales - results.calcSales}
- 메모: ${data.note || '없음'}

${menuEngineeringSummary}

[중요 규칙]
- 통화 단위는 반드시 USD로 표기.
- 숫자는 반올림하여 간결하게.
- 인사말, 감탄, 서술형 설명 절대 금지.
- 각 섹션 최대 2~3줄.
- “숫자 + 행동 지시” 위주로 작성.

[출력 형식 - 반드시 이 구조만 사용]
1) 오늘 요약 (매출, 객단가, 전환율 위주 성과 요약)
2) 핵심 포인트 (잘한 점/아쉬운 점 중 2개, 각 1줄, 숫자 포함)
3) 월 목표 관점 (남은 목표액 대비 현재 페이스 진단 및 한 줄 조언)
4) 내일 액션 플랜 (Puzzles/Stars 그룹의 추천 메뉴와 추가 목표 수량 4~6개. 예: 깐풍기 +3, 마파두부 +2)
5) 실행 체크리스트 (3줄, 매우 구체적인 현장 행동 지침)
`;

  try {
    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
    console.log(`[Gemini] Calling model: ${modelName}`);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    if (!response.text) {
      throw new Error("EMPTY_RESPONSE");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
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
    
    return `통신 오류 발생 (${error.message || 'Unknown'}). 데이터를 다시 확인해주세요.`;
  }
};
