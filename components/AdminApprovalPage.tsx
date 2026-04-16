import React, { useEffect, useMemo, useState } from "react";
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

const getCountryLabel = (code: string) =>
  COUNTRY_OPTIONS.find((item) => item.code === code)?.label || code || "-";

const getBrandLabel = (code: string) =>
  BRAND_OPTIONS.find((item) => item.code === code)?.label || code || "-";

type StatusTab = "pending" | "approved" | "rejected";

type AdminApprovalPageProps = {
  initialTab?: StatusTab;
};

const AdminApprovalPage = ({ initialTab = "pending" }: AdminApprovalPageProps) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [passwordUpdatingId, setPasswordUpdatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>(initialTab);
  const [editForm, setEditForm] = useState({
    owner_name: "",
    phone: "",
    email: "",
    requested_password: "",
    country: "",
    brand: "",
    store_name: "",
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const filteredList = useMemo(() => {
    return list.filter((item) => (item.status || "pending") === activeTab);
  }, [list, activeTab]);

  const pendingCount = useMemo(
    () => list.filter((item) => (item.status || "pending") === "pending").length,
    [list]
  );

  const approvedCount = useMemo(
    () => list.filter((item) => item.status === "approved").length,
    [list]
  );

  const rejectedCount = useMemo(
    () => list.filter((item) => item.status === "rejected").length,
    [list]
  );

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
      const onlyNumbers = value.replace(/\D/g, "").slice(0, 6);
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

    if (!/^\d{6}$/.test(editForm.requested_password)) {
      alert("희망 비밀번호는 숫자 6자리여야 합니다.");
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
      setActiveTab("rejected");
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
      setActiveTab("approved");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "승인 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyApprovedPassword = async (item: any) => {
    const email = String(item?.email || "").trim().toLowerCase();
    const newPassword = String(item?.requested_password || "").trim();

    if (!email) {
      alert("이메일이 없습니다.");
      return;
    }

    if (!/^\d{6}$/.test(newPassword)) {
      alert("실제 비밀번호 반영은 숫자 6자리만 가능합니다.");
      return;
    }

    const ok = window.confirm(
      `${email} 계정의 실제 로그인 비밀번호를 ${newPassword}(으)로 변경하시겠습니까?`
    );
    if (!ok) return;

    try {
      setPasswordUpdatingId(item.id);

      const response = await fetch("/api/update-approved-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "실제 비밀번호 반영 실패");
      }

      alert("실제 로그인 비밀번호 반영 완료");
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "실제 비밀번호 반영 실패");
    } finally {
      setPasswordUpdatingId(null);
    }
  };

  const handleDelete = async (item: any) => {
    const ok = window.confirm("이 신청 내역을 삭제하시겠습니까?");
    if (!ok) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("signup_requests")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      if (editingId === item.id) {
        cancelEdit();
      }

      alert("삭제 완료");
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-5 md:px-6">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 sm:px-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Sales Coach AI
        </div>
        <h2 className="mt-2 text-lg font-black text-white sm:text-xl">
          가입 승인 관리
        </h2>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          계정 생성 신청 내역을 검토하고 상태별로 관리합니다.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "pending"
              ? "bg-indigo-600 text-white"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          대기 계정 ({pendingCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "approved"
              ? "bg-emerald-600 text-white"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          생성 완료 계정 ({approvedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "rejected"
              ? "bg-rose-600 text-white"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          거절 계정 ({rejectedCount})
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-500">
            {activeTab === "pending" && "대기 계정이 없습니다."}
            {activeTab === "approved" && "생성 완료 계정이 없습니다."}
            {activeTab === "rejected" && "거절 계정이 없습니다."}
          </div>
        ) : (
          filteredList.map((item) => {
            const isEditing = editingId === item.id;
            const isPasswordUpdating = passwordUpdatingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 sm:px-4 sm:py-4"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
                      <input
                        value={editForm.owner_name}
                        onChange={(e) => handleEditChange("owner_name", e.target.value)}
                        placeholder="점주 성함"
                        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
                      />
                      <input
                        value={editForm.phone}
                        onChange={(e) => handleEditChange("phone", e.target.value)}
                        placeholder="연락처"
                        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </div>

                    <input
                      value={editForm.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                      placeholder="이메일"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
                    />

                    <input
                      value={editForm.requested_password}
                      onChange={(e) =>
                        handleEditChange("requested_password", e.target.value)
                      }
                      placeholder="희망 비밀번호 6자리"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
                    />

                    <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
                      <select
                        value={editForm.country}
                        onChange={(e) => handleEditChange("country", e.target.value)}
                        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
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
                        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
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
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
                    />

                    <div className="flex flex-wrap gap-2 pt-1">
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
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold text-white sm:text-[17px]">
                        {item.store_name}
                      </div>

                      <div className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">
                        {getBrandLabel(item.brand)}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-300 sm:text-sm">
                        <div>
                          <span className="text-slate-500">점주</span>
                          <span className="ml-2 text-slate-200">{item.owner_name || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">연락처</span>
                          <span className="ml-2 text-slate-200">{item.phone || "-"}</span>
                        </div>
                        <div className="break-all">
                          <span className="text-slate-500">이메일</span>
                          <span className="ml-2 text-slate-200">{item.email || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">국가</span>
                          <span className="ml-2 text-slate-200">
                            {getCountryLabel(item.country)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">희망 비밀번호</span>
                          <span className="ml-2 text-slate-200">
                            {item.requested_password || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">상태</span>
                          <span className="ml-2 text-slate-200">{item.status || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
                      {item.status === "pending" && (
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={loading}
                          className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white sm:px-4 sm:text-sm"
                        >
                          승인
                        </button>
                      )}

                      {item.status === "pending" && (
                        <button
                          onClick={() => handleReject(item)}
                          disabled={loading}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white sm:px-4 sm:text-sm"
                        >
                          거절
                        </button>
                      )}

                      {item.status === "approved" && (
                        <button
                          onClick={() => handleApplyApprovedPassword(item)}
                          disabled={loading || isPasswordUpdating}
                          className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 sm:px-4 sm:text-sm"
                        >
                          {isPasswordUpdating ? "반영 중..." : "실제 비밀번호 반영"}
                        </button>
                      )}

                      <button
                        onClick={() => startEdit(item)}
                        disabled={loading || isPasswordUpdating}
                        className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white sm:px-4 sm:text-sm"
                      >
                        수정
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        disabled={loading || isPasswordUpdating}
                        className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white sm:px-4 sm:text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminApprovalPage;
