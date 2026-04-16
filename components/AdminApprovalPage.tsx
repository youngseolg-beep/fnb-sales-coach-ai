import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AdminApprovalPage = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-black mb-4">가입 승인 관리</h2>

      <div className="space-y-3">
        {list.map((item) => (
          <div
            key={item.id}
            className="border rounded-xl p-4 flex justify-between items-center gap-4"
          >
            <div className="min-w-0">
              <div className="font-bold">
                {item.store_name} ({item.brand})
              </div>

              <div className="text-sm text-gray-500">
                {item.owner_name} / {item.phone}
              </div>

              <div className="text-xs text-gray-400">
                {item.country} / {item.email}
              </div>

              <div className="text-xs mt-1 text-gray-500">
                희망 비밀번호: {item.requested_password || "-"}
              </div>

              <div className="text-xs mt-1">
                상태: {item.status}
              </div>
            </div>

            {item.status === "pending" && (
              <button
                onClick={() => handleApprove(item)}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded font-bold shrink-0"
              >
                승인
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovalPage;
