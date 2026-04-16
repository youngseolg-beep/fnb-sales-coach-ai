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

const getBrandLabel = (brand: string) => {
  switch (brand) {
    case "PAIK_NOODLE":
      return "홍콩반점";
    case "BORNGA":
      return "본가";
    case "SAEMAEUL":
      return "새마을식당";
    case "PAIK_COFFEE":
      return "빽다방";
    case "PAIK_BIBIM":
      return "백스비빔";
    default:
      return brand || "브랜드 미확인";
  }
};

const getMarketGuideByCountry = (country: string) => {
  switch (country) {
    case "KH":
      return `
[국가별 운영 기준 - 캄보디아]
- 통화는 USD 기준으로만 해석한다.
- 가격 부담을 크게 느낄 수 있으므로 객단가보다 회전율과 주문 전환을 우선 본다.
- 배달/포장 접근성과 대표 메뉴 노출이 중요하다.
- 복잡한 실행안보다 즉시 실행 가능한 단순한 업셀 멘트와 세트 제안이 효과적이다.
- 현장 인력 운영이 단순해야 하므로 액션 플랜은 짧고 명확하게 제시한다.
`;
    case "SG":
      return `
[국가별 운영 기준 - 싱가포르]
- 통화는 SGD 기준으로만 해석한다.
- 프리미엄 포지션, 객단가, 메뉴 완성도, 서비스 품질이 중요하다.
- 단순 할인보다 세트 구성의 설득력과 추천 멘트 품질을 더 중시한다.
- 깔끔한 운영, 빠른 제공 속도, 대표 메뉴 집중 전략을 우선 제안한다.
`;
    case "ID":
      return `
[국가별 운영 기준 - 인도네시아]
- 통화는 IDR 기준으로만 해석한다.
- 가격 민감도와 배달 채널 활용도를 함께 고려한다.
- 저가 진입 메뉴와 재구매 유도 메뉴의 조합이 중요하다.
- 업셀은 부담 없는 사이드/음료 추가 중심으로 제안한다.
`;
    case "PH":
      return `
[국가별 운영 기준 - 필리핀]
- 통화는 PHP 기준으로만 해석한다.
- 가족/그룹 수요와 배달 수요를 함께 고려한다.
- 대표 메뉴와 공유 메뉴의 조합, 세트 제안, 음료 추가 판매가 중요하다.
- 너무 복잡한 운영보다 직원이 쉽게 말할 수 있는 추천 멘트를 우선 제안한다.
`;
    case "TW":
      return `
[국가별 운영 기준 - 대만]
- 통화는 TWD 기준으로만 해석한다.
- 메뉴 완성도와 반복 구매를 유도하는 안정적 운영이 중요하다.
- 과한 할인보다 대표 메뉴 집중, 사이드 조합, 추천 동선 최적화를 우선 제안한다.
`;
    case "TH":
      return `
[국가별 운영 기준 - 태국]
- 통화는 THB 기준으로만 해석한다.
- 진입 장벽이 낮은 메뉴와 강한 첫 추천이 중요하다.
- 배달/포장 친화적 메뉴 구성을 고려하고, 업셀은 단순한 세트 중심으로 제안한다.
`;
    case "JP":
      return `
[국가별 운영 기준 - 일본]
- 통화는 JPY 기준으로만 해석한다.
- 운영 정확도, 서비스 일관성, 메뉴 신뢰감이 중요하다.
- 과도한 멘트보다 정돈된 추천 흐름과 대표 메뉴 품질 유지가 우선이다.
- 매출보다도 POS 정확성, 응대 품질, 오퍼레이션 안정성을 함께 본다.
`;
    case "MN":
      return `
[국가별 운영 기준 - 몽골]
- 통화는 MNT 기준으로만 해석한다.
- USD, 달러, $ 기준 해석 금지.
- 가족/그룹 외식과 식사 만족도, 재방문 유도를 함께 고려한다.
- 메뉴 선택이 어렵지 않도록 대표 메뉴 중심으로 추천하고, 추가 주문은 부담 없는 사이드/음료 중심으로 제안한다.
- 운영은 단순하고 명확해야 하며, 현장에서 바로 실행 가능한 액션 위주로 작성한다.
`;
    case "US":
      return `
[국가별 운영 기준 - 미국]
- 통화는 USD 기준으로만 해석한다.
- 객단가, 세트화, 사이드/음료 업셀, 명확한 추천 멘트가 중요하다.
- 대표 메뉴 중심 노출과 직원 업셀 스크립트 적용을 적극적으로 제안한다.
`;
    default:
      return `
[국가별 운영 기준 - 공통]
- 현지 외식 시장 특성, 소비 패턴, 가격 민감도, 배달 비중을 고려한다.
- 복잡한 전략보다 바로 실행 가능한 매장 운영 액션을 우선 제안한다.
- 모든 금액 표기는 지정된 현지 통화 기준으로만 작성한다.
`;
  }
};

const getBrandGuideByBrand = (brand: string) => {
  switch (brand) {
    case "BORNGA":
      return `
[브랜드 운영 기준 - 본가]
- 고기 메뉴, 테이블 운영, 추가 주문 유도, 객단가 상승이 중요하다.
- 단품 중식 메뉴처럼 해석하지 말고, 고기 + 식사 + 주류 + 사이드 흐름으로 해석한다.
- 액션 플랜은 테이블 회전, 추가 주문 멘트, 사이드/식사 연계 중심으로 작성한다.
`;
    case "SAEMAEUL":
      return `
[브랜드 운영 기준 - 새마을식당]
- 고기류와 식사류의 조합, 추가 주문, 테이블 회전이 중요하다.
- 찌개/식사/고기/주류 흐름을 함께 고려한다.
- 액션 플랜은 테이블 단위 추천, 추가 주문 유도, 대표 메뉴 중심 노출로 작성한다.
`;
    case "PAIK_COFFEE":
      return `
[브랜드 운영 기준 - 빽다방]
- 음료, 디저트, 테이크아웃, 빠른 회전율이 중요하다.
- 고기집/중식당처럼 해석하지 말고 카페 운영 기준으로 해석한다.
- 액션 플랜은 세트보다는 음료 + 디저트 추가 제안, 픽업 속도, 베스트 음료 노출 중심으로 작성한다.
`;
    case "PAIK_BIBIM":
      return `
[브랜드 운영 기준 - 백스비빔]
- 비빔류 메인 메뉴와 사이드 조합, 점심 회전율, 단품 만족도가 중요하다.
- 액션 플랜은 대표 비빔 메뉴 집중, 사이드 추가, 간단한 식사 조합 중심으로 작성한다.
`;
    case "PAIK_NOODLE":
    default:
      return `
[브랜드 운영 기준 - 홍콩반점]
- 중식 단품, 탕수육, 짬뽕/짜장류, 토핑/음료 업셀이 중요하다.
- 액션 플랜은 대표 중식 메뉴 노출, 탕수육/음료/토핑 제안 중심으로 작성한다.
`;
  }
};

const sanitizeCurrencyOutput = (text: string, currency: string) => {
  if (!text) return text;

  let next = text;

  if (currency !== "USD") {
    next = next.replace(/\bUSD\b/g, currency);
    next = next.replace(/\bUS\$+/g, currency);
    next = next.replace(/\$/g, `${currency} `);
    next = next.replace(/달러/g, currency);
  }

  next = next.replace(new RegExp(`${currency}\\s+`, "g"), `${currency}`);
  next = next.replace(/\s{2,}/g, " ");

  return next;
};

export const generateCoachingReport = async (
  data: SalesReportData,
  results: CalculationResult,
  menuEngineeringResult: MenuEngineeringResult | null
): Promise<string> => {
  const country = String((data as any)?.country || "KH");
  const brand = String((data as any)?.brand || "PAIK_NOODLE");
  const countryLabel = getCountryLabel(country);
  const brandLabel = getBrandLabel(brand);
  const currency = getCurrencyByCountry(country);
  const marketGuide = getMarketGuideByCountry(country);
  const brandGuide = getBrandGuideByBrand(brand);

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
너는 ${countryLabel}에서 운영되는 ${brandLabel}의 본사 슈퍼바이저이자 매출 코치 AI다.

[절대 규칙 - 매우 중요]
- 반드시 "${countryLabel}"이라는 국가명을 최소 2회 이상 직접 언급해야 한다.
- 반드시 "${brandLabel}"이라는 브랜드명을 최소 2회 이상 직접 언급해야 한다.
- 모든 분석과 액션은 반드시 "${countryLabel}" 시장 기준 + "${brandLabel}" 브랜드 기준으로만 작성해야 한다.
- 다른 국가 기준 일반론 작성 금지
- 다른 브랜드 기준 일반론 작성 금지
- "${countryLabel}" 시장 특성 또는 "${brandLabel}" 운영 특성과 연결되지 않은 문장은 작성 금지
- 국가 또는 브랜드 언급 없이 작성하면 잘못된 리포트로 간주한다
- 모든 금액 표기는 반드시 "${currency}"만 사용
