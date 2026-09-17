import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";

const COUNTRY_OPTIONS = [
  { code: "DEMO", label: "Demo" },
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
  { code: "DEMO", label: "Demo Brand" },
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

const STATUS_LABELS: Record<StatusTab, string> = {
  pending: "대기",
  approved: "승인 완료",
  rejected: "거절",
};

const STATUS_STYLES: Record<StatusTab, string> = {
  pending: "bg-[#F8F1E8] text-[#8B6F5B]",
  approved: "bg-[#EEF5EF] text-[#58765B]",
  rejected: "bg-[#F9EEEE] text-[#9A5F5F]",
};

type AdminApprovalPageProps = {
  initialTab?: StatusTab;
};

const getPrivilegedApiHeaders = async () => {
  if (!supabase) {
    throw new Error("인증 서비스를 사용할 수 없습니다.");
  }

  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) {
    throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
};

const AdminApprovalPage = ({ initialTab = "pending" }: AdminApprovalPageProps) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [passwordUpdatingId, setPasswordUpdatingId] = useState<number | null>(null);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<StatusTab>(initialTab);
  const [editForm, setEditForm] = useState({
    owner_name: "",
    phone: "",
    email: "",
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
      country: "",
      brand: "",
      store_name: "",
    });
  };

  const handleEditChange = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasswordDraftChange = (requestId: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setPasswordDrafts((previous) => ({ ...previous, [requestId]: digitsOnly }));
  };

  const clearPasswordDraft = (requestId: number) => {
    setPasswordDrafts((previous) => {
      const { [requestId]: _discarded, ...remaining } = previous;
      return remaining;
    });
  };

  const handleSaveEdit = async (requestId: number) => {
    if (
      !editForm.owner_name.trim() ||
      !editForm.phone.trim() ||
      !editForm.email.trim() ||
      !editForm.country ||
      !editForm.brand ||
      !editForm.store_name.trim()
    ) {
      alert("모든 항목을 입력해주세요.");
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
    const initialPassword = String(passwordDrafts[item.id] || "").trim();

    if (!/^\d{6}$/.test(initialPassword)) {
      alert("초기 비밀번호는 숫자 6자리여야 합니다.");
      return;
    }

    try {
      setLoading(true);

      const headers = await getPrivilegedApiHeaders();

      const response = await fetch("/api/create-approved-user", {
        method: "POST",
        headers,
        body: JSON.stringify({
          requestId: item.id,
          initialPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "승인 실패");
      }

      alert("승인 완료");
      clearPasswordDraft(item.id);
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
    const newPassword = String(passwordDrafts[item.id] || "").trim();

    if (!email) {
      alert("이메일이 없습니다.");
      return;
    }

    if (!/^\d{6}$/.test(newPassword)) {
      alert("실제 비밀번호 반영은 숫자 6자리만 가능합니다.");
      return;
    }

    const ok = window.confirm(`${email} 계정의 실제 로그인 비밀번호를 변경하시겠습니까?`);
    if (!ok) return;

    try {
      setPasswordUpdatingId(item.id);

      const headers = await getPrivilegedApiHeaders();

      const response = await fetch("/api/update-approved-user-password", {
        method: "POST",
        headers,
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
      clearPasswordDraft(item.id);
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
    <div className="w-full pb-4">
      <div className="mb-4 grid grid-cols-3 gap-1.5 sm:mb-5 sm:flex sm:flex-wrap sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`min-h-11 whitespace-nowrap rounded-xl border px-1 py-2 text-[12.5px] font-semibold leading-none transition sm:px-4 sm:text-sm ${
            activeTab === "pending"
              ? "border-[#8B6F5B] bg-[#8B6F5B] text-white"
              : "border-[#ECE7E1] bg-white text-[#706A66] hover:bg-[#F7F2EE]"
          }`}
        >
          대기 계정 ({pendingCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`min-h-11 whitespace-nowrap rounded-xl border px-1 py-2 text-[12.5px] font-semibold leading-none transition sm:px-4 sm:text-sm ${
            activeTab === "approved"
              ? "border-[#8B6F5B] bg-[#8B6F5B] text-white"
              : "border-[#ECE7E1] bg-white text-[#706A66] hover:bg-[#F7F2EE]"
          }`}
        >
          생성 완료 계정 ({approvedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={`min-h-11 whitespace-nowrap rounded-xl border px-1 py-2 text-[12.5px] font-semibold leading-none transition sm:px-4 sm:text-sm ${
            activeTab === "rejected"
              ? "border-[#8B6F5B] bg-[#8B6F5B] text-white"
              : "border-[#ECE7E1] bg-white text-[#706A66] hover:bg-[#F7F2EE]"
          }`}
        >
          거절 계정 ({rejectedCount})
        </button>
      </div>

      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="rounded-[20px] border border-[#ECE7E1] bg-white px-4 py-10 text-center text-sm text-[#9C948E]">
            {activeTab === "pending" && "대기 계정이 없습니다."}
            {activeTab === "approved" && "생성 완료 계정이 없습니다."}
            {activeTab === "rejected" && "거절 계정이 없습니다."}
          </div>
        ) : (
          filteredList.map((item) => {
            const isEditing = editingId === item.id;
            const isPasswordUpdating = passwordUpdatingId === item.id;
            const status = (item.status || "pending") as StatusTab;

            return (
              <div
                key={item.id}
                className="rounded-[20px] border border-[#ECE7E1] bg-white p-5 sm:p-6"
              >
                {isEditing ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-bold text-[#1F1F1F]">신청 정보 수정</p>
                      <p className="mt-1 text-xs text-[#9C948E]">변경한 신청 정보는 저장 후 반영됩니다.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-[#706A66]">
                        점주 성함
                        <input
                          value={editForm.owner_name}
                          onChange={(e) => handleEditChange("owner_name", e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#A8866B]"
                        />
                      </label>
                      <label className="text-xs font-semibold text-[#706A66]">
                        연락처
                        <input
                          value={editForm.phone}
                          onChange={(e) => handleEditChange("phone", e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#A8866B]"
                        />
                      </label>
                      <label className="text-xs font-semibold text-[#706A66] sm:col-span-2">
                        이메일
                        <input
                          value={editForm.email}
                          onChange={(e) => handleEditChange("email", e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#A8866B]"
                        />
                      </label>
                      <label className="text-xs font-semibold text-[#706A66]">
                        국가
                        <select
                          value={editForm.country}
                          onChange={(e) => handleEditChange("country", e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#A8866B]"
                        >
                        <option value="">국가 선택</option>
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-[#706A66]">
                        브랜드
                        <select
                          value={editForm.brand}
                          onChange={(e) => handleEditChange("brand", e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#A8866B]"
                        >
                        <option value="">브랜드 선택</option>
                        {BRAND_OPTIONS.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.label}
                          </option>
                        ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-[#706A66] sm:col-span-2">
                        매장명
                        <input
                          value={editForm.store_name}
                          onChange={(e) => handleEditChange("store_name", e.target.value)}
                          className="mt-1.5 h-12 w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#A8866B]"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={loading}
                        className="min-h-11 rounded-xl bg-[#8B6F5B] px-5 text-sm font-bold text-white transition hover:bg-[#765C49] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className="min-h-11 rounded-xl border border-[#ECE7E1] bg-white px-5 text-sm font-bold text-[#706A66] transition hover:bg-[#F7F2EE] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold text-[#1F1F1F] sm:text-lg">{item.store_name}</h3>
                        <p className="mt-1 text-[13px] text-[#706A66] sm:text-sm">{getBrandLabel(item.brand)}</p>
                      </div>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold sm:text-xs ${STATUS_STYLES[status] || "bg-[#F4F1EE] text-[#706A66]"}`}>
                        {STATUS_LABELS[status] || item.status || "-"}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:mt-5 sm:grid-cols-2 sm:gap-y-4 lg:grid-cols-4">
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold text-[#9C948E] sm:text-xs">점주</dt>
                        <dd className="mt-1 break-words font-medium text-[#1F1F1F]">{item.owner_name || "-"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold text-[#9C948E] sm:text-xs">연락처</dt>
                        <dd className="mt-1 break-words font-medium text-[#1F1F1F]">{item.phone || "-"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold text-[#9C948E] sm:text-xs">이메일</dt>
                        <dd className="mt-1 break-all font-medium text-[#1F1F1F]">{item.email || "-"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold text-[#9C948E] sm:text-xs">국가</dt>
                        <dd className="mt-1 break-words font-medium text-[#1F1F1F]">{getCountryLabel(item.country)}</dd>
                      </div>
                    </dl>

                    <div className="mt-4 border-t border-[#ECE7E1] pt-4 sm:mt-5 sm:pt-5">
                      {status === "pending" && (
                        <div className="max-w-md space-y-3">
                          <label className="block text-xs font-semibold text-[#706A66]">
                            초기 비밀번호
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={6}
                              value={passwordDrafts[item.id] || ""}
                              onChange={(event) => handlePasswordDraftChange(item.id, event.target.value)}
                              placeholder="숫자 6자리"
                              className="mt-1.5 h-[46px] w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none placeholder:text-[13px] focus:border-[#A8866B] sm:h-12"
                            />
                          </label>
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={loading}
                            className="h-[46px] w-full rounded-xl bg-[#8B6F5B] px-4 text-sm font-semibold text-white transition hover:bg-[#765C49] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11"
                          >
                            승인
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              disabled={loading || isPasswordUpdating}
                              className="min-h-11 rounded-xl border border-[#ECE7E1] bg-white px-4 text-sm font-bold text-[#706A66] transition hover:bg-[#F7F2EE] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              disabled={loading}
                              className="min-h-11 rounded-xl bg-[#F9EEEE] px-4 text-sm font-bold text-[#9A5F5F] transition hover:bg-[#F4E2E2] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              거절
                            </button>
                          </div>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={loading || isPasswordUpdating}
                            className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-[#9A5F5F] transition hover:bg-[#FCF5F5] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      )}

                      {status === "approved" && (
                        <div className="max-w-md space-y-3">
                          <label className="block text-xs font-semibold text-[#706A66]">
                            새 비밀번호
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={6}
                              value={passwordDrafts[item.id] || ""}
                              onChange={(event) => handlePasswordDraftChange(item.id, event.target.value)}
                              placeholder="숫자 6자리"
                              className="mt-1.5 h-[46px] w-full rounded-[14px] border border-[#ECE7E1] bg-[#FFFDFC] px-3 text-sm text-[#1F1F1F] outline-none placeholder:text-[13px] focus:border-[#A8866B] sm:h-12"
                            />
                          </label>
                          <button
                            onClick={() => handleApplyApprovedPassword(item)}
                            disabled={loading || isPasswordUpdating}
                            className="h-[46px] w-full rounded-xl bg-[#8B6F5B] px-4 text-sm font-semibold text-white transition hover:bg-[#765C49] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11"
                          >
                            {isPasswordUpdating ? "변경 중..." : "비밀번호 변경"}
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              disabled={loading || isPasswordUpdating}
                              className="min-h-11 rounded-xl border border-[#ECE7E1] bg-white px-4 text-sm font-bold text-[#706A66] transition hover:bg-[#F7F2EE] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={loading || isPasswordUpdating}
                              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#9A5F5F] transition hover:bg-[#FCF5F5] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}

                      {status === "rejected" && (
                        <div className="grid max-w-md grid-cols-2 gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            disabled={loading || isPasswordUpdating}
                            className="min-h-11 rounded-xl border border-[#ECE7E1] bg-white px-4 text-sm font-bold text-[#706A66] transition hover:bg-[#F7F2EE] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={loading || isPasswordUpdating}
                            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#9A5F5F] transition hover:bg-[#FCF5F5] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      )}
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
