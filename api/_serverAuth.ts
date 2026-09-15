import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

type MasterAuthorization =
  | { ok: true; admin: SupabaseClient }
  | { ok: false; status: 401 | 403 | 500; error: string };

const getBearerToken = (authorization: string | string[] | undefined) => {
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

export async function requireMasterAuthorization(req: VercelRequest): Promise<MasterAuthorization> {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { ok: false, status: 500, error: "Server configuration unavailable" };
  }

  try {
    const verifier = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await verifier.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: applicationUser, error: applicationUserError } = await admin
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (applicationUserError || !applicationUser || applicationUser.role !== "master") {
      return { ok: false, status: 403, error: "Forbidden" };
    }

    return { ok: true, admin };
  } catch {
    return { ok: false, status: 500, error: "Authorization unavailable" };
  }
}
