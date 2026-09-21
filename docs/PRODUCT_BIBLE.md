SALES COACH AI
PRODUCT BIBLE
VERSION 4.4 — CODEX / PRODUCT MASTER

Product Type: Mobile-First Store Operating Coach
Status: V4.4 Pilot Ready / Pilot Readiness Closed
Primary Platform: Responsive Web (Mobile First)
Primary User: Restaurant Store Owner / Store Operator
Secondary User: HQ / Brand Operations via active Master workspace
Primary Navigation: Coach / Sales / Home / Menu / More
Core Product Flow: INPUT → ANALYSIS → ACTION
UI Reference: 11 Approved V4 UI/UX Reference Images
Companion Document: Sales Coach AI UI/UX Guideline V4.4

==============================================================================
2026-09-21 AUTHORITATIVE PRODUCT UPDATE — V4.4
==============================================================================

This is the newest authoritative Product Bible state. It supersedes conflicting V4.3 and older statements; historical sections remain records of their respective dates.

CURRENT PILOT STATUS
- Indonesia pilot account exists: account code `ID_SAE`, login `id_sae@tbk.com`, storeId `1789955524607`, country `ID`, currency `IDR`, brand `SAEMAEUL`.
- Current placeholder store name: `SAEMAEUL INDONESIA PILOT`. The final real production store name is still TBD; this is not a final production-store identity.
- Pilot inputs are current test/operating inputs derived from supplied source data: 32 active sellable menus (BBQ 9, DISH 3, MEAL 13, SIDE 7), supplied selling prices and unit costs, and menu price/cost history baseline effective 2026-09-21.
- 기본 제공 찬 has 11 configured component items and current 1회 총 원가 IDR 27,759.13. Effective snapshots exist for pilot testing across seeded Food Cost history.

SYNTHETIC PILOT SALES CONTINUITY
- Only exact profiles are eligible: Demo `storeId 5 / DEMO / DEMO`; Indonesia pilot `storeId 1789955524607 / ID / SAEMAEUL`.
- Indonesia pilot retains a rolling 60-day deterministic synthetic Sales dataset for end-to-end testing. Synthetic rows are TEST/PILOT data, not claimed real historical store sales.
- Existing rows are authoritative. Continuity uses `insertDailyIfMissing` only and never updates, upserts, or deletes existing Sales rows.
- Generated total Sales equals menu price × generated quantity; POS + Delivery equals total Sales; generated rows include sharedSideDishCount and deliberately varied demand/menu mix for period comparisons.
- The app checks browser-local date rollover about every 60 seconds. A new local day runs continuity after midnight while open; reopening/login backfills missed dates.

COACH REFERENCE-DATE AND KPI CONTRACT
- App-header `selectedDate` is Coach reference “today”; completed analysis ends at `selectedDate - 1` calendar day. It is not always browser-local yesterday.
- With selectedDate 2026-09-17: 어제 = 2026-09-16 vs 2026-09-15; 이번 주 = 2026-09-14~2026-09-16 vs 2026-09-07~2026-09-09; 이번 달 = 2026-09-01~2026-09-16 vs 2026-08-01~2026-08-16. 선택 기간 compares its immediately preceding equal-length inclusive range.
- Labels: 전일 비교, 전주 동일 기간, 전월 동일 기간, 직전 동일 기간. Monday disables 이번 주; the first day of month disables 이번 달; custom end max is selectedDate - 1.
- Comparison mode is derived from active v4Period: yesterday/custom → MANUAL, week → WOW, month → MOM. No independent stale comparison-mode state exists.
- KPI Sales prefers stored total Sales, then POS + Delivery, never POS-only when Delivery exists. Orders and Visitors are period sums; AOV = total Sales / Orders; Conversion = Orders / Visitors × 100.
- Conversion footer is fixed explanatory text `주문수/방문객` with no comparison delta. Other KPI cards retain comparison deltas.

PERIOD SCOPE / TENANT SAFETY
- The same periodRange/comparisonRange drives the visible Analysis Period card, KPI deltas, Period Analysis, daily trend, Top 5 menu comparison, Food Cost, AI Operating Coaching, Menu Engineering, and Boost Plan.
- Coach current-period, comparison-period, and period-analysis request keys include storeId. Same date range plus a different store is always a different request.
- On active-store change, current KPI, comparison KPI, and period-analysis state clear; request refs invalidate; stale old-store responses cannot overwrite the new-store state.

FOOD COST / SALES / MENU
- Official terms remain: 매출, 메뉴 원가, 기본 제공 찬 원가, 총 식재료 원가, 실질 원가율, 원가 기준 이익. No fees or operating expenses are deducted. 기본 제공 찬 remains store/period-level only and is never allocated to individual menu items.
- POS, Delivery, Orders, Visitors, Note, menu quantities, and sharedSideDishCount persist. sharedSideDishCount is payload-only; saved/manual rows are authoritative and synthetic continuity never overwrites them. Save/reload were manually verified with ID_SAE.
- 기본 제공 찬 management uses one compact table-like editor: one shared header, compact one-line editable rows, no repeated item cards/labels. Existing save/history behavior is unchanged and history is read-only.

HOME / MORE
- Home reflects selected-date Sales, same-store previous-day comparison, and same-store current-month cumulative Sales. Greeting uses the accessing browser/device JavaScript local clock, not store country/timezone metadata; this is acceptable for the current pilot's local-device use.
- More is a lightweight support/account-context surface: Store information; Sales Coach AI 둘러보기 (현재 화면 가이드, 처음부터 둘러보기); 빠른 도움말 (매출 입력, 영수증 OCR, AI Coach, 메뉴 엔지니어링, AI 부스트 플랜, 메뉴 관리); and Logout. AI 분석 안내 and 앱 정보 are removed. AI Coach quick-help uses `fa-robot`.

FINAL E2E / STATUS
- ID_SAE manual smoke test completed 2026-09-21: Home daily/previous-day/month cumulative; Sales display, Note save, date move/return reload; Menu 32 items, prices/costs and 기본 제공 찬 configuration; Coach selectedDate anchoring, all period modes/ranges, total-Sales KPI, conversion, Food Cost, and period switching; More context/tour/help/simplified structure.
- This does not claim unperformed OCR smoke testing or browser/device matrix testing.
- Final integration audit completed. The major Coach tenant request-key issue was fixed in `da98ee8ed02c7ea85ee957768f786fbc6dc6719f`; no blocking issue remains from this integration round. TypeScript, production build, and git diff --check passed; final production deployment succeeded.
- Optional non-blocking work: bundle splitting, broader automated regression tests, observability, and legacy cleanup.

==============================================================================
END 2026-09-21 AUTHORITATIVE PRODUCT UPDATE — V4.4
==============================================================================

==============================================================================
2026-09-21 AUTHORITATIVE PRODUCT UPDATE — V4.3
==============================================================================

This is the latest Product Bible state and overrides older conflicting product-status statements. Current verified application behavior remains the final source of truth.

SYSTEM calculates deterministic facts. AI interprets those facts. INTERFACE clarifies what matters. OPERATOR makes the final decision.

SHARED SIDE DISH / FOOD COST PRODUCT CONTRACT

Official product term: 기본 제공 찬. It is not a sellable menu item.

MENU
- Menu supports a store-scoped 기본 제공 찬 cost configuration, separate from sellable Menu CRUD.
- Configuration uses browser-local current date as its effective date; Menu selectedDate does not control it.
- A configuration has multiple component items, each with a name and 1회 기준 원가. 1회 총 원가 is derived, never manually stored.
- 기본 제공 찬 저장 is explicit and independent from regular Menu Save. A same-local-calendar-day save updates that date's snapshot; a later local date creates a new effective-date snapshot.
- History is read-only and preserves effective-date snapshots.
- Storage is public.shared_side_dish_configs, scoped by store_id with RLS.

SALES
- Sales additionally captures 기본 제공 찬 제공 횟수 in sales_daily.payload.sharedSideDishCount; there is no dedicated sales_daily column.
- Missing legacy values normalize to 0.
- Input appears only when a configuration effective on or before the selected Sales date applies.
- New unsaved dates recommend count = Orders. A manual edit prevents later Orders changes from overwriting the count; saved historical dates preserve their saved count.
- OCR file/image count never controls this value.
- The count is a food-cost operating quantity: it is not part of menu quantity total and does not change sales, orders, visitors, AOV, or conversion.
- With an applicable configuration and sales > 0 or orders > 0, count must be an integer >= 1. With sales = 0 and orders = 0, 0 is allowed. Stores without configuration retain previous Sales behavior.
- OCR authority and reconciliation rules remain unchanged.

DETERMINISTIC FOOD COST PROFITABILITY

Official UI terms: 매출, 메뉴 원가, 기본 제공 찬 원가, 총 식재료 원가, 실질 원가율, 원가 기준 이익.

periodSales = sum(saved POS sales + saved delivery sales)

directMenuCost = sum(each saved day's sold menu qty × that same saved day's unitCost)

sharedSideDishCost = sum(saved sharedSideDishCount × 기본 제공 찬 configuration total effective on that Sales date)

totalFoodCost = directMenuCost + sharedSideDishCost

foodCostRate = periodSales > 0 ? totalFoodCost / periodSales × 100 : 0

grossProfitBeforeOtherExpenses = periodSales - totalFoodCost

- Historical menu cost comes from the saved Sales row; current Menu master cost is not used to recalculate history.
- Missing or invalid menu unitCost is not invented.
- Effective dates are respected per Sales day; the newest configuration is never applied retroactively to all history.
- 기본 제공 찬 cost stays a store/period cost and is never allocated to an individual sellable menu item. Menu Engineering classifications remain direct-menu-cost based.
- Labor, rent, card/payment fees, delivery commission, tax, utilities, and other operating expenses are excluded.
- 원가 기준 이익 is not 순이익, 영업이익, or EBITDA. No default target or industry food-cost benchmark exists.

COACH / AI
- Coach V4 displays deterministic 원가 기준 수익성 after 선택 기간 KPI and before expandable analysis sections, using all six official metrics.
- FoodCostSummary is application-calculated deterministic data. AI Operating Coaching may receive the exact period summary only as supporting evidence.
- AI interprets rather than recalculates; it must not invent missing costs, excluded expenses, food-cost targets, industry benchmarks, or per-menu 기본 제공 찬 allocations. Food-cost context need not appear in every report.
- Operational notes remain user-entered context, not verified causality.
- Completed reports store the resolved summary at coach_reports.input_snapshot.foodCost. An empty range may retain its exact zero summary in the snapshot while AI receives no food-cost context. Food-cost calculation failure must not block AI Operating Coaching.

COACH PERIOD COMPARISON CONTRACT
- Coach excludes today because the operating day may still be in progress; all preset analysis uses completed data through browser-local yesterday.
- 어제: analyze yesterday; compare the immediately preceding day; label 전일 비교.
- 이번 주: analyze current calendar-week Monday through yesterday; compare prior Monday through the same elapsed weekday; label 전주 동일 기간. On Monday, 이번 주 is unavailable because there are no completed current-week days; do not fall back to the previous full week.
- 이번 달: analyze current-month day 1 through yesterday; compare previous-month day 1 through the same elapsed day; label 전월 동일 기간. On the first day of a month, 이번 달 is unavailable. Previous-month dates are capped to that month's valid final day.
- 선택 기간: analyze the user-selected inclusive range; compare the immediately preceding equal-length inclusive range; label 직전 동일 기간. The end date cannot exceed browser-local yesterday.
- Period KPI deltas, Period Analysis, and AI Operating Coaching comparison context use the same comparisonRange. These Store Owner rules are separate from Master Dashboard comparison rules.

CURRENT STATUS
- Shared Side Dish / Food Cost is completed Store Owner functionality, store-scoped for any configured store; it is not Indonesia-only.
- This feature did not create ID_SAE or seed actual Indonesia account, menu, side-dish, or production sales data.

==============================================================================
END 2026-09-21 AUTHORITATIVE PRODUCT UPDATE
==============================================================================

==============================================================================
2026-09-18 AUTHORITATIVE PRODUCT UPDATE — V4.2
==============================================================================

This section is the latest Product Bible state.
If an older section in this document describes a previous implementation status or future plan that conflicts with this section, THIS SECTION WINS.
Current verified application behavior remains the final source of truth for functional details.

CURRENT PRODUCT STATUS

Store Owner:
- Pilot Ready
- Home / Sales / Coach / Menu / More active
- Contextual Help and Guided Tour active

Master:
- active HQ / brand-operations workspace
- dashboard, period comparison, store drill-down, and approvals available

Pilot Readiness:
- CLOSED

Production Security Hardening:
- core hardening complete
- tenant isolation verified
- Security Advisor final warning count verified at zero after the hardening work

Broad Multi-Store Production:
- not automatically declared only because Pilot Readiness is closed
- additional operational monitoring/observability may still be added as scale requires

CURRENT PRODUCT LOOP

INPUT
→ ANALYSIS
→ ACTION
→ RE-CHECK

The foundational responsibility split remains:

SYSTEM
calculates deterministic facts.

AI
interprets those facts and proposes actions.

INTERFACE
clarifies what matters.

OPERATOR
decides and acts.

ACTIVE USER ROLES

STORE USER
- operates one authorized store,
- requires a valid positive `store_id`,
- accesses only authorized store data.

MASTER
- operates the cross-store management surface,
- can inspect multi-store information according to the active authorization/RLS design.

Invalid or incomplete authenticated profiles fail closed.

CURRENT STORE OWNER IA

Coach / Sales / Home / Menu / More

Important navigation clarification:
Home remains the conceptual daily anchor, but mobile navigation no longer gives Home a permanent special visual state.
All five tabs share the same baseline; only the active tab is highlighted.

HOME
Daily Brief.

SALES
Daily Input Workspace.

COACH
Analysis + Interpretation + Action.

MENU
Menu Master Management.

MORE
Store Context + Help + Guided Tour + AI Notice + App Info + Logout.

CURRENT DATE CONTRACT

Operational "today" follows the browser's local calendar date.
Do not substitute UTC date for the Store Owner daily experience.

- `localToday` = browser-local current date
- `selectedDate` = user-selected operating date
- these are related but not identical concepts
- local-day display updates at local midnight
- do not hardcode a store timezone without an explicit product requirement

CURRENT SALES / RECONCILIATION CONTRACT

Sales captures:
- POS sales
- delivery sales
- orders
- visitors
- note
- menu quantities

Menu total is derived from menu quantities and current menu pricing.
The interface exposes the relationship between entered sales and menu sales so the operator can identify a mismatch before saving.

OCR CURRENT CONTRACT

OCR is an input accelerator, not the authority over store context.

Supported flow:
Upload
→ Recognize
→ Match
→ Review
→ Apply
→ Save

Manual input remains available even when OCR fails.

Current hard-block concepts:
1. unresolved / review-required menu item
2. no recognized menu item
3. invalid or future receipt date
4. currency mismatch
5. receipt subtotal vs menu-total mismatch

Store-name mismatch is advisory only.
A missing, uncertain, or different printed store name must not by itself block Apply.

Current request/file hardening includes:
- max batch 8 images
- client timeout 45 seconds
- original image max 12 MB
- processed image max 4 MB
- server max 4 MB per image
- server max 16 MB total
- JPEG / PNG / WebP validation

MENU ENGINEERING CURRENT CONTRACT

Deterministic calculation comes first.
AI commentary cannot change the deterministic classification.

Current classifications:
- STAR
- CASH_COW
- PUZZLE
- DOG

AI Menu Strategy:
- interprets deterministic Menu Engineering output,
- uses supplied menu IDs/names only,
- does not invent missing sales/cost/price facts,
- returns structured output,
- may prioritize up to five menus.

AI reliability:
- strict structured JSON schema,
- first invalid response may trigger one repair,
- maximum two Gemini attempts per user action,
- final invalid response becomes a safe UI error,
- deterministic analysis remains visible.

BOOST PLAN CURRENT CONTRACT

Boost Plan converts deterministic analysis candidates into operational suggestions.

Current rule:
- candidate preparation is deterministic,
- AI creates one action per supplied valid candidate,
- maximum 3 actions,
- therefore 1 / 2 / 3 actions are all valid outcomes,
- the system must not invent filler actions just to display three.

Commercial safety:
- do not invent finalized discount percentages/amounts,
- do not invent coupon/voucher values,
- do not invent BOGO/1+1,
- do not finalize free-item/giveaway terms without approved evidence,
- do not invent bundle/set price,
- PRICE / SET_PROMOTION requires cost/contribution/margin validation or approval before implementation,
- expected effect is an estimate, not a guarantee.

AI FAILURE CONTRACT

AI failures must be local to AI functions.

Base operational/deterministic information stays usable.

Current safe error concepts include:
- no usable menu data
- invalid model response
- unsafe commercial term
- authentication problem
- configuration problem
- provider/model request failure

User-facing copy should be Korean and actionable.
Raw prompts, model response dumps, credentials, and stack traces do not belong in operator UI.

MORE / HELP CURRENT CONTRACT

More is no longer a placeholder settings list.

Current responsibilities:
- current store information
- product walkthrough entry
- current-screen guide
- full workflow guide
- quick help
- AI analysis notice
- app information
- logout

Do not show fake Language / Display settings until those settings actually exist.

CONTEXTUAL HELP + GUIDED TOUR PRODUCT CONTRACT

- user initiated only
- no auto-start
- current screen help first
- full workflow help second
- 5–8 steps preferred
- one concept/action per step
- short operator-friendly Korean copy
- stable `data-tour` markers
- missing/hidden target skips safely
- mobile viewport safety
- Esc / close / previous / next / complete supported
- full workflow may navigate pages
- must never save, delete, upload, trigger AI, change business input, or log out
- tutorial never compensates for poor UI; fix poor UI itself

MASTER WORKSPACE CURRENT CONTRACT

Master is an active secondary workspace, not a future placeholder.

Core responsibilities:
- multi-store overview
- store drill-down
- period-aware KPI comparison
- approvals / account operation support

Period comparison semantics:
- Today = current day vs previous day
- This Week = current Monday→current day vs previous Monday→same elapsed weekday
- This Month = current month start→current day vs previous month start→same elapsed day, capped to valid previous-month date
- Last 30 Days = current 30-day window vs immediately preceding 30-day window
- Custom = selected period vs immediately preceding equal-duration period

Do not pad future dates into current-period comparison.

AUTH / SECURITY CURRENT CONTRACT

Authentication:
- Supabase Auth
- persisted browser session
- automatic token refresh
- profile is resolved before authenticated application state is accepted

Role resolution:
- `master` accepted as cross-store role
- `store_user` requires valid positive integer store_id
- missing/invalid role mapping fails closed
- session/profile query failure returns to recoverable login state

Production hardening completed:
- unsafe public test-sales RPC removed
- `coach_reports` policies restricted to intended authenticated access
- obsolete SECURITY DEFINER helpers removed
- trigger function `search_path` hardened
- leaked-password protection enabled
- Store User tenant isolation and Master cross-store behavior verified

FAILURE PRINCIPLES

AI failure
→ deterministic/base information remains.

OCR failure
→ manual input remains.

Configuration/data failure
→ show a useful reason; do not fake an empty success.

Network/API failure
→ preserve user-entered data where practical.

Permission/profile failure
→ fail closed.

CURRENT ENGINEERING POSITION

Do not initiate a rewrite simply because legacy code exists.

Completed:
- conservative dead/debug cleanup
- unreachable legacy Coach UI removal

Known optional work:
- bundle code splitting / lazy loading
- broader DataInput legacy cleanup
- automated regression-test expansion
- additional observability
- pilot feedback instrumentation

These are non-blocking unless real operation proves otherwise.

CURRENT CHANGE STANDARD

A new feature or refactor must:
1. preserve tenant boundaries,
2. preserve deterministic truth,
3. preserve manual fallback,
4. preserve explicit AI trigger behavior,
5. preserve user data on recoverable failure,
6. remain mobile-first,
7. justify added complexity with real operational value.

==============================================================================
END 2026-09-18 AUTHORITATIVE PRODUCT UPDATE
==============================================================================

DOCUMENT ROLE
This Product Bible is the highest-level product constitution for Sales Coach AI.
It defines WHAT the product is, WHY it exists, WHICH responsibilities belong to each screen,
WHAT must be preserved, WHAT must not be added casually, and HOW the product should evolve.

The UI/UX Guideline defines how the product should look and behave visually.
The Product Bible defines what the product means and how product responsibilities are divided.

SOURCE-OF-TRUTH RULES

PRODUCT / RESPONSIBILITY
1. Product Bible V4
2. Current verified application behavior
3. UI/UX Guideline V4
4. Approved visual references
5. Legacy UI

FUNCTION / BUSINESS BEHAVIOR
1. Current verified application behavior
2. Product Bible V4
3. UI/UX Guideline V4
4. Visual references

VISUAL PRESENTATION
1. Approved V4 visual references
2. UI/UX Guideline V4
3. Product Bible V4
4. Existing UI

If the image omits a current function, the function remains.
If the image includes a decorative/nonexistent feature, it must not be implemented automatically.


==============================================================================
00. DOCUMENT PURPOSE
==============================================================================

This Bible answers five questions:

1. What is Sales Coach AI?
2. Who is it for?
3. What problems is it allowed to solve?
4. How are product responsibilities divided?
5. What must never be broken as the product expands?

This is not a development log.
This is not a visual style guide.
This is not a feature wishlist.

Every new feature, redesign, migration, country extension, AI change, and Codex task must be
evaluated against this document.

The product must remain:
- mobile-first,
- store-owner-first,
- data-grounded,
- action-oriented,
- operationally practical,
- simple enough for daily use.

A new feature is justified only when it improves one or more of:
- input accuracy,
- input speed,
- analysis clarity,
- decision quality,
- actionability,
- repeat usage,
- operational consistency.

Features that only make the product look more “advanced” are not automatically valuable.


==============================================================================
01. ONE-SENTENCE PRODUCT DEFINITION
==============================================================================

Sales Coach AI is a mobile-first store operating coach that lets a restaurant operator
enter daily sales data, understand what changed, interpret why it changed,
and receive concrete operational actions based on verified store data.

The product is not centered on data storage.
It is centered on operational judgment.

The product loop is:

INPUT
→ ANALYSIS
→ ACTION
→ RE-CHECK

The loop repeats daily.


==============================================================================
02. PRODUCT IDENTITY
==============================================================================

Sales Coach AI must always feel like an operating coach.

AI is not a decorative layer.
AI is not a chat widget attached to a dashboard.
AI is not allowed to replace deterministic facts.

The system has three responsibilities:

SYSTEM
calculates trusted metrics.

AI
interprets the metrics.

INTERFACE
clarifies what matters.

OPERATOR
decides and acts.

This separation is foundational.

AI should:
- detect meaningful change,
- explain possible causes,
- rank issues,
- summarize risk/opportunity,
- suggest concrete actions,
- identify the KPI to check afterward.

AI should not:
- invent missing sales,
- fabricate causality,
- hide uncertainty,
- overwrite deterministic calculations,
- promise outcomes without evidence,
- create actions that cannot be monitored.


==============================================================================
03. WHAT THE PRODUCT IS NOT
==============================================================================

3.1 NOT ERP

Do not prioritize:
- approval chains,
- accounting workflows,
- complex master administration,
- table-heavy enterprise UI,
- deep configuration menus.

3.2 NOT POS

The product does not process orders or payments as its core job.

3.3 NOT BI DASHBOARD

Metrics are not the end result.
Insights and actions are the end result.

3.4 NOT OCR PRODUCT

OCR is an input accelerator.

3.5 NOT GENERIC CHAT

The user should not need to invent prompts to receive value.

3.6 NOT NATIVE APP BY DEFAULT

The primary product is a URL-accessed responsive web application.
Do not casually design native-only features such as push settings, background tasks,
or device-specific assumptions unless separately approved.

3.7 NOT MENU ANALYTICS TOOL ONLY

Menu Engineering is one analysis capability inside Coach,
not the overall product identity.


==============================================================================
04. PRODUCT GOAL
==============================================================================

PRIMARY GOAL

A store operator should be able to:
- enter the day's essential information,
- confirm data consistency,
- understand the store's current condition,
- see the most important recommended action

within approximately three minutes of active use.

This is a directional product goal, not a hard SLA.

The product should reduce:
- manual calculation,
- data ambiguity,
- analysis burden,
- decision hesitation,
- repetitive explanation work.

The product should increase:
- daily data completeness,
- menu master accuracy,
- operational awareness,
- usefulness of sales data,
- action follow-through.


==============================================================================
05. SUCCESS METRICS
==============================================================================

Product success is not measured by number of screens.

Useful product metrics include:

INPUT
- daily sales entry completion rate
- time to complete sales entry
- OCR correction time
- missing-field rate
- reconciliation mismatch frequency

ANALYSIS
- Coach view rate
- Menu Engineering availability rate
- AI generation success rate
- percentage of reports with sufficient data

ACTION
- Boost Plan view rate
- recommendation follow-up behavior
- repeated check of recommended KPI

DATA QUALITY
- menu price completeness
- menu cost completeness
- menu master update frequency
- stale menu rate

RETENTION
- daily/weekly returning operators
- consecutive entry behavior
- operator completion loop: Sales → Coach


==============================================================================
06. CORE USER
==============================================================================

PRIMARY USER

Restaurant store owner or operating manager.

Typical environment:
- mobile browser,
- store floor,
- office after closing,
- limited uninterrupted attention,
- limited analytics expertise,
- needs fast interpretation.

PRIMARY USER NEEDS

“Did we perform well today?”
“What changed?”
“Why might it have changed?”
“Which menu matters?”
“What should I do next?”
“What should I check tomorrow?”

SECONDARY USER

HQ operations / brand manager.

HQ needs may include:
- multiple-store monitoring,
- data completion tracking,
- problem store discovery,
- country/brand comparison,
- coaching support.

However:
Store Owner IA must not become an HQ dashboard.

HQ can have a separate product surface or IA.


==============================================================================
07. PRODUCT PRINCIPLE — MOBILE FIRST
==============================================================================

Mobile-first is a product requirement, not a visual preference.

Design order:
Mobile
→ Tablet
→ Desktop

Do not:
design desktop first and shrink later.

Daily store tasks must remain usable:
- one-handed where practical,
- short-scroll where possible,
- without horizontal tables,
- with visible save/navigation states.

The existing mobile-optimized architecture is a protected asset.

Desktop adaptation should:
- preserve mobile information hierarchy,
- use centered or moderately widened layout,
- never turn the store-owner product into an admin dashboard.


==============================================================================
08. PRODUCT PRINCIPLE — INPUT → ANALYSIS → ACTION
==============================================================================

Every major function belongs to one stage.

INPUT
- manual sales entry
- OCR receipt input
- visitor count
- order count
- menu quantity
- menu price
- menu cost
- notes

ANALYSIS
- KPI
- period comparison
- average ticket
- sales change
- menu revenue
- contribution
- food cost %
- Menu Engineering
- AI interpretation

ACTION
- operating recommendation
- action priority
- Boost Plan
- KPI to re-check

If a proposed feature does not support one of these stages,
its product value must be proven before implementation.


==============================================================================
09. PRODUCT PRINCIPLE — DATA BEFORE AI
==============================================================================

AI quality is bounded by data quality.

Therefore:
- inputs must be reviewable,
- OCR output must be correctable,
- sales and menu totals must be reconcilable,
- price/cost gaps must be visible,
- insufficient data must remain insufficient.

AI must not fill missing truth with confident guesses.

When data is missing:
- deterministic analysis should use only valid data,
- AI should disclose limitations,
- the interface should guide the operator to the missing input.


==============================================================================
10. PRODUCT PRINCIPLE — DETERMINISTIC BEFORE GENERATIVE
==============================================================================

The core product must remain useful even if Gemini is unavailable.

DETERMINISTIC DOMAIN
- total sales
- menu sales
- quantities
- visitors
- orders
- average ticket
- achievement rate
- period comparison
- food cost %
- contribution
- Menu Engineering classification when formula-based

GENERATIVE DOMAIN
- natural-language interpretation
- operating summary
- cause hypotheses
- recommendation wording
- action prioritization
- Boost Plan narrative

AI failure must not break deterministic metrics.

The interface should degrade gracefully:
metrics remain,
AI section shows retry/error.


==============================================================================
11. PRODUCT PRINCIPLE — ONE SCREEN, ONE PURPOSE
==============================================================================

HOME
Daily Brief.

SALES
Daily Input Workspace.

COACH
Analysis + Interpretation + Action.

MENU
Menu Master Management.

MORE
Store Context / Help / Guided Tour / About / Logout.

LOGIN
Secure product entry.

Screen responsibilities must not drift.

Do not:
- put Menu Engineering in Menu,
- put API administration in More,
- put detailed AI reports on Home,
- put long analytics in Sales,
- turn Menu into Coach,
- turn Home into Dashboard.


==============================================================================
12. INFORMATION ARCHITECTURE V4
==============================================================================

PRIMARY BOTTOM NAVIGATION

Coach
Sales
Home
Menu
More

Home remains the conceptual daily anchor. Navigation visuals treat all five tabs equally; only the active tab is highlighted.

Why this IA works:

HOME
answers: “What is happening today?”

SALES
answers: “What data do I need to enter?”

COACH
answers: “What does the data mean and what should I do?”

MENU
answers: “Is the master data used by analysis accurate?”

MORE
answers: “Where are support/settings/about functions?”

LOGIN exists outside the authenticated navigation shell.


==============================================================================
13. HOME — PRODUCT CONTRACT
==============================================================================

HOME ROLE

Home = Daily Brief.

PRIMARY QUESTION

“What is the state of my store today, and what should I do next?”

MUST PROVIDE
- current/selected date context
- daily status
- monthly/goal context where supported
- concise AI Coach insight
- immediate next actions

MUST NOT BECOME
- deep analytics
- multi-chart dashboard
- Menu Engineering report
- long AI report
- admin workspace

HOME ACTIONS

Typical actions:
- go to Sales
- run/use OCR entry
- open Coach

HOME DOES NOT OWN
- editing menu price/cost
- detailed period analysis
- Boost Plan detail


==============================================================================
14. SALES — PRODUCT CONTRACT
==============================================================================

SALES ROLE

Sales = Input Workspace.

PRIMARY QUESTION

“How can I record today accurately and quickly?”

CURRENT FUNCTIONAL RESPONSIBILITY

Preserve actual implemented fields including:
- selected date
- POS total sales
- delivery sales
- visitor count
- order count
- notes/special notes
- menu quantities
- OCR-assisted input
- menu total
- entered total
- difference/reconciliation
- save
- reset
- validation
- persistence

OCR ROLE

OCR assists entry.
It is not a separate product.

SALES DOES NOT OWN
- AI coaching report
- Menu Engineering
- Boost Plan
- menu master editing beyond direct navigation when required

ENTRY PHILOSOPHY

Fast
Reviewable
Correctable
Recoverable


==============================================================================
15. OCR — PRODUCT CONTRACT
==============================================================================

OCR exists to reduce typing.

OCR must:
- accept supported receipt input,
- extract usable data,
- expose results for review,
- allow correction,
- fail safely.

OCR should not:
- silently overwrite trusted inputs,
- hide confidence/problem states,
- treat multiple images of one long receipt as unrelated receipts when current workflow models them as one receipt,
- block manual entry when OCR fails.

OCR state model:

Idle
→ Select/Upload
→ Scan
→ Review
→ Warning/Block if needed
→ Apply
→ Save

Fallback:
Manual entry always remains available.


==============================================================================
16. COACH — PRODUCT CONTRACT
==============================================================================

COACH ROLE

Coach = Understand + Act.

PRIMARY QUESTION

“What does my data mean, and what should I do?”

COACH OWNS

- deterministic metric presentation
- period comparison
- AI interpretation
- Menu Engineering
- operating recommendation
- Boost Plan
- follow-up KPI

COACH IS THE PRODUCT'S INTERPRETATION CENTER.

COACH MUST DISTINGUISH

FACT
Deterministic metric.

INTERPRETATION
AI explanation.

RECOMMENDATION
Suggested action.

EXPECTED RESULT
Only when evidence/logic supports it.

FOLLOW-UP
What to check later.

COACH DOES NOT OWN
- menu master CRUD,
- sales entry,
- account/developer settings.


==============================================================================
17. MENU ENGINEERING — PRODUCT CONTRACT
==============================================================================

Menu Engineering belongs inside Coach.

Purpose:
translate menu sales + price + cost data into operating decisions.

The category label alone is not the outcome.

Useful Menu Engineering should answer:
- which items are strong,
- which items have weak profitability,
- which items need visibility,
- which items need price/cost review,
- which items deserve reconsideration.

Preserve current verified classification logic.

Do not casually rename categories in UI or code.

If the current implementation uses:
Star
Cash Cow
Puzzle
Dog
no-cost / missing-cost handling

preserve those verified terms until a product decision changes them.

Menu Engineering is analysis.
Menu screen is management.


==============================================================================
18. BOOST PLAN — PRODUCT CONTRACT
==============================================================================

Boost Plan converts analysis into a practical operating plan.

STRUCTURE

Problem
→ Goal
→ Action
→ Check KPI

The user should understand:
- what is wrong/opportunity,
- what to try,
- why,
- what to measure later.

Do not invent task-management behavior.

Unless current product supports it, Boost Plan is NOT:
- a task checklist,
- a persisted project manager,
- a notification scheduler,
- an employee assignment system.

Display recommendations as recommendations.


==============================================================================
19. MENU — PRODUCT CONTRACT
==============================================================================

MENU ROLE

Menu = Menu Master Data Management.

PRIMARY QUESTION

“Are the menu records used by Sales and Coach accurate?”

CORE OPERATIONAL REQUIREMENTS

The operator must quickly respond when:
- menu name changes,
- price changes,
- cost changes,
- menu is introduced,
- menu is removed.

PRIMARY MASTER DATA

Menu Name
Price
Cost

OTHER VERIFIED METADATA

If current code requires category, order, active state, local name, etc.,
preserve those fields according to actual implementation.

But do not visually over-expand the Menu screen merely because metadata exists.

CRITICAL BOUNDARY

Menu does NOT contain:
AI Insight
Menu Engineering
Boost Plan
sales trend analysis
performance classification

Those belong to Coach.

MENU PHILOSOPHY

Read first.
Edit on request.
Fast maintenance.
Source of truth.


==============================================================================
20. MORE — PRODUCT CONTRACT
==============================================================================

MORE ROLE

More = Quiet Support Area.

STORE OWNER SCOPE

Appropriate:
- current store context
- Help / quick help
- Contextual Guided Tour
- AI analysis notice
- App information
- Logout

NOT APPROPRIATE

- Supabase service keys
- Gemini API keys
- system secrets
- developer tools
- technical configuration
- admin-only integration settings

API SETTINGS

Store owners should not be able to change application secrets.

NOTIFICATIONS

The baseline product is a responsive web URL.
Do not add native-style notification settings by default.

HELP TOPICS MAY INCLUDE
- getting started
- sales entry
- OCR
- Coach
- menu management
- FAQ

These support surfaces are implemented; future changes should be driven by actual operator feedback.


==============================================================================
21. LOGIN — PRODUCT CONTRACT
==============================================================================

LOGIN ROLE

Provide a clear, trustworthy entry into Sales Coach AI.

Authentication behavior remains existing system behavior.

The redesign may change:
- layout,
- typography,
- form styling,
- visual hierarchy,
- support copy.

The redesign must not silently change:
- login identifier semantics,
- password rules,
- session behavior,
- approval workflow,
- authorization roles.

LOGIN SHOULD FEEL
Warm
Premium
Simple
Secure
Consistent with the authenticated product.


==============================================================================
22. DATA MODEL PHILOSOPHY
==============================================================================

The Product Bible does not redefine the database schema.

However, product meaning should remain clear.

DAILY SALES DATA
represents store-day operating input.

MENU MASTER
represents the source of truth for menu name/price/cost and verified metadata.

ANALYSIS DATA
should be derived where possible rather than duplicated manually.

AI OUTPUT
must be distinguishable from deterministic fields.

DERIVED VALUES
such as food cost %, contribution, totals, rates should be calculated from valid source data
rather than independently edited unless product logic explicitly requires otherwise.

Do not create duplicated sources of truth.


==============================================================================
23. DATA QUALITY RULES
==============================================================================

Data quality is a product feature.

Minimum principles:
- required fields are clear,
- invalid values are caught,
- totals are reconcilable,
- menu master gaps are visible,
- OCR result is reviewable,
- save success/failure is explicit,
- incomplete AI context is disclosed.

The product should prefer:
“insufficient data”
over
fabricated certainty.

Data errors must be recoverable.

A failed save must not wipe user entry.


==============================================================================
24. AI TRUST & EXPLAINABILITY
==============================================================================

AI should be useful without pretending to be omniscient.

AI output should generally include:
- observation,
- evidence,
- interpretation,
- recommendation.

Use language such as:
“~로 보입니다”
“~가능성이 있습니다”
when causality is not certain.

Avoid:
“매출이 떨어진 원인은 X입니다”
unless there is actual causal evidence.

AI should cite/reflect relevant product metrics in plain language.

AI should not expose prompt internals, model secrets, or raw system instructions to store users.


==============================================================================
25. PRODUCT COPY PHILOSOPHY
==============================================================================

Product language is operational.

Good:
“오늘 매출”
“메뉴 원가를 확인해 주세요.”
“점심 주문수가 감소했어요.”
“매출 입력하기”
“AI 코치 보기”

Avoid:
- developer terminology,
- verbose analytics terminology,
- corporate jargon,
- raw API errors.

AI copy must sound like a coach:
helpful,
direct,
grounded,
not patronizing,
not overly casual.


==============================================================================
26. INTERNATIONAL / MULTI-COUNTRY PRINCIPLE
==============================================================================

Sales Coach AI may expand across countries and brands.

Country differences must not fragment the core product.

CORE SHOULD REMAIN COMMON
- navigation
- daily sales flow
- menu master concept
- deterministic analysis structure
- AI interpretation pipeline

COUNTRY-SPECIFIC LAYERS MAY INCLUDE
- currency
- tax display
- menu naming
- language
- receipt format
- local data mapping

Do not solve one-country exceptions by forking the whole app structure.
Prefer configuration and normalization.


==============================================================================
27. BRAND / STORE SCALABILITY
==============================================================================

The product should support future brand/store expansion without changing the operator's basic mental model.

A store operator should always know:
Home = today
Sales = input
Coach = meaning/action
Menu = master
More = support

If multi-store behavior is added later,do not turn single-store daily flow into an HQ dashboard.

Store switching should be explicit and context-safe.
Data from two stores must never appear mixed.


==============================================================================
28. PRODUCT ROLE SEPARATION — STORE OWNER VS HQ
==============================================================================

STORE OWNER PRODUCT

Optimized for:
- speed,
- daily input,
- immediate coaching,
- mobile use.

HQ PRODUCT

May require:
- portfolio comparison,
- issue triage,
- monitoring,
- management views.

The two can share:
- data,
- design tokens,
- analysis logic,
- some components.

They should not be forced to share identical information architecture.

HQ complexity must never leak into the store-owner experience.


==============================================================================
29. ERROR & DEGRADATION PRODUCT POLICY
==============================================================================

The product must remain useful under partial failure.

SUPABASE / DATA FAILURE
show clear error.
Do not pretend save succeeded.

AI FAILURE
retain deterministic metrics.
Retry AI only.

OCR FAILURE
retain manual entry.

MENU COST MISSING
allow sales data to exist;
explain that profitability analysis may be limited.

NETWORK FAILURE
preserve unsaved form state where technically feasible.

PERMISSION FAILURE
show actionable access message.

No raw stack traces.
No silent empty output.


==============================================================================
30. FEATURE ADMISSION TEST
==============================================================================

Before adding a feature, answer:

1. Which stage does it support?
Input / Analysis / Action

2. Which primary user needs it?

3. Does it reduce time, ambiguity, or effort?

4. Does it improve data quality or operating decisions?

5. Does it belong in an existing screen?

6. Does it duplicate another feature?

7. Does it introduce native-app assumptions into a web product?

8. Does it create a new source of truth?

9. Can it be explained simply to a store owner?

10. What will be removed/simplified to offset added complexity?

If these questions cannot be answered clearly,
the feature should not be prioritized.


==============================================================================
31. FEATURE REJECTION EXAMPLES
==============================================================================

Examples of features to reject or defer unless strongly justified:

- API key management for store owners
- complex dashboard builder
- dozens of customizable widgets
- menu photo management without clear product need
- background push notification system before core daily loop is proven
- generic AI chat with no store context
- task-management system inside Boost Plan without validated demand
- unrelated employee scheduling
- accounting approval workflows
- overly technical settings
- desktop-first reporting interfaces for store owners


==============================================================================
32. PRODUCT PRIORITY FRAMEWORK
==============================================================================

P0
Protect core operation.
Fix anything that breaks input, analysis truth, save, navigation, or access.

P1
Improve the daily loop.
Sales speed, Coach clarity, menu master accuracy, mobile usability.

P2
Improve repeat value.
better trends, better action follow-up, support/help.

P3
Future expansion.
multi-store, predictive alerts, HQ tools, advanced memory.

Never allow P3 features to destabilize P0/P1.


==============================================================================
33. CODEX PRODUCT RULES
==============================================================================

Codex must understand the product before coding.

Before changing UI:
- inspect current implementation,
- identify current working behavior,
- identify business callbacks,
- identify persistence,
- identify route/page mapping.

Codex must not:
- invent product responsibilities,
- move Menu Engineering to Menu,
- expose API secrets,
- remove OCR because a visual is simplified,
- create native push features,
- rewrite calculations during a UI task,
- change database structure during a design task,
- add fake expected-effect numbers,
- add menu photos,
- turn Boost Plan into persisted tasks without instruction.

When unclear:
report NOT CONFIRMED.


==============================================================================
34. UI/UX GUIDELINE RELATIONSHIP
==============================================================================

The Product Bible answers:
WHAT / WHY / WHO / RESPONSIBILITY.

The UI/UX Guideline answers:
HOW IT LOOKS / HOW IT INTERACTS.

Examples:

Bible:
Menu manages menu master.

UIUX:
Menu uses read-first list, warm cards, edit sheet.

Bible:
Coach owns Menu Engineering.

UIUX:
Coach uses progressive disclosure and AI-purple cues.

Bible:
Home is Daily Brief.

UIUX:
Home uses greeting → dark hero → AI insight → actions → dock.

Neither document should contradict the other.


==============================================================================
35. VISUAL REFERENCE RELATIONSHIP
==============================================================================

The 11 visual references define the desired visual system.

They are not standalone product requirements.

Codex must use them as:
- composition references,
- spacing references,
- component styling references,
- density references,
- hierarchy references.

Codex must NOT infer new business functionality from decorative imagery.

Known explicit correction:
Menu visual image may show food photography.
Actual V4 product does not require menu images.
Do not implement menu photo functionality.

Known explicit correction:
If a reference image omits Bottom Navigation,
the navigation may still be required by the authenticated shell.

Textual product rules override accidental visual omissions.


==============================================================================
36. PRODUCT QA CHECKLIST
==============================================================================

Before approving a product change:

PRODUCT
□ Does it support Input, Analysis, or Action?
□ Is the target user clear?
□ Is responsibility on the correct screen?
□ Does it preserve product simplicity?

DATA
□ Does it preserve source-of-truth rules?
□ Does it avoid duplicate master data?
□ Does it avoid AI guessing over missing facts?

AI
□ Is deterministic logic still available without AI?
□ Is AI interpretation separated from facts?
□ Is uncertainty handled correctly?

MOBILE
□ Can the operator use it comfortably on mobile?
□ Does it avoid table-heavy interaction?

BOUNDARY
□ Menu remains management.
□ Coach remains analysis/action.
□ Home remains Daily Brief.
□ Sales remains input.
□ More remains quiet support.

TECH
□ No unrelated API/DB changes.
□ Existing functional behavior preserved.
□ No unapproved secrets/settings exposed.


==============================================================================
37. V4 IMPLEMENTATION SEQUENCE
==============================================================================

Recommended product-safe sequence:

0. Current-state audit
1. V4 design tokens / components
2. Login
3. Home
4. Sales
5. Coach
6. Menu
7. More
8. State components
9. Responsive/accessibility polish
10. Browser validation
11. Product review
12. Commit after meaningful completion per workflow

Each phase must preserve existing functional contracts.

UI redesign must be reviewed as a product migration,
not just a CSS task.


==============================================================================
38. FUTURE PRODUCT DIRECTIONS
==============================================================================

Possible future expansions:

- personalized AI Coach memory
- weekly operating brief
- predictive alerts
- multi-store Coach
- contextual onboarding/help
- HQ observation mode
- localization expansion
- richer follow-up measurement
- recommendation effectiveness tracking

These are NOT baseline V4 requirements.

Any future feature must preserve:
mobile-first,
daily-first,
data-before-AI,
deterministic-before-generative,
clear screen responsibility,
low cognitive load.


==============================================================================
39. FINAL PRODUCT STATEMENT
==============================================================================



==============================================================================
35. CURRENT VERIFIED PRODUCT STATE — 2026-08-12 / V4.1
==============================================================================

This section supersedes older implementation-status statements when they describe a previous technical state.

It does NOT replace the product principles above.

Current maturity:

- Demo Ready
- One-Store Pilot Ready
- Production Scale Hardening Pending

The product now has a complete active store-owner loop:

HOME
→ SALES
→ COACH
→ MENU
→ RE-CHECK

with MORE as the quiet support area.

==============================================================================
36. VERIFIED CURRENT FEATURE CONTRACT
==============================================================================

36.1 HOME

Home remains Daily Brief.

It can:
- summarize the current selected date,
- show daily KPI/goal context,
- expose concise AI Coach insight,
- guide the operator toward Sales/OCR/Coach,
- reflect task completion.

Home must not:
- become the detailed Coach,
- run Menu Engineering,
- become menu administration,
- become a multi-chart BI page.

36.2 SALES

Sales remains Daily Input Workspace.

Verified active responsibilities:
- selected date,
- POS sales,
- delivery sales,
- orders,
- visitors,
- note,
- menu quantities,
- OCR-assisted input,
- reconciliation,
- reset,
- save,
- persistence,
- save confirmation.

Japan pilot additionally preserves:
- DINE-IN quantity,
- TAKEOUT quantity,
- combined quantity compatibility.

36.3 OCR

OCR is now modeled as a RECEIPT BATCH.

Multiple photos of one long closing receipt are one logical receipt.

Required semantics:
- all selected images are ordered parts of one receipt,
- one batch request,
- one structured result,
- item extraction before financial summary interpretation,
- reviewable mappings.

Store/date authority belongs to the selected app context.

Currency remains a safety validation.

Receipt financial fields must remain distinct:
- subtotal,
- service,
- tax,
- final payment.

OCR must never silently convert a suspicious item into a trusted menu match.

36.4 COACH

Coach consists of four independent product capabilities:

1. Sales Analysis
2. AI Operating Coaching
3. Menu Engineering / AI Menu Strategy
4. Boost Plan

Comparison data is enrichment, not a mandatory prerequisite.

UI execution order is never a prerequisite.

36.5 SALES ANALYSIS

Sales Analysis is deterministic.

It may compute automatically.

AI is not required to show:
- KPI,
- comparison,
- daily trend,
- top menu comparison.

36.6 AI OPERATING COACHING

A new AI report is generated only after an explicit user action.

Entering Coach or opening the card is not consent to spend an AI request.

Saved exact-scope completed reports load immediately.

36.7 MENU ENGINEERING

The foundation is deterministic.

Classification:
- Star
- Cash Cow
- Puzzle
- Dog

The deterministic layer remains valid even if Gemini is unavailable.

AI Menu Strategy is interpretation on top of that result.

Short periods may have weaker confidence but are not automatically invalid.

36.8 BOOST PLAN

Boost Plan converts deterministic analysis into prioritized operational action.

Its deterministic prerequisite must be internally available.

The user is not required to visit Menu Engineering first.

AI generation is explicit.

36.9 MENU

Menu remains Menu Master Management.

The live product DOES NOT use menu photos.

Menu is browse-first:
- search,
- category filter,
- data cards,
- edit on request.

It manages:
- name,
- category where required,
- price,
- cost,
- effective date,
- order,
- history,
- deletion/availability behavior according to current implementation.

Food cost % is derived where possible.

==============================================================================
37. AI PERSISTENCE & SCOPE CONTRACT
==============================================================================

AI output persistence is now a verified product behavior.

Table:
`public.coach_reports`

Types:
- operating_coaching
- menu_engineering
- boost_plan

Exact product scope:
`store_id + report_type + period_start + period_end`

This scope is fundamental.

A report for one period must never appear under another period.

A report for one store must never appear under another store.

Completed:
- restore immediately,
- no automatic regeneration.

Generating:
- display as active only when a matching browser request is genuinely active.

Interrupted/persisted generating without a live request:
- provide safe retry/re-analysis behavior.

Failed:
- provide retry.

No report:
- provide explicit analysis CTA.

==============================================================================
38. AI EXECUTION CONSENT PRINCIPLE
==============================================================================

The application may automatically:
- load deterministic data,
- compute deterministic metrics,
- restore saved reports.

The application may NOT automatically spend a new generative AI request merely because the user:
- entered Coach,
- opened a card,
- changed period,
- returned from another tab.

Generative actions require an explicit CTA.

This rule supports:
- cost control,
- user predictability,
- demo reliability,
- operator trust.

==============================================================================
39. ASYNC / NAVIGATION PRODUCT CONTRACT
==============================================================================

Normal in-app navigation should not force the operator to stare at an AI loading screen.

If the architecture can safely continue an active request while navigating:
- analysis continues,
- operator may use Home/Sales/Menu,
- completed result is persisted,
- Coach later restores it.

Current implementation keeps Coach request ownership alive during normal SPA tab navigation.

Full browser refresh is different:
- an active client request may be interrupted,
- completed persisted results must still restore.

UI copy should be positive:

`AI가 분석하고 있어요`
`분석하는 동안 다른 메뉴를 둘러보셔도 됩니다.`

Do not build a false background-job promise.

==============================================================================
40. DEMO FIXTURE & PRODUCTION DATA BOUNDARY
==============================================================================

Japan demo fixture is permitted as an isolated demonstration aid.

Rules:
- pilot/demo fixture must not write fake daily sales rows to Supabase,
- fixture must use real loaded menu master names/prices where possible,
- fixture scope must be explicit,
- non-pilot accounts must not receive fixture data,
- production rollout must verify fixture precedence cannot contaminate real operations.

Temporary demo behavior is not automatically product behavior.

==============================================================================
41. PRODUCTION READINESS POSITION
==============================================================================

Current classification:

DEMO:
YES.

ONE-STORE PILOT:
YES.

10-STORE ROLLOUT:
YES WITH CONDITIONS.

100-STORE ROLLOUT:
NOT YET.

Conditions before broader production:

1. Real-store E2E data verification.
2. Cross-store authorization/RLS testing.
3. Failure/retry behavior verification.
4. Observability/logging.
5. High-value automated tests.
6. Architecture/maintainability audit.
7. Incremental technical-debt plan where evidence justifies it.

The existence of technical debt does not automatically block the pilot.
It must be prioritized by production risk.

==============================================================================
42. PRODUCTION HARDENING PRINCIPLES
==============================================================================

42.1 DATA ACCURACY FIRST

A beautiful UI does not compensate for wrong:
- quantity,
- price,
- subtotal,
- store,
- period,
- menu identity.

42.2 SECURITY BEFORE SCALE

Cross-store isolation must be tested, not assumed.

42.3 OBSERVABILITY BEFORE LARGE ROLLOUT

An engineer must be able to answer:
- which store,
- which date/period,
- which feature,
- which request,
- what failed.

42.4 TEST THE DETERMINISTIC CORE

The highest-value tests protect:
- dates,
- money,
- quantities,
- classification,
- scoping,
- persistence.

42.5 NO BIG-BANG REWRITE

The current working product is an asset.

Refactor incrementally after a read-only architecture audit.

==============================================================================
43. CURRENT TECHNICAL GOVERNANCE
==============================================================================

Development workflow:

1. Codex makes a scoped change.
2. TypeScript validation.
3. Production build.
4. `git diff --check`.
5. Review/Audit.
6. Commit/push only after PASS.
7. Vercel Ready.
8. Browser validation.

Do not combine unrelated business areas in one risky patch when avoidable.

Use evidence:
- source,
- diff,
- console,
- browser,
- Supabase.

Do not declare a fix based only on intention.

==============================================================================
44. ARCHITECTURE AUDIT — NEXT FORMAL GATE
==============================================================================

A senior-engineering read-only audit is the next formal technical gate.

The audit must inspect:
- repository tree,
- LOC,
- large files,
- component responsibilities,
- state ownership,
- async race safety,
- service boundaries,
- Supabase access,
- type safety,
- error handling,
- debug visibility,
- tests,
- duplication,
- coupling,
- demo isolation,
- production readiness.

It must NOT rewrite the project.

After the audit, technical debt is grouped:
- P0 before production scale,
- P1 soon,
- P2 as project grows,
- P3 optional cleanup.

Only then should a refactor roadmap be approved.

==============================================================================
45. HIGH-RISK REGRESSION BOUNDARIES
==============================================================================

Never casually change:

1. Exact report scope.
2. OCR batch semantics.
3. Receipt subtotal vs final payment semantics.
4. Currency safety behavior.
5. Japan DINE-IN/TAKEOUT.
6. Deterministic Menu Engineering formulas.
7. Explicit AI-generation consent.
8. Coach report persistence.
9. stale async-response protection.
10. Menu effective-date/persistence behavior.
11. store-owner authorization boundaries.
12. Home/Sales/Coach/Menu responsibility boundaries.

==============================================================================
46. FOR ANOTHER AI / DEVELOPER — START HERE
==============================================================================

When inheriting this project:

1. Read this Product Bible first.
2. Read the UI/UX Guideline.
3. Read the latest Development Handover section.
4. Check the current working tree before making claims.
5. Verify the active render path.
6. Distinguish historical notes from current behavior.
7. Preserve deterministic truth.
8. Treat AI as interpretation/action assistance.
9. Never let demo shortcuts become global production behavior.
10. Prefer a safe incremental change over a rewrite.

Current priority after the 2026-09-18 Pilot Readiness close:

`Pilot Usage → Evidence Collection → Targeted Improvement → Optional Optimization`


Sales Coach AI should never require the store owner to become a data analyst.

The operator should enter only the data that is genuinely needed.

The system should calculate what can be calculated.

AI should interpret what requires interpretation.

The interface should clarify what matters.

The operator should act.

HOME
is not a dashboard.
It is a Daily Brief.

SALES
is not a database form.
It is the daily input workflow.

COACH
is not a report archive.
It is the operating interpretation and action center.

MENU
is not Menu Engineering.
It is the master-data source of truth.

MORE
is not a junk drawer.
It is the support, help, guided-tour, and app-information area.

LOGIN
is not a separate visual product.
It is the entrance to the same V4 experience.

The product succeeds when daily restaurant operation becomes easier,
clearer, and more actionable because of the system.
