# Sales Coach AI

# Complete Development Handover / Extended Context Prompt

# Version V2.2.0

# Date: 2026-09-18

---

# 2026-09-18 LATEST AUTHORITATIVE STATE — V2.2.0

> **IMPORTANT — READ THIS SECTION FIRST**
>
> 이 섹션은 2026-09-18 현재 Sales Coach AI의 실제 구현·검증 상태를 정의한다.
> 아래 2026-08-12 Authoritative State, Indonesia Addendum, Historical Archive는 개발 배경과 의사결정 이력을 보존하기 위한 기록이다.
> 과거 문서의 “현재”, “다음 작업”, “대기”, “미완료”, “Ready with Conditions” 표현이 이 섹션과 충돌하면 **이 V2.2.0 섹션이 우선**한다.
>
> 현재 문서 우선순위:
>
> 1. Product Bible V4.2 최신 Authoritative Update
> 2. UI/UX Guide V4.2 최신 Authoritative Update
> 3. 이 Dev Log V2.2.0 최신 섹션
> 4. 현재 verified application behavior
> 5. Historical Archive / 과거 Audit 기록
>
> 기능 동작에 대해서는 항상 **현재 verified code가 최종 사실**이다.

---

## A. 2026-09-18 제품 상태

Sales Coach AI는 더 이상 2026-08-12의 “Controlled Pilot: Ready with Conditions” 상태가 아니다.

현재 정의:

- **Store Owner Core:** Pilot Ready / 핵심 흐름 검증 완료
- **Master Workspace:** 운영 가능 상태
- **Pilot Readiness:** CLOSED
- **Production Security Hardening:** 핵심 항목 완료
- **Broad Multi-Store Production:** 별도 운영·모니터링 기준 없이 자동 선언하지 않음
- **현재 Blocking Issue:** 없음
- **Optional Technical Work:** bundle code splitting, 추가 observability, DataInput legacy 정리, 자동화 테스트 확장

현재 Store Owner 흐름:

HOME
→ SALES
  → Manual Input / OCR
  → Review / Reconciliation
  → Save
→ COACH
  → Period Sales Analysis
  → AI Operating Coaching
  → Menu Engineering
  → AI Menu Strategy
  → AI Boost Plan
→ MENU
  → Browse / Add / Edit / Delete / History / Reorder
  → Save
→ MORE
  → Store Context
  → Guided Tour / Quick Help
  → AI Analysis Notice
  → App Info / Logout

현재 Master 흐름:

MASTER DASHBOARD
→ period filter / elapsed-period comparison
→ major store overview
→ store detail drill-down
→ approvals / account-related operation

핵심 Product Loop는 유지한다:

INPUT
→ ANALYSIS
→ ACTION
→ RE-CHECK

책임 분리는 그대로다:

- SYSTEM = deterministic fact 계산
- AI = 계산된 사실 해석 및 실행 제안
- INTERFACE = 중요한 정보와 액션을 명확하게 표현
- OPERATOR = 최종 판단과 실행

---

## B. 2026-09 핵심 완료 사항

### B-1. Store Owner V4 완료

현재 5개 Primary Navigation:

- Coach
- Sales
- Home
- Menu
- More

모바일 Bottom Navigation 최신 규칙:

- 5개 탭은 동일한 높이/기본 형태를 사용한다.
- **현재 선택된 탭만** warm highlight를 받는다.
- Home은 중앙 개념적 anchor이지만 비활성 상태에서 더 크거나 떠 있거나 항상 강조되지 않는다.
- Home 전용 permanent raised / shadow / border treatment는 제거되었다.

Non-Home shared header:

- Coach / Sales / Menu / More는 동일한 Store Owner shell header를 사용한다.
- Sales의 과거 별도 back-arrow/title bar는 제거되었다.
- Sales selected-date/calendar 기능은 공통 header 안에서 유지된다.

### B-2. Sales / OCR 안정화

Sales 핵심:

- POS / Delivery Sales
- Orders
- Visitors
- Note
- Menu quantity
- total menu quantity display
- input sales vs menu sales reconciliation
- selected-date save/delete
- monthly target context

OCR은 input accelerator다.

현재 hard block:

1. review-required / unresolved menu item
2. recognized menu item 없음
3. invalid or future receipt date
4. currency mismatch
5. receipt subtotal vs menu-total mismatch

현재 advisory:

- receipt store name missing / uncertain / different
- store-name mismatch만으로 Apply를 막지 않는다.

Hardening:

- client timeout 45 sec
- max batch 8 images
- original file max 12 MB
- processed image max 4 MB
- server max 4 MB per image / 16 MB total
- JPEG / PNG / WebP validation
- OCR 실패 후에도 manual input 사용 가능

### B-3. Local Date 기준 확정

Store Owner 운영 날짜는 UTC 날짜가 아니라 **브라우저 현지 날짜**를 기준으로 한다.

- `formatLocalDate(new Date())`
- getFullYear / getMonth / getDate 기반
- UI에 `현지 오늘 · YYYY.MM.DD` 표시
- local midnight에 현지 오늘 표시 갱신
- selectedDate와 localToday는 서로 다른 개념이다.

Store timezone을 임의로 hardcode하지 않는다.

### B-4. Coach / AI Reliability 완료

Menu Engineering:

- deterministic classification을 먼저 계산한다.
- STAR / CASH_COW / PUZZLE / DOG를 AI가 재계산하거나 변경하지 않는다.
- Gemini structured JSON output 사용
- strict response schema validation
- invalid response 시 repair 1회
- **최대 2 attempts / user action**
- 최종 실패 시 safe Korean reason 표시
- deterministic analysis는 AI 실패와 관계없이 유지

Boost Plan:

- deterministic candidate를 먼저 만든다.
- AI는 supplied candidate를 실행안으로 변환한다.
- valid candidate 하나당 action 하나
- 최대 3개
- candidate가 2개면 action 2개, 1개면 1개
- 3개를 채우기 위해 임의 action을 발명하지 않는다.
- wrong action count / invalid schema / unsafe commercial term은 repair 대상
- repair 포함 최대 2 attempts

Commercial safety:

- 근거 없는 확정 할인율/할인금액/쿠폰금액/무료증정/BOGO/세트가격을 생성하지 않는다.
- PRICE / SET_PROMOTION은 원가·공헌이익·마진 확인/검증/승인 후 진행한다.
- expected effect는 보장이 아니라 추정으로 표현한다.

AI error UX:

- `NO_MENU_DATA`
- `INVALID_MODEL_RESPONSE`
- `UNSAFE_COMMERCIAL_TERM`
- `AUTH_ERROR`
- `CONFIG_ERROR`
- `MODEL_REQUEST_FAILED`

사용자 화면에는 내부 stack/raw response가 아니라 안전한 한국어 이유를 표시한다.

### B-5. Master Workspace 완료

Master Dashboard / Store Detail 최신 비교 기준:

- Today = 오늘 vs 전일
- This Week = 이번 주 월요일~현재일 vs 전주 월요일~동일 요일
- This Month = 이번 달 1일~현재일 vs 전월 1일~동일 경과일
- Last 30 Days = 최근 30일 vs 직전 연속 30일
- Custom = 선택 기간 vs 직전 동일 길이 기간

Future date padding을 비교 데이터에 넣지 않는다.

Approval list:

- loading / error / retry 상태 구분
- refresh 실패를 false empty state로 표시하지 않는다.
- mutation 성공 후 refresh 실패를 mutation 실패로 오해시키지 않는다.

### B-6. Auth / Security Hardening 완료

Auth:

- Supabase session persistence 유지
- `persistSession: true`
- `autoRefreshToken: true`
- authenticated profile을 앱 진입 전에 검증
- `master`는 cross-store role
- `store_user`는 positive integer `store_id` 필수
- invalid/missing profile은 fail closed + sign out
- session/profile query error도 recoverable login error로 처리

Production hardening:

- exposed `generate_test_sales(integer)` RPC 제거
- `coach_reports` 권한/RLS 강화
- obsolete SECURITY DEFINER helper 제거
- trigger function `search_path` 고정
- leaked-password protection 활성화
- Store User tenant isolation / Master cross-store behavior live verification 완료
- Security Advisor 최종 0 warnings 확인

### B-7. More / Contextual Help 완료

More는 더 이상 placeholder settings screen이 아니다.

현재 구성:

- current store information
  - store name
  - brand
  - country
  - currency
- `Sales Coach AI 둘러보기`
- `현재 화면 가이드`
- `처음부터 둘러보기`
- 6개 `빠른 도움말`
  - 매출 입력
  - 영수증 OCR
  - AI Coach
  - 메뉴 엔지니어링
  - AI 부스트 플랜
  - 메뉴 관리
- AI 분석 안내
- App information
- Logout

Guided Tour:

- 항상 user initiated
- 자동 시작 없음
- localStorage/cookie onboarding completion 없음
- current screen guide 우선
- full workflow tour는 secondary
- Home 5 / Sales 6 / Coach 7 / Menu 5 / More 5 / Full workflow 8 steps
- stable `data-tour` target 사용
- missing/hidden target은 retry 후 safe skip
- mobile viewport-bound tooltip
- resize/scroll 재계산
- Esc / close / previous / next / complete 지원
- full workflow navigation은 가능하지만 save/OCR upload/AI generate/delete/logout 등 destructive/data-changing action은 실행하지 않는다.
- tutorial은 poor UI를 설명하기 위한 대체 수단이 아니다.

Tour copy는 점주가 바로 이해할 수 있는 일반 한국어를 사용한다.
`유효 후보`, `분석 후보`, `실행 우선순위` 같은 내부 표현을 사용자 안내 문구에 쓰지 않는다.

### B-8. Final Code Cleanup 완료

1차 conservative cleanup:

- DetailPage temporary brand/country debug log 제거
- menu order success debug log 제거
- unused `OcrReview` 제거
- constant-false Sales legacy footer 제거
- JP_PN demo comment 정확화

2차 Coach legacy cleanup:

- `DetailPage`의 runtime-unreachable legacy Coach JSX 제거
- legacy-only period UI files 제거:
  - `PeriodMenuAnalysisSection.tsx`
  - `PeriodComparisonPanel.tsx`
  - `PeriodMenuEngineering.tsx`
  - `PeriodBoostPlan.tsx`
- active `PeriodTopMenuCompare` 유지
- active path는 `DetailPage → CoachV4Page`

현재부터 대규모 legacy rewrite는 기본 우선순위가 아니다.

---

## C. 2026-09-18 Current Active Architecture

### Store Owner

`App.tsx`
→ `StoreOwnerShell`
→ `StoreOwnerPageRouter`

Home:
→ `SummaryPage`

Sales:
→ `SalesPage`
→ `DailySalesPage`
→ `DataInput`
→ `renderV4(model)`
→ `SalesV4Page`

Coach:
→ `DetailPage`
→ `CoachV4Page`

Menu:
→ `MenuPage`
→ `MenuSettingsPage`

More:
→ `MorePage`

Guided Help:
→ `GuidedTourProvider`
→ `GuidedTour`

### Master

`App.tsx`
→ `MasterDashboardPage`
→ store-level detail / approvals

---

## D. 현재 검증/배포 기준

의미 있는 변경 후 기본 검증:

1. `node node_modules/typescript/bin/tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. `git diff --check`
5. `git status`
6. Git push 후 Vercel Production deployment status 확인

현재 build의 알려진 non-blocking warning:

- single entry chunk 약 775 kB minified / 약 225 kB gzip
- Vite >500 kB warning
- Pilot blocker로 보지 않는다.
- lazy loading / code splitting은 optional optimization이며 별도 작업으로 다룬다.

---

## E. 현재 우선순위

### DONE / CLOSED

- Store Owner Home / Sales / Coach / Menu / More
- OCR review/apply flow
- Store-name advisory behavior
- Sales reconciliation
- local-date semantics
- AI Menu Engineering reliability
- AI Boost Plan reliability/safety
- Master Dashboard / Store Detail
- Master Approval loading/error handling
- Auth profile validation
- RLS / Production security hardening
- Contextual Help + Guided Tour
- More quick help
- safe code cleanup
- legacy Coach UI cleanup
- Pilot Readiness

### OPTIONAL / FUTURE

- Production bundle code splitting
- automated characterization / regression test expansion
- broader `DataInput` legacy cleanup
- additional observability
- pilot usage/feedback metrics
- additional localization/settings if real demand exists

### Historical Indonesia Requests

2026-08-12 Indonesia feedback에 기록된 Note/Shared Food Cost 요청은 역사적 요구사항으로 보존한다.
현재 2026-09-18 기본 작업 queue의 자동 blocker로 취급하지 않는다.
다시 추진할 경우 Product Bible / current schema / actual store requirement를 기준으로 별도 재확인한다.

---

## F. 다음 AI / 개발자 Handover 원칙

1. 현재 verified code를 먼저 확인한다.
2. Product Bible V4.2의 최신 Authoritative Update를 읽는다.
3. UI/UX Guide V4.2 최신 Authoritative Update를 읽는다.
4. 이 Dev Log V2.2.0 섹션을 읽는다.
5. 과거 2026-08-12 Roadmap의 “next task”를 현재 작업으로 자동 재개하지 않는다.
6. Pilot에서 실제 문제가 발견되지 않는 한 새로운 cosmetic redesign을 시작하지 않는다.
7. deterministic fact와 AI interpretation 경계를 유지한다.
8. AI/OCR failure가 manual/deterministic workflow를 막지 않게 한다.
9. Store tenant isolation과 fail-closed auth를 약화하지 않는다.
10. 한 번에 하나의 명확한 작업 단위로 변경한다.

---

# 2026-08-12 PREVIOUS AUTHORITATIVE STATE — V2.1.2 (HISTORICAL)

> **IMPORTANT — READ THIS SECTION FIRST**

> 이 섹션은 2026-08-12 당시의 Authoritative State를 보존한 Historical Snapshot이다.
> 2026-09-18 이후 현재 상태와 충돌하면 문서 상단의 **V2.2.0 LATEST AUTHORITATIVE STATE가 우선**한다.

> 다른 AI / Codex / Gemini / 개발자가 프로젝트를 인수하는 경우:

1. Product Bible
2. UI/UX Guide
3. 이 Dev Log V2.1.2 최신 섹션
4. SALES\_COACH\_AI\_ENGINEERING\_AUDIT\_V1.0

> 순서로 읽고 작업을 시작한다.

> **POST-MEETING UPDATE:** 문서 맨 하단의 `LATEST ADDENDUM — INDONESIA STORE OWNER FEEDBACK`은 2026-08-12 인도네시아 점주 미팅 이후 확정된 가장 최신 상태다. 본 문서 상단의 미팅 전 Indonesia 계획과 충돌할 경우 해당 Addendum을 우선한다.

---

## A. 현재 제품 상태 요약

Sales Coach AI는 2026-08-12 기준 단순 Prototype을 넘어섰다.
현재 상태는 다음과 같이 정의한다.
Product / UI:
Demo Ready

Controlled Pilot:
Ready with Conditions

Broad Multi-Store Production:
Not Yet

Engineering Classification:
C. PILOT READY
현재 Store Owner의 실제 V4 사용자 흐름:
HOME
→ SALES
   → Manual Input / OCR
   → Review / Reconciliation
   → Save
→ COACH
   → Sales Analysis
   → AI Operating Coaching
   → Menu Engineering
   → AI Menu Strategy
   → Boost Plan
→ MENU
   → Browse
   → Add / Edit / Delete / History / Reorder
   → Save
→ MORE
핵심 Product Loop:
INPUT
→ ANALYSIS
→ ACTION
→ RE-CHECK
제품 역할 분리:

- SYSTEM = deterministic fact 계산
- AI = 계산된 사실 해석
- INTERFACE = 중요한 내용과 액션을 명확하게 표현
- OPERATOR = 최종 판단과 실행

현재 기능과 UI 품질은 실제 사용자 시연에 충분하다.
다만 Engineering Audit 결과, broad production scale 전 아래 영역의 hardening이 필요하다.

- privileged API authorization
- password provisioning security
- full RLS / schema reproducibility
- tenant/store isolation
- automated tests
- observability
- God Component / legacy path 정리

---

## B. 2026-08-12 기준 가장 중요한 방향 전환

### B-1. 일본 파일럿은 종료되었다

일본 파일럿은 더 이상 “현지 추가 피드백을 기다리는 진행 중 작업”이 아니다.
현재 상태:
Japan Pilot
\= Completed Technical / Product Reference
일본 계정을 통해 검증한 핵심 항목:

- structured OCR
- `menuCandidates` 기반 후보 제한
- `name + jp_name` 메뉴 reference 구조
- DINE-IN / TAKEOUT 독립 수량
- multi-image receipt 처리
- human review / apply
- VAT 포함 가격과 분석용 순매출 분리 개념
- 국가별/계정별 입력 방식 분기
- V4 Sales / Coach / Menu 시연 흐름

**앞으로 일본 측 추가 피드백을 받아야 다음 개발을 진행할 필요는 없다.**
과거 Dev Log에 존재하는 다음 표현은 역사적 기록으로만 본다.
일본 피드백 대기
일본 피드백 후 진행
일본 파일럿 안정화 후 진행
현재 Roadmap의 blocker가 아니다.

---

### B-2. 오늘 시연 대상은 인도네시아 점주다

현재 다음 실제 Product Validation 대상은 인도네시아다.
2026-08-12 당일 시연에서는 현재까지 완성된 테스트 계정 / 일본 파일럿 기반 구현을 활용해 제품 전체 흐름을 보여준다.
중요:
일본 테스트 계정을 시연에 활용
≠
일본 Store를 실제 Indonesia Store로 전환
오늘 시연의 목적은 데이터 migration이 아니라:
완성된 제품 경험 시연
→ 실제 인도네시아 점주 반응 확인
→ 요구사항 수집
→ Indonesia Pilot Requirement 확정
이다.

---

### B-3. 시연 후에는 독립 인도네시아 계정을 만든다

인도네시아 점주 피드백을 받은 뒤에는 기존 일본 계정을 계속 운영 계정으로 변형하는 것이 아니라, **별도의 신규 Store / User account를 생성하는 방향**이 원칙이다.
예상 흐름:
Indonesia Feedback
→ Requirements Classification
→ New Indonesia Store
→ New Indonesia User
→ Indonesia Menu Master
→ Country / Currency / Brand Context
→ Common Verified Features
→ Indonesia-Specific Feedback
→ E2E Validation
신규 Indonesia account는 독립 tenant여야 한다.
일본 Store/User/Menu data와 섞이면 안 된다.

---

## C. Global Common Feature와 Country-Specific Feature를 분리한다

향후 가장 중요한 구조 원칙 중 하나다.
일본에서 구현되었다는 이유만으로 모든 기능을 인도네시아에 그대로 복제하지 않는다.
다음 두 그룹으로 나눈다.

### C-1. COMMON PRODUCT BEHAVIOR

국가와 무관하게 재사용할 수 있는 현재 검증 기능:

- V4 Home
- V4 Sales input
- selected date
- POS / operational sales input framework
- orders / visitors / note
- Menu quantity input framework
- OCR multi-image single receipt batch
- OCR Review / Correction / Apply
- menuCandidates 기반 matching
- Sales save / reload
- reconciliation framework
- Coach period selection
- deterministic Sales Analysis
- AI Operating Coaching
- deterministic Menu Engineering
- AI Menu Strategy
- Boost Plan
- Supabase coach report persistence
- exact-scope restore
- stale async response guard
- explicit AI trigger
- Menu browse/add/edit/delete/history/reorder/save
- bottom navigation
- mobile-first V4 UI

이 기능들은 Indonesia account에도 재사용 가능한 Product Core다.

---

### C-2. JAPAN-SPECIFIC BEHAVIOR

아래는 일본에서 검증되었거나 일본 파일럿을 위해 구현된 국가 전용 behavior다.

-

```
jp_name
```

1. Japanese receipt semantics
2. JPY 표시
3. `※` / `★` / `※★` 포장 판별
4. Japan DINE-IN / TAKEOUT interpretation
5. 일본 VAT 포함 가격
6. DINE-IN 10%
7. TAKEOUT 8%
8. Japan VAT-excluded analysis calculation
9. Japan account/email 조건
10. Japan demo fixture

이 항목을 Indonesia에 자동 적용하면 안 된다.

---

### C-3. INDONESIA-SPECIFIC BEHAVIOR

현재 아직 확정되지 않았다.
반드시 오늘 점주 피드백과 실제 운영 데이터를 보고 결정한다.
확인 후보:

- 실제 currency
- POS closing data format
- menu naming/local language
- DINE-IN / TAKEOUT / DELIVERY 구분 필요 여부
- channel별 가격 차이 여부
- VAT / tax 처리 필요 여부
- service charge 여부
- receipt 구조
- menu quantity 입력 방식
- OCR 활용성
- 점주가 원하는 Coach 분석
- 매출 비교 단위
- UI wording
- daily workflow

**Indonesia-specific rule을 사전에 추정해서 코드에 넣지 않는다.**

---

## D. Country Policy 장기 방향

현재 일부 Japan behavior가 특정 email / account 조건에 묶여 있다.
예:
JP\_PN\@THEBORN.CO.KR
Pilot 단계에서는 허용되었지만 장기 Production에서는 다음 방향이 맞다.
User Email Hardcoding
→ Store / Country / Brand Context
→ Country Policy
예상 개념:
Store Context
  country
  brand
  currency
  salesChannelPolicy
  taxPolicy
  ocrPolicy
  menuLocalizationPolicy
단, 지금 즉시 큰 Country Policy Framework를 만들지 않는다.
Indonesia 실제 요구사항을 받은 후 필요한 최소 abstraction부터 설계한다.

---

## E. V4 UI/UX 현재 완료 상태

Primary Navigation:
Coach / Sales / Home / Menu / More
화면 역할:

- Home = Daily Brief
- Sales = Daily Input Workspace
- Coach = Analysis + Interpretation + Action
- Menu = Menu Master Management
- More = Support / About / Logout

V4 visual direction:

- warm off-white canvas
- white surface
- warm brown operating action
- AI purple only for AI semantic
- beige / warm-gray secondary
- thin warm borders
- restrained radius
- minimal shadow
- mobile-first 360–430px
- primary validation width 약 388–390px

UI/UX는 현재 시연 가능한 수준으로 본다.
향후 기능 추가가 아니라 실제 사용자 피드백 기반으로 수정한다.

---

## F. HOME V4 최신 상태

Home은 Dashboard가 아니라 Daily Brief다.
목적:
오늘 상황 확인
→ 해야 할 일 확인
→ Sales / OCR / Coach로 이동
주요 UX:

- selected/current date context
- today KPI
- monthly/goal context
- concise AI Coach Insight
- Today's Actions
- navigation shortcuts

Home action intent는 active Sales V4 DOM으로 연결한다.
sales\:manual
→ Basic Sales Info

sales\:ocr
→ OCR Upload
legacy/unreachable DOM target에 의존하지 않는다.
Today Task Checklist 방향:

- manual check 가능
- 실제 업무 완료 시 auto complete 가능
- 예: Sales Save 완료 → 관련 task checked + strikethrough

Home을 multi-chart BI dashboard로 되돌리지 않는다.

---

## G. SALES V4 최신 상태

Active path:
App
→ StoreOwnerPageRouter
→ SalesPage
→ DailySalesPage
→ DataInput
→ renderV4(model)
→ SalesV4Page
승인된 Sales 디자인 순서:

1. Header / Date
2. 오늘 요약
3. 기본 매출 정보
4. 영수증 자동입력 (OCR)
5. 매출 맞춤 확인
6. 메뉴 판매량 입력
7. Sticky Reset / Save

완료 사항:

- compact Today Summary
- compact label/input rows
- OCR card
- reconciliation 3-column layout
- compact menu rows
- Japan channel input 유지
- save success toast
- sticky save
- V4 warm design

Save success:
YYYY-MM-DD 매출 데이터가 저장되었습니다.
OCR receipt icon:
fa-regular fa-receipt
→
fa-solid fa-receipt
broken glyph 문제 해결 완료.

---

## H. OCR V4 최종 Architecture

OCR은 Product 자체가 아니라 input accelerator다.

### H-1. Receipt Batch

여러 이미지는 하나의 긴 영수증으로 처리한다.
ordered images[]
→ ONE /api/ocr
→ ONE Gemini multimodal generateContent
→ ONE structured receipt
per-image independent Gemini request로 되돌리지 않는다.

---

### H-2. OCR Authority

Persisted target authority:
Store
\= current authenticated/selected Store

Date
\= current Sales selected date

Currency
\= current Store currency
OCR store/date metadata는 context다.
Currency mismatch는 safety block.

---

### H-3. Item Semantics

qty
\= quantity

price
\= unit price

line\_total
\= printed line total when available
Menu calculation:
sum(qty × unit price)

---

### H-4. Financial Semantics

다음 값은 분리한다.
calculated\_item\_total
receipt\_subtotal
service\_charge
tax
receipt\_total
Menu total validation:
receipt\_subtotal
Final payment:
receipt\_total
둘을 혼동하지 않는다.

---

### H-5. Apply Gate

현재 blocker:

1. OCR items empty
2. incompatible currency

Warning / review:

- missing receipt total
- subtotal mismatch
- price difference
- uncertain mapping
- store/date metadata mismatch

Store/date OCR mismatch만으로 Apply를 block하지 않는다.

---

### H-6. Mapping

현재 방향:
Gemini
\+
Store Menu Candidates
\+
Human Review
불확실한 item을 임의 메뉴로 강제 매핑하지 않는다.

---

## I. JAPAN TECHNICAL REFERENCE — COMPLETED

Japan pilot identity:
Store/Account: JP\_PN
Login: JP\_PN\@THEBORN.CO.KR
Country: JP
이 계정은 앞으로:
Technical Reference
Demo Reference
Regression Reference
역할로 유지할 수 있다.
현재 일본 추가 현지 피드백을 Roadmap prerequisite로 두지 않는다.

---

### I-1. Japan Menu

구조:
name
\= Korean canonical

jp\_name
\= Japanese reference
Japanese menu를 별도 canonical row로 만들지 않는다.
포장 menu를 별도 row로 만들지 않는다.

---

### I-2. Japan Channels

dine\_in\_qty
takeout\_qty
qty = dine\_in\_qty + takeout\_qty
현재 UI:
메뉴명 + 가격
DINE-IN | TAKEOUT | 합계

---

### I-3. Japan OCR Channel

현재 의미:
POS
→ DINE-IN

DELIVERY
→ TAKEOUT
`※` / `★` / `※★`는 Japan receipt에서 TAKEOUT 판별 context로 사용.

---

### I-4. Japan VAT

현재 구현/reference:
Menu Price
\= VAT Included

DINE-IN
\= 10%

TAKEOUT
\= 8%
분석 방향:
AI / Menu Analysis
→ VAT Excluded

POS / Admin Reconciliation
→ VAT Included
중요:
과거 미확정이었던 rounding / truncation 세부 정책은 현재 Indonesia Roadmap의 blocker가 아니다.
Japan 프로젝트가 다시 공식적으로 재개되지 않는 이상 이 세부 정책을 이유로 현재 개발을 멈추지 않는다.
또한 Japan VAT policy를 Indonesia에 재사용하지 않는다.

---

### I-5. Japan Demo Fixture

```
services/coachDemoData.ts
```

- deterministic historical fixture
- Japan pilot/demo 전용
- Supabase fake sales row를 만들지 않음

Indonesia 신규 account에는 이 fixture가 자동 적용되면 안 된다.

---

## J. COACH V4 최종 상태

Coach는 4개 독립 기능:
1\. Sales Analysis
2\. AI Operating Coaching
3\. Menu Engineering / AI Menu Strategy
4\. Boost Plan
UI execution order는 dependency가 아니다.

---

### J-1. Period

Today:
selectedDate
Week:
selectedDate - 6 days
→ selectedDate
Month:
first day of selected month
→ selectedDate
Custom:
user-selected range
Comparison data는 enrichment.
없어도 current-period analysis가 가능해야 한다.

---

### J-2. Menu Engineering

Deterministic:
Star
\= 판매 ↑ / 수익 ↑

Cash Cow
\= 판매 ↑ / 수익 ↓

Puzzle
\= 판매 ↓ / 수익 ↑

Dog
\= 판매 ↓ / 수익 ↓
7일 미만 기간 hard block 없음.
Available data로 계산하고 필요하면 caution만 표시.

---

### J-3. Explicit AI Trigger

새 Gemini request를 자동으로 만들지 않는다.
다음은 request = 0:

- Coach entry
- period change
- card open
- tab return
- saved report restore
- deterministic calculation

새 AI call:

- AI 운영 코칭 분석하기
- AI 메뉴 분석하기
- AI Boost Plan 만들기
- 다시 분석

---

### J-4. Persistence

Table:
public.coach\_reports
Exact scope:
store\_id
\+ report\_type
\+ period\_start
\+ period\_end
Types:

- operating\_coaching
- menu\_engineering
- boost\_plan

Statuses:

- generating
- completed
- failed

Completed same-scope report:
즉시 표시
→ 자동 regeneration 없음

---

### J-5. Async Safety

현재 강점:

- exact-scope state
- stale response protection
- period/store isolation
- active-request tracking
- persisted result restore

Normal tab navigation 중 Coach/DetailPage lifecycle은 유지되어 active request가 계속될 수 있다.
F5/full refresh는 client request를 유지할 수 없음.
Persisted completed report는 복원.

---

## K. MENU V4 최신 상태

Active path:
App
→ StoreOwnerPageRouter
→ MenuPage
→ MenuSettingsPage
Menu는 browse-first다.
READ FIRST
→ EDIT ON REQUEST
현재:

- summary card
- search
- actual category chips
- no-image menu cards
- menu name
- category
- price
- cost
- food cost %
- edit
- Add
- Delete
- History
- Drag
- Effective Date
- Sticky Save

---

### K-1. NO MENU IMAGES

실제 제품에 메뉴 사진을 사용하지 않는다.
금지:

- food thumbnail
- image upload
- image URL
- placeholder image
- reserved empty image box

Guide reference image에 음식 사진이 있어도 actual product feature가 아니다.

---

### K-2. Food Cost %

Derived display:
unitCost / price × 100
새 DB column을 만들지 않는다.

---

## L. ENGINEERING AUDIT V1.0 — 완료

2026-08-12 Senior/Staff-level READ-ONLY repository audit 완료.
이 Audit은 앞으로 별도 Master Document:
SALES\_COACH\_AI\_ENGINEERING\_AUDIT\_V1.0
에서 관리한다.

### L-1. Project Size

Relevant Source Files: 54
Physical LOC: 15,597
Nonblank LOC: 13,715
Automated Tests: 0
핵심은 프로젝트 전체 크기보다 일부 Controller에 복잡도가 집중된 점이다.

---

### L-2. Largest / High-Risk Files

DataInput.tsx
2,364 LOC
CRITICAL / God Component

MenuSettingsPage.tsx
1,348 LOC
HIGH

DetailPage.tsx
1,310 LOC
CRITICAL / God Component

MasterDashboardPage.tsx
1,269 LOC
HIGH

DailySalesPage.tsx
1,037 LOC
HIGH

App.tsx
805 LOC
HIGH
LOC 자체만으로 refactor하지 않는다.
Responsibility concentration과 regression risk를 기준으로 판단.

---

### L-3. Audit Classification

C. PILOT READY
Deployment view:
Demo:
YES

Controlled 1-Store Pilot:
YES WITH CONDITIONS

10-Store Rollout:
NO

100-Store Rollout:
NO
이 분류는 현재 공식 Engineering 판단으로 사용한다.
과거 Dev Log의:
Production 10+ stores: YES WITH CONDITIONS
표현은 이 Audit 결과로 대체한다.

---

### L-4. 잘된 Engineering 영역

보호해야 할 것:

- `SalesV4Page.tsx` presentation boundary
- `CoachV4Page.tsx` presentation boundary
- deterministic-before-generative architecture
- Coach exact-scope protection
- stale async response protection
- server-side Gemini key isolation
- `coach_reports` store-scoped RLS migration
- human-authoritative OCR Apply flow
- current Vercel serverless deployment model
- current React local-state model

Redux/Zustand 도입은 현재 필요하지 않다.

---

### L-5. P0 Production Blockers

Broad production 전에 반드시 해결:

1. privileged API server-side authentication / role authorization
2. plaintext `requested_password` persistence/display 제거
3. operational table 전체 RLS inventory
4. full Supabase schema/migration reproducibility
5. default tenant/store ID 제거
6. high-value characterization/security tests

---

### L-6. P1

- `DataInput` / `DetailPage` domain extraction
- verified unreachable legacy code 제거
- API contract/error parsing 통일
- multi-step persistence failure 개선
- structured observability
- OCR async request guard

---

### L-7. Rewrite Policy

REWRITE NOT RECOMMENDED
권장:
PROTECT
→ TEST
→ REMOVE DEAD CODE
→ EXTRACT

---

## M. INDONESIA DEMO / PILOT — NEXT PRODUCT PHASE

현재 가장 중요한 다음 Product Validation 단계다.

### M-1. 오늘 시연

오늘은 완성된 제품을 인도네시아 점주에게 시연한다.
기존 테스트 계정을 시연용으로 사용할 수 있다.
하지만 시연용 temporary configuration은 product architecture의 최종 국가 정책이 아니다.

---

### M-2. 오늘 받아야 할 피드백

피드백은 아래 구조로 수집한다.

#### DAILY WORKFLOW

- 실제 마감 후 누가 입력하는가
- 입력 가능한 시간
- 하루 몇 분까지 허용 가능한가
- mobile 사용이 주인가
- 여러 명이 사용할 필요가 있는가

#### SALES

- POS total
- delivery / takeout / dine-in 구분
- orders
- visitors
- 필요한 추가 값
- 불필요한 값

#### RECEIPT / OCR

- 실제 마감 receipt 형태
- 한 장 / 긴 영수증
- 메뉴명
- 수량
- 단가
- channel
- tax/service 정보
- OCR을 실제 사용할 의향
- manual correction 허용 수준

#### MENU

- 메뉴명 언어
- category
- price
- cost
- 가격 변경 빈도
- 신규/삭제 빈도
- menu quantity 입력 방식

#### COACH

- 어떤 분석이 가장 유용한가
- Sales trend
- menu performance
- operational recommendation
- Boost action
- 보고 싶은 비교 기간
- AI 문구 난이도

#### UI / UX

- 이해하기 어려운 문구
- 불필요한 화면
- 입력이 느린 구간
- 화면이 길거나 복잡한 곳
- 버튼 위치
- mobile readability

---

### M-3. Feedback Classification

피드백을 바로 코드로 만들지 않는다.
먼저 다음으로 분류한다.
A. COMMON PRODUCT IMPROVEMENT
B. INDONESIA-SPECIFIC REQUIREMENT
C. NICE TO HAVE
D. OUT OF SCOPE
E. SECURITY / DATA REQUIREMENT
F. ADMIN REQUIREMENT
그 다음 implementation priority를 결정한다.

---

### M-4. 신규 Indonesia Account

피드백 후 독립 계정 생성.
필요 data:

- Store Name
- Country = Indonesia
- Brand
- Currency
- User Email
- role
- actual Menu Master
- selling price
- unit cost
- category
- active status

절대 하지 말 것:
Japan store row 이름만 Indonesia로 변경
신규 tenant로 만든다.

---

### M-5. External Pilot Access Condition

신규 Indonesia account를 내부에서 준비하는 것은 가능하다.
하지만 실제 외부 점주에게 장기 Pilot access를 제공하기 전에는 최소한 아래 Engineering P0를 우선 검증한다.

- privileged endpoint authorization
- password provisioning security
- relevant RLS
- tenant isolation
- default store fallback

즉:
Internal Account Preparation
→ 가능

External Controlled Pilot
→ P0 최소 보안 검증 후

---

### M-6. Indonesia E2E

최종 확인:
New Indonesia Account
→ Login
→ Menu Master
→ Sales Manual Input
→ OCR
→ Review
→ Apply
→ Save
→ Reload
→ Home
→ Sales Analysis
→ AI Operating Coaching
→ Menu Engineering
→ AI Menu Strategy
→ Boost Plan
→ Historical Revisit
모든 단계에서 Japan fixture / Japan VAT / Japan jp\_name policy가 leak되지 않는지 확인.

---

## N. 다음 우선순위 — FINAL ROADMAP

앞으로의 순서는 다음 4개 Phase로 고정한다.
PHASE A
Indonesia User Feedback & Pilot Definition
PHASE B
Production P0 Engineering Hardening

PHASE C
Safe Architecture Refactor

PHASE D
Admin Product Expansion

---

# PHASE A — INDONESIA USER FEEDBACK & PILOT DEFINITION

### 1순위. 인도네시아 점주 시연 및 피드백 수집

오늘 수행.
목표:
Does the product solve the real store workflow?
기능 추가보다 실제 사용 반응 확인이 우선.

---

### 2순위. Feedback Requirement 정리

시연 후 반드시 문서화:

- KEEP
- CHANGE
- ADD
- REMOVE
- COUNTRY-SPECIFIC
- DEFER

피드백을 그대로 구현하지 않고 Product Bible과 비교해 가치 판단.

---

### 3순위. Indonesia Account Specification

새 Store/User의:

- country
- brand
- currency
- menu master
- role
- sales channels
- tax/service policy
- OCR policy

정의.

---

### 4순위. 신규 Indonesia Store/User 생성

독립 account.
일본 테스트 계정을 production Indonesia tenant로 변환하지 않는다.

---

### 5순위. 공통 검증 기능 적용

Japan/V4 개발에서 검증된 Common Core를 활용:

- V4 UI
- OCR batch
- Sales save/reload
- Coach
- AI report persistence
- Menu management

---

### 6순위. Indonesia Feedback 반영

국가 전용 behavior는 실제 확인된 요구만 적용.
Japan-specific behavior 자동 복제 금지.

---

### 7순위. Indonesia E2E 검증

실제 메뉴/매출/영수증 데이터를 사용해 확인.
이 단계가 완료되면 제품이 한 국가용 customization이 아니라 실제 Multi-Country architecture로 갈 수 있는지 판단한다.

---

# PHASE B — PRODUCTION P0 ENGINEERING HARDENING

### 8순위. Privileged API Server Authorization

대상:
api/create-approved-user.ts
api/update-approved-user-password.ts
서버 자체에서:
Authentication
→ Role Authorization
→ Privileged Action
확인.
Client role gating만 믿지 않는다.

---

### 9순위. Plaintext Password 제거

현재 Audit issue:
requested\_password
Production-safe provisioning으로 변경.

- plaintext DB persistence 제거
- Admin UI 표시 제거
- secure reset/provision flow
- 기존 data cleanup 검토

---

### 10순위. Full Supabase Schema / RLS Inventory

대상:

- users
- stores
- sales\_daily
- menu\_master
- menu\_price\_history
- monthly\_targets
- coach\_reports
- signup\_requests

확인:

- schema
- PK / FK
- index
- unique
- trigger
- RLS
- policies

Repository migrations로 재현 가능하게 하는 것이 목표.

---

### 11순위. Default Store / Tenant 제거

`storeId = 1` 같은 fallback 제거.
Missing Store Context
→ Explicit Error

---

### 12순위. Characterization Tests

Refactor 전에 우선 구축.
Priority:

1. period logic
2. sales persistence / store scope
3. OCR normalization
4. OCR Apply gate
5. Japan DINE-IN / TAKEOUT regression
6. Menu Engineering
7. Boost guardrails
8. Coach exact-scope stale response
9. Menu effective-date/history
10. Auth/RLS

Indonesia-specific rule이 확정되면 해당 regression test도 추가.

---

# PHASE C — SAFE ARCHITECTURE REFACTOR

### 13순위. Legacy Code Inventory

Audit 후보:

- DetailPage unreachable render
- DailySalesPage `false &&`
- DataInput legacy JSX
- LoginPage
- legacy Period components
-

```
app/api/test-save/route.ts
```

분류:
SAFE TO DELETE
REQUIRES VERIFICATION
STILL ACTIVE
증거 없이 삭제하지 않는다.

---

### 14순위. Verified Dead Code Removal

Characterization test / active-path 확인 후 작은 단위로 제거.
Behavior identical.

---

### 15순위. DataInput.tsx 점진적 리팩토링

현재:
2,364 LOC
CRITICAL GOD COMPONENT
전체 rewrite 금지.
권장 단계:
Tests
→ OCR Validation Extraction
→ OCR Mapping Extraction
→ Country/Channel Rule Extraction
→ OCR Request Lifecycle
→ Sales Editor Controller
→ DataInput Simplification
Japan behavior와 Indonesia behavior를 분리할 때 Country Policy를 최소한으로 도입할 수 있다.

---

### 16순위. DetailPage.tsx 점진적 리팩토링

현재:
1,310 LOC
CRITICAL GOD COMPONENT
보호:

- exact scope
- stale response
- report persistence
- explicit AI trigger

추출 후보:

- period domain
- sales aggregation
- report lifecycle
- Menu Engineering controller
- Boost controller
- demo adapter

---

### 17순위. Observability

Production issue 진단을 위해:

- feature
- operation
- store\_id
- user\_id
- date
- period
- request\_id
- duration
- status
- error code

구조화.

---

# PHASE D — ADMIN PRODUCT EXPANSION

### 18순위. AdminApproval 기능 / 보안 Contract 재검증

UI보다 먼저:

- server authorization
- password provisioning
- approval
- reject
- edit
- delete
- password reset

확정.

---

### 19순위. AdminApprovalPage 모바일 최적화

Security contract가 확정된 후 진행.
Plaintext password 표시 금지.

---

### 20순위. 생성 완료 계정 전용 관리 화면

승인 workflow와 운영 계정 management를 분리.
예상:

- account status
- Store
- Brand
- Country
- 담당자
- enable/disable
- secure password reset
- operational metadata

Store Owner IA와 Admin IA를 섞지 않는다.

---

## O. Engineering Priority 해석

현재 `DataInput.tsx`가 크다고 해서 바로 리팩토링부터 하지 않는다.
정확한 순서:
Indonesia Feedback
→ New Country Requirements
→ P0 Security / Tenant
→ Characterization Tests
→ Dead Code
→ DataInput / DetailPage Refactor
이유:
지금 리팩토링한 뒤 Indonesia requirement가 새로 나오면 같은 파일을 다시 크게 변경할 수 있다.
실제 사용자 요구를 먼저 확인하고, 그 behavior를 Test로 고정한 다음 구조를 정리하는 편이 안전하다.

---

## P. 절대 잊으면 안 되는 확정 사항

### P-1. Japan Pilot Status

- 일본 파일럿은 완료.
- 더 이상 일본 현지 피드백을 기다리지 않는다.
- 일본은 Technical Reference다.
- 일본 전용 rule은 Indonesia에 자동 적용하지 않는다.
- Japan behavior를 제거하지도 않는다. Regression reference로 보존한다.

---

### P-2. Indonesia Status

- 오늘 실제 사용자 피드백 대상.
- 시연은 기존 test account를 활용할 수 있다.
- 시연 후 신규 독립 Indonesia account를 만든다.
- India/Indonesia 등 국가명을 혼동하지 않는다.
- Indonesia requirement는 실제 점주 피드백/데이터로 확정한다.

---

### P-3. Multi-Country Rule

COMMON CORE
≠
COUNTRY POLICY
공통 기능과 국가 규칙을 분리한다.

---

### P-4. Current UI

Coach / Sales / Home / Menu / More
이 5개가 사용자-facing active V4 navigation.
파일명 `SummaryPage`, `DetailPage`는 내부 이름일 뿐 사용자 IA가 아니다.

---

### P-5. OCR

- multi-image = one receipt batch
- menuCandidates
- human review
- current app Store/Date authority
- currency safety
- subtotal / final total separation
- manual entry fallback

회귀 금지.

---

### P-6. Coach

- deterministic before generative
- explicit AI trigger
- exact report scope
- stale response protection
- saved completed result restore
- UI execution order not dependency

회귀 금지.

---

### P-7. Menu

- no menu image
- browse first
- edit on request
- Add/Edit/Delete/History/Drag/Effective Date 유지

---

### P-8. Security

- Service Role browser exposure 금지
- client role gate는 authorization 아님
- privileged API server auth 필요
- plaintext password 금지 방향
- tenant fallback 금지
- RLS 추정 금지

---

### P-9. Refactor

- Rewrite 금지
- 먼저 Tests
- active path 확인
- dead code 증명
- pure logic부터 extraction
- behavior change와 refactor 분리

---

## Q. 주요 파일 최신 위험도

Engineering Audit 기준:

| **File**                           | **LOC** | **Risk** | **역할**                                  |
| ---------------------------------- | ------- | -------- | --------------------------------------- |
| components/DataInput.tsx           | 2,364   | CRITICAL | Sales/OCR orchestration + legacy        |
| components/MenuSettingsPage.tsx    | 1,348   | HIGH     | Menu draft/CRUD/DnD/persistence         |
| components/DetailPage.tsx          | 1,310   | CRITICAL | Coach orchestration + async/persistence |
| components/MasterDashboardPage.tsx | 1,269   | HIGH     | Master analytics UI/transforms          |
| components/DailySalesPage.tsx      | 1,037   | HIGH     | Sales controller + legacy               |
| App.tsx                            | 805     | HIGH     | Auth/store/routing/app state            |
| hooks/useSalesData.ts              | 488     | HIGH     | Sales date/load/store context           |
| services/salesStorage.ts           | 472     | HIGH     | Sales persistence                       |
| api/ocr.ts                         | 420     | HIGH     | OCR server processing                   |
| components/SalesV4Page.tsx         | 178     | LOW      | focused Sales V4 presentation           |

`SalesV4Page` / `CoachV4Page`처럼 presentation boundary가 작고 명확한 방향을 보호한다.

---

## R. Current Engineering Scorecard Baseline

2026-08-12:

| Area                         | Score / 10 |
| ---------------------------- | ---------- |
| Repository Structure         | 5          |
| Component Architecture       | 3          |
| Separation of Concerns       | 4          |
| TypeScript Quality           | 4          |
| State Management             | 4          |
| Async Safety                 | 6          |
| Service/API Architecture     | 5          |
| Database Access Architecture | 4          |
| Error Handling               | 4          |
| Debuggability                | 3          |
| Testability                  | 2          |
| UI Architecture              | 6          |
| Feature Isolation            | 4          |
| Scalability                  | 3          |
| Overall Maintainability      | 4          |

다음 P0 + Test + Legacy cleanup 이후 재감사.

---

## S. Git / Codex / Validation Workflow

기본:
1\. Current git status
2\. Active path 확인
3\. Business rule 확인
4\. One clear scope
5\. Codex change
6\. TypeScript
7\. Build
8\. git diff --check
9\. ChatGPT Audit
10\. git add / commit
11\. git push
12\. git pull
13\. git status clean
14\. Vercel Ready
15\. Browser Test
검증:
node node\_modules\typescript\bin\tsc --noEmit
npm run build
git diff --check
사용자 작업 선호:

- 1대화 = 1작업
- 가능하면 최소 변경 파일
- PowerShell 명령은 한 copy-paste block
- 파일 위치와 목적 명확히
- 추측으로 PASS 금지
- diff / source / browser / Supabase / console 근거 사용
- 같은 feature의 작은 변경은 meaningful completion까지 묶어 commit 가능
- major area 변경 전 commit

---

## T. 다음 대화에서 사용하는 공식 Master Document Set

다음 대화부터 아래 4개를 함께 제공한다.
1\. bible
2\. ui/ux guide
3\. dev log
4\. SALES\_COACH\_AI\_ENGINEERING\_AUDIT\_V1.0
역할:
bible
→ WHAT / WHY / PRODUCT RESPONSIBILITY

ui/ux guide
→ LOOK / FEEL / INTERACTION

dev log
→ CURRENT IMPLEMENTATION / HISTORY / NEXT WORK

engineering audit
→ CODE HEALTH / SECURITY / TECH DEBT / PRODUCTION READINESS

---

## U. 다음 대화에서 바로 시작할 작업

### U-1. 인도네시아 시연 전이라면

제품 기능을 더 추가하지 않는다.
확인:

- production deploy
- demo account login
- Sales sample
- OCR sample
- Coach saved/current behavior
- Menu
- network/API
- critical demo path

---

### U-2. 인도네시아 시연 후라면

첫 작업:
Indonesia Store Owner Feedback Review
사용자가 시연 피드백을 공유하면:

1. 모든 피드백을 빠짐없이 정리
2. Common / Indonesia-specific 분류
3. Product Bible 위반 여부 확인
4. UI/UX issue와 Business issue 분리
5. P0 / P1 / P2 우선순위
6. 신규 Indonesia account requirement 정의
7. 코드 수정 전에 작업 sequence 확정

---

### U-3. Indonesia account를 만들 때

기존 Japan account를 그대로 production tenant로 rename하지 않는다.
신규 Store/User를 만든다.
단, Engineering Audit의 privileged endpoint / password 문제가 있으므로:

- 내부 준비 가능
- 실제 external pilot access 전 P0 security 확인

---

## V. 다음 AI / 다음 대화용 시작 프롬프트

아래 내용을 새 대화 시작 시 그대로 사용할 수 있다.
Sales Coach AI 프로젝트를 이어서 개발한다.

첨부한 4개의 Master Document를 먼저 읽는다.

1\. Product Bible
2\. UI/UX Guide
3\. Development Log V2.1
4\. SALES\_COACH\_AI\_ENGINEERING\_AUDIT\_V1.0

현재 Store Owner Navigation:
Coach / Sales / Home / Menu / More

핵심 Product Loop:
INPUT → ANALYSIS → ACTION → RE-CHECK

현재 상태:
\- V4 Home / Sales / Coach / Menu / More active
\- UI/UX demo-ready
\- Engineering Audit classification = C. PILOT READY
\- Demo = YES
\- Controlled Pilot = YES WITH CONDITIONS
\- 10-store rollout = NO
\- 100-store rollout = NO

중요한 최신 방향 전환:
\- 일본 파일럿은 완료되었다.
\- 더 이상 일본 현지 피드백을 다음 개발의 prerequisite로 두지 않는다.
\- 일본 계정/구현은 Technical Reference로 유지한다.
\- 오늘 인도네시아 점주에게 현재 완성 제품을 시연한다.
\- 시연 후 실제 점주 피드백을 Product Requirement로 정리한다.
\- 그 후 일본 계정을 production Indonesia 계정으로 바꾸는 것이 아니라 신규 Indonesia Store/User를 생성한다.
\- Japan에서 검증한 Common Product Core는 재사용한다.
\- Japan-specific VAT/jp\_name/※★/DINE-IN/TAKEOUT rule은 Indonesia에 자동 적용하지 않는다.
\- Indonesia-specific behavior는 실제 피드백과 운영 데이터로 결정한다.

현재 Product Core:
\- OCR multi-image = ONE receipt batch
\- OCR Review/Apply
\- Store/Date = app context authoritative
\- currency mismatch = safety blocker
\- receipt\_subtotal != receipt\_total
\- Coach explicit AI trigger
\- Supabase coach report persistence
\- exact-scope restore
\- stale-response guard
\- deterministic Menu Engineering
\- AI Menu Strategy
\- Boost Plan
\- Menu no-image browse-first UI

Engineering Audit 핵심:
\- DataInput.tsx 2,364 LOC / CRITICAL God Component
\- DetailPage.tsx 1,310 LOC / CRITICAL God Component
\- automated tests = 0
\- privileged service-role endpoints의 server authorization이 P0
\- requested\_password plaintext persistence/display 제거가 P0
\- full Supabase RLS/schema inventory가 P0
\- default tenant/store fallback 제거가 P0
\- Characterization Tests가 P0
\- Rewrite 금지

현재 우선순위:

PHASE A — Indonesia User Feedback & Pilot Definition
1\. 인도네시아 점주 피드백 수집
2\. Feedback requirement 분류
3\. Indonesia account specification
4\. 신규 Indonesia Store/User 생성
5\. Common Core 적용
6\. Indonesia-specific feedback 반영
7\. Indonesia E2E 검증

PHASE B — Production P0 Engineering Hardening
8\. Privileged API server authorization
9\. Plaintext password 제거
10\. Full Supabase Schema / RLS Inventory
11\. Default Store/Tenant 제거
12\. Characterization Tests

PHASE C — Safe Architecture Refactor
13\. Legacy Code Inventory
14\. Verified Dead Code Removal
15\. DataInput.tsx 점진적 리팩토링
16\. DetailPage.tsx 점진적 리팩토링
17\. Observability

PHASE D — Admin Product Expansion
18\. AdminApproval security/function contract
19\. AdminApprovalPage 모바일 최적화
20\. 생성 완료 계정 전용 관리 화면

작업 원칙:
\- 1대화 = 1작업
\- 한 번에 major functional area 하나
\- active render path를 먼저 확인
\- DB schema / RLS 추정 금지
\- security fix와 cosmetic refactor를 섞지 않음
\- Japan-specific rule을 Indonesia에 자동 적용하지 않음
\- 일반 account regression 금지
\- DataInput / DetailPage rewrite 금지
\- Refactor 전에 Characterization Test
\- deterministic logic 보존
\- 변경 후 TypeScript / Build / git diff --check
\- 근거 없이 PASS 선언 금지

시연 피드백이 이미 있다면 첫 작업은 피드백 분석이다.
아직 시연 전이면 기능 추가보다 demo smoke test만 진행한다.

---

## W. 2026-08-12 완료 체크

### Product / V4

- V4 Home active
- V4 Sales active
- V4 Coach active
- V4 Menu active
- V4 More active
- Sales original V4 guide implementation
- Coach compact UI
- Menu no-image browse-first UI
- Save success feedback
- OCR receipt icon fix

### OCR

- OCR / Coach API key separation
- OCR multi-image single-batch
- subtotal / total semantics
- menuCandidates mapping
- human review/apply
- currency safety
- Japan DINE-IN / TAKEOUT

### Coach

- Today / Week / Month / Custom
- comparison enrichment
- deterministic Menu Engineering
- short-period hard block removal
- AI Operating
- AI Menu Strategy
- AI Boost Plan
- explicit AI trigger
- Supabase report persistence
- exact scope
- stale-response protection
- normal tab request survival

### Japan

- Japan technical pilot
-

```
name + jp_name
```

1. Japan channel handling
2. Japan VAT reference implementation
3. Japan demo/reference fixture
4. Japan pilot phase closed for current roadmap

### Engineering

- Senior Engineering Architecture Audit V1.0 completed
- Privileged API authorization
- Plaintext password removal
- Full schema / RLS inventory
- Default tenant removal
- Characterization tests
- Legacy code removal
- DataInput extraction
- DetailPage extraction
- Observability

### Indonesia

- Indonesia store-owner demo feedback collected
- Feedback requirement classification
- Indonesia account specification
- Independent Indonesia Store/User
- Indonesia actual Menu Master
- Indonesia-specific rules
- Indonesia E2E validation

### Admin

- Admin security contract
- AdminApprovalPage mobile optimization
- completed-account management surface

---

## X. 현재 최종 판단

현재 Sales Coach AI는:
기능:
시연 가능

UI/UX:
시연 수준 충족

Japan:
Technical Pilot Completed

Next User Validation:
Indonesia

Architecture:
작동하지만 Technical Debt 존재

Security:
Production Hardening 필요

Testing:
부족

Refactor:
필요하지만 Rewrite 불필요

Immediate Product Priority:
Indonesia Feedback

Immediate Engineering Priority After Product Feedback:
P0 Security / Tenant / Tests
가장 중요한 현재 전략:
DO NOT KEEP POLISHING JAPAN.

USE JAPAN AS A REFERENCE.

LISTEN TO INDONESIA.

CREATE A CLEAN INDONESIA TENANT.

FIX P0 ENGINEERING RISKS.

LOCK BEHAVIOR WITH TESTS.

THEN REFACTOR SAFELY.

---

# HISTORICAL ARCHIVE — DEVELOPMENT HISTORY

> 아래 내용은 기존 Dev Log의 개발 이력과 의사결정 과정을 보존하기 위한 Historical Archive다.

> 이 영역에는 당시 시점에서 유효했던 표현이 그대로 남아 있을 수 있다.
> 예:

- “일본 현지 피드백 대기”
- “일본 파일럿 안정화 후”
- “DataInput.tsx 1600줄 이상”
- 과거 Summary / Detail 사용자 IA

> 이런 표현은 **현재 상태가 아니다.**

> 현재 구현 / 우선순위 / LOC / Production Readiness를 판단할 때는 반드시 문서 최상단의
> `LATEST AUTHORITATIVE STATE — V2.1.0`을 따른다.

---

## 0. 이 문서의 목적

이 문서는 단순 회고용 문서가 아니다.
이 문서의 목적은 **다음 대화에서 바로 개발을 재개하기 위한 실전 운영 문서**다.
즉, 다음 대화에서 이 문서 하나만 복붙해도 아래 내용이 모두 이어져야 한다.

- 프로젝트 목적
- 현재 UI/UX 구조
- 실제 운영 흐름
- 주요 파일 역할
- 현재 파일 트리
- 현재 안정 상태
- 최근 완료된 작업
- 최근 세션에서 발생한 문제와 해결 방식
- 일본 OCR 파일럿 최신 상태
- 일본 메뉴 데이터 구조
- 일본 홀/포장 구조
- 일본 VAT 구조
- 기존 AI Coach 구조
- Master Dashboard 구조
- 관리자 승인/계정 생성 구조
- Menu 관리 구조
- 현재 미해결 항목
- 다음 우선순위
- 다음 작업 시 절대 잊으면 안 되는 규칙

이번 버전 V1.7.0은 기존 V1.5.0 문서에 더해 아래 내용을 새롭게 반영한다.

- 일본 OCR 파일럿 실사용 테스트 진행
- `menu_master.jp_name` 기반 일본어 메뉴 매칭 구조 확정
- 일본 관리자 화면 기반 OCR 입력 가능성 확인
- `※`, `★`, `※★` 표시 기반 포장 판별 규칙 확정
- 기존 `DELIVERY` 표현을 일본 운영상 `포장 / TAKEOUT` 개념으로 재해석
- 일본 파일럿 계정에만 `홀 / 포장` 2칸 메뉴 입력 UI 적용
- 일반 계정은 기존 단일 수량 입력 UI 유지
- 일본 VAT 구조 확인
- 일본 메뉴 가격은 VAT 포함가임을 확인
- 홀 10%, 포장 8% 소비세 구조 반영
- AI Coach / 분석 기준은 VAT 제외 매출 기준으로 가는 방향 확정
- POS / 일본 관리자 화면 비교는 VAT 포함 금액 기준으로 보는 방향 확정
- DataInput.tsx가 1600줄 이상으로 커진 상태와 리팩토링 후순위 판단
- 일본 현지 피드백 대기 상태
- 현재 추가 수정 전 반드시 일본 피드백을 기다려야 하는 상태

---

## 1. 프로젝트 정의

Sales Coach AI는 외식 매장의 일별 운영 데이터를 기반으로 아래 기능을 제공하는 운영 분석 시스템이다.

- KPI 계산
- 메뉴 엔지니어링 분석
- AI 코칭 리포트 생성
- Boost Plan / 실행 전략 제안
- 메뉴 / 가격 / 원가 관리
- 점주 입력 / 운영 루틴 지원
- OCR 기반 메뉴 수량 자동 입력
- 관리자 승인 / 계정 생성 / 계정 운영 관리
- 국가별 / 브랜드별 / 매장별 운영 기준 분기

초기 목표는 Single Store 운영 분석 도구였지만, 현재 방향은 명확히 프랜차이즈 본사용 Multi-Store SaaS다.
최종 구조 방향은 아래와 같다.
Master Dashboard
└ Brand
　└ Store
예시 브랜드:

- 홍콩반점
- 새마을식당
- 본가
- 빽다방 계열
- 빽비빔 계열
- 기타 더본 해외 브랜드

현재 시스템은 단순 분석 앱 수준을 넘어섰다.
현재는 아래 흐름을 포함하는 운영형 SaaS에 가깝다.
점주 신청
→ 관리자 승인
→ Supabase Auth 계정 생성
→ stores / users row 생성
→ 점주 로그인
→ Sales 입력
→ Menu 관리
→ OCR 자동 입력
→ Summary 확인
→ Detail 분석
→ AI Coach 리포트 생성
→ Master Dashboard에서 전체 매장 확인

---

## 2. 현재 핵심 목표

현재 목표는 기능을 무작정 더 붙이는 것이 아니다.
현재 핵심 목표는 아래 4가지다.

---

### 2-1. 점주가 매일 쓰는 루틴 안정화

점주가 실제로 매일 사용하는 흐름은 아래와 같다.
Summary
→ Sales
→ Detail
→ Menu
이 흐름이 끊기지 않아야 한다.
특히 Sales 페이지는 매장 마감 후 매출 입력 루틴이므로 가장 중요하다.
Sales 페이지의 핵심은 `DataInput.tsx`다.

---

### 2-2. 관리자가 Supabase에 직접 들어가지 않아도 운영 가능하게 만들기

사용자는 명확하게 방향을 정했다.

> Supabase에 직접 들어가서 데이터를 수정하는 방식이 아니라, 시스템 내부에서 모든 운영 데이터 수정이 가능해야 한다.

현재 이미 진행된 관리자 기능:

- 점주 계정 신청
- 관리자 승인
- 승인 시 auth user 생성
- stores row 생성
- users row 생성
- 승인 / 거절 / 수정 / 삭제
- 승인 완료 계정 비밀번호 반영 API

아직 남은 방향:

- 승인 완료 계정 전용 관리 화면
- 운영 중 계정 정보 수정
- 매장 정보 수정
- 비밀번호 변경
- 메뉴/가격/국가/브랜드 운영 정보 관리

---

### 2-3. 국가 / 브랜드 / 매장별 자동 분기 구조 안정화

현재 시스템은 국가별로 아래 항목을 다르게 처리해야 한다.

- 통화
- 메뉴 가격 표시
- AI Coach 프롬프트
- OCR 방식
- 메뉴명 매칭 기준
- VAT / 세금 처리
- 입력 UI
- POS 비교 기준

이번 일본 파일럿은 이 방향의 첫 실제 테스트다.
일본에서는 다음이 별도로 필요했다.

- 일본어 메뉴명
- 한글 canonical menu name

jp\_name

1. 홀 / 포장 구분
2. 10% / 8% VAT
3. VAT 포함 가격
4. VAT 제외 분석
5. POS VAT 포함 비교
---

### 2-4. 안정화 우선, 대형 리팩토링 후순위

현재 `DataInput.tsx`가 1600줄 이상으로 커졌다.
구조적으로는 리팩토링이 필요하지만, 지금은 일본 파일럿 안정화가 우선이다.
따라서 현재 판단은 다음과 같다.

- 지금 당장 리팩토링하지 않는다.
- 일본 피드백 전까지 큰 구조 변경을 피한다.
- 기능 안정화 후 별도 리팩토링 작업으로 분리한다.
- 리팩토링 시에도 1대화 = 1작업 원칙을 지킨다.

---

## 3. 현재 확정된 UI 구조

현재 UI 구조는 기능 분류가 아니라 **사용 흐름 기준**으로 아래 4개가 확정되어 있다.
이 구조는 유지해야 한다.

---

### 3-1. Summary

요약 / 현황 확인 화면이다.
표시 내용 예:

- 전일 대비 매출
- 전일 대비 주문
- 전일 대비 객단가
- 최근 7일 평균 대비 매출
- 월 누적 매출
- 일평균
- 목표 달성률
- 매출 트렌드
- 매장 운영 요약

최근 반영된 방향:

- 국가별 통화 표시 필요
- store country 기준으로 통화가 표시되어야 함
- Master Dashboard와 달리 점주 화면은 해당 매장 현지 통화 기준이 맞음

---

### 3-2. Sales

실제 매출 입력 화면이다.
핵심 입력:

- POS 매출
- 배달 매출 또는 국가별 매출 구분 필드
- 방문객 수
- 주문수
- 메뉴별 수량
- OCR 입력
- OCR 결과 확인
- OCR 결과 수동 교정
- 입력 매출 합계
- 메뉴 매출 합계
- 오차 표시

이 페이지의 핵심은 실질적으로 `DataInput.tsx`다.
일반 계정 기준:
메뉴명 | 수량
일본 파일럿 계정 기준:
메뉴명 | 홀 | 포장
중요:

- 일본 파일럿 계정만 홀/포장 2칸 UI가 보여야 한다.
- 일반 계정에 홀/포장 UI가 노출되면 안 된다.
- 실제로 한 번 모든 계정에 홀/포장 UI가 적용된 문제가 있었고, 즉시 일본 계정 전용 분기로 수정했다.

---

### 3-3. Detail

분석 / AI 코칭 / 기간 분석 화면이다.
포함 기능:

- AI 코칭 리포트
- 기간 비교
- Top 메뉴 비교
- Boost Plan
- Menu Engineering
- Daily Trend
- 기간별 매출 분석
- 메뉴별 판매량 분석
- 메뉴별 매출 분석

최근 상태:

- 코칭 리포트는 클릭 시 생성하는 방향
- 매장 마감 후 오늘의 코칭 리포트 확인 목적
- 코칭 리포트를 매번 DB에 저장하는 구조는 무겁다고 판단
- 현재는 필요 시 생성하는 구조가 맞음
- 추후 속도 개선 필요 가능성 있음

---

### 3-4. Menu

메뉴 설정 / 가격 / 원가 / 순서 / 메뉴명 관리 화면이다.
현재 가능 기능:

- 메뉴명 수정
- 가격 수정
- 원가 수정
- 순서 변경
- 신규 메뉴 추가
- 메뉴 삭제 또는 비활성화
- 변경사항 저장
- 가격 이력 조회
- 중복 메뉴명 감지

일본 작업과의 연관:

- 일본 메뉴의 한글 canonical `name` 관리
- 일본어 `jp_name` 관리
- 일본 가격 관리
- 일본 원가 관리
- 일본 active / inactive 메뉴 구분
- 운영 메뉴만 active 유지

현재 중요한 원칙:

- 일본어 메뉴를 별도 메뉴로 만들지 않는다.
- 포장 메뉴를 별도 메뉴로 만들지 않는다.
- 한글 name 1개 + 일본어 jp\_name 1개 구조를 유지한다.

---

## 4. 기술 스택과 실행 구조

기술 스택:

- Frontend: React + Vite + TypeScript
- Styling: TailwindCSS
- Database/Auth: Supabase
- Deploy: Vercel
- AI/OCR: Gemini API
- Repository: GitHub

실행 구조:
GitHub
→ Vercel
→ Supabase
→ React App
→ Gemini API
중요 사항:

- `App.tsx`는 `src/` 아래가 아니라 프로젝트 루트에 있다.
- 이 점은 다음 대화에서도 반드시 기억해야 한다.
- 사용자는 GitHub에 직접 복붙하고 commit한다.
- Vercel build 로그로 성공/실패를 확인한다.
- 사용자는 개발자가 아니므로, 코드는 바로 붙여넣을 수 있어야 한다.

---

## 5. 현재 파일 트리

현재 프로젝트 주요 파일 트리는 아래와 같다.
/
├─ api/
│  ├─ coach.ts
│  ├─ create-approved-user.ts
│  ├─ health.ts
│  ├─ ocr.ts
│  └─ update-approved-user-password.ts
│
├─ app/
│  └─ api/
│     └─ test-save/
│        └─ route.ts
│
├─ components/
│  ├─ AdminApprovalPage.tsx
│  ├─ AdminCreateUserPage.tsx
│  ├─ DailySalesPage.tsx
│  ├─ DataInput.tsx
│  ├─ DetailPage.tsx
│  ├─ LoginPage.tsx
│  ├─ MasterDashboardPage.tsx
│  ├─ MenuPage.tsx
│  ├─ MenuSettingsPage.tsx
│  ├─ PeriodBoostPlan.tsx
│  ├─ PeriodComparisonPanel.tsx
│  ├─ PeriodMenuAnalysisSection.tsx
│  ├─ PeriodMenuEngineering.tsx
│  ├─ PeriodTopMenuCompare.tsx
│  ├─ ReportDisplay.tsx
│  ├─ SalesPage.tsx
│  ├─ StoreOwnerPageRouter.tsx
│  ├─ StoreOwnerShell.tsx
│  └─ SummaryPage.tsx
│
├─ hooks/
│  ├─ useMonthlyTarget.ts
│  └─ useSalesData.ts
│
├─ services/
│  ├─ geminiService.ts
│  ├─ masterDashboardService.ts
│  ├─ menuEngineeringService.ts
│  ├─ menuMasterService.ts
│  ├─ menuPriceService.ts
│  ├─ monthlyTargetService.ts
│  ├─ ocrService.ts
│  ├─ salesStorage.ts
│  └─ supabaseClient.ts
│
├─ utils2/
│  ├─ currency.ts
│  ├─ date.ts
│  └─ periodComparison.ts
│
├─ App.tsx
├─ README.md
├─ index.css
├─ index.html
├─ index.tsx
├─ metadata.json
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ tsconfig.json
├─ types.ts
├─ utils/
└─ vite.config.ts

---

## 6. 파일별 실제 역할

---

### 6-1. App.tsx

앱 전체 진입점이다.
매우 민감한 파일이다.
역할:

- 로그인 처리
- Supabase 세션 확인
- user role 확인
- store\_id 확인
- store country 확인
- monthly stats 관리
- selectedDate 관리
- Summary / Sales / Detail / Menu 연결
- master / store\_owner 분기
- StoreOwnerShell 연결
- MasterDashboardPage 연결

현재 중요한 상태:

- 로그인 시 입력값에 `@`가 없으면 `@tbk.com`을 자동으로 붙이는 구조가 있음
- users 테이블에서 role, store\_id 조회
- stores 테이블에서 country 조회
- master면 MasterDashboardPage
- store\_user면 StoreOwnerShell 하위 구조
- 일본 파일럿 계정도 store\_user 흐름을 탄다

중요 경고:

- App.tsx는 부분 패치 누적 방식으로 건드리면 위험하다.
- App.tsx를 건드릴 경우 전체 문맥을 보고 수정해야 한다.
- 지금 일본 파일럿 작업에서는 App.tsx를 최대한 건드리지 않는 방향이 맞다.

---

### 6-2. DataInput.tsx

현재 가장 중요한 파일 중 하나다.
이번 일본 파일럿 작업으로 더 중요해졌다.
현재 1600줄 이상이며 매우 민감하다.
역할:

- 점주용 Sales 입력 화면 핵심
- OCR 업로드 / 처리
- OCR 이미지 압축
- OCR 결과 누적
- OCR rawText 표시
- OCR structured items 처리
- OCR 결과 수동 교정
- 메뉴 수량 입력
- POS 매출 입력
- 배달 매출 입력
- 방문객 수 입력
- 주문수 입력
- 특이사항 입력
- 입력 매출 합계 표시
- 메뉴 매출 합계 표시
- 오차 표시
- 국가별 통화 표시
- 일본 계정 전용 홀/포장 입력 UI
- 일본 계정 전용 VAT 계산
- 일반 계정 단일 수량 입력 유지

기존 구조:
OCR
→ rawText
→ 정규식 파싱
→ autoCorrectItem
→ matched menu 추정
→ qty 입력
현재 구조:
OCR
→ Gemini structured items 우선 사용
→ structured items 없을 경우 rawText fallback
→ matched\_name 기준 메뉴 매칭
→ 일본 계정이면 receipt\_name의 `※` / `★`를 보고 홀/포장 분리
→ 일반 계정이면 기존 qty 단일 구조 유지
현재 일본 파일럿 반영 내용:

- `userEmail` 기준 일본 파일럿 여부 판단
- 일본 계정: `jp_pn@theborn.co.kr`
- 일본 계정만 메뉴 입력 UI가 `홀 / 포장` 2칸으로 표시
- 일반 계정은 기존처럼 수량 1칸만 표시
- OCR 결과에서 `※` 또는 `★`가 들어간 메뉴는 포장으로 분류
- 표시가 없는 메뉴는 홀로 분류

dine\_in\_qty
takeout\_qty

1. `qty = dine_in_qty + takeout_qty` 호환 유지
2. 일본 메뉴 매출 합계는 VAT 제외 기준으로 표시
3. 일본 VAT 포함 금액은 POS / 관리자 화면 비교용으로 별도 표시
4. 일반 계정에는 VAT / 홀포장 UI 영향 없어야 함

현재 DataInput.tsx에서 가장 중요한 리스크:

- 코드가 1600줄 이상
- OCR / 입력 UI / VAT / 합계 / 수동 교정이 한 파일에 몰려 있음
- 수정 중 중괄호 깨짐으로 Vercel build 오류가 발생했던 적 있음
- 전체 파일 교체 방식을 선호해야 함
- 부분 교체는 매우 위험함

향후 리팩토링 후보:
OcrPanel.tsx
MenuInputGrid.tsx
useOcrApply.ts
useJapanVatSales.ts
useMenuQtyInput.ts
단, 현재는 일본 파일럿 피드백 전까지 리팩토링 후순위.

---

### 6-3. services/ocrService.ts

OCR 프론트 호출 서비스다.
기존:
callOcr(imageBase64, mimeType)
현재:
callOcr(imageBase64, mimeType, options)
options에 포함되는 값:

- userEmail
- country
- brand
- menuCandidates

즉, OCR API는 이제 단순 이미지 업로드가 아니다.
현재 OCR은 아래 문맥을 함께 전달한다.

- 어느 계정인지
- 어느 국가인지
- 어느 브랜드인지
- 어떤 메뉴 후보가 있는지

일본 파일럿과의 연관:

- 일본 계정이면 `userEmail`을 기준으로 api/ocr.ts에서 structured OCR 분기
- menuCandidates는 향후 `{ name, jp_name }` 구조가 중요
- 현재 일본 OCR 정확도를 높이려면 `name + jp_name` 후보 전달이 중요함

주의:

- 일반 계정 rawText OCR 흐름이 깨지면 안 된다.
- 일본 계정만 structured OCR / jp\_name matching이 강화되어야 한다.

---

### 6-4. api/ocr.ts

OCR 백엔드 API다.
이번 일본 OCR 파일럿의 핵심 파일이다.
기존:

- 이미지를 Gemini에 보내고 rawText만 추출

현재:

- userEmail을 보고 일본 파일럿 계정인지 분기
- `JP_PN@THEBORN.CO.KR` 계정이면 structured OCR 사용
- 그 외 계정은 기존 rawText OCR 유지

현재 구조:
if Japan pilot account
→ structured OCR
else
→ rawText OCR
현재 일본 structured OCR의 역할:

- 일본어 메뉴명 읽기
- menuCandidates 기준으로 한글 canonical name 선택
- receipt\_name 유지
- matched\_name 반환
- qty 반환
- price 반환 또는 0
- confidence 반환
- needs\_review 반환
- order\_type 또는 order\_channel 유사 값 반환

일본에서 중요한 규칙:

- `※` 또는 `★`가 있으면 포장
- 표시가 없으면 홀
- 초기에는 DELIVERY / POS로 표현했으나, 운영 관점에서는 일본에는 배달이 없는 매장이므로 `포장 / 홀`이 맞음
- 따라서 DataInput에서는 `※` / `★`를 직접 보고 `TAKEOUT / DINE_IN`으로 해석하는 구조가 더 안전함

중요:

- OCR 프롬프트를 계속 만지면 정확도가 흔들릴 수 있음
- 세금 / 홀포장 계산은 OCR이 아니라 앱 입력 반영 단계에서 처리하는 방향이 맞음
- OCR은 읽기와 매칭에 집중
- 앱은 운영 규칙 적용에 집중

---

### 6-5. services/menuMasterService.ts

menu\_master 로드 및 관리 서비스다.
역할:

- store\_id 기준 메뉴 로드
- 카테고리 그룹핑
- active 메뉴만 로드
- 메뉴 추가
- 메뉴 비활성화
- 메뉴 순서 업데이트
- 메뉴 데이터 normalize

일본 작업에서의 역할:

- 일본 store\_id 기준 현재 active 메뉴 관리
- 한글 canonical `name` 유지
- 일본어 `jp_name` 추가
- active / inactive 메뉴 정리
- OCR 후보 메뉴의 기준 테이블 역할

중요:

- 일본어 메뉴를 별도 row로 만들지 않는다.
- 포장 메뉴를 별도 row로 만들지 않는다.
- `name`은 한글 기준
- `jp_name`은 일본어 reference 기준

---

### 6-6. services/menuPriceService.ts

가격 / 원가 저장 / 조회 서비스다.
역할:

- 메뉴별 가격 조회
- 메뉴별 원가 조회
- effective date 기준 가격 history 조회
- 가격/원가 수정 저장
- store\_id 기준 가격 적용

중요 과거 문제:

- storeId를 받아놓고 실제로 store\_id = 1처럼 하드코딩된 문제가 있었음
- 일본 계정 가격 데이터가 DB에 있어도 화면에 안 보이던 문제가 있었음

해결 상태:

- 실제 storeId를 사용하도록 수정 완료
- 일본 계정 가격 데이터 반영 가능

일본 VAT와의 관계:

- 메뉴 가격은 VAT 포함 가격으로 저장되어 있음
- 예: 짜장 880엔은 VAT 포함 가격
- 분석 시에는 VAT를 나눠서 순매출을 계산해야 함
- 메뉴 가격 자체를 VAT 제외로 바꾸면 안 됨

---

### 6-7. MenuSettingsPage.tsx

메뉴 페이지 핵심 UI다.
현재 지원:

- 메뉴명 수정
- 가격 수정
- 원가 수정
- 순서 변경
- 신규 메뉴 추가
- 메뉴 삭제 / 비활성화
- 변경사항 저장
- 가격 이력 조회
- 중복 메뉴명 감지

일본 작업과의 연관:

- 일본 메뉴명 수정 가능
- 일본 메뉴 가격 수정 가능
- 일본 메뉴 원가 수정 가능
- 일본 운영 메뉴 active 상태 관리 가능
- 일본 `jp_name` 관리까지 장기적으로 UI에 필요할 수 있음

현재 중요한 방향:

- Supabase에 직접 들어가지 않고 시스템 내에서 메뉴 관리
- 일본 메뉴도 시스템 안에서 관리 가능해야 함
- 장기적으로 jp\_name도 Menu 페이지에서 수정 가능하게 하는 것이 이상적

---

### 6-8. SummaryPage.tsx

요약 페이지다.
역할:

- 월 누적 매출
- 일 평균 매출
- 목표 달성률
- 전일 대비
- 최근 7일 평균 대비
- KPI 요약

최근 반영:

- 국가별 통화 표시
- App에서 country prop을 넘겨야 정상 작동

일본 VAT와의 관계:

- 아직 Summary 전체가 일본 VAT 제외/포함 중 어떤 기준으로 보여야 하는지 최종 확정 필요
- 현재 Sales 입력에서는 일본 메뉴 매출을 VAT 제외 기준으로 분석하는 방향
- Summary에 표시되는 매출 기준은 일본 피드백 후 조정 가능성 있음

---

### 6-9. DetailPage.tsx / PeriodMenuAnalysisSection.tsx

AI 코칭 및 기간 분석 핵심 영역이다.
현재 정상 상태:

- AI 코칭 리포트
- 기간 분석
- Top10 메뉴 비교
- Boost Plan
- Menu Engineering
- Daily Trend

최근 해결한 UI 이슈:

- 기간 분석 비교 설정 직접선택 영역이 PC에서 잘리던 문제 해결
- `PeriodComparisonPanel.tsx` 내부 날짜 input 영역을 세로 배치로 수정
- 모바일에서는 문제 없었고 PC에서만 문제였음

일본 VAT와의 관계:

- AI Coach / 분석 기준은 VAT 제외 매출 기준이 맞음
- 일본에서는 홀/포장 세율이 다르므로 메뉴별 net sales 계산이 더 중요해짐
- Detail 분석에서 일본 매출이 VAT 포함 기준인지 제외 기준인지 혼동되지 않도록 장기적으로 라벨 정리가 필요함

---

### 6-10. AdminCreateUserPage.tsx

점주 신청 페이지다.
현재 신청 필드:

- owner name
- phone
- email
- requested\_password
- country
- brand
- store name

현재 운영 기준:

- 요청 비밀번호는 6자리 숫자 기준
- 신청 시 바로 계정을 만들지 않음
- signup\_requests에 pending 상태로 저장
- master가 승인해야 계정 생성

---

### 6-11. AdminApprovalPage.tsx

관리자 승인 페이지다.
현재 가능:

- pending / approved / rejected 탭
- 신청 내역 확인
- 수정
- 삭제
- 승인
- 거절
- 승인 완료 계정 실비밀번호 반영 버튼

연결 API:
/api/create-approved-user
/api/update-approved-user-password
현재 상태:

- 승인 시 auth user 생성
- stores row 생성
- users row 생성
- signup\_requests approved 처리
- 승인 후 requested\_password 수정만으로는 실제 Auth 비밀번호가 바뀌지 않는 문제를 인지했고, 별도 password update API를 만들었음

남은 과제:

- 모바일 최적화
- 승인 완료 계정 전용 관리 화면
- 운영 계정 관리와 signup\_requests 분리

---

### 6-12. MasterDashboardPage.tsx

본사용 마스터 대시보드다.
역할:

- 전체 매장 요약
- 브랜드별 필터
- 매장별 랭킹
- 브랜드 카드
- 선택 매장 상세
- 리스크 카드
- 추천 액션
- Top 메뉴 확인
- 기간 선택
- 현재 기간 vs 이전 기간 성장률 비교

현재 안정 상태:

- Master Dashboard는 MVP 기준 기능적으로 충분함
- 큰 기능 추가는 후순위
- 운영 테스트 후 필요한 기능만 추가하는 방향

---

### 6-13. masterDashboardService.ts

마스터 대시보드용 데이터 집계 서비스다.
역할:

- store range loading
- brand aggregation
- store ranking
- period comparison
- growth calculation
- selected store detail
- risk / action / top menu 구조 지원

현재 방향:

- Master Dashboard는 USD 기준으로 보는 방향
- 점주 페이지는 각 국가 현지 통화 기준
- 국가별 통화 매핑은 utils2/currency.ts와 연동

---

### 6-14. geminiService.ts

AI Coach 리포트 생성 서비스다.
역할:

- 매출 데이터 기반 코칭 리포트 생성
- KPI 요약
- 메뉴 엔지니어링
- Boost Plan
- 실행 제안
- 국가 / 브랜드 / 통화 문맥 반영

일본 VAT와의 관계:

- AI Coach에는 VAT 제외 매출이 들어가는 것이 맞음
- 세금 포함 금액이 들어가면 마진 / 메뉴 엔지니어링 / 객단가 분석이 왜곡될 수 있음
- 일본은 홀/포장에 따라 같은 가격이라도 순매출이 다르므로, AI 분석 기준은 VAT 제외가 더 논리적

---

### 6-15. useSalesData.ts

매출 데이터 로드 / 저장 / normalize 핵심 hook이다.
역할:

- 날짜별 sales\_daily 로드
- 저장
- categories normalize
- menu qty 관리
- monthly data 연동
- datesWithData 연동
- store\_id 기반 데이터 처리

중요:

- 현재 Sales Coach AI에서 가장 민감한 파일 중 하나
- App.tsx / DataInput.tsx / useSalesData.ts는 함부로 동시에 건드리면 안 됨
- 일본 홀/포장 수량이 payload에 어떻게 저장되는지 장기적으로 이 파일과 연관 있음

---

### 6-16. utils2/currency.ts

국가별 통화 표시 유틸이다.
역할:

- 국가 코드 기반 통화 반환
- 현지 통화 표시
- formatCurrencyValue 처리

현재 통화 방향:

- 점주 화면: 현지 통화
- Master Dashboard: 장기적으로 USD 환산 기준
- 일본: JPY
- 캄보디아: USD
- 싱가포르: SGD
- 몽골: MNT
- 기타 국가별 매핑 필요

---

### 6-17. utils2/date.ts

날짜 처리 유틸이다.
역할:

- local date formatting
- parseLocalDate
- calendar 날짜 처리
- timezone 문제 완화

중요:

- 매장 일별 데이터는 date 기준이 매우 중요
- 시간대가 꼬이면 sales\_daily 저장 날짜가 틀어질 수 있음

---

### 6-18. utils2/periodComparison.ts

기간 비교 유틸이다.
역할:

- 현재 기간
- 비교 기간
- 이전 동일 길이 기간
- period preset 계산

관련 UI:

- PeriodComparisonPanel
- PeriodMenuAnalysisSection
- DetailPage

최근 관련 작업:

- 직접 선택 날짜 input PC 잘림 문제 해결

---

## 7. 이번 세션에서 실제 완료된 작업

이번 세션의 핵심은 기존 일본 OCR 파일럿을 **실제 일본 운영 구조에 맞춰 한 단계 더 진화**시킨 것이다.

---

### 7-1. 일본 OCR 구조 방향 재검토

초기에는 OCR 속도 개선과 캐시 구조를 검토했다.
시도한 내용:

- 서버리스 Map 캐시
- OCR 이미지 압축
- prompt 간소화
- 모델 분기

결론:

- Vercel 서버리스 환경에서 메모리 Map 캐시는 유지 보장이 없어서 효과 없음
- 같은 이미지 1차 20초, 2차 21초로 차이 없음
- Map 캐시는 폐기 대상
- Supabase 기반 영구 캐시가 필요할 수 있으나 후순위
- 속도보다 정확도가 현재 더 중요
- 일본 파일럿은 OCR 정확도와 운영 구조가 우선

---

### 7-2. 일반 계정 rawText OCR 문제 확인 및 해결

일반 계정에서 영수증 OCR 시 아래 문제가 발생했다.
예:

- 짜장면을 제대로 짜장면으로 잡지 못함
- 고추짜장을 고추짜장으로 잡지 못함
- 원문 그대로 인식하지 못하는 것처럼 보임

분석 결과:

- OCR 자체가 글자를 못 읽은 것이 아니라 rawText 파싱 규칙 문제
- 일반 계정은 structured OCR이 아니라 rawText → 정규식 파싱 구조
- 영수증 포맷이 `메뉴명 / 가격 수량 합계` 형태일 때 기존 파서가 약함

해결:

- `extractMenuItemsFromRawText()` 보강

짜장면 / 7 1 7
고추짜장 9 2 18

1. 이런 구조를 처리하도록 정규식 보강

결과:

- 일반 계정 OCR도 해당 케이스에서 정상화
- 메뉴 합계 이상 문제는 OCR 문제가 아니라 메뉴 마스터 가격 문제였음
- 고추짜장 가격이 $10000으로 잘못 들어가 있었던 것이 원인
- 가격 수정 후 정상 확인

중요 운영 규칙:

- OCR 합계가 이상하면 먼저 메뉴 가격 데이터 확인

---

### 7-3. 일본 OCR 결과 정상 확인

일본 파일럿 계정에서 관리자 화면 OCR 테스트를 진행했다.
확인된 예시:

- チャジャン麺 → 짜장
- ちゃんぽん → 짬뽕
- タンスユク半皿 → 탕수육 하프
- タンスユク(小) → 탕수육 소
- タンスユク(大) → 탕수육 대
- コカ・コーラ → 콜라
- コカ・コーラ ゼロ → 제로콜라
- 生ビール → 생맥주
- 瓶ビール → 병맥주
- ハイボール → 하이볼
- ライス → 공기밥

일본 OCR 정확도는 실사용 가능한 수준으로 판단했다.

---

### 7-4. 일본 관리자 화면 기준으로 실제 운영 데이터 확인

일본 측 피드백에서 일 마감 영수증에는 메뉴별 수량이 없는 경우가 있었다.
따라서 일본 운영에서는 영수증보다 관리자 화면 / POS 집계 화면 OCR이 더 적합할 수 있다고 판단했다.
관리자 화면에는 다음이 보인다.

- 메뉴명
- 수량
- 매출
- 메뉴별 합계
- 일부 메뉴 앞의 `※`, `★` 표시

중요:

- 일본 OCR은 영수증 OCR만이 아니라 관리자 화면 OCR까지 고려해야 한다.
- 현재 테스트는 일본 관리자 화면 기반으로 상당히 잘 동작했다.

---

### 7-5. `※` / `★` 표시 의미 재정의

처음에는 `※` / `★`를 DELIVERY로 해석했다.
하지만 일본 파일럿 매장은 실제 배달이 없는 매장이라고 확인했다.
따라서 운영상 의미는 다음이 맞다.

- `※` 또는 `★` 있음 → 포장 / TAKEOUT
- 표시 없음 → 홀 / DINE\_IN

이후 코드 방향도 바뀌었다.
기존:

- order\_type = DELIVERY
- order\_type = POS

현재 운영 해석:

- order\_channel = TAKEOUT
- order\_channel = DINE\_IN

다만 기존 호환을 위해 내부 변수명에 DELIVERY/POS가 일부 남아 있을 수 있음.
중요:

- OCR API에서 order\_type을 믿는 것보다 DataInput에서 `receipt_name`에 `※` 또는 `★`가 있는지 직접 보는 방식이 더 안전하다고 판단했다.
- 실제 적용은 `/[※★]/.test(receiptName)` 구조로 판단.

---

### 7-6. 일본 홀 / 포장 UI 필요성 확정

사용자가 제안했다.

> 모든 메뉴와 음료 메뉴 포함해서 포장이 가능하고, 포장이랑 홀 가격은 같고 세율만 다르다. 그러면 메뉴 입력칸을 홀 / 포장으로 나누는 게 더 직관적이지 않나?

판단:

- 맞다.
- 이 방향이 일본 운영에는 가장 맞다.
- qty 하나로 합산하면 VAT 계산과 운영 확인이 계속 헷갈림
- 홀 / 포장 2칸 UI가 직관적
- OCR 결과와 화면 입력값이 1:1로 맞음

결정:
일본 파일럿 계정에서는 메뉴 입력 UI를 아래처럼 변경.
메뉴명 | 홀 | 포장
일반 계정은 기존 유지.
메뉴명 | 수량

---

### 7-7. 전체 계정에 홀/포장 UI가 적용된 문제 발생 및 해결

처음 홀/포장 UI를 적용했을 때 모든 계정에 적용되는 문제가 발생했다.
이건 큰 문제였다.
문제:

- 일본 파일럿만 적용되어야 하는데 전체 계정에 홀/포장 UI 표시
- 다른 국가/브랜드 매장 운영 혼란 가능
- 기존 데이터 구조 영향 가능

해결:

- 일본 파일럿 계정만 분기
- `jp_pn@theborn.co.kr` 기준으로 홀/포장 UI 표시
- 일반 계정은 기존 단일 qty input 유지

현재 원칙:

- 일본 파일럿 계정만 홀/포장
- 나머지는 기존 수량 1칸
- 이 분기 절대 깨지면 안 됨

---

### 7-8. OCR → 홀/포장 자동 입력 구조 반영

일본 OCR 결과에서 다음처럼 분리되도록 반영했다.
예시:
짜장:

- 원문: チャジャン麺
- 수량: 68
- 홀

짜장:

- 원문: ※★チャジャン麺
- 수량: 17
- 포장

적용 결과:

- 짜장 홀 68
- 짜장 포장 17

다른 예시:

- 짬뽕 홀 54 / 포장 11
- 탕수육 하프 홀 46 / 포장 6
- 탕수육 소 홀 37 / 포장 8
- 탕수육 대 홀 8 / 포장 4

이 상태는 정상으로 판단했다.

---

### 7-9. qty 호환 구조 유지

기존 시스템은 menu item에 qty 하나를 기준으로 움직인다.
일본만 홀/포장으로 나누더라도 기존 분석 / 저장 / 합계 호환을 위해 qty는 유지해야 한다.
현재 방향:
dine\_in\_qty
takeout\_qty
qty = dine\_in\_qty + takeout\_qty
즉, 일본에서는 홀/포장 입력값을 별도로 가지되 기존 qty도 합산값으로 유지한다.
이 구조는 기존 useSalesData / 분석 로직과의 호환을 위해 필요하다.

---

### 7-10. 일본 VAT 구조 확인

일본 피드백에서 VAT 관련 이슈가 나왔다.
일본 소비세:
- 홀 / 매장 내 식사: 10%
- 포장: 8%

중요한 질문:

- 메뉴 가격 880엔이 VAT 별도인가?
- VAT 포함인가?

확인 결과:
일본 관리자 화면에서:

- チャジャン麺 매출 33,440
- 수량 38
- 33,440 ÷ 38 = 880

즉, 관리자 화면 매출은 메뉴 가격 880엔 기준으로 계산됨.
따라서 일본 POS / 관리자 화면은 VAT 포함 가격 기준으로 보인다.
정리:

- 짜장 880엔은 VAT 포함 가격
- 880 + VAT가 아님
- 880 안에 VAT가 포함되어 있음

---

### 7-11. 일본 VAT 계산 방식 확정

짜장 1그릇 가격 880엔 기준.
홀 10%:

- 고객 결제: 880
- 순매출: 880 ÷ 1.10 = 800
- VAT: 80

포장 8%:

- 고객 결제: 880
- 순매출: 880 ÷ 1.08 = 약 814.81
- VAT: 약 65.19

핵심:

- 고객 가격은 같다.
- 내부 순매출이 다르다.
- 포장이 순매출이 더 크다.
- VAT는 더하는 것이 아니라 포함된 것을 나누어 제거하는 구조다.

---

### 7-12. AI Coach / 분석 기준은 VAT 제외로 판단

사용자와 논의 결과, AI Coach에 들어가는 값은 VAT 제외가 맞다고 판단했다.
이유:

- VAT는 매장 매출이 아니라 세금
- 메뉴 엔지니어링 / 원가 / 마진 계산 시 VAT 포함 금액을 쓰면 왜곡됨
- 국가별 세율이 다르면 비교가 왜곡됨
- AI 분석은 순매출 기준이 더 논리적

현재 방향:

- AI Coach 입력: VAT 제외
- 메뉴 매출 합계: VAT 제외
- POS 비교 / 관리자 화면 비교: VAT 포함
- 화면에는 VAT 포함 금액도 별도로 보여줌

---

### 7-13. 일본 Sales 화면 VAT 표시 구조 반영

일본 파일럿 계정에서는 메뉴 매출 쪽에 아래 구조가 필요하다.

- 메뉴 매출 합계 (VAT 제외)
- VAT 포함 금액
- 오차

POS 입력값은 일본 관리자 화면과 비교하려면 VAT 포함 기준이어야 한다.
따라서 비교 구조:

- POS / 관리자 화면 총매출: VAT 포함
- 앱 계산 VAT 포함 금액: 비교용
- 앱 계산 VAT 제외 금액: AI/분석용

현재 일본 피드백 대기 중이라 최종 라벨/표시 방식은 조정 가능.

---

### 7-14. DataInput.tsx 대형화 리스크 확인

현재 DataInput.tsx는 1600줄 이상이다.
문제:

- OCR
- 이미지 처리
- 메뉴 매칭
- 수동 교정
- 메뉴 입력 UI
- 일본 분기
- VAT 계산
- 합계 계산
- 캘린더 처리 일부
- 기본 정보 입력
- OCR 결과 표시

이 모든 것이 한 파일에 있다.
판단:

- 지금 당장은 일본 파일럿 안정화가 우선
- 리팩토링은 후순위
- 그러나 장기적으로 반드시 분리해야 함

추천 분리 후보:

- OcrPanel.tsx
- OcrResultList.tsx
- MenuInputGrid.tsx
- JapanMenuInputGrid.tsx
- useOcrApply.ts
- useJapanVatSales.ts
- useOcrFiles.ts

---

## 8. VAT(소비세) 이슈 최신 상태

기존 V1.5.0에서는 VAT 정책이 보류 상태였다.
현재 V1.7.0 기준으로는 구조적 방향이 상당히 명확해졌다.

---

### 8-1. 일본 가격은 VAT 포함가

예:
짜장 = 880엔
이는 880 + 세금이 아니라 880 안에 세금이 포함된 가격이다.

---

### 8-2. 세율

- 홀: 10%
- 포장: 8%

---

### 8-3. 계산

홀:

- gross = price \* dine\_in\_qty
- net = gross / 1.10

포장:

- gross = price \* takeout\_qty
- net = gross / 1.08

전체:

- grossTotal = dineInGross + takeoutGross
- netTotal = dineInNet + takeoutNet

---

### 8-4. 현재 기준

| **항목**          | **기준**  |
| --------------- | ------- |
| POS / 일본 관리자 화면 | VAT 포함  |
| 앱 VAT 포함 표시     | POS 비교용 |
| 메뉴 매출 합계        | VAT 제외  |
| AI Coach        | VAT 제외  |
| 메뉴 엔지니어링        | VAT 제외  |
| 마진 분석           | VAT 제외  |

---

### 8-5. 아직 확인 필요한 것

일본 측 피드백 필요:

- 소수점 처리 방식
- 일본 POS가 세금 계산에서 반올림인지 버림인지
- 메뉴별 합계와 총합이 어떤 방식으로 rounding 되는지
- 앱에서 VAT 제외 금액을 소수점 표시할지 정수 반올림할지
- POS 총액과 앱 VAT 포함 금액 비교 시 허용 오차 기준

---

## 9. 현재 정상 동작 범위

---

### 점주 측

현재 정상 동작 범위:

- 로그인
- Summary 표시
- Sales 입력
- 국가별 통화 표시
- 메뉴 수량 입력
- OCR 업로드
- OCR 이미지 압축
- OCR 결과 확인
- structured OCR 결과 우선 반영
- rawText fallback 유지
- OCR 결과 수동 교정
- 일반 계정 단일 수량 입력
- 일본 계정 홀/포장 수량 입력
- 일본 OCR에서 포장 자동 분리
- Detail AI 코칭 리포트
- 기간 분석
- Top 메뉴 비교
- Menu 페이지에서 메뉴명 / 가격 / 원가 / 순서 수정
- 일본 홍콩반점 계정의 메뉴 / 가격 / 원가 세팅 반영
- 일본 active 메뉴에 대한 jp\_name 입력 완료

---

### 관리자 측

현재 정상 동작 범위:

- 계정 생성 요청 저장
- AdminApprovalPage 진입
- 상태별 탭 전환
- pending / approved / rejected 확인
- 수정
- 삭제
- 승인
- 거절
- 승인 완료 계정 실비밀번호 반영 버튼

---

### 일본 파일럿 측

현재 정상 동작 범위:

- 일본 메뉴명 OCR 인식
- jp\_name 기반 매칭
- 한글 name 반환
- `※` / `★` 포장 판별
- 일본 계정에만 홀/포장 UI 표시
- 포장 수량 포장 칸 입력
- 홀 수량 홀 칸 입력
- 기존 qty 합산 유지
- VAT 포함 가격 해석
- VAT 제외 매출 계산 방향
- VAT 포함 금액 별도 비교 방향

---

## 10. 현재 미해결 / 보류 사항

---

### 10-1. AdminApprovalPage 모바일 최적화

기능은 충분하지만 모바일 UX가 아직 부족하다.
현재 후순위.

---

### 10-2. 생성 완료 계정 전용 관리 화면

signup\_requests와 실제 운영 계정 관리가 아직 분리되지 않았다.
필요한 이유:

- 승인 요청 관리와 운영 계정 관리는 다름
- 승인 완료 계정의 비밀번호 / 매장명 / 브랜드 / 국가 / 권한 수정이 필요할 수 있음

---

### 10-3. 로그인 UX 정리

현재 로그인 입력값에 `@`가 없으면 `@tbk.com`을 자동으로 붙인다.
문제:

- 신규 계정은 실제 이메일을 입력해야 하는 경우가 있음
- 전체 이메일 입력과 자동 도메인 부착이 혼선을 만들 수 있음

후순위지만 정리 필요.

---

### 10-4. OCR 고도화 확장

현재는 일본 한정 파일럿 구조다.
향후 과제:

- 타 국가 확대 여부
- 브랜드별 분기
- confidence 기준 자동 적용 정책
- 일반 계정도 structured OCR로 전환할지
- rawText OCR은 fallback으로만 남길지
- OCR 캐시를 Supabase에 저장할지
- menuCandidates를 `{ name, jp_name }` 구조로 완전히 넘길지

---

### 10-5. 일본 VAT rounding 정책

현재 가장 중요한 미확정 항목 중 하나다.
확인 필요:

- 반올림
- 버림
- 절사
- 메뉴별 계산 후 합산
- 총합 기준 계산
- POS와 동일한 계산 방식

---

### 10-6. 일본 POS 총액 자동 매칭

현재는 VAT 포함 금액을 보여주는 구조까지 왔다.
다음 단계에서는:

- POS 입력값
- 앱 VAT 포함 계산값
- 차이
- 오차율

이 세트를 더 명확하게 보여줄 필요가 있다.

---

### 10-7. DataInput.tsx 리팩토링

현재는 보류.
하지만 장기적으로 반드시 필요.

---



---

# HISTORICAL ADDENDUM — INDONESIA STORE OWNER FEEDBACK

# Date: 2026-08-12 / Post-Meeting Update

> **LATEST PRIORITY OVERRIDE**

> 이 섹션은 2026-08-12 인도네시아 점주 미팅 이후 받은 실제 사용자 피드백을 반영한 최신 Addendum이다.
> 문서 상단의 `Indonesia demo 예정`, `시연 후 피드백 수집 예정` 등 미팅 전 상태 표현보다 이 섹션이 우선한다.

> 이번 미팅 결과, **현재 V4 화면 구성과 기존 기능 전반은 긍정적으로 평가되었으며 큰 UI 재설계 요청은 없었다.**
> 신규 요청은 “기능을 더 화려하게 만드는 것”보다 **AI가 현장 Context를 더 잘 이해하고, 실제 식당 원가를 더 정확하게 계산하도록 만드는 것**에 집중되어 있다.

---

## AA. 인도네시아 점주 미팅 결과 요약

### AA-1. 현재 제품 만족도

점주 피드백:

- 현재 Sales 화면 구성 만족
- 현재 입력 항목 만족
- 현재 전체 기능 흐름 만족
- 큰 Navigation/UI 구조 변경 요청 없음
- 신규 기능 2개 요청

현재 Product 판단:
V4 UI / FLOW
\= KEEP

NEXT IMPROVEMENT
\= DATA CONTEXT ACCURACY
\+ FOOD COST ACCURACY
즉, 다음 Indonesia 작업의 중심은 UI 전면 재설계가 아니다.

---

## AB. 신규 요청사항 1 — Sales 특이사항을 AI Coach Context로 활용

### AB-1. 사용자 요청

Sales 화면의:
특이사항 (선택)
입력 내용을 AI가 읽고 AI 운영 코칭을 생성할 때 참고할 수 있도록 한다.
특이사항은 단순 메모가 아니라 **점주가 직접 입력하는 운영 Context**로 취급한다.
예:
비가 많이 와서 저녁 방문객 감소
단체 예약 3팀 방문
배달앱 프로모션 진행
주요 메뉴 품절
인근 행사로 점심 고객 증가

---

### AB-2. Product 의미

특이사항과 수치 데이터의 역할을 분리한다.
SALES / ORDERS / VISITORS / MENU QTY
\= DETERMINISTIC FACT

NOTE / 특이사항
\= OPERATIONAL CONTEXT
특이사항은 KPI 계산식 자체를 변경하지 않는다.
AI가 수치의 운영 배경을 해석할 때만 참고한다.

---

### AB-3. 절대 규칙

다음 deterministic 계산에는 Note가 영향을 주면 안 된다.

- 매출
- 매출 증감률
- 주문수
- 방문객
- 객단가
- Conversion
- Menu Engineering classification
- deterministic Boost candidate

Note는:
AI INTERPRETATION LAYER
에서만 사용한다.

---

### AB-4. 1차 적용 범위

우선 다음 기능에만 적용한다.
AI Operating Coaching
Flow:
Sales Data
\+ Deterministic Metrics
\+ Operational Note
→ AI Operating Coaching
초기 단계부터 AI Menu Strategy / Boost Plan에 무조건 전달하지 않는다.
실제 가치 확인 후 별도 확장한다.

---

### AB-5. 기간 분석 시 Note Context

Today:
Selected Date Note
Week / Month / Custom:
2026-08-10 — 비가 많이 와서 저녁 방문객 감소
2026-08-11 — 단체 예약 3팀
2026-08-12 — 신메뉴 프로모션 시작
처럼 날짜와 함께 전달하는 방향이 적절하다.
Guardrail:

- 빈 Note 제외
- 반드시 날짜 포함
- Current Store / Current Period scope만 사용
- 기간이 길 경우 prompt가 과도하게 커지지 않도록 제한
- 다른 Store/Period Note가 섞이면 안 됨

---

### AB-6. AI 표현 원칙

점주가 입력한 Note는 운영 Context이지 검증된 causal fact가 아니다.
잘못된 표현:
매출이 감소한 이유는 비 때문입니다.
권장 표현:
입력된 특이사항에 우천 내용이 있어,
방문객 감소에 영향을 주었을 가능성을 함께 고려할 수 있습니다.
원칙:
USER NOTE
\= CONTEXT
≠ VERIFIED CAUSAL FACT

---

### AB-7. 구현 전 READ-ONLY 확인

코드 수정 전에 반드시 확인:

1. 현재 Sales Note의 실제 field 이름
2. 실제 Supabase DB column
3. `salesStorage` save mapping
4. `salesStorage` / range load mapping
5. 기간 데이터 로딩 시 Note가 함께 복원되는지
6. `geminiService.ts` AI Operating input contract
7. `coach_reports.input_snapshot`에 Note 포함 여부
8. 다른 Store/Period로 Note가 leak되지 않는지

DB 컬럼명을 추정해서 새 컬럼을 만들지 않는다.
기존 Note storage가 있다면 최대한 재사용한다.

---

### AB-8. 현재 Product Decision

FEATURE:
APPROVED

PRIORITY:
HIGH

INITIAL SCOPE:
AI Operating Coaching

DETERMINISTIC CALCULATION CHANGE:
NO

DB CHANGE:
READ-ONLY AUDIT 후 결정

---

## AC. 신규 요청사항 2 — 기본 제공 반찬류 원가 반영

### AC-1. 사용자 요청 배경

인도네시아:
본가
새마을식당
은 기본 제공 반찬 종류가 많아 일반적인 메뉴 자체 원가만으로 실제 Food Cost를 충분히 설명하기 어렵다.
특히 고기 메뉴 주문 시:
기본 반찬
\+
쌈채소
\+
소스류
\+
기타 기본 제공품
이 추가되어 실질 원가 부담이 높다.
점주 요청:

- 메뉴별 원가율 외에 **기본 제공 반찬류에 대한 별도 원가율 입력 영역** 필요
- Menu 관리 영역에서 관리
- 인도네시아 본가 / 새마을식당의 원가율 업데이트 주기는 **6개월**

---

### AC-2. 현재 문제

현재 Menu 기본 구조:
Selling Price
Unit Cost
Food Cost %
예:
판매가 100
메뉴 자체 원가 35
→ 표시 원가율 35%
그러나 실제 운영 원가는:
메뉴 자체 원가
\+
기본 반찬
\+
소스
\+
쌈채소
\+
기타 기본 제공 원가
가 될 수 있다.
따라서 메뉴 자체 원가만 사용하면 실제 수익성을 과대평가할 가능성이 있다.

---

### AC-3. 반찬을 가짜 판매 메뉴로 만들지 않는다

권장하지 않는 구조:
menu\_master
  김치
  쌈채소
  기본찬 1
  기본찬 2
이유:

- 실제 판매 메뉴가 아님
- 판매수량 개념이 없음
- OCR 대상이 아님
- Menu Engineering popularity에 섞일 수 있음
- menu\_master의 의미를 왜곡함

따라서 다음을 분리한다.
SELLABLE MENU COST
와
SHARED / INCLUDED FOOD COST

---

### AC-4. 1차 권장 Product 구조

Menu 화면 안에 별도 설정 영역을 둔다.
예:
기본 제공 원가 설정

기본 반찬 원가율        X.X %
최근 업데이트          YYYY-MM-DD
업데이트 주기          6개월
다음 점검 예정         YYYY-MM-DD
초기 대상:
Indonesia
\+
BonGa / 본가
Saemaeul / 새마을식당
정확한 brand/store 식별 방법은 실제 DB 값을 확인한 뒤 결정한다.
브랜드 문자열을 임의로 추정하여 hardcoding하지 않는다.

---

### AC-5. Store-Level 관리 권장

초기 권장 방향:
STORE-LEVEL SHARED COST CONFIG
이유:
같은 브랜드라도 다음이 다를 수 있다.

- 반찬 구성
- 원재료 가격
- 공급업체
- 지역
- 운영 방식

따라서:
Brand
\= applicability / default policy

Store
\= actual configured value
형태가 더 안전하다.
실제 schema 확인 후 최종 결정한다.

---

### AC-6. 6개월 업데이트 주기

인도네시아 본가 / 새마을식당 운영 기준:
Food Cost Review Cycle
\= 6 Months
권장 관리 정보:
current rate
effective date
last updated date
review cycle months = 6
next review date
`next review date`는 중복 저장보다:
last\_updated\_at + 6 months
로 derive할 수 있는지 검토한다.

---

### AC-7. Menu Engineering 반영 방향

이 기능은 Menu 화면에 숫자만 저장하고 끝내는 기능이 아니다.
궁극적으로 profitability 계산에 반영해야 한다.
현재:
Selling Price
\- Menu Unit Cost
\= Contribution Margin
향후:
Selling Price
\- Menu Unit Cost
\- Applicable Shared Food Cost
\= Adjusted Contribution Margin
이 값을 기반으로 Menu Engineering의 profitability 판단이 실제 운영 원가에 가까워질 수 있다.

---

### AC-8. 계산식을 지금 추정하지 않는다

“기본 반찬 원가율”이라는 표현만으로 계산 기준은 아직 확정되지 않았다.
가능한 의미:
매출액의 X%
메뉴 판매가의 X%
주문당 고정 금액
방문객당 평균 원가
고기 메뉴에만 추가
전체 주문에 공통 적용
어떤 의미인지 확정 없이 임의 계산식을 연결하면 안 된다.
정확한 순서:
1\. 현재 원가 데이터 구조 Audit
2\. 점주가 의미한 원가율 계산 기준 확정
3\. 적용 Scope 결정
4\. DB/Data Model 결정
5\. deterministic calculation 설계
6\. Menu UI
7\. Menu Engineering 반영

---

### AC-9. 고기 메뉴 쌈채소 — 2단계 확장 후보

고기 메뉴만 추가 원가가 더 발생한다면 장기적으로:
STORE SHARED COST
기본 반찬

\+

CATEGORY ADDITIONAL COST
고기류 쌈채소 / 추가 제공품
구조가 더 정확할 수 있다.
예:
기본 반찬 공통 원가율
5%

고기류 추가 제공 원가율
3%
하지만 현재:
CATEGORY ADDITIONAL COST
\= FUTURE OPTION
\= NOT YET CONFIRMED
이다.
먼저 Shared Food Cost 1차 구조를 구현/검증하고 실제 필요성이 확인될 때 확장한다.

---

### AC-10. AI 활용

Shared / Adjusted Cost는 먼저 deterministic하게 계산한다.
그 이후 AI가 해석한다.
Configured Cost
→ Deterministic Adjusted Margin
→ AI Interpretation
AI가 반찬 원가를 임의로 추정하면 안 된다.

---

### AC-11. 현재 Product Decision

FEATURE DIRECTION:
APPROVED

TARGET:
Indonesia BonGa / Saemaeul

UPDATE CYCLE:
6 MONTHS

MENU UI:
YES — separate shared-cost setting

FAKE MENU ITEM:
NO

MENU ENGINEERING INTEGRATION:
YES, after deterministic rule is confirmed

MEAT CATEGORY ADD-ON:
FUTURE OPTION / NOT YET CONFIRMED

DATA MODEL:
READ-ONLY AUDIT REQUIRED

---

## AD. 이번 인도네시아 피드백에서 확인된 Product 방향

이번 미팅의 핵심 Validation:
점주가 요청한 것은:
새 Dashboard
더 많은 Chart
새 Navigation
복잡한 AI 기능
이 아니었다.
실제 요구:
1\. 현장 상황을 AI가 이해해 달라.
2\. 실제 식당 원가를 더 정확히 반영해 달라.
따라서 다음 Product 발전 방향:
BETTER OPERATIONAL CONTEXT
\+
BETTER COST ACCURACY
\+
BETTER ACTION QUALITY
현재 V4 UI/UX의 큰 구조는 유지한다.

---

## AE. 신규 Indonesia Account 반영 원칙

인도네시아 신규 account에는 Common Product Core를 재사용한다.

### Common Core

- V4 Home
- V4 Sales
- OCR Batch
- OCR Review / Apply
- Coach
- Menu Engineering
- AI Menu Strategy
- Boost
- Menu Management
- report persistence

### Indonesia Feedback

추가 반영 대상:

- Sales Note → AI Operating Coaching Context
- Shared Side-Dish / Included Food Cost
- 6개월 Food Cost Review Cycle

### Japan-specific

자동 적용 금지:

-

```
jp_name
```

1. Japan VAT 10% / 8%
2. JPY
3. `※` / `★`
4. Japan receipt channel rule
5. Japan demo fixture

---

## AF. 신규 기능 구현 전 READ-ONLY Audit

두 신규 기능 모두 바로 코딩하지 않는다.
먼저 READ-ONLY inventory를 수행한다.

### Sales Note

확인:

- current note field
- DB column
- save mapping
- load mapping
- period range load
- AI Operating prompt input
- report input snapshot

### Shared Food Cost

확인:

- `menu_master` current schema
- menu price / unit cost persistence
- price history
- category structure
- stores / brand metadata
- effective-date architecture
- existing config table 여부
- 별도 table vs column 필요성

Engineering Guardrail:
NO MODIFY
NO MIGRATION
NO REFACTOR
먼저 구조를 확인한 뒤 implementation plan을 확정한다.

---

## AG. POST-INDONESIA 최신 작업 우선순위

현재 Product + Engineering 순서:
1\. Indonesia Feedback Requirements 확정
2\. Sales Note / Menu Cost READ-ONLY Architecture Audit
3\. 신규 Indonesia Account Specification
4\. 신규 Indonesia Store/User 내부 생성
5\. Sales Note → AI Operating Coaching 구현
6\. Shared Side-Dish Cost 의미 / 계산 기준 확정
7\. Shared Side-Dish Cost DB / Menu UI 구현
8\. Adjusted Cost → Menu Engineering 반영
9\. Indonesia E2E Validation

10\. Privileged API Authorization P0
11\. Plaintext Password Removal P0
12\. Full RLS / Schema Inventory P0
13\. Default Tenant Removal P0
14\. Characterization Tests

15\. Legacy Code Removal
16\. DataInput Incremental Refactor
17\. DetailPage Incremental Refactor
18\. Observability

19\. AdminApproval Security Contract
20\. AdminApprovalPage Mobile Optimization
21\. Completed Account Management
주의:
실제 외부 점주에게 지속적인 Pilot access를 제공하기 전에는
Engineering Audit의 P0 security를 반드시 점검한다.

---

## AH. 이번 피드백 관련 회귀 금지

1. Note를 deterministic KPI 계산에 사용하지 않는다.
2. AI가 Note를 확정된 인과관계처럼 표현하지 않는다.
3. 다른 기간/Store의 Note를 현재 AI report에 넣지 않는다.
4. 반찬류를 fake `menu_master` 판매메뉴로 만들지 않는다.
5. Shared Food Cost 계산 기준을 추정해서 구현하지 않는다.
6. Indonesia Shared Cost를 모든 국가/브랜드에 자동 적용하지 않는다.
7. Japan VAT rule을 Indonesia에 재사용하지 않는다.
8. AI가 Shared Cost를 임의 추정하지 않는다.
9. Menu Engineering 계산식 변경은 deterministic test 없이 진행하지 않는다.
10. 이번 기능을 이유로 DataInput/DetailPage 전체 rewrite를 시작하지 않는다.

---

## AI. 다음 대화용 최신 Context

2026-08-12 Indonesia Store Owner Meeting Update:

\- 현재 V4 Sales 화면과 기존 기능 전반은 점주가 만족했다.
\- 큰 UI/Navigation 변경 요청은 없었다.

New Request 1:
Sales의 특이사항(Note)을 AI Operating Coaching이 읽고 운영 Context로 참고하게 한다.
Note는 deterministic KPI를 변경하지 않고 AI interpretation에만 사용한다.
기간 분석에서는 날짜별 Note를 current Store/Period scope 안에서 전달한다.
AI는 Note를 causal fact로 단정하지 않는다.

New Request 2:
Indonesia BonGa / Saemaeul은 기본 반찬류가 많고 고기 메뉴에는 쌈채소까지 제공되어 실제 Food Cost가 높다.
Menu 화면에 메뉴 자체 원가와 별도로 Shared Side-Dish / Included Food Cost를 관리할 수 있는 설정이 필요하다.
Indonesia BonGa / Saemaeul의 Cost Review Cycle은 6개월이다.
반찬을 fake sellable menu\_master row로 만들지 않는다.
Shared Cost의 정확한 계산 기준(Store sales %, menu price %, per order 등)은 아직 추정하지 말고 READ-ONLY schema/business audit 후 확정한다.
고기류만의 쌈채소 Additional Category Cost는 향후 2단계 확장 후보이며 아직 확정 기능이 아니다.

Immediate next task:
Sales Note 저장 구조 + AI Coach input path + Menu cost/schema를 READ-ONLY로 확인하고,
두 기능의 최소 안전 implementation plan을 먼저 확정한다.

---