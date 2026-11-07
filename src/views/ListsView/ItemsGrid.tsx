import React from "react";
import { ListItem, ListItemStatus } from "../../types";
import { ItemCard, ItemViewMode } from "./ItemCard";

interface ItemsGridProps {
  items: ListItem[];
  viewMode: ItemViewMode;
  onOpenStatusPicker: (
    item: ListItem,
    anchorRect: DOMRect,
    currentStatus: ListItemStatus,
  ) => void;
  onOpenItemDetail?: (item: ListItem) => void;
  onOpenContextMenu?: (item: ListItem, pos: { x: number; y: number }) => void;
}

export const ItemsGrid: React.FC<ItemsGridProps> = ({
  items,
  viewMode,
  onOpenStatusPicker,
  onOpenItemDetail,
  onOpenContextMenu,
}) => {
  const wrapper =
    viewMode === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5"
      : viewMode === "compact"
        ? "space-y-1.5"
        : "space-y-2.5";

  return (
    <div className={wrapper}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          viewMode={viewMode}
          onOpenStatusPicker={(rect, status) =>
            onOpenStatusPicker(item, rect, status)
          }
          onOpenItemDetail={onOpenItemDetail}
          onOpenContextMenu={onOpenContextMenu}
        />
      ))}
    </div>
  );
};
