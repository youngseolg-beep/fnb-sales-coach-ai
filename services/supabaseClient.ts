// services/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseReady = Boolean(url && anonKey);

// ✅ 준비 안됐으면 null (저장 시도 시 salesStorage에서 에러 반환)
export const supabase: SupabaseClient | null = isSupabaseReady
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

// 🔎 배포에서 env 확인용(콘솔에서 window.__SUPABASE_ENV__ 보면 됨)
if (typeof window !== "undefined") {
  (window as any).__SUPABASE_ENV__ = {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    urlPreview: url ? url.slice(0, 24) + "..." : null,
  };
}
