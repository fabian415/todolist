import React from 'react';
import { ClockIcon, ChecklistIcon } from './Icons';

function TaskCard({ task, onDragStart, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const priorityColor = {
    '高': 'bg-red-500',
    '中': 'bg-yellow-500',
    '低': 'bg-green-500'
  }[task.priority || '中'];
  
  const totalSubtasks = (task.subtasks || []).length;
  const completedSubtasks = (task.subtasks || []).filter(st => st.completed).length;

  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'border-l-4 border-red-500' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-800 font-medium break-words">{task.content}</p>
        {task.priority && (
          <span className={`text-xs text-white px-2 py-0.5 rounded-full ml-2 ${priorityColor} shrink-0`}>
            {task.priority}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-500 space-y-1">
        {task.dueDate && (
          <span className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            <ClockIcon />
            到期：{new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {totalSubtasks > 0 && (
          <span className="flex items-center">
            <ChecklistIcon />
            子任務：{completedSubtasks} / {totalSubtasks}
          </span>
        )}
        {(task.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(task.tags).map((tag, index) => (
              <span key={index} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCard;


