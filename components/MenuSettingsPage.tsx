import React, { useMemo } from "react";
import type { MenuCategory } from "../types";

interface MenuSettingsPageProps {
  selectedDate: string;
  categories: MenuCategory[];
  originalCategories: MenuCategory[];
  onChangeCategories: (next: MenuCategory[]) => void;
  onSavePrices: () => void;
  saving: boolean;
}

const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const MenuSettingsPage: React.FC<MenuSettingsPageProps> = ({
  selectedDate,
  categories,
  originalCategories,
  onChangeCategories,
  onSavePrices,
  saving,
}) => {
  const dirtyCount = useMemo(() => {
    let count = 0;

    categories.forEach((category, cIdx) => {
      category.items.forEach((item, iIdx) => {
        const originalItem = originalCategories[cIdx]?.items?.[iIdx];
        if (!originalItem) return;

        const priceChanged = Number(item.price) !== Number(originalItem.price);
        const costChanged = Number(item.unitCost) !== Number(originalItem.unitCost);

        if (priceChanged || costChanged) count += 1;
      });
    });

    return count;
  }, [categories, originalCategories]);

  const updateItemField = (
    categoryIndex: number,
    itemIndex: number,
    field: "price" | "unitCost",
    value: string
  ) => {
    const next = categories.map((category, cIdx) => {
      if (cIdx !== categoryIndex) return category;

      return {
        ...category,
        items: category.items.map((item, iIdx) => {
          if (iIdx !== itemIndex) return item;
          return {
            ...item,
            [field]: toNumber(value),
          };
        }),
      };
    });

    onChangeCategories(next);
  };

  return (
    <section className="space-y-4 pb-28">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Menu Settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              선택 날짜 기준으로 메뉴 가격 / 원가를 수정합니다.
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              Effective Date: {selectedDate}
            </p>
          </div>

          <button
            type="button"
            onClick={onSavePrices}
            disabled={saving || dirtyCount === 0}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : `가격 저장${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
          </button>
        </div>
      </div>

      {categories.map((category, categoryIndex) => (
        <div
          key={category.name}
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {category.items.length} items
            </span>
          </div>

          <div className="hidden grid-cols-12 gap-2 border-b pb-2 text-xs font-bold text-slate-500 md:grid">
            <div className="col-span-4">메뉴명</div>
            <div className="col-span-3">Price</div>
            <div className="col-span-3">Unit Cost</div>
            <div className="col-span-2">상태</div>
          </div>

          <div className="mt-3 space-y-3">
            {category.items.map((item, itemIndex) => {
              const originalItem = originalCategories[categoryIndex]?.items?.[itemIndex];
              const changed =
                Number(item.price) !== Number(originalItem?.price ?? item.price) ||
                Number(item.unitCost) !== Number(originalItem?.unitCost ?? item.unitCost);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-12 md:items-center"
                >
                  <div className="md:col-span-4">
                    <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.id}</div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-slate-500 md:hidden">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price ?? 0}
                      onChange={(e) =>
                        updateItemField(categoryIndex, itemIndex, "price", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-slate-500 md:hidden">
                      Unit Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitCost ?? 0}
                      onChange={(e) =>
                        updateItemField(categoryIndex, itemIndex, "unitCost", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <span
                      className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold ${
                        changed
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {changed ? "Changed" : "Saved"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="fixed bottom-20 left-0 right-0 z-20 mx-auto w-full max-w-6xl px-4">
        <div className="rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">메뉴 가격 설정</div>
              <div className="text-xs text-slate-500">
                변경된 메뉴 수: {dirtyCount} / Effective Date: {selectedDate}
              </div>
            </div>

            <button
              type="button"
              onClick={onSavePrices}
              disabled={saving || dirtyCount === 0}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "가격 저장"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSettingsPage;
