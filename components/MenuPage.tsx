import React from "react";
import MenuSettingsPage from "./MenuSettingsPage";
import type { MenuCategory } from "../types";

type Props = {
  selectedDate: string;
  categories: MenuCategory[];
  originalCategories: MenuCategory[];
  onChangeCategories: (nextCategories: MenuCategory[]) => void;
  onSavePrices: () => Promise<void>;
  onReloadMenuMaster: () => Promise<void>;
  saving: boolean;
  storeId: number;
  country: string;
  onShowToast: (msg: string) => void;
};

const MenuPage: React.FC<Props> = ({
  selectedDate,
  categories,
  originalCategories,
  onChangeCategories,
  onSavePrices,
  onReloadMenuMaster,
  saving,
  storeId,
  country,
  onShowToast,
}) => {
  return (
    <MenuSettingsPage
      selectedDate={selectedDate}
      categories={categories}
      originalCategories={originalCategories}
      onChangeCategories={onChangeCategories}
      onSavePrices={onSavePrices}
      onReloadMenuMaster={onReloadMenuMaster}
      saving={saving}
      storeId={storeId}
      country={country}
      onShowToast={onShowToast}
    />
  );
};

export default MenuPage;
