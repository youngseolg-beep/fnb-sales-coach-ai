이미지파일
https://drive.google.com/drive/folders/1fXlcQqT8SQvA1GUKSr6-WuywbFvrxWOo?usp=drive_link
SALES COACH AI
DESIGN LANGUAGE & UI/UX GUIDELINE
VERSION 4.3 — CODEX IMPLEMENTATION MASTER
Document Type: Product Design Language / UIUX Specification / Implementation Guide
Primary Platform: Mobile-first Responsive Web
Primary Navigation: Coach / Sales / Home / Menu / More
Core Product Flow: Input → Analysis → Action
Visual Reference Set: 11 approved UI/UX reference images
Implementation Target: Existing Sales Coach AI codebase
Document Status: Official V4.3 UI/UX Master — Pilot Implementation Integrated
Last Updated: 2026-09-21
==============================================================================
CURRENT AUTHORITATIVE IMPLEMENTATION UPDATE — 2026-09-21 / V4.3
==============================================================================

This section overrides older conflicting implementation-status statements. The existing V4 visual language remains authoritative.

MENU — 기본 제공 찬
- The 기본 제공 찬 card sits within Menu management but remains separate from sellable-menu editing.
- It supports loading, error/retry, empty/not-configured, configured, review-overdue, edit/manage, and read-only-history states.
- Configured summary shows 1회 총 원가, item count, effective-date context, and next review date.
- Editing is compact and mobile-first: item name, 1회 기준 원가, add/delete, derived total, and an explicit independent Save.
- Read-only history opens in a modal, newest effective date first, showing effective date, total, item count, expandable item detail, and a current-applied badge where appropriate.
- Styling stays within warm V4 neutral/brown surfaces.

SALES — 기본 제공 찬 제공 횟수
- Inside 메뉴 판매량, after category/menu quantity rows, display: 기본 제공 찬 / 제공 횟수 [ ] 회.
- Display only when configuration applies to the selected Sales date. Do not list child component items in Sales.
- Keep the count visually separate from 총 판매수량: it is a food-cost operating quantity, not a sellable-menu quantity.
- Validation and error copy remain concise Korean.

COACH — 원가 기준 수익성
- Place the compact panel after 선택 기간 KPI and before expandable 매출 분석, AI 운영 코칭 리포트, Menu Engineering, and Boost Plan sections.
- Use a mobile-first warm-white/neutral surface and two-column metric grid; do not use an oversized finance dashboard or AI-purple emphasis.
- Metrics are exactly: 매출, 메뉴 원가, 기본 제공 찬 원가, 총 식재료 원가, 실질 원가율, 원가 기준 이익.
- Quiet disclaimer: 인건비, 임차료, 카드·배달 수수료, 세금 등 기타 비용은 포함하지 않습니다. 원가 기준 이익은 순이익이 아닙니다.
- Loading, error + retry, and empty-range states are local to this panel.
- Do not introduce food-cost comparison arrows or benchmarks; they are not implemented.

==============================================================================
END CURRENT AUTHORITATIVE IMPLEMENTATION UPDATE — 2026-09-21 / V4.3
==============================================================================
==============================================================================
CURRENT AUTHORITATIVE IMPLEMENTATION UPDATE — 2026-09-18 / V4.2
==============================================================================

This section overrides any older implementation-status statement in this document when there is a conflict.
The original V4 visual language remains authoritative unless this update explicitly changes a rule.

CURRENT STATUS
- Store Owner V4: Pilot-ready and verified in Production.
- Coach / Sales / Home / Menu / More: active.
- More: no longer placeholder-only.
- Contextual Help + Guided Tour: implemented.
- Mobile bottom navigation: unified active-tab treatment implemented.
- Sales header: unified with Coach / Menu / More.
- Further cosmetic redesign is NOT the default next step. Use pilot evidence.

NAVIGATION — CURRENT RULE
Primary navigation remains:

Coach / Sales / Home / Menu / More

Mobile:
- all five tabs use one baseline, one height family, and one base visual treatment,
- only the CURRENT tab receives the active warm highlight,
- Home is the conceptual daily anchor but is NOT permanently raised, enlarged, bordered, or shadowed when inactive,
- do not restore the old center-FAB-like Home treatment.

Desktop:
- sidebar navigation remains appropriate,
- current item only receives active treatment.

SHARED NON-HOME HEADER
Coach / Sales / Menu / More use the same Store Owner shell header language.

Header includes:
- Sales Coach AI product label,
- current page name,
- short page description,
- month / date context,
- compact secondary metadata/action area.

Sales must NOT use the old isolated back-arrow/title bar.
Its date/calendar control remains functional inside the shared header.

MORE — CURRENT IMPLEMENTATION
More is now a functional support surface.

Current content:
1. real store information
   - store name
   - brand
   - country
   - currency
2. Sales Coach AI 둘러보기
3. 현재 화면 가이드
4. 처음부터 둘러보기
5. 빠른 도움말
   - 매출 입력
   - 영수증 OCR
   - AI Coach
   - 메뉴 엔지니어링
   - AI 부스트 플랜
   - 메뉴 관리
6. AI 분석 안내
7. App information
8. Logout

Do NOT reintroduce fake Language / Display settings until those controls actually exist.

CONTEXTUAL HELP + GUIDED TOUR
Canonical rules:

- always user initiated,
- never auto-start on login/page load,
- no onboarding cookie/localStorage requirement,
- current screen first,
- full task-flow tour second,
- prefer 5–8 steps,
- one concept/action per step,
- copy preferably 1–2 short lines,
- stable `data-tour` markers are the targeting convention,
- missing targets retry briefly and then skip safely,
- hidden mobile/desktop targets skip safely,
- tooltip remains viewport-bounded on mobile,
- resize and scroll recalculate target position,
- Esc and visible close supported,
- Previous / Next / Complete supported,
- full workflow may navigate between Store Owner pages,
- tour must NEVER save, delete, upload OCR, trigger AI generation, change input values, or log out,
- tutorial is not a substitute for fixing poor UI.

Current tour size:
- Home: 5
- Sales: 6
- Coach: 7
- Menu: 5
- More: 5
- Full workflow: 8

GUIDE COPY RULE
Use operator language, not internal implementation language.

Prefer:
- 매출 분석 결과
- 판매 흐름
- 개선 방법
- 실행 방법
- 확인할 내용
- 필요한 조치

Avoid in user-facing guidance:
- 유효 후보
- 분석 후보
- 실행 우선순위
- deterministic
- internal error-code jargon

AI / FAILURE PRESENTATION
- deterministic/base metrics remain visible when AI fails,
- AI section shows a plain Korean reason,
- retry remains possible where appropriate,
- no raw model response should dominate the UI,
- Menu Engineering and Boost Plan should remain visually compact and action-oriented.

SALES CURRENT PRESENTATION
Sales now shares the common header.
Core content remains:
1. 오늘 요약
2. 기본 매출 정보
3. 영수증 자동입력
4. 메뉴 판매량
5. input/menu sales reconciliation context
6. save/reset actions

The reconciliation information may live inside the Today Summary rather than as a separate oversized card.
Do not recreate a redundant standalone reconciliation card if the same information is already clear.

MOBILE QA
Primary widths remain:
- 360
- 390
- 430

Additionally verify:
- active tab only,
- no permanent Home emphasis,
- guided-tour tooltip stays inside viewport,
- bottom nav does not cover content,
- sticky controls respect safe area.

CURRENT DESIGN DECISION
V4 visual redesign is considered complete enough for controlled pilot.
Future UI work should be:
pilot-evidence driven
→ friction reduction
→ accessibility/responsive polish
not another speculative cosmetic redesign.

==============================================================================
END CURRENT AUTHORITATIVE IMPLEMENTATION UPDATE
==============================================================================

PURPOSE OF THIS FILE
This file is written for Codex and any future developer/AI working on Sales Coach AI.
It translates the approved 11 visual reference images into a detailed, implementation-oriented
design specification. It does not replace current business logic. It defines how the existing
product should LOOK, FEEL, BE STRUCTURED, and BE INTERACTED WITH after the V4 redesign.
THE 11 VISUAL REFERENCES
01\. Login Screen
02\. Home Screen
03\. Sales Input Screen
04\. Coach Screen
05\. Menu Management Screen
06\. More Screen
07\. Component Library
08\. Navigation & Flow
09\. Design Token
10\. Empty / Loading / Error States
11\. UI Rules
IMPORTANT DISTINCTION
\- Current verified application behavior is the source of truth for functionality.
\- The Product Bible is the source of truth for product architecture and responsibilities.
\- This UI/UX Guideline is the source of truth for interaction and presentation rules.
\- The 11 approved visual images are the source of truth for visual intent and appearance.
\- Existing legacy UI is NOT a visual reference and must not override the approved V4 design.
ABSOLUTE IMPLEMENTATION RULE
Do not remove a working feature merely because an image does not show it.
Do not add a business feature merely because an image contains a decorative representation.
Preserve current functionality first; apply V4 presentation second.
\==============================================================================
00\. DOCUMENT GOVERNANCE & SOURCE-OF-TRUTH RULES
\==============================================================================
0.1 WHY THIS DOCUMENT EXISTS
Sales Coach AI already has working product logic: authentication, store owner navigation,
sales entry, OCR-assisted entry, deterministic calculations, AI Coach analysis, Menu Engineering,
Boost Plan output, menu master management, and supporting routes.
The redesign must not turn into a product rewrite.
The job of V4 is to:
1\. modernize the presentation layer,
2\. unify visual language,
3\. reduce dashboard-like density,
4\. make daily store operation feel faster,
5\. make AI guidance clearer,
6\. preserve all verified business behavior.
0.2 TWO DIFFERENT PRIORITY CHAINS
FUNCTION / BEHAVIOR PRIORITY
1\. Current verified application behavior
2\. Product Bible V4
3\. UI/UX Guideline V4
4\. Visual reference images
5\. Legacy UI
VISUAL PRESENTATION PRIORITY
1\. Approved visual reference images
2\. UI/UX Guideline V4
3\. Product Bible V4
4\. Existing implementation
5\. Personal preference of developer/AI
This split is mandatory.
0.3 IMAGE INTERPRETATION RULE
The 11 images are IMPLEMENTATION REFERENCES, not loose mood boards.
Use them to reproduce:
\- composition,
\- density,
\- visual hierarchy,
\- radius,
\- spacing,
\- tone,
\- color relationships,
\- typography hierarchy,
\- component personality,
\- navigation treatment.
However, the images are not exhaustive functional specifications.
If an image omits a currently working function:
KEEP THE FUNCTION.
If an image displays a decorative food photo but the current product does not use menu photos:
DO NOT ADD MENU PHOTOS.
If an image shows a simplified flow while the real code requires additional verified steps:
KEEP THE STEPS and redesign them using the closest V4 component pattern.
If an image shows text that conflicts with actual data or labels:
USE ACTUAL DATA / CURRENT BUSINESS TERMINOLOGY, while preserving visual hierarchy.
0.4 NO CREATIVE REINTERPRETATION
Codex must not:
\- redesign the product in another visual style,
\- switch to Material Design,
\- switch to Bootstrap-like components,
\- replace the bottom dock with a generic tab bar,
\- introduce bright blue SaaS colors,
\- convert mobile screens into desktop dashboards,
\- invent large FABs,
\- invent charts where the reference intentionally uses text and cards,
\- overuse gradients,
\- overuse purple,
\- introduce arbitrary new typography scales.
0.5 CHANGE SCOPE
Allowed:
\- JSX layout refactoring,
\- component composition,
\- CSS/Tailwind/style-token changes,
\- shared UI primitives,
\- responsive layout,
\- accessibility improvements that do not alter business logic,
\- visual state handling,
\- presentation-only copy cleanup when behavior is unchanged.
Not allowed unless separately requested:
\- API contract changes,
\- database schema changes,
\- Supabase schema changes,
\- OCR API behavior changes,
\- Gemini prompt/business logic rewrites,
\- calculation formula changes,
\- persistence behavior changes,
\- authentication architecture changes,
\- route semantics changes,
\- data model renaming,
\- silent feature removal.
0.6 WORKING PRINCIPLE
When uncertain:
1\. preserve behavior,
2\. preserve data,
3\. preserve callbacks,
4\. preserve routes,
5\. apply the V4 visual system,
6\. document any unavoidable deviation.
\==============================================================================
01\. PRODUCT DEFINITION & EXPERIENCE PHILOSOPHY
\==============================================================================
1.1 PRODUCT DEFINITION
Sales Coach AI is not a POS.
It is not an ERP.
It is not a BI dashboard.
It is not a generic analytics tool.
Sales Coach AI is an AI Store Operating Coach.
The store owner uses it to:
\- record daily operational data,
\- understand what changed,
\- understand why,
\- see what deserves attention,
\- receive practical suggestions,
\- manage menu master data,
\- act faster.
1.2 CORE EXPERIENCE
INPUT → ANALYSIS → ACTION
INPUT
Daily sales, delivery sales, orders, visitors, menu quantities, price, cost, notes,
and OCR-derived receipt information are collected.
ANALYSIS
Deterministic calculations produce trusted metrics.
AI interprets those metrics.
Menu Engineering and trend analysis provide context.
ACTION
The UI must translate analysis into an understandable next step.
1.3 DESIGN SUCCESS CRITERIA
A strong screen should let the user:
\- understand current status within 5 seconds,
\- identify the main issue or opportunity within 15 seconds,
\- begin a useful action within 30 seconds.
1.4 DAILY-FIRST PRINCIPLE
The product is used in daily store operation.
Therefore, default experience should prioritize:
\- today,
\- current selected date,
\- current sales state,
\- current action,
\- current coaching.
Avoid making the user start from historical analytics unless they intentionally request it.
1.5 HUMAN + PROFESSIONAL BALANCE
Desired emotional balance:
Warm 60 / Neutral 40
Human 60 / Professional 40
Minimal 70 / Informative 30
AI Guidance 60 / Data Display 40
The product should feel like a reliable operating partner, not enterprise accounting software.
\==============================================================================
02\. V4 DESIGN PRINCIPLES
\==============================================================================
2.1 WARM CANVAS
Use warm off-white as the environmental background.
2.2 CALM HIERARCHY
Only one or two elements should dominate any viewport.
2.3 ONE PRIMARY PURPOSE PER SCREEN
Home = daily brief.
Sales = data input.
Coach = interpretation and action.
Menu = menu master management.
More = quiet support/help.
Login = confident entry into the product.
2.4 ONE PRIMARY CTA RULE
A screen can contain multiple actions, but visually it must have one dominant primary action.
2.5 AI PURPLE IS SEMANTIC
Purple indicates AI-generated, AI-assisted, or AI-processing content only.
2.6 BROWN IS OPERATING ACTION
Warm brown is the product's main action/selection color.
2.7 READ FIRST, EDIT ON REQUEST
Especially in Menu and settings, default view should favor scanning/reading.
Editing appears when explicitly requested.
2.8 PROGRESSIVE DISCLOSURE
Long analytical content is collapsed or summarized first.
Coach should not dump a full report at first glance.
2.9 MOBILE FIRST
Design for 360–430px first.
Desktop should not become an admin dashboard.
2.10 CONTINUOUS CANVAS
Avoid filling the screen with a grid of independent cards.
Use whitespace and sections. Cards exist only where grouping is useful.
2.11 NO VISUAL NOISE
Avoid:
\- excessive border lines,
\- excessive badges,
\- excessive shadow,
\- repeated colored surfaces,
\- tiny helper text everywhere,
\- heavy metric grids.
2.12 NO FAKE APP FEATURES
Do not add push notifications, API key management for store owners, native-app-only patterns,
or other features not supported by current product requirements merely because they seem modern.
\==============================================================================
03\. MASTER VISUAL LANGUAGE
\==============================================================================
3.1 VISUAL FORMULA
Warm Off-White Canvas
\+ White Surface
\+ Charcoal Text
\+ Warm Brown Primary Action
\+ Soft Beige Secondary Accent
\+ AI Purple
\+ Muted Semantic Colors
\+ Generous Whitespace
\+ Rounded Surfaces
\+ Minimal Shadow
\+ Quiet Icons
\+ Mobile-first Vertical Rhythm
3.2 AVOIDED AESTHETICS
Do not look like:
\- ERP,
\- POS back office,
\- corporate analytics dashboard,
\- developer console,
\- spreadsheet,
\- generic blue SaaS,
\- gaming interface,
\- flashy AI product,
\- glassmorphism-heavy concept app.
3.3 VISUAL DENSITY
Home: low density.
Sales: medium density, because it is operational input.
Coach: medium density with progressive disclosure.
Menu: medium density, scan-friendly.
More: low density.
Login: low density.
3.4 VISUAL PRIORITY ORDER
1\. Current context / page role
2\. Primary status or task
3\. AI guidance if relevant
4\. Primary action
5\. Supporting data
6\. Metadata
\==============================================================================
04\. DESIGN TOKENS — COLOR
\==============================================================================
4.1 CORE TOKENS
\--color-bg: #FAF8F6
\--color-surface: #FFFFFF
\--color-text-primary: #1F1F1F
\--color-text-secondary: #706A66
\--color-text-muted: #9C948E
\--color-primary-brown: #8B6F5B
\--color-primary-brown-soft: #A8866B
\--color-soft-beige: #DCC2A1
\--color-border: #ECE7E1
\--color-ai-purple: #7C6CF6
\--color-success: muted green family
\--color-warning: muted amber family
\--color-danger: muted red family
4.2 PRIMARY BROWN USAGE
Use for:
\- login primary CTA,
\- save buttons,
\- selected main action,
\- active nav state,
\- important operating CTA,
\- active bottom-navigation state.
Do not use for:
\- every icon,
\- AI badges,
\- errors,
\- decorative backgrounds across the entire app.
4.3 AI PURPLE USAGE
Use for:
\- AI Coach badge,
\- AI Insight icon,
\- AI-generated recommendation cue,
\- AI processing status,
\- AI-specific labels.
Do not use for:
\- ordinary save,
\- general navigation active states,
\- basic input focus,
\- menu CRUD,
\- ordinary KPI.
4.4 SEMANTIC COLOR RULE
Never communicate state through color only.
Combine:
Icon + label + color.
4.5 BACKGROUND RULE
Base canvas remains warm off-white.
White surfaces sit on top.
Avoid default gray SaaS backgrounds.
4.6 DARK HERO
The Home daily hero may use a dark charcoal surface as shown in the approved reference.
Dark hero must remain isolated and intentional.
Do not spread dark cards across the app.
4.7 GRADIENTS
Use minimally.
If used, only subtle within an approved hero or AI accent.
No decorative rainbow gradients.
\==============================================================================
05\. DESIGN TOKENS — TYPOGRAPHY
\==============================================================================
5.1 FONT
Primary: Pretendard or the closest currently established Korean/system sans stack.
Fallback must remain clean and modern.
5.2 TYPE SCALE
Display / Greeting:
28–32px, 700
Page Title:
24–28px, 700
Hero Metric:
24–32px, 700
Section Title:
18–20px, 600–700
Card Title:
15–17px, 600
Body:
14–16px, 400–500
Supporting:
13–14px, 400–500
Caption:
11–12px, 500
Micro Label:
10–11px only when non-essential.
5.3 WEIGHT RULE
700: page titles, key metric, greeting.
600: section title, CTA, row title.
500: labels and supporting controls.
400: body copy.
Avoid 800–900 except for exceptional numbers or brand lockup.
5.4 LINE HEIGHT
Display: 1.2–1.3
Body: 1.45–1.6
Caption: 1.35–1.45
5.5 COPY WIDTH
Do not let AI explanations run full-width in long dense paragraphs.
Use short sentences and readable line lengths.
5.6 NUMBER FORMATTING
Use tabular-feeling alignment where practical.
Display currency consistently.
Keep units visible.
Do not mix currency styles on the same screen.
5.7 KOREAN COPY
Short, direct, human.
Good:
“오늘 매출”
“매출 입력하기”
“AI 코치의 오늘 제안”
“다시 시도”
“메뉴를 추가해 주세요.”
Avoid:
bureaucratic phrasing,
developer terminology,
long system explanations.
\==============================================================================
06\. DESIGN TOKENS — SPACING, GRID, RADIUS, SHADOW
\==============================================================================
6.1 MOBILE WIDTH
Primary reference width: 390px.
Supported focus: 360–430px.
6.2 HORIZONTAL PADDING
Default: 20px.
Minimum: 16px.
Home / Coach may use 20–24px breathing room.
6.3 SPACING SCALE
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
Use this scale repeatedly.
Do not create random 13px, 17px, 23px values unless required for alignment.
6.4 SECTION SPACING
Major section: 28–36px.
Related block gap: 12–20px.
List row vertical padding: 14–16px.
Label to field: 6–8px.
6.5 RADIUS
Small control: 10–12px.
Button: 12–14px.
Input: 12–14px.
Small surface: 16px.
Standard card: 18–20px.
Hero: 20–24px.
Modal / bottom sheet: 24–26px.
Pill: 9999 only for actual chips/badges.
6.6 SHADOW
Level 0:
No shadow.
Level 1:
Very subtle surface separation.
Use for dock, selected floating surface, rare cards.
Level 2:
Modal / bottom sheet only.
No heavy drop shadow.
6.7 BORDERS
1px neutral border.
Warm neutral color.
Avoid dark outlines.
Avoid repeated box outlines if whitespace can separate content.
6.8 TOUCH TARGET
Minimum 44x44px interactive target.
Primary button visual height approximately 48–50px.
\==============================================================================
07\. ICONOGRAPHY & VISUAL SYMBOLS
\==============================================================================
7.1 STYLE
Simple line or compact filled icons.
No multicolor icon set.
No emoji dependency for core controls.
7.2 COLOR
Default icon: charcoal or muted.
Active operating icon: brown.
AI icon: purple only when semantically AI.
Danger: muted red.
7.3 SIZE
Bottom nav: visually \~18–22px.
List icons: \~18–20px inside 32–36px soft container.
Hero/AI emphasis icon: 20–28px.
7.4 MENU IMAGES
The approved Menu visual reference may contain food photography as illustrative decoration.
Current product does not require menu photos.
DO NOT add photo upload, image fields, or menu thumbnails unless separately specified.
7.5 LOGIN ARTWORK
Login may include light abstract/product illustration if easy to implement,
but it must not become required business content.
The page must still work cleanly without external illustration assets.
\==============================================================================
08\. MOTION SYSTEM
\==============================================================================
8.1 PRINCIPLE
Nothing jumps.
Everything glides.
8.2 TIMING
Preferred: 180–220ms.
Allowed: 150–250ms.
8.3 EASING
ease-out for entrance.
ease-in-out for controlled layout changes.
8.4 ALLOWED MOTION
\- fade,
\- small vertical slide,
\- accordion expand/collapse,
\- bottom sheet slide,
\- subtle scale 0.98 → 1.0,
\- button pressed feedback.
8.5 DISALLOWED MOTION
\- bounce,
\- long animation,
\- autoplay looping decoration,
\- excessive parallax,
\- spinning cards,
\- dramatic chart reveals,
\- attention-grabbing AI glow loops.
8.6 REDUCED MOTION
Respect prefers-reduced-motion when practical.
\==============================================================================
09\. COMPONENT LIBRARY — BUTTONS
\==============================================================================
9.1 PRIMARY BUTTON
Purpose:
Primary operating action.
Examples:
로그인
저장하기
매출 데이터 저장
메뉴 추가
적용하기
Specification:
Height: 48–50px
Radius: 12–14px
Horizontal padding: 18–20px
Text: 14–16px / 600
Background: Primary Brown
Text: White
Shadow: Level 0 or very light Level 1
Icon gap: 8px
States:
Default
Hover (desktop)
Pressed
Focus-visible
Disabled
Loading
Disabled:
Do not simply hide.
Use reduced opacity and no action.
Loading:
Keep button width stable.
Show spinner and preserve recognizable label.
9.2 SECONDARY BUTTON
White or soft neutral background.
Neutral border.
Dark text.
Examples:
취소
초기화
닫기
9.3 DANGER BUTTON
Use only for destructive actions.
Muted red.
Prefer red text or soft red surface before solid red fill.
9.4 GHOST BUTTON
Text/icon only.
Use for low-priority actions.
9.5 AI BUTTON
Purple is permitted only when the action itself triggers or represents AI.
Do not recolor ordinary actions purple.
9.6 ONE PRIMARY RULE
Within a single decision context, one dominant primary button.
Avoid two equal brown CTAs side by side.
9.7 BUTTON COPY
Verb-first.
Short.
No technical terms.
\==============================================================================
10\. COMPONENT LIBRARY — INPUTS & FORMS
\==============================================================================
10.1 TEXT INPUT
Height: \~48px.
Radius: 12–14px.
Border: 1px neutral.
Background: white or very light warm surface.
Text: 14–16px.
Label above input, not placeholder-only.
10.2 NUMERIC INPUT
Use inputmode numeric/decimal where applicable.
Keep currency/unit visible.
Do not make numeric inputs tiny.
Right alignment optional if consistent.
10.3 TEXTAREA
Minimum comfortable height.
Used for notes/special notes.
Do not over-style.
10.4 FOCUS
Visible warm-brown focus ring/border.
Must be keyboard-accessible.
10.5 ERROR
Show:
what is wrong + what user should do.
Bad:
INVALID\_VALUE
Good:
“0보다 큰 금액을 입력해 주세요.”
10.6 DROPDOWN
Prefer native select or mobile-friendly bottom sheet.
Avoid complex desktop dropdown frameworks.
10.7 DATE SELECTOR
Compact, clear.
Current selected date always visible.
Preserve existing date behavior.
10.8 SEARCH
Full-width compact rounded input.
Search icon optional.
Live filtering acceptable when current logic supports it.
10.9 FORM LAYOUT
Mobile:
One column by default.
Two-column allowed only for small numeric pairs and when tap targets remain comfortable.
\==============================================================================
11\. COMPONENT LIBRARY — CARDS & SURFACES
\==============================================================================
11.1 STANDARD SURFACE
White surface.
18–20px radius.
1px neutral border.
Minimal/no shadow.
Internal padding 18–24px.
11.2 HERO CARD
Used for the single most important summary.
Home dark daily hero is the signature example.
11.3 AI CARD
White or very soft surface.
Purple cue only.
Contains:
AI label/icon
short judgment
supporting reason
optional CTA.
11.4 ACTION LIST CARD
Multiple action rows grouped in one white surface.
Do not make each row a separate floating card.
11.5 METRIC CARD
Use sparingly.
Coach may use compact metric blocks as evidence, not as dashboard decoration.
11.6 NO CARD INSIDE CARD
Avoid nested card-on-card unless it is a deliberate state block.
Prefer whitespace.
11.7 CARD COUNT
If a viewport shows more than 4–5 independent cards,
reassess whether some should become sections or grouped rows.
\==============================================================================
12\. COMPONENT LIBRARY — BADGES, CHIPS, TABS, SEGMENTS
\==============================================================================
12.1 BADGE
Use for meaningful status only.
Examples:
AI
자동 계산
입력 중
NEW when actually needed
12.2 CHIP
Used for compact filters.
Selected chip may use brown.
Unselected: white + neutral border.
12.3 SEGMENT CONTROL
Used for compact mode/period switching.
Examples:
오늘 / 이번 주 / 이번 달
Selected:
white raised surface or brown text,
depending on surrounding background.
12.4 TAB RULE
Do not create secondary tab systems that compete with the primary bottom dock unless needed.
12.5 BADGE OVERUSE
Do not label everything.
If a badge does not change user understanding, remove it.
\==============================================================================
13\. COMPONENT LIBRARY — ACCORDION & PROGRESSIVE DISCLOSURE
\==============================================================================
13.1 PURPOSE
Reduce vertical overload while preserving access.
13.2 SALES USE
Menu categories can be accordion sections.
Only required categories need to be open.
13.3 COACH USE
Period Analysis
Menu Engineering
Boost Plan
may be summarized and expanded.
13.4 HEADER
Title
short metadata
chevron
13.5 MOTION
180–220ms expand/collapse.
13.6 STATE
Expanded state must be visually obvious.
Do not use a hidden tiny caret only.
13.7 ACCESSIBILITY
Button semantics.
aria-expanded.
Keyboard operable.
\==============================================================================
14\. COMPONENT LIBRARY — MODAL, BOTTOM SHEET, TOAST
\==============================================================================
14.1 MODAL
Use for important confirmation only.
Examples:
destructive delete confirmation,
high-impact irreversible action.
14.2 BOTTOM SHEET
Preferred mobile pattern for:
\- menu edit,
\- menu add,
\- selection,
\- compact detail flow,
\- confirmation on mobile.
Radius top corners: 24–26px.
Backdrop subtle.
14.3 TOAST
Used for short success/failure feedback.
Examples:
저장되었습니다.
메뉴가 추가되었습니다.
다시 시도해 주세요.
Keep brief.
Do not replace persistent validation with toast.
14.4 BROWSER ALERT/CONFIRM
Do not use browser alert(), confirm(), or prompt() in V4 UI.
\==============================================================================
15\. COMPONENT LIBRARY — LOADING, EMPTY, ERROR
\==============================================================================
15.1 LOADING PRINCIPLE
Prefer skeleton or local progress over full-screen spinner.
15.2 EMPTY PRINCIPLE
An empty state should explain:
what is missing,
why it matters,
what to do next.
15.3 ERROR PRINCIPLE
Human-friendly.
Actionable.
No raw stack traces or API codes.
15.4 GLOBAL STATE TYPES
Loading
No Data
Search Empty
OCR Error
AI Error
Network Error
Permission/Access Error
Save Error
Validation Warning
15.5 ERROR COLORS
Muted red, not aggressive bright red.
Icon + title + supporting text + retry/action.
15.6 OCR ERROR COPY
Example:
“영수증 정보를 충분히 읽지 못했어요.
사진을 다시 확인하고 스캔해 주세요.”
15.7 AI ERROR COPY
Example:
“AI 분석을 완료하지 못했어요.
잠시 후 다시 시도해 주세요.”
15.8 NETWORK ERROR
Do not blame the user.
Offer retry.
15.9 SEARCH EMPTY
“검색 결과가 없습니다.”
Offer clear-filter action if useful.
15.10 MENU EMPTY
“아직 등록된 메뉴가 없습니다.”
CTA: 메뉴 추가.
15.11 SALES EMPTY
“아직 이 날짜의 매출 데이터가 없습니다.”
CTA: 매출 입력.
15.12 COACH EMPTY
If insufficient data:
explain what must be entered before analysis becomes available.
\==============================================================================
16\. PRIMARY NAVIGATION — OPERATING DOCK
\==============================================================================
16.1 ORDER
Coach / Sales / Home / Menu / More
This order is fixed unless separately approved.
16.2 SHARED DOCK
All five items belong to a single calm white dock surface.
16.3 HOME CENTER
Home is the visual anchor.
Slightly raised or emphasized with brown.
Do not turn into an oversized FAB.
16.4 ACTIVE STATE
Active tab:
brown emphasis.
Inactive:
muted neutral.
AI tab does NOT become purple merely because it is Coach.
16.5 SAFE AREA
Respect mobile safe-area inset.
16.6 VISIBILITY
Screen references should normally show the bottom dock.
If a visual reference accidentally omits it, that omission does not mean navigation should be removed.
16.7 ROUTING
Preserve existing routing/page-key behavior.
Visual labels may be modernized only if current product terminology remains correct.
16.8 NAVIGATION ROLE
Home = daily brief
Sales = data input
Coach = analysis/action
Menu = master data management
More = support/settings
\==============================================================================
17\. NAVIGATION & USER FLOW
\==============================================================================
17.1 CORE FLOW
Login
→ Home
→ Sales Input
→ Save
→ Home refreshed
→ Coach
→ Menu if master data needs maintenance
→ More for support/settings
17.2 DAILY FLOW
Open
→ Understand today
→ Identify action
→ Enter/update sales
→ Review coaching
→ Act
17.3 HOME ACTION LINKS
Home action rows can deep-link to:
Sales input
OCR entry
Coach
Preserve existing callback/navigation behavior.
17.4 BACK NAVIGATION
Use natural browser/app navigation.
Do not introduce custom dead ends.
17.5 DEEP LINK RULE
If current app supports direct route/page state, preserve it.
17.6 NO DUPLICATED RESPONSIBILITY
Do not place Menu Engineering inside Menu management.
Do not place API key management inside More for store owners.
Do not turn Home into a Coach report.
Do not turn Sales into analytics.
\==============================================================================
18\. LOGIN SCREEN BLUEPRINT
\==============================================================================
18.1 ROLE
Login should feel like the entry to the same premium, warm product.
18.2 VISUAL STRUCTURE
Warm background
→ brand/product header
→ concise welcome statement
→ login form
→ primary login CTA
→ optional secondary account/help actions if currently supported
→ lightweight product benefit/supporting area
18.3 AUTHENTICATION
Do not change current auth logic.
Do not change credential semantics.
Do not invent social login unless it already exists.
18.4 INPUTS
ID/email/username field according to current implementation.
Password field.
Visible labels.
Password show/hide allowed if simple.
18.5 PRIMARY CTA
Brown.
Full-width.
\~48–50px height.
18.6 SECONDARY ACTIONS
Keep visually quieter.
Do not compete with login.
18.7 ERROR
Inline human-readable error near form.
Avoid browser alert.
18.8 MOBILE
Center within viewport with generous breathing room.
18.9 DESKTOP
Do not create a large enterprise split dashboard.
Center or gently scale the mobile login composition.
18.10 VISUAL REFERENCE NOTE
The approved login image defines tone and hierarchy,
not new authentication features.
\==============================================================================
19\. HOME SCREEN BLUEPRINT
\==============================================================================
19.1 SCREEN ROLE
Home = Daily Brief.
Not Dashboard.
Not Analytics Overview.
19.2 USER GOAL
Within seconds:
\- know today's state,
\- know if attention is needed,
\- see one AI suggestion,
\- choose the next action.
19.3 TOP-TO-BOTTOM STRUCTURE
1\. Greeting / context
2\. Daily Hero
3\. AI Coach Insight
4\. Today's Actions
5\. Bottom Operating Dock
19.4 GREETING
Time-aware or existing greeting behavior.
Store owner name if current data provides it.
Selected date/store context may appear subtly.
Do not add a traditional app header that pushes greeting down if reference intentionally begins with greeting.
19.5 DAILY HERO
Signature dark card.
Prioritize:
\- today sales,
\- orders,
\- monthly cumulative or goal progress where current data supports it,
\- goal progress,
\- current achievement.
Goal editing must preserve current goal-save behavior.
Do not split into four KPI cards.
19.6 HERO COLOR
Dark charcoal.
Warm brown/beige progress accents.
White text.
Use only here or in similarly justified signature surface.
19.7 AI COACH INSIGHT
One concise insight.
Structure:
AI label
→ current observation
→ supporting reason
→ optional link to Coach.
Purple only for AI cues.
19.8 TODAY'S ACTIONS
iOS-style grouped action rows.
Recommended action examples based on current functions:
매출 입력
영수증 스캔
AI 코치 보기
Each row:
icon
title
supporting line optional
chevron.
19.9 NO-DATA HOME
If no selected-day sales data:
hero still exists with 0 / no-data language,
primary action points to Sales.
19.10 NAVIGATION
Dock visible.
All five tabs share one baseline; Home is highlighted only when Home is the current page.
19.11 DENSITY
Low.
No chart grid.
No long report.
19.12 CODEX PRESERVATION
Keep:
existing callbacks,
goal-save behavior,
selected date behavior,
sales comparison data,
navigation callbacks,
AI insight source.
Change:
presentation only.
\==============================================================================
20\. SALES INPUT SCREEN BLUEPRINT
\==============================================================================
20.1 SCREEN ROLE
Sales = Input Workspace.
The goal is fast, accurate daily entry.
20.2 USER GOAL
Enter/review today's operational data with minimum friction,
optionally use OCR,
verify totals,
save.
20.3 FUNCTIONAL CONTRACT TO PRESERVE
Preserve current verified inputs and behavior, including:
\- selected date,
\- POS total sales,
\- delivery sales,
\- visitor count,
\- order count,
\- notes/special notes,
\- OCR-assisted receipt workflow,
\- menu quantity input,
\- entered sales total,
\- menu sales total,
\- difference/reconciliation,
\- save,
\- reset,
\- current persistence callbacks,
\- current calculation rules.
20.4 TOP-TO-BOTTOM V4 STRUCTURE
1\. Sales header / selected date
2\. Daily input summary
3\. Basic Sales Information
4\. OCR assist embedded into entry workflow
5\. Sales Reconciliation / Validation
6\. Menu Sales Quantity
7\. Sticky bottom actions
8\. Bottom Operating Dock
20.5 IMPORTANT OCR POSITIONING
OCR is an assistive tool, not the main purpose of the page.
The V4 preferred presentation:
Basic Sales Information
→ “영수증으로 자동 입력” assist block
→ review/validation
→ menu quantity.
Do not make the page feel like an OCR app.
20.6 DAILY SUMMARY
Compact dark or strong summary surface may be used if consistent with reference.
Show current input status:
sales total
orders
visitors
optional progress.
Do not invent a progress percentage if the real product has no meaningful way to calculate it.
If the mockup shows progress decoratively but code has no source, omit or use a non-functional visual only if explicitly approved.
20.7 BASIC SALES INFORMATION
Use large mobile-friendly fields.
Avoid dense tables.
20.8 MENU QUANTITY
Use category accordions.
Do not show every menu row expanded by default if the list is long.
Each row:
menu name
price if currently shown/useful
quantity control(s)
calculated amount if existing.
Do not add menu photos.
20.9 QUANTITY CONTROL
Use existing input behavior.
Stepper presentation may be used if it does not break current channel-specific fields.
If current data distinguishes dine-in/takeout or other channels, preserve those fields even if the image simplifies them.
20.10 RECONCILIATIONShow:
entered total
menu total
difference
status.
Use calm semantic treatment.
Warning does not need aggressive red.
20.11 SAVE
Sticky bottom action allowed.
Primary: brown “매출 데이터 저장”.
Secondary: reset.
Preserve existing save/reset semantics.
20.12 VALIDATION
Inline.
Actionable.
Do not block without explanation.
20.13 OCR STATES
Idle
Selecting/uploading
Scanning
Review
Warning
Apply
Success
Retry
20.14 LONG RECEIPTS
If current OCR supports multiple images for one receipt,
present this as “one receipt, multiple sections” rather than unrelated files.
20.15 CODEX RULE
Do not modify sales formulas, OCR contracts, persistence, or API logic during this visual redesign.
\==============================================================================
21\. COACH SCREEN BLUEPRINT
\==============================================================================
21.1 SCREEN ROLE
Coach = Understand + Act.
It interprets data and connects it to operating decisions.
21.2 RESPONSIBILITY
Coach owns:
\- AI Insight,
\- deterministic KPI interpretation,
\- period analysis,
\- Menu Engineering,
\- recommendations,
\- Boost Plan.
These must NOT be moved into Menu management.
21.3 TOP-TO-BOTTOM STRUCTURE
1\. Coach header
2\. Date / period selector
3\. Today's AI Coach summary
4\. Evidence KPIs
5\. Period Analysis
6\. Menu Engineering
7\. Boost Plan
8\. Bottom Operating Dock
21.4 TODAY'S AI COACH
Primary content:
judgment
→ reason
→ recommendation
→ expected effect only if actual logic provides/supports it.
If expected effect is not generated by current business logic, do not invent numeric promises.
21.5 AI SUMMARY LENGTH
One main statement.
Short supporting explanation.
Detailed report behind “자세히 보기” or progressive disclosure.
21.6 KPI EVIDENCE
Metrics should support the AI interpretation.
Examples:
today sales
orders
average ticket
visitors
conversion rate if actually calculated.
Do not turn this into a dashboard grid.
21.7 PERIOD ANALYSIS
Collapsed summary first.
Expand for detail.
Preserve current period filter/date behavior.
21.8 MENU ENGINEERING
Display existing categories from current implementation.
Do not rename or normalize categories without verifying code/business terminology.
If current implementation includes Star / Cash Cow / Puzzle / Dog / no-cost states,
preserve them.
Do not move editing controls here.
Coach analyzes; Menu manages source data.
21.9 BOOST PLAN
Show as analysis/recommendation output.
Do not add task completion checkboxes or persistence unless current functionality supports it.
21.10 AI COLOR
Purple cues only.
The rest remains brown/neutral.
21.11 FAILURE STATE
If AI generation fails:
keep deterministic metrics visible if available,
show local error in AI section,
offer retry.
21.12 INSUFFICIENT DATA
Explain what data is missing.
CTA can link to Sales or Menu as appropriate.
21.13 CODEX RULE
Do not rewrite AI prompts, Gemini models, Menu Engineering formulas, or Boost Plan logic as part of UI migration.
\==============================================================================
22\. MENU MANAGEMENT SCREEN BLUEPRINT
\==============================================================================
22.1 SCREEN ROLE
Menu = Menu Master Data Management.
This distinction is absolute.
22.2 CURRENT OPERATING PURPOSE
The store owner must be able to immediately respond when:
\- menu name changes,
\- menu price changes,
\- menu cost changes,
\- a menu is added,
\- a menu is removed.
22.3 CORE MANAGED DATA
Primary editable data:
\- Menu Name
\- Price
\- Cost
If current code also persists required category/order/active metadata,
preserve it, but do not visually turn the screen into analytics.
22.4 WHAT DOES NOT BELONG HERE
Do NOT place:
\- AI Insight,
\- Menu Engineering,
\- Star/Puzzle/etc analysis,
\- Boost Plan,
\- sales trend charts,
\- recommendation panels.
Those belong to Coach.
22.5 TOP-TO-BOTTOM STRUCTURE
1\. Menu header
2\. compact menu count / management summary
3\. Add Menu CTA
4\. Search
5\. Category filter if current data supports category
6\. Read-first menu list
7\. Edit/Add bottom sheet or detail form
8\. Delete confirmation
9\. Bottom Operating Dock
22.6 MENU LIST
Text-first.
No food photos.
Each row/card:
Menu Name
Price
Cost
Chevron/edit affordance
Optional computed cost rate may be displayed if useful,
but it is derived, not a primary editable field.
22.7 READ FIRST, EDIT ON REQUEST
Default:
scan the list.
Tap row:
open edit state.
22.8 ADD MENU
Clear CTA.
Do not use oversized floating FAB.
Fields:
Menu Name
Price
Cost
and any currently required category/metadata.
22.9 EDIT MENU
Edit only verified master fields.
Save with brown primary CTA.
22.10 DELETE
Destructive confirmation required.
Use modal/bottom sheet.
Avoid browser confirm.
22.11 DELETE COPY
Explain real product effect accurately.
Do not claim physical database deletion if current code actually deactivates.
Use behavior-specific copy based on code.
22.12 SEARCH
Live menu-name search is encouraged if current architecture supports it without logic risk.
If not existing, do not add as business behavior without explicit approval.
22.13 MENU IMAGES
Strictly no photo feature in V4 implementation unless separately requested.
The image in the visual guide is illustrative only.
22.14 CODEX RULE
Menu is the source of truth for master data.
Coach is the source of interpretation.
Never merge them.
\==============================================================================
23\. MORE SCREEN BLUEPRINT
\==============================================================================
23.1 SCREEN ROLE
More = Quiet Support Area.
Not a junk drawer.
Not a developer settings page.
23.2 STORE OWNER SCOPE
Only expose settings the store owner should control.
23.3 V4 CONTENT
Store Context
Guided Tour / Quick Help
AI Analysis Notice
App Information
Logout
23.4 DO NOT EXPOSE
API Keys
Service Role Keys
Gemini API Keys
Supabase credentials
Developer options
System secrets
23.5 ENVIRONMENT SETTINGS
Keep basic.
Recommended:
\- language, if localization is actually supported/planned,
\- display mode only if current web implementation supports it cleanly.
Do not pretend native-app capabilities exist.
23.6 NOTIFICATIONS
This product is URL-based web.
Do not include push notification settings in V4 by default.
Web push may be technically possible in future,
but it is not part of the baseline More screen.
23.7 HELP
Potential help topics:
\- 시작하기
\- 매출 입력 방법
\- 영수증 스캔 방법
\- AI Coach 사용 방법
\- 메뉴 관리 방법
\- FAQ
If these are placeholders, keep them clearly as support placeholders or implement only when requested.
23.8 APP INFORMATION
Product name
Version
23.9 LOGOUT
Separated at bottom.
Danger text/soft surface.
Do not use huge solid red block.
23.10 BOTTOM NAV
More active.
\==============================================================================
24\. EMPTY / LOADING / ERROR STATE SPECIFICATION
\==============================================================================
24.1 DESIGN GOAL
State screens should feel like part of the same product,
not default browser/system messages.
24.2 EMPTY STATE ANATOMY
Icon
Title
Short explanation
Optional primary action
Optional secondary action
24.3 LOADING STATE ANATOMY
Context-preserving skeleton or progress.
Keep page frame/navigation stable where possible.
24.4 ERROR STATE ANATOMY
Semantic icon
Plain-language title
What happened
What user can do
Retry or route action
24.5 HOME STATES
No sales:
show Daily Brief shell,
0/no-data state,
action to Sales.
Goal missing:
show subtle set-goal action if current product supports it.
24.6 SALES STATES
No menu:
explain menu master must be set up,
link to Menu if current routing supports it.
OCR failure:
show retry/manual fallback.
Save failure:
preserve entered data,
do not wipe form.
24.7 COACH STATES
AI failure:
retain deterministic metrics.
Only AI section enters error state.
Insufficient sales history:
explain requirements.
24.8 MENU STATES
No menu:
simple empty state + Add Menu.
Search no result:
clear filter/search option.
24.9 MORE STATES
Most More rows are static/supportive.
Avoid unnecessary loading placeholders.
24.10 LOGIN STATES
Invalid credentials:
inline message.
Network:
retry.
Submitting:
button loading state.
\==============================================================================
25\. UI RULES — GLOBAL BEHAVIOR
\==============================================================================
25.1 ONE SCREEN, ONE PURPOSE
Never mix analysis + configuration + data entry without clear boundaries.
25.2 ONE PRIMARY CTA
Primary visual action must be obvious.
25.3 MOBILE-FIRST SCROLL
Vertical scroll is acceptable.
Horizontal scrolling is not for core content.
25.4 TABLE AVOIDANCE
Do not use table-first UI on mobile.
Convert to list/card/row structures.
25.5 STICKY ACTIONS
Allowed when:
\- form is long,
\- save must remain available,
\- it does not cover content.
25.6 FIXED BOTTOM DOCK
Account for dock height in content bottom padding.
25.7 NO BROWSER DIALOGS
No alert/confirm/prompt.
25.8 FOCUS & KEYBOARD
Keep visible focus.
Inputs work with keyboard.
Escape can close modal/sheet where appropriate.
25.9 DATA LOSS PREVENTION
UI redesign must not accidentally reset form state during navigation or accordions.
25.10 DEFAULT STATES
Do not default every accordion open.
Do not default every advanced report expanded.
25.11 COPY
Short.
Operational.
Warm.
No developer jargon.
25.12 VISUAL CONSISTENCY
Same component must look the same across screens.
\==============================================================================
26\. RESPONSIVE WEB RULES
\==============================================================================
26.1 PRIMARY EXPERIENCE
Mobile web.
26.2 MOBILE
360–430px:
single-column.
full attention on current task.
bottom dock fixed/safe.
26.3 TABLET
Preserve mobile information architecture.
Increase breathing room.
Do not add extra dashboard columns by default.
26.4 DESKTOP
Center the store-owner experience in a controlled max-width container.
May use wider spacing.
Do not transform into desktop admin software.
26.5 HEIGHT
Consider short mobile screens.
Sticky actions must not obscure fields.
26.6 SAFE AREA
Use env(safe-area-inset-bottom) where appropriate.
26.7 VIEWPORT
Avoid 100vh bugs on mobile browser chrome.
Use modern viewport units if compatible.
26.8 INPUT ZOOM
Keep font sizes sufficient to avoid undesirable mobile zoom behavior.
\==============================================================================
27\. ACCESSIBILITY
\==============================================================================
27.1 TOUCH TARGET
44px minimum.
27.2 CONTRAST
Primary text high contrast.
Muted text must remain readable.
Do not place low-contrast beige text on beige surfaces.
27.3 COLOR
No color-only status.
27.4 FOCUS
Visible keyboard focus.
27.5 SEMANTICS
Buttons are buttons.
Navigation uses nav.
Accordion buttons expose state.
Modal/sheet manages focus when practical.
27.6 LABELS
Every form control has a visible or accessible label.
27.7 ICON BUTTONS
aria-label required.
27.8 MOTION
Respect reduced motion when practical.
27.9 LANGUAGE
Set document language appropriately for Korean UI.
\==============================================================================
28\. COPYWRITING SYSTEM
\==============================================================================
28.1 TONE
Warm
Short
Helpful
Direct
Non-technical
28.2 AI TONE
Confident but not absolute.
Explain evidence.
Avoid overpromising.
28.3 ERROR TONE
Calm.
Actionable.
No blame.
28.4 BUTTON LABELS
Verb-first.
Examples:
로그인
저장하기
메뉴 추가
다시 시도
AI 코치 보기
매출 입력하기
영수증 스캔
28.5 HOME
Avoid:
Dashboard
Overview
System Summary
Prefer:
오늘 매출
오늘의 제안
오늘 할 일
28.6 COACH
Avoid:
complex analytics jargon unless already part of business terminology.
28.7 MENU
Use master-data language.
Avoid AI words.
28.8 MORE
Quiet, utility-oriented language.
\==============================================================================
29\. CODEX IMPLEMENTATION CONSTITUTION
\==============================================================================
29.1 DO NOT REORGANIZE THE PRODUCT WITHOUT NEED
Do not rename major folders.
Do not move business logic simply for UI cleanup.
Do not replace routing.
Do not replace state management.
Do not introduce a new design framework without approval.
29.2 SHARED UI COMPONENTS
Create/reuse shared primitives where practical:
Button
Input
Card
Badge
Chip
SegmentControl
BottomNavigation
Modal
BottomSheet
Toast
Accordion
ProgressBar
ListItem
LoadingState
EmptyState
ErrorState
DateSelector
29.3 AVOID DUPLICATION
Do not create five different brown button implementations.
Do not copy/paste shadows/radii/colors across pages.
29.4 DESIGN TOKENS
Centralize colors, spacing, radius, shadow when practical.
Prefer CSS variables / existing token mechanism.
29.5 CSS RULE
Avoid uncontrolled inline styles.
Avoid page-specific hardcoded design values when a shared token exists.
Do not introduce random values.
29.6 BUSINESS LOGIC ISOLATION
UI components should receive data/callbacks.
Do not embed new business rules into purely visual primitives.
29.7 NO MOCK BUSINESS DATA IN PRODUCTION
Visual reference numbers are illustrative.
Use actual app data.
Do not hardcode reference values.
29.8 IMAGE REFERENCES
Do not hardcode decorative reference-image content.
Use current assets or omit decoration if not needed.
29.9 CURRENT CALLBACKS
Preserve existing save, reset, OCR, goal, navigation, edit, delete, AI callbacks.
29.10 CURRENT ROUTES
Preserve current route/page semantics.
Visual labels can be refined only when product meaning remains unchanged.
29.11 FAILURE TO CONFIRM
If implementation detail is unclear from code:
do not invent.
Report “NOT CONFIRMED” before behavior-changing work.
\==============================================================================
30\. SCREEN-BY-SCREEN FUNCTION PRESERVATION MATRIX
\==============================================================================
LOGIN
Preserve:
authentication method,
credential submission,
error behavior,
session creation,
redirect behavior.
Change:
visual layout only.
HOME
Preserve:
selected-date context,
sales summary data,
goal-save behavior,
AI insight source,
action navigation.
Change:
Daily Brief presentation.
SALES
Preserve:
all existing fields,
OCR,
calculations,
menu quantities,
save/reset,
persistence,
validation.
Change:
form hierarchy and component presentation.
COACH
Preserve:
current deterministic metrics,
AI generation,
period analysis,
Menu Engineering,
Boost Plan,
existing filters.
Change:
progressive disclosure and visual hierarchy.
MENU
Preserve:
menu master persistence,
menu name,
price,
cost,
add/edit/delete or deactivate behavior,
required metadata.
Change:
read-first V4 management UI.
Do not add:
AI analysis,
menu photos.
MORE
Preserve:
current functional actions.
Remove from store-owner presentation:
API key controls if present only as developer/placeholder functionality.
Do not add:
web push settings unless separately approved.
NAVIGATION
Preserve:
routing behavior.
Change:
unified V4 dock styling.
STATES
Preserve:
actual error/loading conditions.
Change:
human-friendly V4 state components.
\==============================================================================
31\. IMAGE-TO-IMPLEMENTATION MATCHING RULES
\==============================================================================
31.1 LOGIN IMAGE
Match:
warm canvas,
centered/contained structure,
brown CTA,
rounded form controls,
calm visual hierarchy.
Do not infer:
new auth providers,
native app behavior.
31.2 HOME IMAGE
Match:
greeting-first,
dark daily hero,
single AI insight,
iOS-like action list,
unified dock.
31.3 SALES IMAGE
Match:
structured sales form,
OCR as assist,
reconciliation,
accordion/list menu quantities,
sticky actions,
warm/neutral surfaces.
Do not infer:
photo upload features beyond existing OCR.
31.4 COACH IMAGE
Match:
AI-first judgment,
evidence,
recommendation,
progressive sections,
purple AI cues.
Do not infer:
task completion persistence.
31.5 MENU IMAGE
Match:
clean master-data list,
add/edit/delete states,
price/cost emphasis.
IGNORE FOOD PHOTOS AS FUNCTIONAL REQUIREMENT.
31.6 MORE IMAGE
Match:
quiet settings/help layout,
app info,
logout,
More active in dock.
31.7 COMPONENT IMAGE
Use as reusable component style reference.
31.8 NAVIGATION IMAGE
Use as primary route/flow visual reference.
Text instructions override any accidental mismatch in illustration.
31.9 DESIGN TOKEN IMAGE
Use for tone and relative token system.
Exact numeric values in this document are the implementation baseline when the image cannot be measured reliably.
31.10 STATE IMAGE
Use for Empty / Loading / Error composition and tone.
31.11 UI RULES IMAGE
Use for spacing, dimensions, interaction, consistency.
This document has priority when tiny image text is unreadable.
\==============================================================================
32\. DESIGN QA CHECKLIST
\==============================================================================
Before a screen is considered PASS:
VISUAL
□ Warm off-white canvas used correctly.
□ Brown is the main operating action color.
□ Purple is limited to AI semantics.
□ Typography hierarchy matches V4.
□ Radius is consistent.
□ Shadows are subtle.
□ Borders are warm/neutral.
□ Whitespace is sufficient.
□ No ERP/dashboard feeling.
□ No unnecessary cards.
□ No bright-blue default theme.
□ No oversized FAB.
FUNCTIONAL
□ Existing callbacks still fire.
□ Existing routes still work.
□ Existing persistence still works.
□ Existing calculations unchanged.
□ OCR unchanged logically.
□ AI unchanged logically.
□ Menu CRUD unchanged logically.
□ Goal-save unchanged logically.
□ No business feature was removed due to image omission.
MOBILE
□ 360px usable.
□ 390px visually close to reference.
□ 430px comfortable.
□ Bottom dock does not cover content.
□ Sticky save does not cover fields.
□ Touch targets >=44px.
ACCESSIBILITY
□ Labels present.
□ Focus visible.
□ Icon buttons labeled.
□ Color is not sole status signal.
STATE
□ Loading exists where needed.
□ Empty exists where needed.
□ Error is actionable.
□ No browser alert/confirm.
QUALITY
□ No console errors.
□ No TypeScript errors.
□ No temporary hardcoded demo values.
□ No duplicated ad-hoc components.
□ No mojibake.
\==============================================================================
33\. ACCEPTANCE CRITERIA FOR THE V4 REDESIGN
\==============================================================================
The redesign is complete only when:
1\. Login visually belongs to the same V4 product.
2\. Home feels like a Daily Brief, not a dashboard.
3\. Sales feels faster even though all required fields remain.
4\. OCR is supportive rather than dominant.
5\. Coach prioritizes judgment → evidence → action.
6\. Menu is clearly a master-data management screen.
7\. Menu Engineering remains inside Coach.
8\. More remains quiet and store-owner appropriate.
9\. Bottom navigation is unified and consistent.
10\. Empty/loading/error states are visually designed, not browser defaults.
11\. Component styling is reusable.
12\. Design tokens are centralized where practical.
13\. Mobile experience is primary.
14\. Desktop does not become an unrelated admin redesign.
15\. Existing business behavior remains intact.
16\. The result resembles the approved 11 visual references closely enough that
    a reviewer can immediately recognize the same design system.
\==============================================================================
34\. DO / DON'T MASTER LIST
\==============================================================================
DO
\- Use warm canvas.
\- Use white surfaces.
\- Use charcoal text.
\- Use warm brown for operating actions.
\- Use purple only for AI.
\- Keep screens calm.
\- Keep one primary purpose per screen.
\- Use one primary CTA per context.
\- Use Daily Brief structure on Home.
\- Use progressive disclosure on Coach.
\- Use accordions for long Sales menu input.
\- Use read-first Menu management.
\- Keep menu photos out unless explicitly required.
\- Keep API secrets out of store-owner More.
\- Use human error copy.
\- Use bottom sheets/modals instead of browser dialogs.
\- Preserve current functional contracts.
\- Use real data, not image demo values.
\- Verify mobile first.
DON'T
\- Rebuild as ERP.
\- Rebuild as desktop dashboard.
\- Add bright blue theme.
\- Add heavy shadows.
\- Add excessive gradients.
\- Add too many cards.
\- Put Purple everywhere.
\- Put Menu Engineering in Menu.
\- Put AI Insight in Menu.
\- Add menu image upload.
\- Add push notification settings by default.
\- Expose API keys to store owners.
\- Rewrite business logic during UI pass.
\- Replace routing unnecessarily.
\- Invent new calculations.
\- Invent task persistence for Boost Plan.
\- Remove existing functionality because it is absent in a reference image.
\==============================================================================
35\. FINAL CODEX HANDOFF INSTRUCTIONS
\==============================================================================
Codex must treat this file as a production implementation specification.
Recommended execution order:
PHASE 0 — READ-ONLY AUDIT
\- inspect current source,
\- map screens/files/functions,
\- identify reusable current components,
\- identify style entry points,
\- confirm business functions.
PHASE 1 — TOKENS / SHARED PRIMITIVES
\- color tokens,
\- spacing,
\- radius,
\- typography,
\- shared buttons/inputs/cards,
\- bottom navigation,
\- state components.
PHASE 2 — LOGIN
\- presentation only,
\- auth unchanged.
PHASE 3 — HOME
\- Daily Brief.
PHASE 4 — SALES
\- input hierarchy,
\- OCR assist,
\- accordion menu,
\- reconciliation,
\- sticky save.
PHASE 5 — COACH
\- AI judgment,
\- evidence,
\- progressive disclosure.
PHASE 6 — MENU
\- master management only.
PHASE 7 — MORE
\- quiet support/settings.
PHASE 8 — STATES
\- empty/loading/error.
PHASE 9 — POLISH
\- spacing,
\- accessibility,
\- responsive,
\- animation.
IMPLEMENTATION BEHAVIOR
Do not make git commits unless explicitly instructed by the user.
Do not modify unrelated files.
Do not change API/DB/business logic without separate approval.
After each meaningful implementation phase:
\- run TypeScript validation,
\- run build,
\- inspect changed files,
\- report functional preservation.
This section records the CURRENT VERIFIED V4 implementation state.
If an older implementation-status note in this document conflicts with this section,
THIS SECTION WINS for presentation status.
The original visual/product rules above remain authoritative.
31.1 IMPLEMENTATION MATURITY
Current status:

- Home V4: active
- Sales V4: active and guide-aligned
- Coach V4: active and compacted
- Menu V4: active and guide-aligned
- More V4: active
- Bottom Navigation V4: active
- Login: preserve current V4 direction; no new business behavior required

The current product is visually suitable for demo and a controlled one-store pilot.
31.2 GLOBAL VISUAL REFERENCE AFTER IMPLEMENTATION
The most successful implemented density reference is the current Boost Plan presentation:

- compact body type,
- warm brown operating CTA,
- thin warm borders,
- small metadata,
- low vertical waste,
- clear action hierarchy.

Subsequent Coach/Sales/Menu compaction should remain compatible with this density.
Do not interpret this as permission to make every screen identical.
Screen responsibility still controls composition.
31.3 HOME — CURRENT V4 STATE
Home remains Daily Brief.
Current screen behavior includes:

- current date/store context,
- today KPI summary,
- monthly/goal context where available,
- concise AI Coach Insight,
- Today's Actions,
- bottom dock.

Home task actions may be:

- manually checked by the user,
- automatically marked complete when the corresponding real task is completed.

Examples:

- successful Sales save can complete "매출 입력하기",
- completed OCR-assisted entry can complete the OCR task when the product logic supports it.

Home actions must land on ACTIVE Sales V4 DOM:

- manual Sales → Basic Sales Info,
- OCR → OCR section.

Do not reintroduce unreachable legacy landing targets.
31.4 SALES — IMPLEMENTED GUIDE FIDELITY
The current Sales screen now follows the approved Sales Input reference.
Section order is fixed:

1. compact Header / Date
2. 오늘 요약
3. 기본 매출 정보
4. 영수증 자동입력 (OCR)
5. 매출 맞춤 확인
6. 메뉴 판매량 입력
7. Sticky 초기화 / 저장하기

Daily Summary:

- four compact columns,
- today sales,
- orders,
- visitors,
- input progress,
- thin separators,
- progress bar.

Basic Sales:

- label-left / input-right,
- compact numeric rows,
- note remains larger but restrained.

OCR:

- compact receipt icon,
- warm-brown Scan/Upload CTA,
- progressive disclosure for result details,
- review/mapping/retry remain available,
- no raw developer-looking result should dominate default state.

Receipt icon implementation:

- use a supported icon (`fa-solid fa-receipt` in current implementation),
- never allow broken image/glyph placeholders.

Validation:

- input total,
- menu total,
- difference,
- clear success/warning semantics.

Japan Menu Quantity:

- no giant vertical rows,
- menu/price first line,
- compact DINE-IN / TAKEOUT controls,
- combined total visible.

Non-Japan:

- existing single quantity behavior.

Save:

- sticky above nav,
- positive success feedback:
  `YYYY-MM-DD 매출 데이터가 저장되었습니다.`

31.5 OCR PRESENTATION RULE AFTER BATCH ARCHITECTURE
One long receipt may use multiple photos.
UI should communicate multiple files as ONE receipt batch.
Default summary should prioritize:

- recognized menu count,
- OCR calculated menu total,
- currency,
- status.

Secondary review may show:

- file rows,
- price review count,
- raw OCR,
- mappings,
- warnings.

Do not visually imply that each fragment is a separate receipt transaction.
31.6 COACH — CURRENT V4 INFORMATION ARCHITECTURE
Coach exposes four independent analysis experiences:

1. 매출 분석
2. AI 운영 코칭
3. Menu Engineering / AI 메뉴 전략
4. Boost Plan

Shared period controls:

- Today
- Week
- Month
- Custom

Each analysis may expose the shared period control in its opened section,
but UI execution order is NEVER a prerequisite.
31.7 COACH — EXPLICIT AI ACTION
Entering Coach must not generate AI automatically.
Opening an AI row/card must not generate AI automatically.
Period changes must not generate AI automatically.
Required CTAs:

- AI 운영 코칭 분석하기
- AI 메뉴 분석하기
- AI Boost Plan 만들기
- 다시 분석 (when a completed report exists)

Completed saved results:

- display immediately,
- never flash a false empty/loading state,
- do not auto-regenerate.

Genuinely active analysis copy:
Primary:
`AI가 분석하고 있어요`
Secondary:
`분석하는 동안 다른 메뉴를 둘러보셔도 됩니다.`
Avoid:

- countdowns,
- negative long-wait warnings,
- scary timeout copy,
- requiring user to stay on the screen.

31.8 COACH DAILY TREND — CURRENT VISUAL
Daily Trend is implemented as a lightweight responsive SVG LINE CHART.
Rules:

- warm-brown line and points,
- no permanent sales value on every point,
- first/middle/last date labels preferred for dense periods,
- tooltip on hover/focus,
- touch/click point selection on mobile,
- tooltip = date + formatted currency amount,
- one-day = centered point,
- never stretch one point into a full bar/line,
- empty = concise empty state.

Do not revert to dense month-long vertical bars.
31.9 COACH TOP MENU COMPARE — CURRENT VISUAL
Labels:

- 이전
- 현재

Do not use:

- PREV
- CURR

Current palette:
- 이전 = muted beige/gray
- 현재 = warm brown
- positive change = muted green
- negative change = muted red

Cards must remain compact.
Each row/card must still preserve:

- rank,
- menu name,
- previous value,
- current value,
- change percentage.

Avoid oversized rank cards.
31.10 AI OPERATING COACHING — COMPACT TYPOGRAPHY
Current visual target follows Boost Plan density.
Approximate mobile hierarchy:

- report title: 17–18px,
- section title: \~12px bold/semibold,
- body: \~12–13px,
- metadata: \~9–10px,
- body line height: \~1.55–1.65.

Nested report cards:

- reduce outer/inner padding,
- retain readable hierarchy,
- do not remove content merely to reduce height.

Progressive disclosure remains a long-term product principle:
summary/action should be easier to scan than raw long-form text.
31.11 MENU ENGINEERING — CLASSIFICATION MEANING
Always make category meaning understandable at a glance.
Current deterministic semantics:
⭐ Stars
`판매 ↑ · 수익 ↑`
🐄 Cash Cows
`판매 ↑ · 수익 ↓`
🧩 Puzzles
`판매 ↓ · 수익 ↑`
🐕 Dogs
`판매 ↓ · 수익 ↓`
These labels explain the existing calculation.
They must not change classification logic.
Category cards should be compact:

- name + count,
- semantic one-line meaning,
- concise menu names.

31.12 MENU — CURRENT APPROVED NO-IMAGE IMPLEMENTATION
HARD RULE:
THE REAL PRODUCT DOES NOT USE MENU PHOTOS.
Even if an approved visual reference contains food photography:

- do not add images,
- do not reserve thumbnail space,
- do not add image upload,
- do not add image URL,
- do not use placeholders.

Current Menu main view is BROWSE-FIRST.
Main structure:

1. Header/date context
2. Menu Management summary
3. Search
4. Actual category chips
5. no-image menu cards
6. Add/Edit/Delete/History
7. Sticky Save

Current no-image card uses width for:

- menu name,
- category,
- selling price,
- cost,
- food cost %,
- edit/navigation affordance,
- subtle drag affordance.

Main view should NOT revert to:

- spreadsheet rows,
- all-fields-always-editable,
- large delete buttons on every row.

READ FIRST → EDIT ON REQUEST remains mandatory.
31.13 MENU ADD / EDIT
Add/Edit fields:

- Menu Name
- Category
- Selling Price
- Unit Cost
- Derived Food Cost %

Food Cost %:
`unitCost / sellingPrice × 100`
Derived presentation only.
Do not persist a redundant percentage unless business schema explicitly requires it.
Edit may include:

- history,
- delete,
- save-to-draft.

Delete confirmation:

- concise,
- warning icon,
- neutral cancel,
- muted red destructive action,
- overlay above bottom navigation.

31.14 MENU PRICE HISTORY / DRAG
Price History:

- preserve existing behavior,
- secondary visual weight,
- Korean labels.

Drag:

- preserve existing handlers,
- make handle visually secondary,
- do not remove reorder capability.

31.15 MORE
More is quiet.
Appropriate:

- support,
- app information,
- logout,
- future help.

Do not expose:

- Gemini secrets,
- Supabase keys,
- developer tooling.

31.16 LOADING / SAVED REPORT RESTORE
AI UI state is exact-scope aware.
When returning to a period that already has a completed report:

- show completed report immediately,
- do not show another period's loading state,
- do not require refresh.

When a request is genuinely active for the current scope:

- show active analysis copy immediately,
- avoid idle → loading flicker.

31.17 CURRENT SCREEN DENSITY CHECK
Home:
LOW density.
Sales:
MEDIUM, operationally dense but fast.
Coach:
MEDIUM with progressive disclosure.
Menu:
MEDIUM, scan-first.
More:
LOW.
Any future change that makes:

- Sales feel like a long database form,
- Coach feel like a report dump,
- Menu feel like a spreadsheet,
- Home feel like BI,
  should be rejected.

32.1 Never revert Sales to the legacy oversized field/card presentation.
32.2 Never display all OCR raw/mapping detail by default.
32.3 Never visually model multi-photo long receipt fragments as unrelated receipts.
32.4 Never replace current store/date authority with OCR store/date labels.
32.5 Never use final receipt payment total as the menu subtotal comparison label.
32.6 Never remove Japan DINE-IN / TAKEOUT independence.
32.7 Never auto-trigger Coach AI from:

- card open,
- Coach entry,
- preset change,
- saved report restore.

32.8 Never show loading from a different report scope.
32.9 Never remove deterministic Menu Engineering because AI commentary exists.
32.10 Never hard-block Menu Engineering solely because the period is <7 days.
32.11 Never remove the Stars/Cash Cows/Puzzles/Dogs semantic explanation.
32.12 Never add menu photos to actual Menu UI.
32.13 Never turn Menu main list back into always-editable spreadsheet controls.
32.14 Never remove Price History / Drag just because visual references omit them.
32.15 Never hide Save success on Sales/Menu after confirmed persistence.
Priority is no longer a major V4 redesign.
Next UI/UX work should be evidence-driven from pilot usage.
P1:

- run full mobile smoke at 360 / 390 / 430 widths,
- verify long Japanese menu names,
- verify tooltip placement on small screens,
- verify OCR review on long receipt batches,
- verify bottom-nav/sticky-action safe-area behavior.

P2:

- observe store operator task completion time,
- reduce friction only where real usage shows delay,
- improve progressive disclosure of AI reports if operators still scroll excessively,
- refine the implemented Contextual Help / Guided Tour only from real usage evidence.

P3:

- tablet/desktop polish,
- HQ-specific surface refinement,
- accessibility audit,
- reduced-motion audit.

Do not begin another cosmetic redesign without pilot evidence.
When this UI/UX Guideline is provided to another AI:

1. Treat the approved visual references as visual intent.
2. Treat the V4.2 Current Authoritative Implementation Update as the current presentation state.
3. Treat current verified application behavior as functional truth.
4. Never delete a working feature because a reference image omits it.
5. Never add a decorative reference-only element as a product feature.
6. For Menu specifically, never implement food photos.
7. Use Boost Plan current compact density as a useful implemented reference.
8. Confirm active render path before styling.
9. Separate UI task from business-logic task.
10. Validate TypeScript/build/diff after meaningful presentation changes.

FINAL PRINCIPLE
The system calculates.
The AI interprets.
The interface clarifies.
The operator acts.
Home is not a dashboard.
It is a Daily Brief.
Sales is not a form dump.
It is a fast input workflow.
Coach is not a report.
It is guidance.
Menu is not analytics.
It is master-data management.
More is not a junk drawer.
It is a quiet support area.
The approved images define the emotional and visual standard.
This document defines the implementation language.
Current verified code defines the functional contract.
Preserve all three.
