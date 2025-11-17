import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectAPI, taskAPI } from '../services/api';
import Sidebar from './Sidebar';
import BoardView from './BoardView';
import OverviewDashboard from './OverviewDashboard';
import TaskModal from './TaskModal';
import AddProjectModal from './AddProjectModal';
import { MenuIcon } from './Icons';

function Dashboard() {
  const { user, logout } = useAuth();
  
  // 狀態管理
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入專案
  const loadProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.data);
    } catch (err) {
      console.error('載入專案失敗:', err);
      setError('載入專案失敗');
    }
  }, []);

  // 載入任務
  const loadTasks = useCallback(async () => {
    try {
      const response = await taskAPI.getAll();
      setTasks(response.data.data);
    } catch (err) {
      console.error('載入任務失敗:', err);
      setError('載入任務失敗');
    }
  }, []);

  // 初始載入
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadProjects(), loadTasks()]);
      setLoading(false);
    };
    loadData();
  }, [loadProjects, loadTasks]);

  // 自動刷新（每 30 秒）
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks();
      loadProjects();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadProjects, loadTasks]);

  // 總覽儀表板資料處理
  const overviewData = useMemo(() => {
    const projectStatusSummary = projects.map(project => {
      const projectTasks = tasks.filter(task => {
        // 處理 projectId 可能是字符串或物件的情況
        const taskProjectId = typeof task.projectId === 'string' 
          ? task.projectId 
          : task.projectId?._id;
        return taskProjectId === project._id;
      });
      return {
        id: project._id,
        name: project.name,
        todo: projectTasks.filter(t => t.status === 'todo').length,
        doing: projectTasks.filter(t => t.status === 'doing').length,
        done: projectTasks.filter(t => t.status === 'done').length,
        total: projectTasks.length,
      };
    }).filter(p => p.total > 0);

    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt);
    const trendData = {};
    
    completedTasks.forEach(task => {
      const completionDate = new Date(task.completedAt);
      const dateKey = completionDate.toISOString().split('T')[0];
      trendData[dateKey] = (trendData[dateKey] || 0) + 1;
    });

    const completionTrend = Object.entries(trendData)
      .map(([date, count]) => ({ 
        date: new Date(date), 
        count 
      }))
      .sort((a, b) => a.date - b.date);

    return {
      projectStatusSummary,
      completionTrend
    };
  }, [tasks, projects]);

  // 獲取當前選中專案的任務
  const currentProjectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return tasks.filter(task => {
      // 處理 projectId 可能是字符串或物件的情況
      const taskProjectId = typeof task.projectId === 'string' 
        ? task.projectId 
        : task.projectId?._id;
      return taskProjectId === selectedProjectId;
    });
  }, [tasks, selectedProjectId]);

  // 將任務按狀態分類
  const taskColumns = useMemo(() => {
    const columns = {
      todo: { id: 'todo', title: '待辦事項', tasks: [] },
      doing: { id: 'doing', title: '進行中', tasks: [] },
      done: { id: 'done', title: '已完成', tasks: [] },
    };
    
    currentProjectTasks.forEach(task => {
      if (columns[task.status]) {
        columns[task.status].tasks.push(task);
      } else {
        columns.todo.tasks.push(task);
      }
    });
    
    return Object.values(columns);
  }, [currentProjectTasks]);

  // 新增專案
  const handleAddProject = async (projectName) => {
    if (!projectName.trim()) return;
    
    try {
      const response = await projectAPI.create({ name: projectName.trim() });
      setProjects([...projects, response.data.data]);
      setSelectedProjectId(response.data.data._id);
      setIsProjectModalOpen(false);
    } catch (err) {
      console.error('新增專案失敗:', err);
      alert('新增專案失敗');
    }
  };

  // 新增/儲存任務
  const handleSaveTask = async (taskData) => {
    try {
      if (taskData._id) {
        // 更新現有任務
        const { _id, projectId, userId, createdAt, updatedAt, __v, ...updateData } = taskData;
        const response = await taskAPI.update(_id, updateData);
        
        // 使用伺服器返回的完整資料更新本地狀態
        setTasks(tasks.map(t => t._id === _id ? response.data.data : t));
      } else {
        // 建立新任務
        const response = await taskAPI.create({
          ...taskData,
          projectId: selectedProjectId
        });
        // 後端已經 populate projectId，直接使用返回的資料
        setTasks([...tasks, response.data.data]);
      }
      
      setSelectedTask(null);
    } catch (err) {
      console.error('儲存任務失敗:', err);
      alert('儲存任務失敗');
    }
  };

  // 更新任務狀態（拖放）
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      
      // 更新本地狀態
      setTasks(tasks.map(task => 
        task._id === taskId 
          ? { 
              ...task, 
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : null
            } 
          : task
      ));
    } catch (err) {
      console.error('更新任務狀態失敗:', err);
      alert('更新任務狀態失敗');
    }
  };

  // 刪除任務
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('確定要刪除此任務嗎？')) return;
    
    try {
      await taskAPI.delete(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      setSelectedTask(null);
    } catch (err) {
      console.error('刪除任務失敗:', err);
      alert('刪除任務失敗');
    }
  };

  // 拖放處理
  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      const task = tasks.find(t => t._id === taskId);
      if (task && task.status !== newStatus) {
        handleUpdateTaskStatus(taskId, newStatus);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans overflow-hidden">
      {/* 側邊欄 */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        user={user}
        onLogout={logout}
      />

      {/* 主要看板區域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 z-10 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 mr-2"
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedProjectId === null 
                ? "總覽儀表板" 
                : (projects.find(p => p._id === selectedProjectId)?.name || "專案看板")}
            </h1>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </header>

        {selectedProjectId ? (
          <BoardView
            columns={taskColumns}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onOpenTask={(task) => setSelectedTask(task)}
            onAddTask={(status) => setSelectedTask({ 
              content: '', 
              status, 
              projectId: selectedProjectId,
              priority: '中',
              tags: [],
              subtasks: []
            })}
            onCollapseSidebar={() => setIsSidebarOpen(false)}
          />
        ) : (
          <OverviewDashboard
            overviewData={overviewData}
            onOpenProjectModal={() => setIsProjectModalOpen(true)}
            onSelectProject={setSelectedProjectId}
          />
        )}
      </main>

      {/* 任務詳情彈窗 */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* 新增專案彈窗 */}
      {isProjectModalOpen && (
        <AddProjectModal
          onClose={() => setIsProjectModalOpen(false)}
          onSave={handleAddProject}
        />
      )}
    </div>
  );
}

export default Dashboard;

