import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function json(res: VercelResponse, status: number, body: Record<string, any>) {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return json(res, 500, {
        ok: false,
        error: "Missing server environment variables",
      });
    }

    const { email, newPassword } = req.body ?? {};

    const safeEmail = String(email || "").trim().toLowerCase();
    const safePassword = String(newPassword || "").trim();

    if (!safeEmail) {
      return json(res, 400, { ok: false, error: "Email is required" });
    }

    if (!/^\d{6}$/.test(safePassword)) {
      return json(res, 400, {
        ok: false,
        error: "Password must be exactly 6 numeric digits",
      });
    }

    let page = 1;
    let foundUserId: string | null = null;

    while (!foundUserId) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        return json(res, 500, {
          ok: false,
          error: `Failed to list auth users: ${error.message}`,
        });
      }

      const users = data?.users ?? [];
      const matched = users.find(
        (user) => String(user.email || "").trim().toLowerCase() === safeEmail
      );

      if (matched?.id) {
        foundUserId = matched.id;
        break;
      }

      if (users.length < 1000) break;
      page += 1;
    }

    if (!foundUserId) {
      return json(res, 404, {
        ok: false,
        error: "Approved auth user not found for this email",
      });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      foundUserId,
      {
        password: safePassword,
      }
    );

    if (updateError) {
      return json(res, 500, {
        ok: false,
        error: `Failed to update password: ${updateError.message}`,
      });
    }

    return json(res, 200, {
      ok: true,
      message: "Auth password updated successfully",
      userId: foundUserId,
      email: safeEmail,
    });
  } catch (error: any) {
    return json(res, 500, {
      ok: false,
      error: error?.message || "Unknown server error",
    });
  }
}
