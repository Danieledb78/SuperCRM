'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanColumnDef } from './kanban-board';

interface KanbanColumnProps {
  column: KanbanColumnDef;
  children: React.ReactNode;
  itemCount: number;
}

export function KanbanColumn({ column, children, itemCount }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || '#6B7280' }}
          />
          <h3 className="font-medium text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {itemCount}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'kanban-column transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-primary/20'
        )}
      >
        {children}
        {itemCount === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Nessun elemento
          </div>
        )}
      </div>
    </div>
  );
}
