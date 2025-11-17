import React, { useCallback } from 'react';
import KanbanColumn from './KanbanColumn';

function BoardView({ columns, onDragStart, onDragOver, onDrop, onOpenTask, onAddTask, onCollapseSidebar }) {
  const handleScroll = useCallback((e) => {
    if (e.currentTarget.scrollLeft > 0) {
      onCollapseSidebar();
    }
  }, [onCollapseSidebar]);

  return (
    <div 
      className="flex-1 flex gap-4 p-4 overflow-x-auto"
      onScroll={handleScroll}
    >
      {columns.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, column.id)}
          onOpenTask={onOpenTask}
          onAddTask={() => onAddTask(column.id)}
        />
      ))}
    </div>
  );
}

export default BoardView;

