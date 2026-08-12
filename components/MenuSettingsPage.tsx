import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragCancelEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { supabase } from "../services/supabaseClient";

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

type ChangedItemRow = {
  id: string;
  oldName: string;
  newName: string;
  nameChanged: boolean;
  oldPrice: number;
  newPrice: number;
  oldUnitCost: number;
  newUnitCost: number;
  priceChanged: boolean;
  unitCostChanged: boolean;
};

type DragPreviewItem = {
  id: string;
  name: string;
  price: number;
  unitCost?: number;
  changed: boolean;
};

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

const normalizeNameValue = (value: any) => String(value || "").trim();

const isSameName = (a: any, b: any) => {
  return normalizeNameValue(a) === normalizeNameValue(b);
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

interface SortableMenuItemProps {
  item: any;
  categoryName: string;
  categoryIndex: number;
  itemIndex: number;
  changed: boolean;
  actionSaving: boolean;
  onEdit: () => void;
}

const formatMenuNumber = (value: any) => normalizeNumber(value).toLocaleString();

const getFoodCostRate = (price: any, unitCost: any) => {
  const normalizedPrice = normalizeNumber(price);
  if (normalizedPrice <= 0) return 0;
  return (normalizeNumber(unitCost) / normalizedPrice) * 100;
};

const SortableMenuItem: React.FC<SortableMenuItemProps> = ({
  item,
  categoryName,
  categoryIndex,
  itemIndex,
  changed,
  actionSaving,
  onEdit,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    WebkitUserSelect: "none",
    userSelect: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-30" : ""}
    >
      <div className="relative rounded-[14px] border border-[#e7dfd8] bg-white shadow-[0_2px_8px_rgba(65,47,35,0.035)] transition-colors hover:border-[#d6c7bc]">
        <button
          type="button"
          onClick={onEdit}
          className="block w-full px-3.5 py-3 text-left"
          aria-label={`${item.name} 메뉴 수정`}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="break-words text-[14px] font-semibold leading-5 tracking-[-0.02em] text-[#211c19]">
                  {item.name}
                </h4>
                {changed && (
                  <span className="shrink-0 rounded-full bg-[#fff2d9] px-1.5 py-0.5 text-[8px] font-bold text-[#a1661d]">
                    수정됨
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[9px] font-medium text-[#93877f]">{categoryName}</p>
            </div>
            <span className="pt-0.5 text-[18px] leading-none text-[#7c6b60]">›</span>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-[#f0eae5] pt-2.5">
            <div>
              <p className="text-[9px] font-medium text-[#8c817a]">판매가</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#211c19]">{formatMenuNumber(item.price)}</p>
            </div>
            <div>
              <p className="text-[9px] font-medium text-[#8c817a]">원가</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#211c19]">{formatMenuNumber(item.unitCost)}</p>
            </div>
            <div className="rounded-[9px] bg-[#f8f4f0] px-2 py-1.5 text-right">
              <p className="text-[9px] font-medium text-[#8c817a]">원가율</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#6f4a32]">
                {getFoodCostRate(item.price, item.unitCost).toFixed(1)}%
              </p>
            </div>
          </div>
        </button>

        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          disabled={actionSaving}
          onClick={(event) => event.stopPropagation()}
          className="absolute right-8 top-2.5 inline-flex h-7 w-7 touch-none select-none items-center justify-center rounded-[8px] text-[12px] font-bold text-[#b1a69e] hover:bg-[#f5f0ec] hover:text-[#76503a] disabled:opacity-40"
          style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
          title="드래그해서 순서 변경"
          aria-label={`${item.name} 순서 변경`}
        >
          ⋮⋮
        </button>
      </div>
    </div>
  );
};

const MobileDragPreviewCard: React.FC<{ item: DragPreviewItem }> = ({ item }) => {
  return (
    <div className="w-[340px] rounded-[14px] border border-[#d6c7bc] bg-white p-3.5 shadow-xl ring-1 ring-[#8b5e3c]/15 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-[14px] font-semibold text-[#211c19]">{item.name}</div>
        <span className="text-[#9b8e85]">⋮⋮</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#f0eae5] pt-2">
        <div><p className="text-[9px] text-[#8c817a]">판매가</p><p className="text-[12px] font-semibold">{formatMenuNumber(item.price)}</p></div>
        <div><p className="text-[9px] text-[#8c817a]">원가</p><p className="text-[12px] font-semibold">{formatMenuNumber(item.unitCost)}</p></div>
        <div><p className="text-[9px] text-[#8c817a]">원가율</p><p className="text-[12px] font-semibold text-[#6f4a32]">{getFoodCostRate(item.price, item.unitCost).toFixed(1)}%</p></div>
      </div>
    </div>
  );
};

const DesktopDragPreviewCard: React.FC<{ item: DragPreviewItem }> = ({ item }) => {
  return (
    <div className="hidden w-[520px] rounded-[14px] border border-[#d6c7bc] bg-white p-4 shadow-xl ring-1 ring-[#8b5e3c]/15 md:block">
      <div className="flex items-center justify-between"><div className="text-[15px] font-semibold text-[#211c19]">{item.name}</div><span className="text-[#9b8e85]">⋮⋮</span></div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-[#f0eae5] pt-3">
        <div><p className="text-[10px] text-[#8c817a]">판매가</p><p className="text-[14px] font-semibold">{formatMenuNumber(item.price)}</p></div>
        <div><p className="text-[10px] text-[#8c817a]">원가</p><p className="text-[14px] font-semibold">{formatMenuNumber(item.unitCost)}</p></div>
        <div><p className="text-[10px] text-[#8c817a]">원가율</p><p className="text-[14px] font-semibold text-[#6f4a32]">{getFoodCostRate(item.price, item.unitCost).toFixed(1)}%</p></div>
      </div>
    </div>
  );
};

const DragPreviewCard: React.FC<{ item: DragPreviewItem }> = ({ item }) => {
  return (
    <>
      <MobileDragPreviewCard item={item} />
      <DesktopDragPreviewCard item={item} />
    </>
  );
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryName, setActiveCategoryName] = useState("전체");
  const [editTarget, setEditTarget] = useState<{
    categoryIndex: number;
    itemIndex: number;
    itemId: string;
    categoryName: string;
  } | null>(null);
  const [editMenuName, setEditMenuName] = useState("");
  const [editMenuPrice, setEditMenuPrice] = useState("");
  const [editMenuUnitCost, setEditMenuUnitCost] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    categoryIndex: number;
    itemIndex: number;
    itemId: string;
    itemName: string;
  } | null>(null);

  const [actionSaving, setActionSaving] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<DragPreviewItem | null>(null);
  const [draftSourceDate, setDraftSourceDate] = useState(selectedDate);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 10,
      },
    })
  );

  useEffect(() => {
    setDraftCategories(cloneCategories(categories));
    setDraftSourceDate(selectedDate);
  }, [categories, selectedDate]);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else window.alert(msg);
  };

  const originalItemMap = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        price: number;
        unitCost: number;
      }
    >();

    originalCategories.forEach((category) => {
      category.items.forEach((item) => {
        map.set(item.id, {
          name: normalizeNameValue(item.name),
          price: normalizeNumber(item.price),
          unitCost: normalizeNumber(item.unitCost),
        });
      });
    });

    return map;
  }, [originalCategories]);

  const changedItems = useMemo(() => {
    const rows: ChangedItemRow[] = [];

    draftCategories.forEach((category) => {
      category.items.forEach((item) => {
        const originalItem = originalItemMap.get(item.id);
        if (!originalItem) return;

        const oldName = normalizeNameValue(originalItem.name);
        const newName = normalizeNameValue(item.name);
        const oldPrice = normalizeNumber(originalItem.price);
        const newPrice = normalizeNumber(item.price);
        const oldUnitCost = normalizeNumber(originalItem.unitCost);
        const newUnitCost = normalizeNumber(item.unitCost);

        const nameChanged = !isSameName(newName, oldName);
        const priceChanged = !isSameValue(newPrice, oldPrice);
        const unitCostChanged = !isSameValue(newUnitCost, oldUnitCost);

        if (nameChanged || priceChanged || unitCostChanged) {
          rows.push({
            id: item.id,
            oldName,
            newName,
            nameChanged,
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

  const changedItemMap = useMemo(() => {
    const map = new Map<string, ChangedItemRow>();
    changedItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [changedItems]);

  const dirtyCount = changedItems.length;
  const isDateSwitching = draftSourceDate !== selectedDate;
  const uiDirtyCount = isDateSwitching ? 0 : dirtyCount;
  const menuCount = draftCategories.reduce((sum, category) => sum + category.items.length, 0);
  const categoryCount = draftCategories.length;

  const changedOrderItems = useMemo(() => {
    const rows: Array<{ id: string; displayOrder: number }> = [];

    draftCategories.forEach((category, categoryIndex) => {
      const originalIds = (originalCategories[categoryIndex]?.items ?? []).map((item) => item.id);
      const currentIds = category.items.map((item) => item.id);

      category.items.forEach((item, idx) => {
        if (originalIds[idx] !== currentIds[idx]) {
          rows.push({
            id: item.id,
            displayOrder: idx,
          });
        }
      });
    });

    return rows;
  }, [draftCategories, originalCategories]);

  const orderChanged = changedOrderItems.length > 0;
  const uiOrderChanged = isDateSwitching ? false : orderChanged;

  const hasDuplicateNames = useMemo(() => {
    const seen = new Set<string>();

    for (const category of draftCategories) {
      for (const item of category.items) {
        const name = normalizeNameValue(item.name).toLowerCase();
        if (!name) return true;
        if (seen.has(name)) return true;
        seen.add(name);
      }
    }

    return false;
  }, [draftCategories]);

  const openEditMenu = (
    categoryIndex: number,
    itemIndex: number,
    item: any,
    categoryName: string
  ) => {
    setEditTarget({ categoryIndex, itemIndex, itemId: item.id, categoryName });
    setEditMenuName(normalizeNameValue(item.name));
    setEditMenuPrice(String(normalizeNumber(item.price)));
    setEditMenuUnitCost(String(normalizeNumber(item.unitCost)));
  };

  const closeEditMenu = () => {
    setEditTarget(null);
    setEditMenuName("");
    setEditMenuPrice("");
    setEditMenuUnitCost("");
  };

  const handleApplyEdit = () => {
    if (!editTarget) return;

    const normalizedName = normalizeNameValue(editMenuName);
    if (!normalizedName) {
      notify("메뉴명을 비워둘 수 없습니다.");
      return;
    }

    const duplicated = draftCategories.some((category) =>
      category.items.some(
        (item) =>
          item.id !== editTarget.itemId &&
          normalizeNameValue(item.name).toLowerCase() === normalizedName.toLowerCase()
      )
    );

    if (duplicated) {
      notify("같은 이름의 메뉴가 이미 있습니다.");
      return;
    }

    setDraftCategories((currentCategories) =>
      currentCategories.map((category, categoryIndex) => {
        if (categoryIndex !== editTarget.categoryIndex) return category;
        return {
          ...category,
          items: category.items.map((item, itemIndex) =>
            itemIndex === editTarget.itemIndex
              ? {
                  ...item,
                  name: normalizedName,
                  price: toNumber(editMenuPrice),
                  unitCost: toNumber(editMenuUnitCost),
                }
              : item
          ),
        };
      })
    );
    closeEditMenu();
  };

  const filteredCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return draftCategories
      .filter(
        (category) => activeCategoryName === "전체" || category.name === activeCategoryName
      )
      .map((category, categoryIndex) => ({
        category,
        categoryIndex,
        items: category.items
          .map((item, itemIndex) => ({ item, itemIndex }))
          .filter(({ item }) => {
            if (!normalizedQuery) return true;
            return `${item.name} ${category.name}`.toLowerCase().includes(normalizedQuery);
          }),
      }))
      .filter(({ items }) => items.length > 0);
  }, [activeCategoryName, draftCategories, searchQuery]);

  const handleCategoryDragStart = (categoryIndex: number, event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const category = draftCategories[categoryIndex];
    const item = category.items.find((menu) => menu.id === activeId);

    if (!item) return;

    setActiveDragItem({
      id: item.id,
      name: item.name,
      price: normalizeNumber(item.price),
      unitCost: item.unitCost,
      changed: changedItemMap.has(item.id),
    });
  };

  const handleCategoryDragEnd = (categoryIndex: number, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveDragItem(null);
      return;
    }

    setDraftCategories((prev) =>
      prev.map((category, idx) => {
        if (idx !== categoryIndex) return category;

        const oldIndex = category.items.findIndex((item) => item.id === active.id);
        const newIndex = category.items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return category;

        return {
          ...category,
          items: arrayMove(category.items, oldIndex, newIndex),
        };
      })
    );

    setActiveDragItem(null);
  };

  const handleCategoryDragCancel = (_event?: DragCancelEvent) => {
    setActiveDragItem(null);
  };

  const handleConfirmSave = async () => {
    try {
      const blankNameExists = draftCategories.some((category) =>
        category.items.some((item) => !normalizeNameValue(item.name))
      );

      if (blankNameExists) {
        notify("메뉴명을 비워둘 수 없습니다.");
        return;
      }

      if (hasDuplicateNames) {
        notify("같은 이름의 메뉴가 있습니다. 메뉴명을 확인해 주세요.");
        return;
      }

      setActionSaving(true);

      const nameChangedItems = changedItems.filter((item) => item.nameChanged);
      if (nameChangedItems.length > 0) {
        for (const item of nameChangedItems) {
          const { error } = await supabase
            .from("menu_master")
            .update({ name: normalizeNameValue(item.newName) })
            .eq("id", item.id)
            .eq("store_id", storeId);

          if (error) throw error;
        }
      }

      if (changedOrderItems.length > 0) {
        await Promise.all(
          changedOrderItems.map((item) =>
            updateMenuOrder(item.id, item.displayOrder, storeId)
          )
        );
      }

      const priceOrCostChangedItems = changedItems.filter(
        (item) => item.priceChanged || item.unitCostChanged
      );

      if (priceOrCostChangedItems.length > 0) {
        await Promise.all(
          priceOrCostChangedItems.map((item) =>
            saveMenuPriceHistory(
              item.id,
              selectedDate,
              Number(item.newPrice ?? 0),
              item.newUnitCost !== null && item.newUnitCost !== undefined
                ? Number(item.newUnitCost)
                : undefined,
              storeId
            )
          )
        );
      }

      onChangeCategories(cloneCategories(draftCategories));
      await onReloadMenuMaster();

      setShowConfirmModal(false);
      notify("메뉴명 / 순서 / 가격이 저장되었습니다.");
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
      <section className="mx-auto max-w-[430px] space-y-3.5 pb-40">
        <div className="rounded-[16px] border border-[#e7ded7] bg-white p-4 shadow-[0_3px_12px_rgba(70,54,42,0.045)]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f8eee6] text-[#875333]">
              <i className="fa-solid fa-utensils text-[20px]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-[#6f4027]">Menu Management</h2>
              <p className="mt-1 text-[11px] text-[#504842]">메뉴 {menuCount}개를 관리하고 있습니다.</p>
              <p className="mt-0.5 text-[9px] font-medium text-[#978980]">적용일 {selectedDate} · 카테고리 {categoryCount}개</p>
            </div>
            <strong className="shrink-0 text-[28px] font-semibold tracking-[-0.05em] text-[#8b5e3c]">
              {menuCount}<span className="ml-0.5 text-[11px] font-medium">개</span>
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMenuModal(true)}
            disabled={actionSaving}
            className="mt-3.5 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#8b5e3c] text-[13px] font-semibold text-white shadow-[0_4px_10px_rgba(111,64,39,0.14)] hover:bg-[#74472d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="mr-2 text-[18px] font-light">＋</span> 메뉴 추가
          </button>

          {hasDuplicateNames && (
            <p className="mt-2 text-[10px] font-semibold text-[#d75048]">중복 메뉴명이 있습니다. 저장 전에 수정해 주세요.</p>
          )}
        </div>

        <label className="relative block">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#8c7e75]" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="메뉴명, 카테고리 검색"
            className="h-11 w-full rounded-full border border-[#ded4cc] bg-white pl-10 pr-4 text-[12px] text-[#29231f] outline-none placeholder:text-[#a99f98] focus:border-[#8b5e3c]"
          />
        </label>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["전체", ...draftCategories.map((category) => category.name)].map((name) => {
            const active = activeCategoryName === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategoryName(name)}
                className={`h-8 shrink-0 rounded-full border px-3.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-[#8b5e3c] bg-[#8b5e3c] text-white"
                    : "border-[#e2d9d2] bg-white text-[#5f554f]"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredCategories.map(({ category, categoryIndex, items }) => (
            <div key={category.name}>
              <div className="mb-2 flex items-center justify-between px-0.5">
                <h3 className="text-[12px] font-semibold text-[#3b312b]">{category.name}</h3>
                <span className="text-[9px] font-medium text-[#998c84]">{items.length}개</span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => handleCategoryDragStart(categoryIndex, event)}
                onDragEnd={(event) => handleCategoryDragEnd(categoryIndex, event)}
                onDragCancel={handleCategoryDragCancel}
              >
                <SortableContext items={category.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                  {items.map(({ item, itemIndex }) => {
                    const originalItem = originalItemMap.get(item.id);
                    const changed =
                      !isDateSwitching && originalItem
                        ? !isSameName(item.name, originalItem.name) ||
                          !isSameValue(item.price, originalItem.price) ||
                          !isSameValue(item.unitCost, originalItem.unitCost)
                        : false;

                    return (
                      <SortableMenuItem
                        key={item.id}
                        item={item}
                        categoryName={category.name}
                        categoryIndex={categoryIndex}
                        itemIndex={itemIndex}
                        changed={changed}
                        actionSaving={actionSaving}
                        onEdit={() => openEditMenu(categoryIndex, itemIndex, item, category.name)}
                      />
                    );
                  })}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                  {activeDragItem ? <DragPreviewCard item={activeDragItem} /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="rounded-[14px] border border-[#e7dfd8] bg-white px-4 py-10 text-center">
              <p className="text-[12px] font-semibold text-[#5d514a]">검색 결과가 없습니다.</p>
              <p className="mt-1 text-[10px] text-[#958981]">다른 메뉴명이나 카테고리를 검색해 보세요.</p>
            </div>
          )}
        </div>

        <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 z-[10000] mx-auto w-full max-w-[430px] px-3">
          <div className="rounded-[14px] border border-[#e2d8d0] bg-white/96 p-2 shadow-[0_8px_20px_rgba(70,54,42,0.11)] backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-[#302722]">메뉴 변경사항</div>
                <div className="text-[9px] leading-tight text-[#887b73]">변경 {uiDirtyCount}개{uiOrderChanged ? " · 순서 변경" : ""} · 적용일 {selectedDate}</div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={
                  saving ||
                  actionSaving ||
                  hasDuplicateNames ||
                  (!uiOrderChanged && uiDirtyCount === 0)
                }
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-[9px] bg-[#8b5e3c] px-4 text-[12px] font-semibold text-white shadow-[0_4px_10px_rgba(111,64,39,0.14)] disabled:cursor-not-allowed disabled:bg-[#d8d1cc] disabled:shadow-none"
              >
                {saving || actionSaving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {editTarget && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center overflow-y-auto bg-[#2b221d]/45 p-4"
          onClick={closeEditMenu}
        >
          <div
            className="flex w-full max-w-[410px] max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[18px] border border-[#e5dcd5] bg-white shadow-[0_18px_48px_rgba(58,40,28,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#eee7e1] px-4 py-3.5">
              <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-[#211c19]">메뉴 수정</h3>
              <p className="mt-0.5 text-[9px] text-[#91857d]">적용일 {selectedDate}</p>
            </div>

            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">메뉴명</label>
                <input
                  type="text"
                  value={editMenuName}
                  onChange={(event) => setEditMenuName(event.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#dfd6cf] px-3 text-[13px] outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">카테고리</label>
                <div className="flex h-11 items-center rounded-[10px] border border-[#e7dfd8] bg-[#faf8f6] px-3 text-[13px] text-[#6e625b]">
                  {editTarget.categoryName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">판매가</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMenuPrice}
                    onChange={(event) => setEditMenuPrice(event.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#dfd6cf] px-3 text-right text-[13px] outline-none focus:border-[#8b5e3c]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">원가</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMenuUnitCost}
                    onChange={(event) => setEditMenuUnitCost(event.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#dfd6cf] px-3 text-right text-[13px] outline-none focus:border-[#8b5e3c]"
                  />
                </div>
              </div>

              <div className="rounded-[10px] border border-[#e8dfd8] bg-[#faf7f4] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#756961]">원가율 (자동 계산)</span>
                  <strong className="text-[14px] font-semibold text-[#6f4a32]">
                    {getFoodCostRate(editMenuPrice, editMenuUnitCost).toFixed(1)}%
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenHistory(editTarget.itemId, editMenuName)}
                className="inline-flex h-9 w-full items-center justify-between rounded-[9px] border border-[#e4dbd4] px-3 text-[11px] font-medium text-[#6f4a32]"
              >
                가격 변경 이력 <span>›</span>
              </button>
            </div>

            <div className="grid grid-cols-[0.9fr_1.1fr] gap-2 border-t border-[#eee7e1] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget({
                    categoryIndex: editTarget.categoryIndex,
                    itemIndex: editTarget.itemIndex,
                    itemId: editTarget.itemId,
                    itemName: editMenuName,
                  });
                  closeEditMenu();
                }}
                disabled={actionSaving}
                className="h-10 rounded-[9px] border border-[#efcfc9] text-[12px] font-semibold text-[#d83c35] disabled:opacity-50"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleApplyEdit}
                disabled={actionSaving}
                className="h-10 rounded-[9px] bg-[#8b5e3c] text-[12px] font-semibold text-white shadow-[0_4px_10px_rgba(111,64,39,0.14)] disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMenuModal && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center overflow-y-auto bg-[#2b221d]/45 p-4"
          onClick={() => setShowAddMenuModal(false)}
        >
          <div
            className="flex w-full max-w-lg max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[20px] border border-[#e8e1db] bg-white shadow-[0_18px_48px_rgba(58,40,28,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[#eee8e3] bg-[#fdfaf8] px-5 py-4">
              <h3 className="text-[16px] font-semibold text-[#211c19]">메뉴 추가</h3>
              <p className="mt-1 text-[10px] text-[#8c817a]">적용일 {selectedDate} 기준으로 새 메뉴를 등록합니다.</p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">카테고리</label>
                <select
                  value={newMenuCategoryName}
                  onChange={(e) => setNewMenuCategoryName(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#e5ddd7] bg-white px-3 text-sm outline-none focus:border-[#8b5e3c]"
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
                <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">메뉴명</label>
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#e5ddd7] bg-white px-3 text-sm outline-none focus:border-[#8b5e3c]"
                  placeholder="예: 군만두"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">판매가</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#e5ddd7] bg-white px-3 text-sm outline-none focus:border-[#8b5e3c]"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#5e534c]">원가</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMenuUnitCost}
                    onChange={(e) => setNewMenuUnitCost(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#e5ddd7] bg-white px-3 text-sm outline-none focus:border-[#8b5e3c]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="rounded-[10px] border border-[#e8dfd8] bg-[#faf7f4] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#756961]">원가율 (자동 계산)</span>
                  <strong className="text-[14px] font-semibold text-[#6f4a32]">
                    {getFoodCostRate(newMenuPrice, newMenuUnitCost).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-[#eee8e3] bg-white px-5 py-3">
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
                className="rounded-[9px] bg-[#8b5e3c] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#74472d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSaving ? "처리 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center overflow-y-auto bg-[#2b221d]/45 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="flex w-full max-w-md max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[20px] border border-[#e8e1db] bg-white shadow-[0_18px_48px_rgba(58,40,28,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[#eee8e3] bg-[#fdfaf8] px-5 py-4">
              <h3 className="text-lg font-black text-slate-900">메뉴 삭제</h3>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0ed] text-[20px] text-[#d83c35]">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              </div>
              <p className="mt-3 text-center text-[15px] font-semibold text-[#211c19]">메뉴를 삭제하시겠습니까?</p>
              <p className="mt-2 text-center text-[11px] leading-5 text-[#786c65]">
                <span className="font-semibold text-[#3d342f]">{deleteTarget.itemName}</span> 메뉴를 삭제하면<br />Sales 입력에서 선택할 수 없습니다.
              </p>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-[#eee8e3] bg-white px-5 py-3">
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
                className="rounded-[9px] bg-[#df3832] px-5 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSaving ? "처리 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center overflow-y-auto bg-[#2b221d]/45 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="flex w-full max-w-2xl max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[20px] border border-[#e8e1db] bg-white shadow-[0_18px_48px_rgba(58,40,28,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[#eee8e3] bg-[#fdfaf8] px-5 py-4">
              <h3 className="text-lg font-black text-slate-900">변경사항 저장 확인</h3>
              <p className="mt-1 text-sm text-slate-500">
                선택한 날짜 기준 메뉴명 변경 / 가격 변경 / 현재 메뉴 순서가 함께 저장됩니다.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-400">Effective Date</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{selectedDate}</div>
                </div>
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-400">변경 메뉴 수</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    메뉴 {uiDirtyCount}개 / 순서 {uiOrderChanged ? "변경됨" : "변경 없음"}
                  </div>
                </div>
                <div className="rounded-xl border bg-amber-50 p-3">
                  <div className="text-xs font-bold text-amber-600">주의</div>
                  <div className="mt-1 text-sm font-bold text-amber-700">
                    선택 날짜부터 적용
                  </div>
                </div>
              </div>

              <div className="max-h-[calc(100dvh-310px)] overflow-auto rounded-[12px] border border-[#e8e1db]">
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
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.nameChanged ? (
                            <>
                              <span className="text-slate-400">{item.oldName}</span>
                              <span className="mx-2 text-slate-400">→</span>
                              <span className="text-slate-900">{item.newName}</span>
                            </>
                          ) : (
                            item.newName
                          )}
                        </td>
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

            <div className="flex shrink-0 justify-end gap-2 border-t border-[#eee8e3] bg-white px-5 py-3">
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
                disabled={saving || actionSaving || hasDuplicateNames}
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
          className="fixed inset-0 z-[10002] flex items-center justify-center overflow-y-auto bg-[#2b221d]/45 p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="flex w-full max-w-2xl max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[20px] border border-[#e8e1db] bg-white shadow-[0_18px_48px_rgba(58,40,28,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[#eee8e3] bg-[#fdfaf8] px-5 py-4">
              <h3 className="text-[16px] font-semibold text-[#211c19]">{historyMenuName} 가격 변경 이력</h3>
              <p className="mt-1 text-[10px] text-[#8c817a]">
                가격이 실제로 적용되는 기간 기준으로 표시합니다.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {historyLoading ? (
                <div className="py-10 text-center font-bold text-slate-400">불러오는 중...</div>
              ) : (
                <div className="max-h-[calc(100dvh-250px)] overflow-auto rounded-[12px] border border-[#e8e1db]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#796d66]">변경 시각</th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#796d66]">판매가</th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#796d66]">원가</th>
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

            <div className="flex shrink-0 justify-end border-t border-[#eee8e3] bg-white px-5 py-3">
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
