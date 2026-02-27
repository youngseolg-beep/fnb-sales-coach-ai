import { NextResponse } from 'next/server';

export async function GET() {
  // 서버 콘솔에 메시지 출력
  console.log("TEST SAVE API CALLED");
  
  // "ok" 텍스트와 함께 200 응답 반환
  return new NextResponse("ok", {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
