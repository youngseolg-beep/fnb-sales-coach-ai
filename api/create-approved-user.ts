import { createClient } from "@supabase/supabase-js";

type ApproveRequestBody = {
  requestId: number;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: "Missing Supabase server environment variables",
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const body: ApproveRequestBody =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const requestId = Number(body?.requestId);

    if (!requestId) {
      return res.status(400).json({ error: "requestId is required" });
    }

    const { data: requestRow, error: requestError } = await admin
      .from("signup_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !requestRow) {
      return res.status(404).json({ error: "Signup request not found" });
    }

    if (requestRow.status === "approved") {
      return res.status(400).json({ error: "Already approved" });
    }

    const requestedPassword = String(requestRow.requested_password || "").trim();

    if (!/^\d{6}$/.test(requested_password)) {
  return res.status(400).json({
    error: "Requested password must be exactly 6 digits",
  });
}

    const normalizedEmail = String(requestRow.email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data: existingUserRow, error: existingUserError } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      return res.status(400).json({
        error: existingUserError.message || "Failed to check existing user",
      });
    }

    if (existingUserRow) {
      return res.status(400).json({ error: "This email is already in use" });
    }

    const storeId = Date.now();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: requestedPassword,
        email_confirm: true,
      });

    if (authError || !authData?.user?.id) {
      return res.status(400).json({
        error: authError?.message || "Failed to create auth user",
      });
    }

    const userId = authData.user.id;

    const { error: storeError } = await admin.from("stores").insert([
      {
        id: storeId,
        store_name: requestRow.store_name,
        brand: requestRow.brand,
        country: requestRow.country,
      },
    ]);

    if (storeError) {
      await admin.auth.admin.deleteUser(userId);
      return res.status(400).json({
        error: storeError.message || "Failed to create store",
      });
    }

    const { error: userError } = await admin.from("users").insert([
      {
        id: userId,
        email: normalizedEmail,
        role: "store_user",
        store_id: storeId,
      },
    ]);

    if (userError) {
      await admin.from("stores").delete().eq("id", storeId);
      await admin.auth.admin.deleteUser(userId);
      return res.status(400).json({
        error: userError.message || "Failed to create user profile",
      });
    }

    const { error: updateError } = await admin
      .from("signup_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    if (updateError) {
      return res.status(400).json({
        error: updateError.message || "Failed to update request status",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Approved successfully",
      userId,
      storeId,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Unexpected server error",
    });
  }
}
