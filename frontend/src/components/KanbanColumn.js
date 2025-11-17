import React from 'react';
import TaskCard from './TaskCard';

function KanbanColumn({ column, onDragStart, onDragOver, onDrop, onOpenTask, onAddTask }) {
  return (
    <div
      className="w-80 bg-gray-200 rounded-lg shadow-md flex flex-col shrink-0"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <h3 className="text-lg font-semibold text-gray-700 p-4 border-b border-gray-300">
        {column.title} ({column.tasks.length})
      </h3>
      <div className="flex-1 p-2 overflow-y-auto min-h-[200px]">
        {column.tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onDragStart={(e) => onDragStart(e, task._id)}
            onClick={() => onOpenTask(task)}
          />
        ))}
      </div>
      <div className="p-2">
        <button
          onClick={onAddTask}
          className="w-full text-blue-600 font-medium hover:text-blue-800 hover:bg-gray-300 p-2 rounded-lg transition-colors border-2 border-dashed border-gray-400 hover:border-blue-500"
        >
          + 新增任務
        </button>
      </div>
    </div>
  );
}

export default KanbanColumn;



