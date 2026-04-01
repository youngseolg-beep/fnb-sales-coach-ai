import { useState } from "react";
import { loadMonthlyTarget, saveMonthlyTarget } from "../services/monthlyTargetService";

export const useMonthlyTarget = (storeId: number | null) => {
  const [monthlyTarget, setMonthlyTarget] = useState<number>(0);
  const [monthlyTargetLoading, setMonthlyTargetLoading] = useState(false);

  const refreshMonthlyTarget = async (monthKey: string) => {
    if (storeId == null) return;

    try {
      setMonthlyTargetLoading(true);
      const value = await loadMonthlyTarget(monthKey, storeId);
      setMonthlyTarget(value);
    } catch (error) {
      console.error("refreshMonthlyTarget error:", error);
      setMonthlyTarget(0);
    } finally {
      setMonthlyTargetLoading(false);
    }
  };

  const handleSaveMonthlyTarget = async (monthKey: string, nextValue: number) => {
    if (storeId == null) return;

    try {
      setMonthlyTarget(nextValue);
      await saveMonthlyTarget(monthKey, nextValue, storeId);
    } catch (error) {
      console.error("handleSaveMonthlyTarget error:", error);
      alert("월 목표 저장 중 오류가 발생했습니다.");
    }
  };

  return {
    monthlyTarget,
    setMonthlyTarget,
    monthlyTargetLoading,
    refreshMonthlyTarget,
    handleSaveMonthlyTarget,
  };
};
