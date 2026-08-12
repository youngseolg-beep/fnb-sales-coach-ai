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
  const visiblePage = currentPage === "summary"
    ? summaryPage
    : currentPage === "sales"
      ? salesPage
      : currentPage === "menu"
        ? menuPage
        : currentPage === "more"
          ? morePage
          : null;

  return <>
    <div className={currentPage === "detail" ? "" : "hidden"} aria-hidden={currentPage !== "detail"}>{detailPage}</div>
    {visiblePage}
  </>;
}
