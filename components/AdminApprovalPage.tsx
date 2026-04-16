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

      // 1. auth user 생성
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: item.email,
          password: item.password,
          email_confirm: true,
        });

      if (authError) throw authError;

      const userId = authData.user.id;
      const storeId = `STORE_${Date.now()}`;

      // 2. store 생성
      const { error: storeError } = await supabase.from("stores").insert([
        {
          id: storeId,
          name: item.store_name,
          brand: item.brand,
          country: item.country,
        },
      ]);

      if (storeError) throw storeError;

      // 3. users 생성
      const { error: userError } = await supabase.from("users").insert([
        {
          id: userId,
          name: item.owner_name,
          phone: item.phone,
          email: item.email,
          role: "store_user",
          status: "active",
          store_id: storeId,
        },
      ]);

      if (userError) throw userError;

      // 4. 상태 업데이트
      await supabase
        .from("signup_requests")
        .update({ status: "approved" })
        .eq("id", item.id);

      alert("승인 완료");

      loadRequests();
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
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-bold">
                {item.store_name} ({item.brand})
              </div>
              <div className="text-sm text-gray-500">
                {item.owner_name} / {item.phone}
              </div>
              <div className="text-xs text-gray-400">
                {item.country} / {item.email}
              </div>
              <div className="text-xs mt-1">
                상태: {item.status}
              </div>
            </div>

            {item.status === "pending" && (
              <button
                onClick={() => handleApprove(item)}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded font-bold"
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
