import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

type AuthorizationFailure = { ok: false; status: 401 | 403 | 500; error: string };
type ApplicationRole = "master" | "store_user";
type AuthenticatedApplicationUser = {
  ok: true;
  userId: string;
  email: string;
  role: ApplicationRole;
  storeId: number | null;
};
type MasterAuthorization = { ok: true; admin: SupabaseClient } | AuthorizationFailure;
type StoreUserAuthorization = { ok: true; userId: string; email: string; storeId: number } | AuthorizationFailure;
type ServerSupabaseConfig = { url: string; anonKey: string; serviceRoleKey: string };

const getBearerToken = (authorization: string | string[] | undefined) => {
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const getServerSupabaseConfig = (): ServerSupabaseConfig | null => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return url && anonKey && serviceRoleKey ? { url, anonKey, serviceRoleKey } : null;
};

const createAdminClient = (config: ServerSupabaseConfig) =>
  createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export async function requireAuthenticatedAppUser(
  req: VercelRequest
): Promise<AuthenticatedApplicationUser | AuthorizationFailure> {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) return { ok: false, status: 401, error: "Unauthorized" };

  const config = getServerSupabaseConfig();
  if (!config) return { ok: false, status: 500, error: "Server configuration unavailable" };

  try {
    const verifier = createClient(config.url, config.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await verifier.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const admin = createAdminClient(config);
    const { data: applicationUser, error: applicationUserError } = await admin
      .from("users")
      .select("role,store_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    const role = applicationUser?.role;
    if (applicationUserError || !applicationUser || (role !== "master" && role !== "store_user")) {
      return { ok: false, status: 403, error: "Forbidden" };
    }

    const storeId = applicationUser.store_id == null ? null : Number(applicationUser.store_id);
    return {
      ok: true,
      userId: authData.user.id,
      email: String(authData.user.email || ""),
      role,
      storeId: Number.isInteger(storeId) ? storeId : null,
    };
  } catch {
    return { ok: false, status: 500, error: "Authorization unavailable" };
  }
}

export async function requireStoreUserAuthorization(
  req: VercelRequest,
  requestedStoreId: unknown
): Promise<StoreUserAuthorization> {
  const authenticated = await requireAuthenticatedAppUser(req);
  if (authenticated.ok === false) return authenticated;

  const storeId = typeof requestedStoreId === "number" ? requestedStoreId : Number.NaN;
  if (
    authenticated.role !== "store_user" ||
    !Number.isInteger(storeId) ||
    storeId <= 0 ||
    authenticated.storeId == null ||
    storeId !== authenticated.storeId
  ) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId: authenticated.userId, email: authenticated.email, storeId };
}

export async function requireMasterAuthorization(req: VercelRequest): Promise<MasterAuthorization> {
  const authenticated = await requireAuthenticatedAppUser(req);
  if (authenticated.ok === false) return authenticated;
  if (authenticated.role !== "master") return { ok: false, status: 403, error: "Forbidden" };

  const config = getServerSupabaseConfig();
  if (!config) return { ok: false, status: 500, error: "Server configuration unavailable" };
  return { ok: true, admin: createAdminClient(config) };
}
