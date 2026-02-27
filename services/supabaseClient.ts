
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Vite 환경변수 우선 사용, fallback으로 process.env (Vite define) 사용
const url = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined);
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined);

// 유효한 URL 형식인지 간단히 체크 (Failed to fetch 방지)
const isValidUrl = (s: string | undefined) => {
  if (!s) return false;
  try {
    new URL(s);
    return true;
  } catch (e) {
    return false;
  }
};

export const isSupabaseReady = Boolean(url && anonKey && isValidUrl(url));

// 안전한 클라이언트 생성 (변수 없으면 null 반환)
export const supabase = isSupabaseReady 
  ? createClient(url!, anonKey!) 
  : null as unknown as SupabaseClient;

if (!isSupabaseReady) {
  if (!url || !anonKey) {
    console.warn('Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다. DB 기능이 비활성화됩니다.');
  } else if (!isValidUrl(url)) {
    console.error('Supabase URL 형식이 올바르지 않습니다:', url);
  }
}
