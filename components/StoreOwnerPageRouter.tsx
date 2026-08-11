import type { ReactNode } from "react";
import type { StoreOwnerPageKey } from "./StoreOwnerShell";

type Props = {
  currentPage: StoreOwnerPageKey;
  summaryPage: ReactNode;
  salesPage: ReactNode;
  detailPage: ReactNode;
  menuPage: ReactNode;
  morePage: ReactNode;
};

export default function StoreOwnerPageRouter({
  currentPage,
  summaryPage,
  salesPage,
  detailPage,
  menuPage,
  morePage,
}: Props) {
  if (currentPage === "summary") {
    return <>{summaryPage}</>;
  }

  if (currentPage === "sales") {
    return <>{salesPage}</>;
  }

  if (currentPage === "detail") {
    return <>{detailPage}</>;
  }

  if (currentPage === "menu") {
    return <>{menuPage}</>;
  }

  if (currentPage === "more") {
    return <>{morePage}</>;
  }

  return <>{summaryPage}</>;
}
