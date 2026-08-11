import { useSalesData } from "./hooks/useSalesData";
import { useMonthlyTarget } from "./hooks/useMonthlyTarget";
import { loadMonthlyTarget } from "./services/monthlyTargetService";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getMonthlyTotal,
  deleteDaily,
  loadDailyRange,
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
import MorePage from "./components/MorePage";
import { supabase } from "./services/supabaseClient";

import StoreOwnerShell, { type StoreOwnerPageKey } from "./components/StoreOwnerShell";
import StoreOwnerPageRouter from "./components/StoreOwnerPageRouter";
import AdminCreateUserPage from "./components/AdminCreateUserPage";

type SummaryCompareStats = {
  selectedSales: number;
  prevSales: number;
  selectedOrders: number;
  prevOrders: number;
  selectedAov: number;
  prevAov: number;
  avg7Sales: number;
  hasPrevData: boolean;
  avg7Count: number;
};

type HomeLandingTarget = "sales:manual" | "sales:ocr" | "coach:insight" | "coach:report" | null;

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (value: string, days: number) => {
  const next = parseLocalDate(value);
  next.setDate(next.getDate() + days);
  return formatYmd(next);
};

const toSafeNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const getSalesMetrics = (source: any) => {
  const payload = source?.payload ?? source ?? {};
  const sales = toSafeNumber(payload.posSales) + toSafeNumber(payload.deliverySales);
  const orders = toSafeNumber(payload.orders);
  const aov = orders > 0 ? sales / orders : 0;

  return {
    sales,
    orders,
    aov,
  };
};

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
  const [storeCountry, setStoreCountry] = useState("KH");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authScreen, setAuthScreen] = useState<"login" | "signup">("login");

  const [storeOwnerPage, setStoreOwnerPage] = useState<StoreOwnerPageKey>("summary");
  const [homeLandingTarget, setHomeLandingTarget] = useState<HomeLandingTarget>(null);
  const [priceSaving, setPriceSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeq, setToastSeq] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({ total: 0, avg: 0, rate: 0 });
  const [summaryCompare, setSummaryCompare] = useState<SummaryCompareStats>({
    selectedSales: 0,
    prevSales: 0,
    selectedOrders: 0,
    prevOrders: 0,
    selectedAov: 0,
    prevAov: 0,
    avg7Sales: 0,
    hasPrevData: false,
    avg7Count: 0,
  });
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
    storeName,
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

      if (userData.store_id != null) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("country")
          .eq("id", userData.store_id)
          .single();

        setStoreCountry(storeData?.country || "KH");
      } else {
        setStoreCountry("KH");
      }
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setIsLoggedIn(false);
    setUserRole(null);
    setStoreId(null);
    setStoreCountry("KH");
    setEmail("");
    setPassword("");
    setAuthError("");
    setAuthScreen("login");
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

          if (userData.store_id != null) {
            const { data: storeData } = await supabase
              .from("stores")
              .select("country")
              .eq("id", userData.store_id)
              .single();

            setStoreCountry(storeData?.country || "KH");
          } else {
            setStoreCountry("KH");
          }
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

  useEffect(() => {
    if (storeId == null || !data.date) return;

    let cancelled = false;

    const loadSummaryCompare = async () => {
      const selectedMetrics = getSalesMetrics(data);
      const prevDate = addDays(data.date, -1);
      const sevenStartDate = addDays(data.date, -7);

      try {
        const rows = await loadDailyRange(sevenStartDate, prevDate, storeId);
        if (cancelled) return;

        const safeRows = Array.isArray(rows) ? rows : [];
        const prevRow = safeRows.find((row: any) => row?.date === prevDate);
        const prevMetrics = getSalesMetrics(prevRow);

        const avg7Rows = safeRows.filter(
          (row: any) =>
            typeof row?.date === "string" &&
            row.date >= sevenStartDate &&
            row.date <= prevDate
        );

        const avg7SalesTotal = avg7Rows.reduce((sum: number, row: any) => {
          return sum + getSalesMetrics(row).sales;
        }, 0);

        const avg7Count = avg7Rows.length;

        setSummaryCompare({
          selectedSales: selectedMetrics.sales,
          prevSales: prevMetrics.sales,
          selectedOrders: selectedMetrics.orders,
          prevOrders: prevMetrics.orders,
          selectedAov: selectedMetrics.aov,
          prevAov: prevMetrics.aov,
          avg7Sales: avg7Count > 0 ? avg7SalesTotal / avg7Count : 0,
          hasPrevData: !!prevRow,
          avg7Count,
        });
      } catch (error) {
        if (cancelled) return;

        console.error("summary compare load error:", error);

        setSummaryCompare({
          selectedSales: selectedMetrics.sales,
          prevSales: 0,
          selectedOrders: selectedMetrics.orders,
          prevOrders: 0,
          selectedAov: selectedMetrics.aov,
          prevAov: 0,
          avg7Sales: 0,
          hasPrevData: false,
          avg7Count: 0,
        });
      }
    };

    void loadSummaryCompare();

    return () => {
      cancelled = true;
    };
  }, [storeId, data.date, data.posSales, data.deliverySales, data.orders]);

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
      <div className="min-h-screen bg-[#faf8f6] bg-[radial-gradient(circle_at_50%_-10%,rgba(220,194,161,0.36),transparent_36%)] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[720px]">
          {authScreen === "login" ? (
            <div className="overflow-hidden rounded-[28px] border border-[#e9e1da] bg-white/95 shadow-[0_20px_52px_rgba(81,57,40,0.12)] backdrop-blur">
              <div className="px-8 pb-8 pt-10 text-center sm:px-14 sm:pt-14">
                <div className="relative mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-[21px] bg-[linear-gradient(135deg,#a8866b_0%,#6f4027_100%)] shadow-[0_10px_24px_rgba(111,64,39,0.22)]">
                  <i className="fa-solid fa-chart-simple text-[29px] text-white"></i>
                  <i className="fa-solid fa-sparkles absolute -right-5 -top-3 text-xl text-[#dcc2a1]"></i>
                </div>

                <h1 className="text-[29px] font-bold tracking-[0.06em] text-[#3a2116] sm:text-[38px]">
                  SALES COACH AI
                </h1>

                <p className="mt-3 text-sm font-medium leading-6 text-[#4e413a] sm:text-base">
                  운영 데이터를 빠르게 입력하고, 바로 코칭까지 확인하세요.
                </p>

              </div>

              <form onSubmit={handleLogin} className="mx-auto max-w-[560px] space-y-5 px-6 pb-8 sm:px-12 sm:pb-12">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#332722]">
                    ID
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="아이디 입력"
                    className="h-14 w-full rounded-[14px] border border-[#ded6d0] bg-white px-5 text-center text-base font-medium text-[#1f1f1f] outline-none transition focus:border-[#a8866b] focus:ring-4 focus:ring-[#f6eee8]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#332722]">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="h-14 w-full rounded-[14px] border border-[#ded6d0] bg-white px-5 text-center text-base font-medium text-[#1f1f1f] outline-none transition focus:border-[#a8866b] focus:ring-4 focus:ring-[#f6eee8]"
                  />
                  {authError && (
                    <p className="mt-3 text-center text-xs font-semibold text-[#d83a32]">
                      {authError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="h-14 w-full rounded-[14px] bg-[linear-gradient(135deg,#8b6f5b_0%,#76472e_100%)] text-[17px] font-semibold text-white shadow-[0_9px_19px_rgba(111,64,39,0.2)] transition hover:brightness-105 active:scale-[0.99]"
                >
                  로그인
                </button>

                <button
                  type="button"
                  onClick={() => setAuthScreen("signup")}
                  className="h-14 w-full rounded-[14px] border border-[#d9d0c9] bg-white text-base font-semibold text-[#332722] transition hover:bg-[#fdfaf8]"
                >
                  계정 생성
                </button>
              </form>
            </div>
          ) : (
            <AdminCreateUserPage onBack={() => setAuthScreen("login")} />
          )}
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
    storeName={storeName}
    monthlyStats={monthlyStats}
    monthlyRate={monthlyRate}
    monthlyTarget={monthlyTarget}
    compareStats={summaryCompare}
    inputStatus={{
      posSales: Number(data.posSales ?? 0),
      deliverySales: Number(data.deliverySales ?? 0),
      orders: Number(data.orders ?? 0),
    }}
    hasSavedSalesData={datesWithData.includes(data.date)}
    onChangeTarget={(v) => {
      setMonthlyTarget(v);
      setData((prev) => ({ ...prev, monthlyTarget: v }));
    }}
    onSaveTarget={() => handleSaveMonthlyTarget(targetMonthKey, monthlyTarget)}
    onGoToSales={(target) => {
      setHomeLandingTarget(target);
      setStoreOwnerPage("sales");
    }}
    onViewCoach={(target) => {
      setHomeLandingTarget(target);
      setStoreOwnerPage("detail");
    }}
    country={data.country || storeCountry}
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
      storeName={storeName}
      homeLandingTarget={homeLandingTarget === "sales:manual" || homeLandingTarget === "sales:ocr" ? homeLandingTarget : null}
      onHomeLandingHandled={() => setHomeLandingTarget(null)}
    />
  );

  const detailPage = (
    <DetailPage
      selectedDate={data.date}
      data={data}
      showToast={showToast}
      storeId={storeId!}
      userEmail={email}
      homeLandingTarget={homeLandingTarget === "coach:insight" || homeLandingTarget === "coach:report" ? homeLandingTarget : null}
      onHomeLandingHandled={() => setHomeLandingTarget(null)}
    />
  );

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

  const morePage = <MorePage onLogout={handleLogout} />;

  if (storeOwnerPage === "admin_create") {
    return <AdminCreateUserPage />;
  }

  return (
    <>
    <StoreOwnerShell
  currentPage={storeOwnerPage}
  onChangePage={setStoreOwnerPage}
  onChangeDate={setSelectedDate}
  onMonthChange={(month) => {
    const monthDate = formatLocalDate(month);
    void handleMonthChange(monthDate);
    void refreshMonthlyStats(monthDate.substring(0, 7));
  }}
  datesWithData={datesWithData}
  selectedDate={data.date}
  monthlyTarget={monthlyTarget}
  monthlyRate={monthlyRate}
  country={data.country || storeCountry}
  onLogout={handleLogout}
>
        <StoreOwnerPageRouter
          currentPage={storeOwnerPage}
          summaryPage={summaryPage}
          salesPage={salesPage}
          detailPage={detailPage}
          menuPage={menuPage}
          morePage={morePage}
        />
      </StoreOwnerShell>
    </>
  );
};

export default App;
