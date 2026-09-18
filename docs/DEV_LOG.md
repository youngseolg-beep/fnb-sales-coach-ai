# Sales Coach AI — Development Log

## 프로젝트 개요와 방향

Sales Coach AI는 매장의 일일 입력을 **입력 → 측정 → 분석 → 실행**으로 연결한다. Store Owner는 한 매장을 운영하고 Master는 여러 매장을 모니터링한다. 모바일 우선, 최소 행동, 현재 데이터 우선, AI 보조 판단, 안전한 실패와 테넌트 격리를 개발 원칙으로 삼았다.

## 주요 개발 단계

1. **Sales Input Foundation** — 일일 POS·배달 매출, 주문·방문객, 메뉴 수량, 월 목표, 메뉴 마스터와 가격·원가 이력을 구축했다.
2. **OCR Sales Input** — 영수증 OCR, 메뉴 매칭·검토, 통화·날짜·소계 검증과 수동 입력 대안을 제공했다. 인쇄 매장명 차이는 경고만 표시한다.
3. **Store Owner V4** — Home, Sales, Coach, Menu, More와 모바일 하단 탐색을 하나의 시각 체계로 정리했다.
4. **Coach / AI** — 기간 KPI, 결정론적 Menu Engineering, AI 메뉴 전략, Boost Plan, 구조화 응답 검증·재시도·오류 안내를 추가했다.
5. **Master Workspace** — 대시보드, 경과 기간 비교, 매장 상세, 승인 관리와 오류/빈 상태를 정비했다.
6. **Security / Production Hardening** — 인증 프로필 검증, RLS 정리, 공개 테스트 RPC 제거, SECURITY DEFINER 및 trigger search_path 하드닝, 평문 가입 비밀번호 제거를 반영했다.
7. **Contextual Help** — More의 빠른 도움말과 사용자가 시작하는 현재 화면/전체 흐름 투어를 제공했다.
8. **Final Cleanup** — 임시 로그와 죽은 UI, V4 이전 Coach UI 체인을 제거했다. 넓은 Sales/DataInput 정리는 회귀 위험 때문에 보류했다.

## 주요 문제와 해결

| 문제 | 원인 | 해결 |
|---|---|---|
| AI `INVALID_MODEL_RESPONSE` | 응답 구조 불일치 | 스키마 검증, 제한된 재시도, 사용자용 오류 |
| Boost Plan 행동 수 부족 | 후보와 응답 수 불일치 | 유효 결정론적 후보만 허용 |
| OCR 매장명 차이 | POS 인쇄명 불일치 가능 | 차단 대신 경고 |
| 기간 비교 혼선 | 기간 의미 불명확 | 완료 기간 및 동등 길이 비교 |
| 프로필/RLS 경고 | 오래된 접근 표면 | 실패 닫힘 검증과 정책 하드닝 |
| UTC/로컬 날짜 혼선 | 날짜 처리 방식 혼재 | 로컬 날짜 기준 정비 |

## 현재 상태

**완료:** Store Owner·Master 핵심 흐름, OCR, AI, Guided Tour, 보안 하드닝, Vercel 배포.

**선택 과제:** 번들 코드 분할, Sales/DataInput 내부 정리, 파일럿 피드백·관측, 추가 온보딩.

## Technical Validation

변경 시 TypeScript, lint, production build, `git diff --check`, 배포 동작 확인을 수행한다. 별도 CI는 문서화하지 않는다.
