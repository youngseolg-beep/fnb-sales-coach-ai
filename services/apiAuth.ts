import { supabase } from "./supabaseClient";

export async function getAuthenticatedApiHeaders() {
  if (!supabase) throw new Error("Authentication service is unavailable");

  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) throw new Error("Session expired. Please sign in again.");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}
