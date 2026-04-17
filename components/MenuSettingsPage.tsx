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
  categoryIndex: number;
  itemIndex: number;
  changed: boolean;
  actionSaving: boolean;
  onUpdateItemField: (
    categoryIndex: number,
    itemIndex: number,
    field: "name" | "price" | "unitCost",
    value: string
  ) => void;
  onOpenHistory: (menuId: string, menuName: string) => void;
  onDelete: () => void;
}

const MobileMenuCard: React.FC<{
  item: any;
  changed: boolean;
  actionSaving: boolean;
  categoryIndex: number;
  itemIndex: number;
  alternate: boolean;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  attributes?: any;
  listeners?: any;
  onUpdateItemField: (
    categoryIndex: number,
    itemIndex: number,
    field: "name" | "price" | "unitCost",
    value: string
  ) => void;
  onOpenHistory: (menuId: string, menuName: string) => void;
  onDelete: () => void;
}> = ({
  item,
  changed,
  actionSaving,
  categoryIndex,
  itemIndex,
  alternate,
  setActivatorNodeRef,
  attributes,
  listeners,
  onUpdateItemField,
  onOpenHistory,
  onDelete,
}) => {
  return (
    <div
      className={`grid grid-cols-1 gap-1 rounded-[16px] border border-slate-200 px-2 py-1.5 md:hidden ${
        alternate ? "bg-slate-50" : "bg-white"
      }`}
    >
      <div className="grid grid-cols-[26px_minmax(0,1fr)_64px] items-center gap-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          disabled={actionSaving}
          className="inline-flex h-7 w-7 shrink-0 touch-none select-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 shadow-sm active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          title="드래그해서 순서 변경"
        >
          ⋮⋮
        </button>

        <input
          type="text"
          value={item.name}
          onChange={(e) =>
            onUpdateItemField(categoryIndex, itemIndex, "name", e.target.value)
          }
          className="min-w-0 rounded-lg border px-2 py-1 text-[12px] font-bold text-slate-900 outline-none focus:border-slate-400"
        />

        <button
          type="button"
          onClick={onDelete}
          disabled={actionSaving}
          className="inline-flex h-7 w-full items-center justify-center rounded-lg border border-rose-200 bg-white px-1 text-[10px] font-bold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          메뉴삭제
        </button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_64px_64px] items-end gap-1">
        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500">
            PRICE
          </div>
          <input
            type="number"
            step="0.01"
            value={normalizeNumber(item.price)}
            onChange={(e) =>
              onUpdateItemField(categoryIndex, itemIndex, "price", e.target.value)
            }
            className="h-7 w-full rounded-lg border px-1.5 text-[12px] outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500">
            UNIT COST
          </div>
          <input
            type="number"
            step="0.01"
            value={normalizeNumber(item.unitCost)}
            onChange={(e) =>
              onUpdateItemField(categoryIndex, itemIndex, "unitCost", e.target.value)
            }
            className="h-7 w-full rounded-lg border px-1.5 text-[12px] outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-transparent">
            STATUS
          </div>
          <span
            className={`flex h-7 w-full items-center justify-center rounded-lg px-1 text-[9px] font-bold ${
              changed ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {changed ? "Changed" : "Saved"}
          </span>
        </div>

        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-transparent">
            HISTORY
          </div>
          <button
            type="button"
            onClick={() => onOpenHistory(item.id, item.name)}
            className="inline-flex h-7 w-full items-center justify-center rounded-lg border bg-white px-1 text-[10px] font-bold text-slate-700"
          >
            History
          </button>
        </div>
      </div>
    </div>
  );
};

const DesktopMenuCard: React.FC<{
  item: any;
  changed: boolean;
  actionSaving: boolean;
  categoryIndex: number;
  itemIndex: number;
  alternate: boolean;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  attributes?: any;
  listeners?: any;
  onUpdateItemField: (
    categoryIndex: number,
    itemIndex: number,
    field: "name" | "price" | "unitCost",
    value: string
  ) => void;
  onOpenHistory: (menuId: string, menuName: string) => void;
  onDelete: () => void;
}> = ({
  item,
  changed,
  actionSaving,
  categoryIndex,
  itemIndex,
  alternate,
  setActivatorNodeRef,
  attributes,
  listeners,
  onUpdateItemField,
  onOpenHistory,
  onDelete,
}) => {
  return (
    <div
      className={`hidden rounded-2xl border border-slate-200 p-3 md:grid md:grid-cols-12 md:items-center md:gap-3 ${
        alternate ? "bg-slate-50" : "bg-white"
      }`}
    >
      <div className="md:col-span-2">
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            disabled={actionSaving}
            className="inline-flex h-12 w-12 shrink-0 touch-none select-none items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-black text-slate-500 shadow-sm active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
            title="드래그해서 순서 변경"
          >
            ⋮⋮
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={item.name}
              onChange={(e) =>
                onUpdateItemField(categoryIndex, itemIndex, "name", e.target.value)
              }
              className="w-full rounded-xl border px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="text-xs font-semibold text-slate-400">드래그로 순서 변경</div>
      </div>

      <div className="md:col-span-2">
        <input
          type="number"
          step="0.01"
          value={normalizeNumber(item.price)}
          onChange={(e) =>
            onUpdateItemField(categoryIndex, itemIndex, "price", e.target.value)
          }
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="md:col-span-2">
        <input
          type="number"
          step="0.01"
          value={normalizeNumber(item.unitCost)}
          onChange={(e) =>
            onUpdateItemField(categoryIndex, itemIndex, "unitCost", e.target.value)
          }
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="md:col-span-1">
        <span
          className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold ${
            changed ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {changed ? "Changed" : "Saved"}
        </span>
      </div>

      <div className="md:col-span-1">
        <button
          type="button"
          onClick={() => onOpenHistory(item.id, item.name)}
          className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          History
        </button>
      </div>

      <div className="md:col-span-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={actionSaving}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          메뉴 삭제
        </button>
      </div>
    </div>
  );
};

const SortableMenuItem: React.FC<SortableMenuItemProps> = ({
  item,
  categoryIndex,
  itemIndex,
  changed,
  actionSaving,
  onUpdateItemField,
  onOpenHistory,
  onDelete,
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

  const alternate = itemIndex % 2 === 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-30" : ""}
    >
      <MobileMenuCard
        item={item}
        changed={changed}
        actionSaving={actionSaving}
        categoryIndex={categoryIndex}
        itemIndex={itemIndex}
        alternate={alternate}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        onUpdateItemField={onUpdateItemField}
        onOpenHistory={onOpenHistory}
        onDelete={onDelete}
      />

      <DesktopMenuCard
        item={item}
        changed={changed}
        actionSaving={actionSaving}
        categoryIndex={categoryIndex}
        itemIndex={itemIndex}
        alternate={alternate}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        onUpdateItemField={onUpdateItemField}
        onOpenHistory={onOpenHistory}
        onDelete={onDelete}
      />
    </div>
  );
};

const MobileDragPreviewCard: React.FC<{ item: DragPreviewItem }> = ({ item }) => {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-[16px] border border-slate-200 bg-white px-2 py-1.5 shadow-2xl ring-2 ring-indigo-200 md:hidden">
      <div className="grid grid-cols-[26px_minmax(0,1fr)_64px] items-center gap-1">
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-[11px] font-black text-indigo-500">
          ⋮⋮
        </div>

        <div className="min-w-0 truncate text-[12px] font-bold text-slate-900">
          {item.name}
        </div>

        <div className="inline-flex h-7 w-full items-center justify-center rounded-lg border border-rose-200 bg-white px-1 text-[10px] font-bold text-rose-600">
          메뉴삭제
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_64px_64px] items-end gap-1">
        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500">
            PRICE
          </div>
          <div className="h-7 rounded-lg border bg-slate-50 px-1.5 text-[12px] leading-[28px] text-slate-900">
            {normalizeNumber(item.price)}
          </div>
        </div>

        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500">
            UNIT COST
          </div>
          <div className="h-7 rounded-lg border bg-slate-50 px-1.5 text-[12px] leading-[28px] text-slate-900">
            {normalizeNumber(item.unitCost)}
          </div>
        </div>

        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-transparent">
            STATUS
          </div>
          <span
            className={`flex h-7 w-full items-center justify-center rounded-lg px-1 text-[9px] font-bold ${
              item.changed ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.changed ? "Changed" : "Saved"}
          </span>
        </div>

        <div>
          <div className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-transparent">
            HISTORY
          </div>
          <div className="inline-flex h-7 w-full items-center justify-center rounded-lg border bg-white px-1 text-[10px] font-bold text-slate-700">
            History
          </div>
        </div>
      </div>
    </div>
  );
};

const DesktopDragPreviewCard: React.FC<{ item: DragPreviewItem }> = ({ item }) => {
  return (
    <div className="hidden scale-[1.01] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-2 ring-indigo-200 md:grid md:grid-cols-12 md:items-center md:gap-3">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-lg font-black text-indigo-500 shadow-sm">
            ⋮⋮
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              {item.name}
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="text-xs font-semibold text-indigo-400">드래그로 순서 변경</div>
      </div>

      <div className="md:col-span-2">
        <div className="h-11 rounded-xl border bg-slate-50 px-3 text-sm leading-[44px] text-slate-900">
          {normalizeNumber(item.price)}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="h-11 rounded-xl border bg-slate-50 px-3 text-sm leading-[44px] text-slate-900">
          {normalizeNumber(item.unitCost)}
        </div>
      </div>

      <div className="md:col-span-1">
        <span
          className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold ${
            item.changed ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {item.changed ? "Changed" : "Saved"}
        </span>
      </div>

      <div className="md:col-span-1">
        <div className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-3 text-xs font-semibold text-slate-700">
          History
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600">
          메뉴 삭제
        </div>
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

  const updateItemField = (
    categoryIndex: number,
    itemIndex: number,
    field: "name" | "price" | "unitCost",
    value: string
  ) => {
    const next = draftCategories.map((category, cIdx) => {
      if (cIdx !== categoryIndex) return category;

      return {
        ...category,
        items: category.items.map((item, iIdx) => {
          if (iIdx !== itemIndex) return item;

          if (field === "name") {
            return {
              ...item,
              name: value,
            };
          }

          return {
            ...item,
            [field]: toNumber(value),
          };
        }),
      };
    });

    setDraftCategories(next);
  };

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
      <section className="space-y-4 pb-28">
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[12px] font-bold text-slate-900 md:text-xl">Menu Settings</h2>
              <p className="mt-0.5 text-[12px] font-medium text-slate-500 md:text-sm">
                선택 날짜 기준으로 메뉴명 / 가격 / 원가를 수정합니다.
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-slate-700 md:text-sm">
                Effective Date: {selectedDate}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-amber-600 md:text-xs">
                선택한 날짜부터 이 가격이 적용됩니다.
              </p>
              <p className="mt-1 hidden text-xs font-semibold text-indigo-600 md:block">
                모바일에서는 손잡이 버튼을 길게 누른 뒤 끌어서 순서를 바꾸세요.
              </p>
              {hasDuplicateNames && (
                <p className="mt-1 text-[12px] font-bold text-rose-600 md:text-xs">
                  중복 메뉴명이 있습니다. 저장 전에 수정해 주세요.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddMenuModal(true)}
                disabled={actionSaving}
                className="inline-flex h-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:rounded-xl md:px-4 md:text-sm md:font-semibold"
              >
                + 새 메뉴 만들기
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={
                  saving ||
                  actionSaving ||
                  hasDuplicateNames ||
                  (!uiOrderChanged && uiDirtyCount === 0)
                }
                className="inline-flex h-7 items-center justify-center rounded-lg bg-slate-900 px-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:rounded-xl md:px-4 md:text-sm md:font-semibold"
              >
                {saving || actionSaving
                  ? "Saving..."
                  : `변경사항 저장${uiDirtyCount > 0 ? ` (${uiDirtyCount})` : uiOrderChanged ? " (순서)" : ""}`}
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => handleCategoryDragStart(categoryIndex, event)}
              onDragEnd={(event) => handleCategoryDragEnd(categoryIndex, event)}
              onDragCancel={handleCategoryDragCancel}
            >
              <SortableContext
                items={category.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-3 space-y-3">
                  {category.items.map((item, itemIndex) => {
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
                        categoryIndex={categoryIndex}
                        itemIndex={itemIndex}
                        changed={changed}
                        actionSaving={actionSaving}
                        onUpdateItemField={updateItemField}
                        onOpenHistory={handleOpenHistory}
                        onDelete={() =>
                          setDeleteTarget({
                            categoryIndex,
                            itemIndex,
                            itemId: item.id,
                            itemName: item.name,
                          })
                        }
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

        <div className="fixed bottom-[56px] left-0 right-0 z-20 mx-auto w-full max-w-6xl px-2 md:bottom-20 md:px-4">
          <div className="rounded-[18px] border bg-white/96 p-2 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold text-slate-900 md:text-sm">
                  메뉴 가격 설정
                </div>
                <div className="text-[10px] leading-tight text-slate-500 md:text-xs">
                  변경된 메뉴 수: {uiDirtyCount} / Effective Date: {selectedDate}
                </div>
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
                className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 px-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:rounded-xl md:px-4 md:text-sm md:font-semibold"
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
                선택한 날짜 기준 메뉴명 변경 / 가격 변경 / 현재 메뉴 순서가 함께 저장됩니다.
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
