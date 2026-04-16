import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

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

interface Props {
  onBack?: () => void;
}

const AdminCreateUserPage: React.FC<Props> = ({ onBack }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    requestedPassword: "",
    country: "",
    brand: "",
    storeName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRequestedPasswordChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, requestedPassword: numbersOnly }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      requestedPassword: "",
      country: "",
      brand: "",
      storeName: "",
    });
  };

  const handleCreate = async () => {
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.requestedPassword.trim() ||
      !form.country ||
      !form.brand ||
      !form.storeName.trim()
    ) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    if (!/^\d{6}$/.test(form.requestedPassword)) {
      alert("희망 비밀번호는 숫자 6자리로 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("signup_requests").insert([
        {
          owner_name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          requested_password: form.requestedPassword,
          country: form.country,
          brand: form.brand,
          store_name: form.storeName.trim(),
          status: "pending",
        },
      ]);

      if (error) throw error;

      alert("계정 생성 신청이 완료되었습니다. 관리자 승인 후 계정이 생성됩니다.");
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "신청 중 에러 발생");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/95 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="bg-[linear-gradient(135deg,#4f46e5_0%,#6d28d9_100%)] px-8 pb-8 pt-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/15 backdrop-blur-sm">
          <i className="fa-solid fa-user-plus text-2xl text-white"></i>
        </div>

        <h2 className="text-[28px] font-black tracking-tight text-white">
          계정 생성
        </h2>

        <p className="mt-2 text-sm font-semibold text-indigo-100/95">
          관리자 승인 후 계정이 생성됩니다.
        </p>
      </div>

      <div className="space-y-4 px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              점주 성함
            </label>
            <input
              placeholder="점주 성함"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              연락처
            </label>
            <input
              placeholder="연락처"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            이메일
          </label>
          <input
            placeholder="이메일"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            희망 비밀번호
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="숫자 6자리"
            value={form.requestedPassword}
            onChange={(e) => handleRequestedPasswordChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            숫자 6자리만 입력 가능합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              국가
            </label>
            <select
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">국가 선택</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              브랜드
            </label>
            <select
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">브랜드 선택</option>
              {BRAND_OPTIONS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            매장명
          </label>
          <input
            placeholder="매장명"
            value={form.storeName}
            onChange={(e) => handleChange("storeName", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="w-full rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#6d28d9_100%)] py-4 text-base font-black text-white shadow-[0_10px_25px_rgba(79,70,229,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "신청 중..." : "계정 생성 신청"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-base font-black text-slate-700 transition-all hover:bg-slate-50"
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default AdminCreateUserPage;
