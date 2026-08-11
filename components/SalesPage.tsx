import React from "react";
import DailySalesPage from "./DailySalesPage";
import type { SalesReportData } from "../types";

type Props = {
  data: SalesReportData;
  setData: React.Dispatch<React.SetStateAction<SalesReportData>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  datesWithData: string[];
  onMonthChange: (month: Date) => void;
  refreshMonthlyStats: (yearMonth: string) => Promise<void>;
  showToast: (msg: string) => void;
  onDelete: () => Promise<void>;
  storeId: number;
  storeName: string;
  homeLandingTarget: "sales:manual" | "sales:ocr" | null;
  onHomeLandingHandled: () => void;
};

const SalesPage: React.FC<Props> = ({
  data,
  setData,
  setSelectedDate,
  datesWithData,
  onMonthChange,
  refreshMonthlyStats,
  showToast,
  onDelete,
  storeId,
  storeName,
  homeLandingTarget,
  onHomeLandingHandled,
}) => {
  return (
    <DailySalesPage
      data={data}
      setData={setData}
      setSelectedDate={setSelectedDate}
      datesWithData={datesWithData}
      onMonthChange={onMonthChange}
      refreshMonthlyStats={refreshMonthlyStats}
      showToast={showToast}
      onDelete={onDelete}
      storeId={storeId}
      storeName={storeName}
      homeLandingTarget={homeLandingTarget}
      onHomeLandingHandled={onHomeLandingHandled}
    />
  );
};

export default SalesPage;
