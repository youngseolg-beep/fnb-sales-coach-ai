import React, { useEffect, useState } from "react";
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

const AdminApprovalPage = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    owner_name: "",
    phone: "",
    email: "",
    requested_password: "",
    country: "",
    brand: "",
    store_name: "",
  });

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("signup_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setList(data);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({
      owner_name: item.owner_name || "",
      phone: item.phone || "",
      email: item.email || "",
      requested_password: item.requested_password || "",
      country: item.country || "",
      brand: item.brand || "",
      store_name: item.store_name || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      owner_name: "",
      phone: "",
      email: "",
      requested_password: "",
      country: "",
      brand: "",
      store_name: "",
    });
  };

  const handleEditChange = (key: string, value: string) => {
    if (key === "requested_password") {
      const onlyNumbers = value.replace(/\D/g, "").slice(0, 4);
      setEditForm((prev) => ({ ...prev, requested_password: onlyNumbers }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEdit = async (requestId: number) => {
    if (
      !editForm.owner_name.trim() ||
      !editForm.phone.trim() ||
      !editForm.email.trim() ||
      !editForm.requested_password.trim() ||
      !editForm.country ||
      !editForm.brand ||
      !editForm.store_name.trim()
    ) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    if (!/^\d{4}$/.test(editForm.requested_password)) {
      alert("희망 비밀번호는 숫자 4자리여야 합니다.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("signup_requests")
        .update({
          owner_name: editForm.owner_name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim().toLowerCase(),
          requested_password: editForm.requested_password.trim(),
          country: editForm.country,
          brand: editForm.brand,
          store_name: editForm.store_name.trim(),
        })
        .eq("id", requestId);

      if (error) throw error;

      alert("수정 완료");
      cancelEdit();
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (item: any) => {
    const ok = window.confirm("이 신청을 거절하시겠습니까?");
    if (!ok) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("signup_requests")
        .update({ status: "rejected" })
        .eq("id", item.id);

      if (error) throw error;

      alert("거절 완료");
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "거절 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    try {
      setLoading(true);

      const response = await fetch("/api/create-approved-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: item.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "승인 실패");
      }

      alert("승인 완료");
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "승인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h2 className="mb-4 text-xl font-black">가입 승인 관리</h2>

      <div className="space-y-4">
        {list.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={editForm.owner_name}
                      onChange={(e) => handleEditChange("owner_name", e.target.value)}
                      placeholder="점주 성함"
                      className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    />
                    <input
                      value={editForm.phone}
                      onChange={(e) => handleEditChange("phone", e.target.value)}
                      placeholder="연락처"
                      className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <input
                    value={editForm.email}
                    onChange={(e) => handleEditChange("email", e.target.value)}
                    placeholder="이메일"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                  />

                  <input
                    value={editForm.requested_password}
                    onChange={(e) =>
                      handleEditChange("requested_password", e.target.value)
                    }
                    placeholder="희망 비밀번호 4자리"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <select
                      value={editForm.country}
                      onChange={(e) => handleEditChange("country", e.target.value)}
                      className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">국가 선택</option>
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={editForm.brand}
                      onChange={(e) => handleEditChange("brand", e.target.value)}
                      className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">브랜드 선택</option>
                      {BRAND_OPTIONS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    value={editForm.store_name}
                    onChange={(e) => handleEditChange("store_name", e.target.value)}
                    placeholder="매장명"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      disabled={loading}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={loading}
                      className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-white">
                      {item.store_name} ({item.brand})
                    </div>

                    <div className="mt-1 text-sm text-slate-300">
                      {item.owner_name} / {item.phone}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      {item.country} / {item.email}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      희망 비밀번호: {item.requested_password || "-"}
                    </div>

                    <div className="mt-1 text-xs text-slate-300">
                      상태: {item.status}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {item.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={loading}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                        >
                          승인
                        </button>

                        <button
                          onClick={() => startEdit(item)}
                          disabled={loading}
                          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white"
                        >
                          수정
                        </button>

                        <button
                          onClick={() => handleReject(item)}
                          disabled={loading}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
                        >
                          거절
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminApprovalPage;
