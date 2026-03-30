import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { MenuCategory } from "../types";
import {
  createMenu,
  deactivateMenu,
  updateMenuOrder,
} from "../services/menuMasterService";
import {
  getMenuPriceHistory,
  saveMenuPriceHistory,
} from "../services/menuPriceService";

interface MenuSettingsPageProps {
  selectedDate: string;
  categories: MenuCategory[];
  originalCategories: MenuCategory[];
  onChangeCategories: (next: MenuCategory[]) => void;
  onSavePrices: () => Promise<void> | void;
  onReloadMenuMaster: () => Promise<void>;
  saving: boolean;
  storeId: number;
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

  const sortedRows = [...rows].sort((a, b) => {
    const aTime = String(a.created_at ?? "");
    const bTime = String(b.created_at ?? "");
    return bTime.localeCompare(aTime);
  });

  const visibleRows = compressHistoryRows(sortedRows);

  return visibleRows.map((row) => ({
    ...row,
    changed_at: row.created_at
      ? format(parseISO(row.created_at), "yyyy-MM-dd HH:mm:ss")
      : row.effective_date,
  }));
};

const slugify = (value: string) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣_-]/g, "");
};

const cloneCategories = (rows: MenuCategory[]) =>
  rows.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }));

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const MenuSettingsPage: React.FC<MenuSettingsPageProps> = ({
  selectedDate,
  categories,
  originalCategories,
  onChangeCategories,
  onSavePrices,
  onReloadMenuMaster,
  saving,
  storeId,
  onShowToast,
}) => {
  const [draftCategories, setDraftCategories] = useState<MenuCategory[]>(() =>
    cloneCategories(categories)
  );

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
  const [draggingItem, setDraggingItem] = useState<{
    categoryIndex: number;
    itemIndex: number;
    itemId: string;
  } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    categoryIndex: number;
    itemIndex: number;
  } | null>(null);

  useEffect(() => {
    setDraftCategories(cloneCategories(categories));
  }, [categories]);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else window.alert(msg);
  };

  const originalItemMap = useMemo(() => {
    const map = new Map<
      string,
      {
        price: number;
        unitCost: number;
      }
    >();

    originalCategories.forEach((category) => {
      category.items.forEach((item) => {
        map.set(item.id, {
          price: normalizeNumber(item.price),
          unitCost: normalizeNumber(item.unitCost),
        });
      });
    });

    return map;
  }, [originalCategories]);

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

    draftCategories.forEach((category) => {
      category.items.forEach((item) => {
        const originalItem = originalItemMap.get(item.id);
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
  }, [draftCategories, originalItemMap]);

  const dirtyCount = changedItems.length;

  const orderChanged = useMemo(() => {
    return draftCategories.some((category, categoryIndex) => {
      const originalIds = (originalCategories[categoryIndex]?.items ?? []).map((item) => item.id);
      const currentIds = category.items.map((item) => item.id);

      if (originalIds.length !== currentIds.length) return true;
      return originalIds.some((id, idx) => id !== currentIds[idx]);
    });
  }, [draftCategories, originalCategories]);

  const updateItemField = (
    categoryIndex: number,
    itemIndex: number,
    field: "price" | "unitCost",
    value: string
  ) => {
    const next = draftCategories.map((category, cIdx) => {
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

    setDraftCategories(next);
  };

  const moveItem = (
    categoryIndex: number,
    itemIndex: number,
    direction: "up" | "down"
  ) => {
    if (actionSaving) return;

    const category = draftCategories[categoryIndex];
    if (!category) return;

    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

    if (targetIndex < 0 || targetIndex >= category.items.length) {
      return;
    }

    const items = reorderItems(category.items, itemIndex, targetIndex);

    const next = draftCategories.map((cat, idx) => {
      if (idx !== categoryIndex) return cat;
      return {
        ...cat,
        items,
      };
    });

    setDraftCategories(next);
  };

  const moveItemToIndex = (categoryIndex: number, fromIndex: number, toIndex: number) => {
    if (actionSaving) return;
    if (fromIndex === toIndex) return;

    const category = draftCategories[categoryIndex];
    if (!category) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= category.items.length || toIndex >= category.items.length) return;

    const items = reorderItems(category.items, fromIndex, toIndex);

    const next = draftCategories.map((cat, idx) => {
      if (idx !== categoryIndex) return cat;
      return {
        ...cat,
        items,
      };
    });

    setDraftCategories(next);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    categoryIndex: number,
    itemIndex: number,
    itemId: string
  ) => {
    if (actionSaving) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    setDraggingItem({ categoryIndex, itemIndex, itemId });
    setDragOverItem({ categoryIndex, itemIndex });
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    categoryIndex: number,
    itemIndex: number
  ) => {
    if (!draggingItem) return;
    if (draggingItem.categoryIndex !== categoryIndex) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (
      !dragOverItem ||
      dragOverItem.categoryIndex !== categoryIndex ||
      dragOverItem.itemIndex !== itemIndex
    ) {
      setDragOverItem({ categoryIndex, itemIndex });
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    categoryIndex: number,
    itemIndex: number
  ) => {
    e.preventDefault();

    if (!draggingItem) return;
    if (draggingItem.categoryIndex !== categoryIndex) return;

    moveItemToIndex(categoryIndex, draggingItem.itemIndex, itemIndex);
    setDraggingItem(null);
    setDragOverItem(null);
  };

const handleDragEnd = () => {
  setDraggingItem(null);
  setDragOverItem(null);
};

const handleConfirmSave = async () => {
  try {
    setActionSaving(true);

    const updates: Promise<any>[] = [];

    for (let categoryIndex = 0; categoryIndex < draftCategories.length; categoryIndex++) {
      const category = draftCategories[categoryIndex];

      for (let itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
        const item = category.items[itemIndex];
        updates.push(updateMenuOrder(item.id, itemIndex, storeId));
      }
    }

    await Promise.all(updates);

    onChangeCategories(cloneCategories(draftCategories));

    await onSavePrices();
    await onReloadMenuMaster();

    setShowConfirmModal(false);
    notify("메뉴 순서 / 가격이 저장되었습니다.");
  } catch (error) {
    console.error("handleConfirmSave error:", error);
    notify("저장 중 오류가 발생했습니다.");
  } finally {
    setActionSaving(false);
  }
};

const handleOpenHistory = async (menuId: string, menuName: string) => {
  try {
    setHistoryLoading(true);
    setHistoryMenuName(menuName);
    setShowHistoryModal(true);

    const rows = await getMenuPriceHistory(menuId, storeId);
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

    const duplicated = draftCategories.some((cat) =>
      cat.items.some((item) => item.name.trim().toLowerCase() === menuName.toLowerCase())
    );

    if (duplicated) {
      notify("같은 이름의 메뉴가 이미 있습니다.");
      return;
    }

    const category = draftCategories.find((cat) => cat.name === categoryName);
    if (!category) {
      notify("선택한 카테고리를 찾을 수 없습니다.");
      return;
    }

    const newId = `${slugify(categoryName)}-${slugify(menuName)}-${Date.now()}`;
    const displayOrder = category.items.length;

    try {
      setActionSaving(true);

      await createMenu(newId, menuName, categoryName, displayOrder, storeId);
      await saveMenuPriceHistory(newId, selectedDate, price, unitCost, storeId);
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

      await deactivateMenu(deleteTarget.itemId, storeId);
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
              <p className="mt-2 text-xs font-semibold text-indigo-600">
                메뉴명 왼쪽 드래그 버튼으로 순서를 바꾼 뒤 저장하세요.
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
                disabled={saving || actionSaving || (!orderChanged && dirtyCount === 0)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving || actionSaving
                  ? "Saving..."
                  : `변경사항 저장${dirtyCount > 0 ? ` (${dirtyCount})` : orderChanged ? " (순서)" : ""}`}
              </button>
            </div>
          </div>
        </div>

        {draftCategories.map((category, categoryIndex) => (
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
                const originalItem = originalItemMap.get(item.id);

                const changed = originalItem
                  ? !isSameValue(item.price, originalItem.price) ||
                    !isSameValue(item.unitCost, originalItem.unitCost)
                  : false;

                const isFirst = itemIndex === 0;
                const isLast = itemIndex === category.items.length - 1;
                const isDragging =
                  draggingItem?.categoryIndex === categoryIndex &&
                  draggingItem?.itemIndex === itemIndex;
                const isDragOver =
                  dragOverItem?.categoryIndex === categoryIndex &&
                  dragOverItem?.itemIndex === itemIndex &&
                  draggingItem?.itemIndex !== itemIndex;

                return (
                  <div
                    key={item.id}
                    onDragOver={(e) => handleDragOver(e, categoryIndex, itemIndex)}
                    onDrop={(e) => handleDrop(e, categoryIndex, itemIndex)}
                    className={`grid grid-cols-1 gap-3 rounded-xl border p-3 transition md:grid-cols-12 md:items-center ${
                      isDragging ? "opacity-40" : ""
                    } ${
                      isDragOver ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200" : ""
                    }`}
                  >
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          draggable={!actionSaving}
                          onDragStart={(e) => handleDragStart(e, categoryIndex, itemIndex, item.id)}
                          onDragEnd={handleDragEnd}
                          disabled={actionSaving}
                          className="inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border bg-slate-50 text-base font-black text-slate-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                          title="드래그해서 순서 변경"
                        >
                          ⋮⋮
                        </button>
                        <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                      </div>
                    </div>

                   <div className="md:col-span-2">
  <div className="text-xs font-semibold text-slate-400">
    드래그로 순서 변경
  </div>
</div>
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
                disabled={saving || actionSaving || (!orderChanged && dirtyCount === 0)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving || actionSaving ? "Saving..." : "변경사항 저장"}
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
                  {draftCategories.map((category) => (
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
              <h3 className="text-lg font-black text-slate-900">변경사항 저장 확인</h3>
              <p className="mt-1 text-sm text-slate-500">
                선택한 날짜 기준 가격 변경과 현재 메뉴 순서가 함께 저장됩니다.
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
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    가격 {dirtyCount}개 / 순서 {orderChanged ? "변경됨" : "변경 없음"}
                  </div>
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
                disabled={saving || actionSaving}
                className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white disabled:opacity-50"
              >
                {saving || actionSaving ? "Saving..." : "저장 확정"}
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
                        <th className="px-4 py-3 text-left font-black text-slate-500">변경 시각</th>
                        <th className="px-4 py-3 text-right font-black text-slate-500">Price</th>
                        <th className="px-4 py-3 text-right font-black text-slate-500">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.length > 0 ? (
                        historyRows.map((row, idx) => (
                          <tr key={`${row.menu_id}-${row.effective_date}-${idx}`} className="border-b border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-800">{row.changed_at}</td>
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
