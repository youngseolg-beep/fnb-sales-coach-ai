import React, { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import type { MenuCategory } from "../types";
import {
  createMenu,
  deactivateMenu,
  updateMenuOrder,
} from "../services/menuMasterService";
import { supabase } from "../services/supabaseClient";

interface MenuSettingsPageProps {
  selectedDate: string;
  categories: MenuCategory[];
  originalCategories: MenuCategory[];
  onChangeCategories: (next: MenuCategory[]) => void;
  onSavePrices: () => Promise<void> | void;
  onReloadMenuMaster: () => Promise<void>;
  saving: boolean;
  onShowToast?: (msg: string) => void;
}

const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isSameValue = (a: any, b: any) => {
  return normalizeNumber(a) === normalizeNumber(b);
};

const compressHistoryRows = (rows: any[]) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const compressed: any[] = [];

  for (const row of rows) {
    if (compressed.length === 0) {
      compressed.push(row);
      continue;
    }

    const prev = compressed[compressed.length - 1];
    const samePrice = isSameValue(prev?.price, row?.price);
    const sameUnitCost = isSameValue(prev?.unit_cost, row?.unit_cost);

    if (!samePrice || !sameUnitCost) {
      compressed.push(row);
    }
  }

  return compressed;
};

const buildHistoryRanges = (rows: any[]) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const ascRows = [...rows].sort((a, b) =>
    String(a.effective_date).localeCompare(String(b.effective_date))
  );

  const compressed = compressHistoryRows(ascRows);

  if (compressed.length === 1) {
    return [
      {
        ...compressed[0],
        applied_range: `${compressed[0].effective_date} 이후`,
      },
    ];
  }

  const rangedRows = compressed.map((row, idx) => {
    const nextRow = compressed[idx + 1];

    let appliedRange = `${row.effective_date} 이후`;

    if (nextRow?.effective_date) {
      const endDate = format(
        subDays(parseISO(nextRow.effective_date), 1),
        "yyyy-MM-dd"
      );
      appliedRange = `${row.effective_date} ~ ${endDate}`;
    }

    return {
      ...row,
      applied_range: appliedRange,
    };
  });

  return rangedRows.reverse();
};

const slugify = (value: string) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣_-]/g, "");
};

const MenuSettingsPage: React.FC<MenuSettingsPageProps> = ({
  selectedDate,
  categories,
  originalCategories,
  onChangeCategories,
  onSavePrices,
  onReloadMenuMaster,
  saving,
  onShowToast,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [historyMenuName, setHistoryMenuName] = useState("");
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuCategoryName, setNewMenuCategoryName] = useState("");
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuUnitCost, setNewMenuUnitCost] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    categoryIndex: number;
    itemIndex: number;
    itemId: string;
    itemName: string;
  } | null>(null);

  const [actionSaving, setActionSaving] = useState(false);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else window.alert(msg);
  };

  const changedItems = useMemo(() => {
    const rows: Array<{
      id: string;
      name: string;
      oldPrice: number;
      newPrice: number;
      oldUnitCost: number;
      newUnitCost: number;
      priceChanged: boolean;
      unitCostChanged: boolean;
    }> = [];

    categories.forEach((category, cIdx) => {
      category.items.forEach((item, iIdx) => {
        const originalItem = originalCategories[cIdx]?.items?.[iIdx];

        if (!originalItem) return;

        const oldPrice = normalizeNumber(originalItem.price);
        const newPrice = normalizeNumber(item.price);
        const oldUnitCost = normalizeNumber(originalItem.unitCost);
        const newUnitCost = normalizeNumber(item.unitCost);

        const priceChanged = !isSameValue(newPrice, oldPrice);
        const unitCostChanged = !isSameValue(newUnitCost, oldUnitCost);

        if (priceChanged || unitCostChanged) {
          rows.push({
            id: item.id,
            name: item.name,
            oldPrice,
            newPrice,
            oldUnitCost,
            newUnitCost,
            priceChanged,
            unitCostChanged,
          });
        }
      });
    });

    return rows;
  }, [categories, originalCategories]);

  const dirtyCount = changedItems.length;

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

  const moveItem = async (
    categoryIndex: number,
    itemIndex: number,
    direction: "up" | "down"
  ) => {
    if (actionSaving) return;

    const category = categories[categoryIndex];
    if (!category) return;

    const items = [...category.items];
    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const temp = items[itemIndex];
    items[itemIndex] = items[targetIndex];
    items[targetIndex] = temp;

    const next = categories.map((cat, idx) => {
      if (idx !== categoryIndex) return cat;
      return {
        ...cat,
        items,
      };
    });

    onChangeCategories(next);

    try {
      setActionSaving(true);

      await Promise.all(items.map((item, idx) => updateMenuOrder(item.id, idx)));

      await onReloadMenuMaster();
      notify("메뉴 순서가 저장되었습니다.");
    } catch (error) {
      console.error("moveItem error:", error);
      notify("메뉴 순서 저장 중 오류가 발생했습니다.");
      await onReloadMenuMaster();
    } finally {
      setActionSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    await onSavePrices();
    setShowConfirmModal(false);
  };

  const handleOpenHistory = async (menuId: string, menuName: string) => {
    try {
      setHistoryLoading(true);
      setHistoryMenuName(menuName);
      setShowHistoryModal(true);

      const rows = await getMenuPriceHistory(menuId);
      const visibleRows = buildHistoryRanges(rows);

      setHistoryRows(visibleRows);
    } catch (error) {
      console.error("History Load Error:", error);
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddMenu = async () => {
    const categoryName = String(newMenuCategoryName || "").trim();
    const menuName = String(newMenuName || "").trim();
    const priceRaw = String(newMenuPrice || "").trim();
    const unitCostRaw = String(newMenuUnitCost || "").trim();

    if (!categoryName || !menuName || !priceRaw || !unitCostRaw) {
      notify("모든 항목을 입력해 주세요.");
      return;
    }

    const price = toNumber(priceRaw);
    const unitCost = toNumber(unitCostRaw);

    const duplicated = categories.some((cat) =>
      cat.items.some((item) => item.name.trim().toLowerCase() === menuName.toLowerCase())
    );

    if (duplicated) {
      notify("같은 이름의 메뉴가 이미 있습니다.");
      return;
    }

    const category = categories.find((cat) => cat.name === categoryName);
    if (!category) {
      notify("선택한 카테고리를 찾을 수 없습니다.");
      return;
    }

    const newId = `${slugify(categoryName)}-${slugify(menuName)}-${Date.now()}`;
    const displayOrder = category.items.length;

    try {
      setActionSaving(true);

      await createMenu(newId, menuName, categoryName, displayOrder);

      const { error: historyError } = await supabase
        .from("menu_price_history")
        .upsert(
          [
            {
              menu_id: newId,
              effective_date: selectedDate,
              price,
              unit_cost: unitCost,
            },
          ],
          {
            onConflict: "menu_id,effective_date",
          }
        );

      if (historyError) {
        console.error("initial price history insert error:", historyError);
        throw historyError;
      }

      await onReloadMenuMaster();

      setNewMenuCategoryName("");
      setNewMenuName("");
      setNewMenuPrice("");
      setNewMenuUnitCost("");
      setShowAddMenuModal(false);

      notify("새 메뉴가 추가되었습니다.");
    } catch (error) {
      console.error("handleAddMenu error:", error);
      notify("새 메뉴 추가 중 오류가 발생했습니다.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!deleteTarget) return;

    try {
      setActionSaving(true);

      await deactivateMenu(deleteTarget.itemId);
      await onReloadMenuMaster();

      setDeleteTarget(null);
      notify("메뉴가 삭제되었습니다.");
    } catch (error) {
      console.error("handleDeleteMenu error:", error);
      notify("메뉴 삭제 중 오류가 발생했습니다.");
    } finally {
      setActionSaving(false);
    }
  };

  return (
    <>
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
              <p className="mt-1 text-xs font-semibold text-amber-600">
                선택한 날짜부터 이 가격이 적용됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAddMenuModal(true)}
                disabled={actionSaving}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + 새 메뉴 만들기
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={saving || dirtyCount === 0 || actionSaving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : `가격 저장${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
              </button>
            </div>
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
              <div className="col-span-2">메뉴명</div>
              <div className="col-span-2">순서</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Unit Cost</div>
              <div className="col-span-1">상태</div>
              <div className="col-span-1">History</div>
              <div className="col-span-2">Delete</div>
            </div>

            <div className="mt-3 space-y-3">
              {category.items.map((item, itemIndex) => {
                const originalItem = originalCategories[categoryIndex]?.items?.[itemIndex];

                const changed = originalItem
                  ? !isSameValue(item.price, originalItem?.price) ||
                    !isSameValue(item.unitCost, originalItem?.unitCost)
                  : false;

                const isFirst = itemIndex === 0;
                const isLast = itemIndex === category.items.length - 1;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-2">
                      <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveItem(categoryIndex, itemIndex, "up")}
                          disabled={isFirst || actionSaving}
                          className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↑ 위로
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(categoryIndex, itemIndex, "down")}
                          disabled={isLast || actionSaving}
                          className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓ 아래로
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500 md:hidden">
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={normalizeNumber(item.price)}
                        onChange={(e) =>
                          updateItemField(categoryIndex, itemIndex, "price", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500 md:hidden">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={normalizeNumber(item.unitCost)}
                        onChange={(e) =>
                          updateItemField(categoryIndex, itemIndex, "unitCost", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="md:col-span-1">
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

                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(item.id, item.name)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        History
                      </button>
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            categoryIndex,
                            itemIndex,
                            itemId: item.id,
                            itemName: item.name,
                          })
                        }
                        disabled={actionSaving}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        메뉴 삭제
                      </button>
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
                onClick={() => setShowConfirmModal(true)}
                disabled={saving || dirtyCount === 0 || actionSaving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "가격 저장"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showAddMenuModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAddMenuModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b bg-indigo-50 px-6 py-4">
              <h3 className="text-lg font-black text-indigo-900">새 메뉴 추가</h3>
              <p className="mt-1 text-sm text-indigo-700">
                새 메뉴를 생성한 뒤 목록에 바로 반영합니다.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                <p className="text-xs font-bold text-indigo-700">
                  메뉴 생성 후 초기 가격 / 원가도 함께 저장합니다.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">카테고리</label>
                <select
                  value={newMenuCategoryName}
                  onChange={(e) => setNewMenuCategoryName(e.target.value)}
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">메뉴명</label>
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-indigo-400"
                  placeholder="예: 군만두"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-indigo-400"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMenuUnitCost}
                    onChange={(e) => setNewMenuUnitCost(e.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-indigo-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setShowAddMenuModal(false)}
                className="rounded-xl px-5 py-2 font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddMenu}
                disabled={actionSaving}
                className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSaving ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-black text-slate-900">메뉴 삭제</h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-700">
                <span className="font-bold">{deleteTarget.itemName}</span> 메뉴를 삭제하시겠습니까?
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl px-5 py-2 font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteMenu}
                disabled={actionSaving}
                className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSaving ? "처리 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-black text-slate-900">가격 저장 확인</h3>
              <p className="mt-1 text-sm text-slate-500">
                선택한 날짜부터 이 가격이 적용됩니다.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-400">Effective Date</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{selectedDate}</div>
                </div>
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-400">변경 메뉴 수</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{dirtyCount}개</div>
                </div>
                <div className="rounded-xl border bg-amber-50 p-3">
                  <div className="text-xs font-bold text-amber-600">주의</div>
                  <div className="mt-1 text-sm font-bold text-amber-700">
                    선택 날짜부터 적용
                  </div>
                </div>
              </div>

              <div className="max-h-80 overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-black text-slate-500">메뉴</th>
                      <th className="px-4 py-3 text-right font-black text-slate-500">Price</th>
                      <th className="px-4 py-3 text-right font-black text-slate-500">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {item.priceChanged ? (
                            <>
                              <span className="text-slate-400">{item.oldPrice}</span>
                              <span className="mx-2 text-slate-400">→</span>
                              <span className="text-slate-900">{item.newPrice}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {item.unitCostChanged ? (
                            <>
                              <span className="text-slate-400">{item.oldUnitCost}</span>
                              <span className="mx-2 text-slate-400">→</span>
                              <span className="text-slate-900">{item.newUnitCost}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {changedItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center font-bold text-slate-400">
                          변경된 항목이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl px-5 py-2 font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving || dirtyCount === 0}
                className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "저장 확정"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-black text-slate-900">{historyMenuName} 가격 변경 로그</h3>
              <p className="mt-1 text-sm text-slate-500">
                가격이 실제로 적용되는 기간 기준으로 표시합니다.
              </p>
            </div>

            <div className="px-6 py-5">
              {historyLoading ? (
                <div className="py-10 text-center font-bold text-slate-400">불러오는 중...</div>
              ) : (
                <div className="max-h-96 overflow-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-black text-slate-500">적용 기간</th>
                        <th className="px-4 py-3 text-right font-black text-slate-500">Price</th>
                        <th className="px-4 py-3 text-right font-black text-slate-500">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.length > 0 ? (
                        historyRows.map((row, idx) => (
                          <tr key={`${row.menu_id}-${row.effective_date}-${idx}`} className="border-b border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-800">{row.applied_range}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700">
                              {normalizeNumber(row.price)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700">
                              {normalizeNumber(row.unit_cost)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center font-bold text-slate-400">
                            실제 가격 변경 이력이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl px-5 py-2 font-bold text-slate-600 hover:bg-slate-100"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuSettingsPage;
