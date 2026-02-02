'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { KanbanItem } from './kanban-board';
import { GripVertical } from 'lucide-react';

interface KanbanCardProps {
  item: KanbanItem;
  onClick?: () => void;
  renderContent?: (item: KanbanItem) => React.ReactNode;
}

export function KanbanCard({ item, onClick, renderContent }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'kanban-card group',
        isDragging && 'dragging opacity-50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent ? (
            renderContent(item)
          ) : (
            <>
              <p className="font-medium text-sm">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
