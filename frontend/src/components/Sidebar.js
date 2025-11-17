import React from 'react';

function Sidebar({ isSidebarOpen, projects, selectedProjectId, onSelectProject, onOpenProjectModal, user, onLogout }) {
  return (
    <nav className={`bg-gray-800 text-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
      <div className="w-64 h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">我的專案</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* 回到總覽按鈕 */}
          <button
            onClick={() => onSelectProject(null)}
            className={`w-full text-left px-4 py-3 truncate ${
              selectedProjectId === null
                ? 'bg-blue-600 font-bold'
                : 'hover:bg-gray-700'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            總覽
          </button>
          
          {projects.map(project => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project._id)}
              className={`w-full text-left px-4 py-3 truncate ${
                project._id === selectedProjectId
                  ? 'bg-blue-600 font-bold'
                  : 'hover:bg-gray-700'
              } transition-colors`}
            >
              {project.name}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onOpenProjectModal}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-3"
          >
            + 新增專案
          </button>
          
          <div className="text-xs text-gray-400 truncate mb-2" title={`使用者: ${user?.username}`}>
            👤 {user?.username || '訪客'}
          </div>
          
          <button
            onClick={onLogout}
            className="w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            登出
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;



