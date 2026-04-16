import { createClient } from "@supabase/supabase-js";

type ApproveRequestBody = {
  requestId: number;
};

type MenuSeedItem = {
  id: string;
  name: string;
  category: string;
  display_order: number;
  is_active: boolean;
};

const getBrandMenuSeed = (brand: string): MenuSeedItem[] => {
  if (brand === "BORNGA") {
    return [
      { id: "bornga-m1", name: "우삼겹", category: "고기 메뉴", display_order: 1, is_active: true },
      { id: "bornga-m2", name: "삼겹살", category: "고기 메뉴", display_order: 2, is_active: true },
      { id: "bornga-m3", name: "목살", category: "고기 메뉴", display_order: 3, is_active: true },
      { id: "bornga-m4", name: "갈비살", category: "고기 메뉴", display_order: 4, is_active: true },
      { id: "bornga-m5", name: "된장찌개", category: "식사 메뉴", display_order: 5, is_active: true },
      { id: "bornga-m6", name: "김치찌개", category: "식사 메뉴", display_order: 6, is_active: true },
      { id: "bornga-m7", name: "냉면", category: "식사 메뉴", display_order: 7, is_active: true },
      { id: "bornga-m8", name: "공기밥", category: "사이드", display_order: 8, is_active: true },
      { id: "bornga-m9", name: "계란찜", category: "사이드", display_order: 9, is_active: true },
      { id: "bornga-m10", name: "소주", category: "음료/주류", display_order: 10, is_active: true },
      { id: "bornga-m11", name: "맥주", category: "음료/주류", display_order: 11, is_active: true },
      { id: "bornga-m12", name: "콜라", category: "음료/주류", display_order: 12, is_active: true },
    ];
  }

  if (brand === "SAEMAEUL") {
    return [
      { id: "saemaeul-m1", name: "열탄불고기", category: "고기 메뉴", display_order: 1, is_active: true },
      { id: "saemaeul-m2", name: "7분돼지김치", category: "식사 메뉴", display_order: 2, is_active: true },
      { id: "saemaeul-m3", name: "냉김치말이국수", category: "식사 메뉴", display_order: 3, is_active: true },
      { id: "saemaeul-m4", name: "계란찜", category: "사이드", display_order: 4, is_active: true },
      { id: "saemaeul-m5", name: "공기밥", category: "사이드", display_order: 5, is_active: true },
      { id: "saemaeul-m6", name: "소주", category: "음료/주류", display_order: 6, is_active: true },
      { id: "saemaeul-m7", name: "맥주", category: "음료/주류", display_order: 7, is_active: true },
      { id: "saemaeul-m8", name: "콜라", category: "음료/주류", display_order: 8, is_active: true },
    ];
  }

  if (brand === "PAIK_COFFEE") {
    return [
      { id: "paikcoffee-m1", name: "아메리카노", category: "커피", display_order: 1, is_active: true },
      { id: "paikcoffee-m2", name: "카페라떼", category: "커피", display_order: 2, is_active: true },
      { id: "paikcoffee-m3", name: "바닐라라떼", category: "커피", display_order: 3, is_active: true },
      { id: "paikcoffee-m4", name: "아이스티", category: "음료", display_order: 4, is_active: true },
      { id: "paikcoffee-m5", name: "레몬에이드", category: "음료", display_order: 5, is_active: true },
      { id: "paikcoffee-m6", name: "쿠키", category: "디저트", display_order: 6, is_active: true },
      { id: "paikcoffee-m7", name: "크로플", category: "디저트", display_order: 7, is_active: true },
    ];
  }

  if (brand === "PAIK_BIBIM") {
    return [
      { id: "paikbibim-m1", name: "비빔밥", category: "메인 메뉴", display_order: 1, is_active: true },
      { id: "paikbibim-m2", name: "불고기비빔밥", category: "메인 메뉴", display_order: 2, is_active: true },
      { id: "paikbibim-m3", name: "제육비빔밥", category: "메인 메뉴", display_order: 3, is_active: true },
      { id: "paikbibim-m4", name: "미니우동", category: "사이드", display_order: 4, is_active: true },
      { id: "paikbibim-m5", name: "만두", category: "사이드", display_order: 5, is_active: true },
      { id: "paikbibim-m6", name: "콜라", category: "음료", display_order: 6, is_active: true },
      { id: "paikbibim-m7", name: "사이다", category: "음료", display_order: 7, is_active: true },
    ];
  }

  return [
    { id: "paiknoodle-f1", name: "짜장면", category: "음식 메뉴 (Main Dishes)", display_order: 1, is_active: true },
    { id: "paiknoodle-f2", name: "짬뽕", category: "음식 메뉴 (Main Dishes)", display_order: 2, is_active: true },
    { id: "paiknoodle-f3", name: "짬뽕밥", category: "음식 메뉴 (Main Dishes)", display_order: 3, is_active: true },
    { id: "paiknoodle-f4", name: "고추짜장", category: "음식 메뉴 (Main Dishes)", display_order: 4, is_active: true },
    { id: "paiknoodle-f5", name: "고추짬뽕", category: "음식 메뉴 (Main Dishes)", display_order: 5, is_active: true },
    { id: "paiknoodle-t1", name: "탕수육 S", category: "탕수육 (Tangsuyuk)", display_order: 6, is_active: true },
    { id: "paiknoodle-t2", name: "탕수육 M", category: "탕수육 (Tangsuyuk)", display_order: 7, is_active: true },
    { id: "paiknoodle-a1", name: "토핑 계란프라이", category: "토핑 (Add-ons)", display_order: 8, is_active: true },
    { id: "paiknoodle-a2", name: "토핑 슬라이스치즈", category: "토핑 (Add-ons)", display_order: 9, is_active: true },
    { id: "paiknoodle-b1", name: "콜라 330ml", category: "음료 및 주류 (Beverages)", display_order: 10, is_active: true },
    { id: "paiknoodle-b2", name: "스프라이트 330ml", category: "음료 및 주류 (Beverages)", display_order: 11, is_active: true },
    { id: "paiknoodle-b3", name: "소주", category: "음료 및 주류 (Beverages)", display_order: 12, is_active: true },
  ];
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

    if (!/^\d{6}$/.test(requestedPassword)) {
      return res.status(400).json({
        error: "Requested password must be exactly 6 digits",
      });
    }

    const normalizedEmail = String(requestRow.email || "").trim().toLowerCase();

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

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
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

    const menuSeedRows = getBrandMenuSeed(String(requestRow.brand || "PAIK_NOODLE")).map((item) => ({
      ...item,
      id: `${storeId}-${item.id}`,
      store_id: storeId,
    }));

    const { error: menuSeedError } = await admin.from("menu_master").insert(menuSeedRows);

    if (menuSeedError) {
      await admin.from("users").delete().eq("id", userId);
      await admin.from("stores").delete().eq("id", storeId);
      await admin.auth.admin.deleteUser(userId);
      return res.status(400).json({
        error: menuSeedError.message || "Failed to seed brand menu",
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
      brand: requestRow.brand,
      seededMenuCount: menuSeedRows.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Unexpected server error",
    });
  }
}
