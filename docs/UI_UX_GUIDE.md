# Sales Coach AI UI/UX Guide

미래 화면은 이 문서를 따른다. 제품 동작은 [Product Bible](PRODUCT_BIBLE.md)을 따른다.

## Foundation

따뜻한 캔버스 `#FAF8F6`, 흰 Surface `#FFFFFF`, 본문 `#1F1F1F`, 보조 `#706A66`, muted `#9C948E`, primary brown `#8B6F5B`, soft brown `#A8866B`, border `#ECE7E1`을 기본으로 한다. AI 의미에는 보라 계열 `#7C6CF6`만 사용하고 상태는 채도 낮은 green/amber/red 계열을 쓴다.

## Visual Rules

- 얇은 테두리, 작은 그림자, 충분한 여백을 사용한다.
- ERP식 밀집 화면, 밝은 SaaS blue, 다크 대시보드, 과도한 카드 중첩을 피한다.
- 화면 하나에는 하나의 주요 목적과 명확한 primary action을 둔다.
- 제목·KPI는 강하게, 보조 문구는 작고 muted로 둔다. 웹폰트를 가정하지 않는다.

## Responsive and Navigation

Store Owner는 360/390/430px을 우선 검증한다. 모바일은 **Coach · Sales · Home · Menu · More** 5개 균등 탭을 쓰며 현재 탭만 강조한다. 데스크톱은 사이드 탐색과 제한된 콘텐츠 폭을 사용한다. 중요한 터치 대상은 작게 만들지 않는다.

Home은 오늘 상태·목표, Sales는 입력·OCR, Coach는 기간 분석·AI, Menu는 가격·원가, More는 정보·도움말·로그아웃을 담당한다. Home 외 공통 헤더는 제품/페이지/설명/월 정보 같은 맥락을 일관되게 제공한다.

## AI, Forms, Help

- 결정론적 KPI와 분류를 먼저 보이고 AI 출력은 보조 영역으로 분리한다.
- AI는 로딩 중 사용자를 가두지 않으며 실패 이유를 운영 언어로 설명한다.
- 금액·수량에는 단위/통화를 가깝게 표시하고, 입력·OCR 실패는 수동 입력을 지우지 않는다.
- 삭제는 명시적 행동을 요구하고 매출 차이는 이해 가능한 상태로 표시한다.
- Guided Tour는 사용자 시작형이며 현재 화면 우선, 전체 흐름 다음 순서다. `data-tour`를 안정적인 타깃으로 사용한다.
- 투어는 5~8단계, 한 단계 한 개념, 이전/다음/Esc/닫기를 지원하며 숨겨진 타깃은 건너뛴다. 데이터 변경을 수행하지 않는다.
