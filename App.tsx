import { useSalesData } from "./hooks/useSalesData";
import { useMonthlyTarget } from "./hooks/useMonthlyTarget";
import { loadMonthlyTarget } from "./services/monthlyTargetService";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getMonthlyTotal,
  deleteDaily,
} from "./services/salesStorage";

import {
  getMenuPricesForDate,
  saveMenuPriceHistory,
} from "./services/menuPriceService";
import { loadMenuMaster } from "./services/menuMasterService";
import { formatLocalDate } from "./utils2/date";

import type { MenuCategory } from "./types";

import MenuPage from "./components/MenuPage";
import SalesPage from "./components/SalesPage";
import MasterDashboardPage from "./components/MasterDashboardPage";
import SummaryPage from "./components/SummaryPage";
import DetailPage from "./components/DetailPage";
import { supabase } from "./services/supabaseClient";

import StoreOwnerShell, { type StoreOwnerPageKey } from "./components/StoreOwnerShell";
import StoreOwnerPageRouter from "./components/StoreOwnerPageRouter";

const persistMenuPriceHistory = async (
  categories: MenuCategory[],
  effectiveDate: string,
  storeId: number
) => {
  const jobs: Promise<any>[] = [];

  for (const cat of categories) {
    for (const item of cat.items) {
      if (!item.id) continue;

      jobs.push(
        saveMenuPriceHistory(
          item.id,
          effectiveDate,
          Number(item.price ?? 0),
          item.unitCost !== null && item.unitCost !== undefined
            ? Number(item.unitCost)
            : undefined,
          storeId
        )
      );
    }
  }

  await Promise.all(jobs);
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [storeOwnerPage, setStoreOwnerPage] = useState<StoreOwnerPageKey>("sales");
  const [priceSaving, setPriceSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeq, setToastSeq] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({ total: 0, avg: 0, rate: 0 });
  const [menuMasterCategories, setMenuMasterCategories] = useState<MenuCategory[]>([]);
  const [menuMasterLoading, setMenuMasterLoading] = useState(true);

  const { monthlyTarget, setMonthlyTarget, handleSaveMonthlyTarget } = useMonthlyTarget(storeId);
  const monthlyStatsRequestRef = useRef("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastSeq((s) => s + 1);
  };

  const {
    selectedDate,
    setSelectedDate,
    data,
    setData,
    originalCategories,
    setOriginalCategories,
    datesWithData,
    refreshDatesInMonth,
    handleMonthChange,
    normalizeMenuMasterCategories,
    createEmptyCategoriesFromBase,
    cloneCategories,
    fetchData,
    initialCategories,
  } = useSalesData({
    storeId,
    menuMasterCategories,
  });

  const targetMonthKey =
    selectedDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);

  const selectedYearMonth = useMemo(() => {
    return selectedDate.substring(0, 7);
  }, [selectedDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setAuthError("Supabase 연결이 설정되지 않았습니다.");
      return;
    }

    setAuthError("");

    const loginEmail = email.includes("@") ? email : `${email}@tbk.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) return;

    setIsLoggedIn(true);

    const userId = sessionData.session.user.id;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, store_id")
      .eq("id", userId)
      .single();

    if (!userError && userData) {
      setUserRole(userData.role);
      setStoreId(userData.store_id);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setIsLoggedIn(false);
    setUserRole(null);
    setStoreId(null);
    setEmail("");
    setPassword("");
    setAuthError("");
    setMenuMasterCategories([]);
    setMenuMasterLoading(true);
    monthlyStatsRequestRef.current = "";
  };

  const refreshMonthlyStats = useCallback(
    async (yearMonth: string) => {
      if (storeId == null) return;

      const requestKey = `${storeId}_${yearMonth}_${Date.now()}`;
      monthlyStatsRequestRef.current = requestKey;

      try {
        const [total, target] = await Promise.all([
          getMonthlyTotal(yearMonth, storeId),
          loadMonthlyTarget(yearMonth, storeId),
        ]);

        if (monthlyStatsRequestRef.current !== requestKey) return;

        const safeDates = await refreshDatesInMonth(`${yearMonth}-01`);

        setMonthlyStats({
          total,
          avg: safeDates.length > 0 ? total / safeDates.length : 0,
          rate: target > 0 ? (total / target) * 100 : 0,
        });

        setMonthlyTarget(target);

        setData((prev: any) => {
          if (prev.date?.substring(0, 7) === yearMonth) {
            return { ...prev, mtdSales: total, monthlyTarget: target };
          }
          return { ...prev, mtdSales: total };
        });
      } catch (error) {
        if (monthlyStatsRequestRef.current !== requestKey) return;
        console.error("refreshMonthlyStats error:", error);
      }
    },
    [storeId, refreshDatesInMonth, setMonthlyTarget, setData]
  );

  const reloadMenuMaster = async () => {
    if (storeId == null) return;

    try {
      setMenuMasterLoading(true);

      const loadedMenuCategories = await loadMenuMaster(storeId);
      const normalized = normalizeMenuMasterCategories(loadedMenuCategories);
      const nextMenuCategories =
        normalized.length > 0 ? normalized : cloneCategories(initialCategories);

      setMenuMasterCategories(nextMenuCategories);
      await fetchData(data.date, nextMenuCategories);
      await refreshMonthlyStats(data.date.substring(0, 7));
    } catch (error) {
      console.error("reloadMenuMaster error:", error);
      showToast("메뉴 목록 새로고침 중 오류가 발생했습니다.");
    } finally {
      setMenuMasterLoading(false);
    }
  };

  const handleMenuSettingsCategoriesChange = (nextCategories: MenuCategory[]) => {
    setData((prev) => ({
      ...prev,
      categories: cloneCategories(nextCategories),
    }));
  };

  const handleSaveMenuPrices = async () => {
    if (storeId == null) return;

    try {
      setPriceSaving(true);

      await persistMenuPriceHistory(data.categories, data.date, storeId);

      const freshPriceMap = await getMenuPricesForDate(data.date, storeId);

      const refreshedCategories = data.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          const latest = freshPriceMap.get(item.id);

          if (!latest) return { ...item };

          return {
            ...item,
            price:
              latest.price !== null && latest.price !== undefined
                ? Number(latest.price)
                : Number(item.price ?? 0),
            unitCost:
              latest.unit_cost !== null && latest.unit_cost !== undefined
                ? Number(latest.unit_cost)
                : item.unitCost,
          };
        }),
      }));

      setData((prev) => ({
        ...prev,
        categories: cloneCategories(refreshedCategories),
      }));
      setOriginalCategories(cloneCategories(refreshedCategories));

      showToast("메뉴 가격 / 원가가 저장되었습니다.");
    } catch (error) {
      console.error("Price Save Error:", error);
      showToast("메뉴 가격 저장 중 오류가 발생했습니다.");
    } finally {
      setPriceSaving(false);
    }
  };

  const handleDelete = async () => {
    if (storeId == null) return;

    const targetDate = data.date;

    try {
      await deleteDaily(targetDate, storeId);

      const resetCats = createEmptyCategoriesFromBase(
        normalizeMenuMasterCategories(menuMasterCategories)
      );

      setData((prev) => ({
        ...prev,
        posSales: 0,
        deliverySales: 0,
        orders: 0,
        visitCount: 0,
        note: "",
        categories: resetCats,
      }));
      setOriginalCategories(cloneCategories(resetCats));

      const yearMonth = targetDate.substring(0, 7);
      await refreshDatesInMonth(targetDate);
      await refreshMonthlyStats(yearMonth);

      showToast("데이터가 삭제되었습니다.");
    } catch (error) {
      console.error("Delete Error:", error);
      showToast("삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setSessionChecked(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session) {
        setIsLoggedIn(true);

        const userId = sessionData.session.user.id;

        const { data: userData, error } = await supabase
          .from("users")
          .select("role, store_id")
          .eq("id", userId)
          .single();

        if (!error && userData) {
          setUserRole(userData.role);
          setStoreId(userData.store_id);
        }
      }

      setSessionChecked(true);
    };

    void checkSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (storeId == null) return;

    let isMounted = true;

    const initMenuMaster = async () => {
      try {
        setMenuMasterLoading(true);

        const loadedMenuCategories = await loadMenuMaster(storeId);
        const normalized = normalizeMenuMasterCategories(loadedMenuCategories);
        const nextMenuCategories =
          normalized.length > 0 ? normalized : cloneCategories(initialCategories);

        if (!isMounted) return;
        setMenuMasterCategories(nextMenuCategories);
      } catch (error) {
        console.error("Menu Master Load Error:", error);

        if (!isMounted) return;
        setMenuMasterCategories(cloneCategories(initialCategories));
      } finally {
        if (isMounted) {
          setMenuMasterLoading(false);
        }
      }
    };

    void initMenuMaster();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, storeId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (storeId == null) return;
    if (menuMasterLoading) return;
    if (menuMasterCategories.length === 0) return;

    void fetchData(selectedDate, menuMasterCategories);
  }, [
    selectedDate,
    isLoggedIn,
    storeId,
    menuMasterLoading,
    menuMasterCategories,
    fetchData,
  ]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (storeId == null) return;
    if (menuMasterLoading) return;
    if (menuMasterCategories.length === 0) return;

    void refreshMonthlyStats(selectedYearMonth);
  }, [
    selectedYearMonth,
    isLoggedIn,
    storeId,
    menuMasterLoading,
    menuMasterCategories.length,
    refreshMonthlyStats,
  ]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastSeq, toastMsg]);

  const monthlyRate = useMemo(() => {
    const target = monthlyTarget;
    if (!target || target <= 0) return 0;
    return (monthlyStats.total / target) * 100;
  }, [monthlyStats.total, monthlyTarget]);

  if (!sessionChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <i className="fa-solid fa-user text-white text-2xl"></i>
            </div>

            <h1 className="text-white font-black text-2xl uppercase tracking-tight">
              SALES COACH AI
            </h1>

            <p className="text-indigo-100 text-sm font-bold opacity-0 mt-1">
              Supabase Login
            </p>

            <div className="mt-3 text-indigo-100 text-s font-semibold opacity-200 space-y-1">
              <div>ID : test</div>
              <div>PW : 0000</div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ID"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg font-bold"
                autoFocus
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg font-bold"
              />
              {authError && (
                <p className="text-rose-500 text-xs font-bold mt-3 text-center">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (userRole !== "master" && menuMasterLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-900 text-xl font-black">Menu Master Loading...</div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            menu_master 데이터를 불러오는 중입니다.
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "master") {
    return <MasterDashboardPage />;
  }

  const summaryPage = (
    <SummaryPage
      date={data.date}
      monthlyStats={monthlyStats}
      monthlyRate={monthlyRate}
      monthlyTarget={monthlyTarget}
      onChangeTarget={(v) => {
        setMonthlyTarget(v);
        setData((prev) => ({ ...prev, monthlyTarget: v }));
      }}
      onSaveTarget={() => handleSaveMonthlyTarget(targetMonthKey, monthlyTarget)}
    />
  );

  const salesPage = (
    <SalesPage
      data={data}
      setData={setData}
      setSelectedDate={setSelectedDate}
      datesWithData={datesWithData}
      onMonthChange={(month) => {
        const monthDate = formatLocalDate(month);
        void handleMonthChange(monthDate);
        void refreshMonthlyStats(monthDate.substring(0, 7));
      }}
      refreshMonthlyStats={refreshMonthlyStats}
      showToast={showToast}
      onDelete={handleDelete}
      storeId={storeId!}
    />
  );

  const detailPage = <DetailPage />;

  const menuPage = (
    <MenuPage
      selectedDate={data.date}
      categories={data.categories}
      originalCategories={originalCategories}
      onChangeCategories={handleMenuSettingsCategoriesChange}
      onSavePrices={handleSaveMenuPrices}
      onReloadMenuMaster={reloadMenuMaster}
      saving={priceSaving}
      storeId={storeId!}
      onShowToast={showToast}
    />
  );

  return (
    <StoreOwnerShell
      currentPage={storeOwnerPage}
      onChangePage={setStoreOwnerPage}
      onChangeDate={setSelectedDate}
      selectedDate={data.date}
      monthlyTarget={monthlyTarget}
      monthlyRate={monthlyRate}
      onLogout={handleLogout}
    >
      <StoreOwnerPageRouter
        currentPage={storeOwnerPage}
        summaryPage={summaryPage}
        salesPage={salesPage}
        detailPage={detailPage}
        menuPage={menuPage}
      />
    </StoreOwnerShell>
  );
};

export default App;
