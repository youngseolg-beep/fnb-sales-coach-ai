# Sales Coach AI

매일의 매장 운영 데이터를 입력해 메뉴 수익성 분석, AI 코칭, 본사 단위 모니터링으로 연결하는 매장 운영 지원 도구입니다.

## Current Status

- Store Owner Pilot ready
- Master workspace operational
- Production deployment: Vercel
- Database/Auth: Supabase
- AI: Gemini

## Main Workspaces

### Store Owner

Home, Sales, Coach, Menu, More: 일일 현황, 매출·OCR 입력, 기간 분석, 메뉴 가격·원가, 도움말·로그아웃을 제공합니다.

### Master

대시보드, 매장 비교·상세, 계정 승인 관리를 제공합니다.

## Core Features

- 날짜별 매출·메뉴 판매량 저장
- 영수증 OCR 및 메뉴 매칭 검토
- 기간 KPI와 Menu Engineering
- AI 메뉴 전략 및 안전장치가 적용된 Boost Plan
- 매장 단위 데이터 격리와 Master 모니터링

## Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, Supabase, Gemini API, Vercel, date-fns, react-day-picker, dnd-kit.

## Documentation

- [Product Bible](docs/PRODUCT_BIBLE.md)
- [UI/UX Guide](docs/UI_UX_GUIDE.md)
- [Development Log](docs/DEV_LOG.md)

## Local Development

1. `npm install`
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` locally.
3. Configure server-side Gemini credentials when AI API features are required.
4. `npm run dev`

Validation: `npm run lint`, `npm run build`, `node node_modules/typescript/bin/tsc --noEmit`.
