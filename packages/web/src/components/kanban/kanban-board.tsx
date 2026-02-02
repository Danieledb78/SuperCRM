'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

export interface KanbanItem {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  [key: string]: any;
}

export interface KanbanColumnDef {
  id: string;
  title: string;
  color?: string;
}

interface KanbanBoardProps {
  columns: KanbanColumnDef[];
  items: KanbanItem[];
  onDragEnd: (itemId: string, sourceColumnId: string, targetColumnId: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  renderCard?: (item: KanbanItem) => React.ReactNode;
}

export function KanbanBoard({
  columns,
  items,
  onDragEnd,
  onItemClick,
  renderCard,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;

    // Determine target column
    let targetColumnId: string;
    if (columns.some((col) => col.id === over.id)) {
      // Dropped on column
      targetColumnId = over.id as string;
    } else {
      // Dropped on item - get that item's column
      const overItem = items.find((i) => i.id === over.id);
      targetColumnId = overItem?.columnId || activeItem.columnId;
    }

    if (activeItem.columnId !== targetColumnId) {
      onDragEnd(activeItem.id, activeItem.columnId, targetColumnId);
    }
  };

  const getColumnItems = (columnId: string) => {
    return items.filter((item) => item.columnId === columnId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnItems = getColumnItems(column.id);
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              itemCount={columnItems.length}
            >
              <SortableContext
                items={columnItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnItems.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick?.(item)}
                    renderContent={renderCard}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="kanban-card opacity-80 rotate-3 shadow-lg">
            {renderCard ? renderCard(activeItem) : <p>{activeItem.title}</p>}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
