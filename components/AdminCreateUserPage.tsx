import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const COUNTRY_OPTIONS = [
  { code: "US", label: "미국 (United States)" },
  { code: "JP", label: "일본 (Japan)" },
  { code: "CN", label: "중국 (China)" },
  { code: "ID", label: "인도네시아 (Indonesia)" },
  { code: "PH", label: "필리핀 (Philippines)" },
  { code: "TW", label: "대만 (Taiwan)" },
  { code: "SG", label: "싱가포르 (Singapore)" },
  { code: "MN", label: "몽골 (Mongolia)" },
  { code: "NL", label: "네덜란드 (Netherlands)" },
  { code: "AU", label: "호주 (Australia)" },
  { code: "TH", label: "태국 (Thailand)" },
  { code: "KH", label: "캄보디아 (Cambodia)" },
];

const BRAND_OPTIONS = [
  { code: "PAIK_NOODLE", label: "홍콩반점 (Paik's Noodle)" },
  { code: "BORNGA", label: "본가 (Bornga)" },
  { code: "SAEMAEUL", label: "새마을식당 (Saemaeul)" },
  { code: "PAIK_COFFEE", label: "빽다방 (Paik's Coffee)" },
  { code: "PAIK_BIBIM", label: "백스비빔 (Paik's Bibim)" },
];

const AdminCreateUserPage = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    country: "",
    brand: "",
    storeName: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    try {
      // 1. auth user 생성
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: form.email,
          password: form.password,
          email_confirm: true,
        });

      if (authError) throw authError;

      const userId = authData.user.id;
      const storeId = `STORE_${Date.now()}`;

      // 2. store 생성
      const { error: storeError } = await supabase.from("stores").insert([
        {
          id: storeId,
          name: form.storeName,
          brand: form.brand,
          country: form.country,
        },
      ]);

      if (storeError) throw storeError;

      // 3. users 테이블 연결
      const { error: userError } = await supabase.from("users").insert([
        {
          id: userId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          role: "store_user",
          status: "active",
          store_id: storeId,
        },
      ]);

      if (userError) throw userError;

      alert("계정 생성 완료");

      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        country: "",
        brand: "",
        storeName: "",
      });
    } catch (err: any) {
      console.error(err);
      alert("에러 발생");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-black">관리자 계정 생성</h2>

      <input
        placeholder="점주명"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="연락처"
        value={form.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="이메일"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="비밀번호"
        type="password"
        value={form.password}
        onChange={(e) => handleChange("password", e.target.value)}
        className="w-full border p-2 rounded"
      />

      <select
        value={form.country}
        onChange={(e) => handleChange("country", e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">국가 선택</option>
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={form.brand}
        onChange={(e) => handleChange("brand", e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">브랜드 선택</option>
        {BRAND_OPTIONS.map((b) => (
          <option key={b.code} value={b.code}>
            {b.label}
          </option>
        ))}
      </select>

      <input
        placeholder="매장명"
        value={form.storeName}
        onChange={(e) => handleChange("storeName", e.target.value)}
        className="w-full border p-2 rounded"
      />

      <button
        onClick={handleCreate}
        className="w-full bg-indigo-600 text-white py-2 rounded font-bold"
      >
        계정 생성
      </button>
    </div>
  );
};

export default AdminCreateUserPage;
