import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// 注意: D3.js 庫在某些執行環境中可能無法作為全域變數自動載入。
// 我們將添加邏輯來動態載入它，以確保圖表功能正常。

// 匯入 Firebase 模組
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// --- Firebase 設定 (從環境變數讀取) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// LLM 配置
const API_KEY = ""; // 留空，Canvas 環境會自動提供
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;


// --- 自訂 Hook: 動態載入 D3.js ---
// 用於解決 D3 庫未載入導致的圖表渲染錯誤
const useD3ScriptLoader = () => {
  // 檢查 D3 是否已全域可用
  const [d3Ready, setD3Ready] = useState(typeof d3 !== 'undefined');

  useEffect(() => {
    if (d3Ready) return;

    const D3_CDN = "https://d3js.org/d3.v7.min.js";
    // 檢查 script 標籤是否已存在
    const existingScript = document.querySelector(`script[src="${D3_CDN}"]`);

    if (existingScript) {
      existingScript.onload = () => setD3Ready(true);
      // 如果 D3 已經被載入但狀態未更新，則手動更新
      if (typeof d3 !== 'undefined') {
        setD3Ready(true);
      }
      return;
    }

    // 動態建立 script 標籤並載入 D3
    const script = document.createElement('script');
    script.src = D3_CDN;
    script.onload = () => {
      console.log("D3.js loaded successfully.");
      setD3Ready(true);
    };
    script.onerror = () => {
      console.error("Failed to load D3.js from CDN.");
      setD3Ready(true); // 即使失敗，也標記為準備就緒，以避免無限載入
    };
    document.head.appendChild(script);

    // 不需要清除，因為我們只需要載入一次
  }, [d3Ready]);

  return d3Ready;
};


// --- App 元件 ---
export default function App() {
  // --- 狀態管理 ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const d3Loaded = useD3ScriptLoader(); // D3 載入狀態

  const [projects, setProjects] = useState([]); // 專案列表
  const [tasks, setTasks] = useState([]); // 所有任務
  const [selectedProjectId, setSelectedProjectId] = useState(null); // 當前選中的專案
  const [selectedTask, setSelectedTask] = useState(null); // 當前開啟的任務 (用於詳情彈窗)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false); // 新增專案的彈窗
  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false); // LLM 任務生成彈窗
  const [llmTargetStatus, setLlmTargetStatus] = useState('todo'); // LLM 生成任務的目標狀態
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 側邊欄開關狀態

  // --- Firebase 初始化 ---
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);
      
      setDb(firestoreDb);
      setAuth(firebaseAuth);

      onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          // 處理登入
          try {
            if (typeof __initial_auth_token !== 'undefined') {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
            // 由於 onAuthStateChanged 會在登入後再次觸發，因此不需要在這裡設置 isAuthReady
          } catch (error) {
            console.error("Firebase 登入失敗:", error);
            setIsAuthReady(true); // 即使失敗，也要讓應用程式繼續執行（可能以匿名身份）
          }
        }
      });
    } catch (e) {
      console.error("Firebase 初始化失敗:", e);
    }
  }, []);

  // --- 訂閱 Firestore 資料 ---
  
  // 訂閱專案
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    const projectsCollectionPath = `artifacts/${appId}/users/${userId}/projects`;
    const q = query(collection(db, projectsCollectionPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(fetchedProjects);

      if (fetchedProjects.length === 0) {
        setSelectedProjectId(null);
      } else if (selectedProjectId === null && fetchedProjects.length > 0) {
        // 如果沒有選中專案，也不自動選擇第一個，保持在總覽頁
      }
    }, (error) => {
      console.error("讀取專案失敗:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, db, userId, selectedProjectId]);

  // 訂閱任務
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    const tasksCollectionPath = `artifacts/${appId}/users/${userId}/tasks`;
    const q = query(collection(db, tasksCollectionPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("讀取任務失敗:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, db, userId]);

  // --- 資料處理 ---
  
  // 總覽儀表板資料處理
  const overviewData = useMemo(() => {
    // 1. 專案狀態摘要 (Status Breakdown)
    const projectStatusSummary = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      return {
        id: project.id,
        name: project.name,
        todo: projectTasks.filter(t => t.status === 'todo').length,
        doing: projectTasks.filter(t => t.status === 'doing').length,
        done: projectTasks.filter(t => t.status === 'done').length,
        total: projectTasks.length,
      };
    }).filter(p => p.total > 0); // 只顯示有任務的專案

    // 2. 任務完成趨勢 (Completion Trend)
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt); 
    
    const trendData = {};
    
    completedTasks.forEach(task => {
      const completionDate = new Date(task.completedAt || task.createdAt);
      const dateKey = completionDate.toISOString().split('T')[0];
      trendData[dateKey] = (trendData[dateKey] || 0) + 1;
    });

    // 轉換為陣列格式，按日期排序
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
    return tasks.filter(task => task.projectId === selectedProjectId);
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

  // --- 事件處理函數 (LLM 彈窗) ---
  
  const handleOpenLlmModal = (status) => {
    setLlmTargetStatus(status);
    setIsLlmModalOpen(true);
  };
  
  const handleCloseLlmModal = () => {
    setIsLlmModalOpen(false);
  };
  

  // --- 事件處理函數 (資料庫操作) ---

  // 新增專案
  const handleAddProject = async (projectName) => {
    if (!db || !userId || !projectName.trim()) return;
    
    const projectsCollectionPath = `artifacts/${appId}/users/${userId}/projects`;
    try {
      const docRef = await addDoc(collection(db, projectsCollectionPath), {
        name: projectName.trim(),
        createdAt: new Date().toISOString()
      });
      setSelectedProjectId(docRef.id);
      setIsProjectModalOpen(false);
    } catch (e) {
      console.error("新增專案失敗:", e);
    }
  };

  // 儲存結構化任務 (LLM 生成/手動建立)
  const handleSaveStructuredTask = async (taskData, status) => {
    if (!db || !userId || !selectedProjectId) return false;

    // 將子任務轉換為 Firestore 格式 (添加 ID 和 completed 狀態)
    const subtasksWithId = (taskData.subtasks || []).map(st => ({
        content: st.content,
        estimatedHours: st.estimatedHours || 0,
        id: crypto.randomUUID(),
        completed: false,
    }));
    
    const tasksCollectionPath = `artifacts/${appId}/users/${userId}/tasks`;
    try {
      await addDoc(collection(db, tasksCollectionPath), {
        content: taskData.content || "新任務",
        status: status,
        projectId: selectedProjectId,
        dueDate: taskData.dueDate || null,
        estimatedEffortHours: taskData.estimatedEffortHours || null,
        priority: taskData.priority || '中',
        tags: taskData.tags || [],
        subtasks: subtasksWithId,
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
      return true;
    } catch (e) {
      console.error("儲存結構化任務失敗:", e);
      return false;
    }
  };

  // 更新任務 (用於拖放)
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!db || !userId) return;

    const taskDocPath = `artifacts/${appId}/users/${userId}/tasks/${taskId}`;
    const updateData = { status: newStatus };

    if (newStatus === 'done') {
      updateData.completedAt = new Date().toISOString();
    } else {
      updateData.completedAt = null;
    }

    try {
      const taskRef = doc(db, taskDocPath);
      await setDoc(taskRef, updateData, { merge: true });
    } catch (e) {
      console.error("更新任務狀態失敗:", e);
    }
  };

  // 儲存任務 (來自詳情彈窗)
  const handleSaveTask = async (updatedTask) => {
    if (!db || !userId) return;

    const { id, ...taskData } = updatedTask;
    const taskDocPath = `artifacts/${appId}/users/${userId}/tasks/${id}`;
    
    if (taskData.status === 'done' && !taskData.completedAt) {
        taskData.completedAt = new Date().toISOString();
    } else if (taskData.status !== 'done') {
        taskData.completedAt = null;
    }

    try {
      const taskRef = doc(db, taskDocPath);
      await setDoc(taskRef, taskData, { merge: true });
      setSelectedTask(null); // 關閉彈窗
    } catch (e) {
      console.error("儲存任務失敗:", e);
    }
  };

  // 刪除任務
  const handleDeleteTask = async (taskId) => {
    if (!db || !userId) return;
    
    const taskDocPath = `artifacts/${appId}/users/${userId}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, taskDocPath));
      setSelectedTask(null); // 如果在彈窗中刪除，關閉彈窗
    } catch (e) {
      console.error("刪除任務失敗:", e);
    }
  };


  // --- 拖放處理 ---
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
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
             handleUpdateTaskStatus(taskId, newStatus);
        }
    }
  };

  // --- 渲染 ---
  if (!isAuthReady || !d3Loaded) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-xl text-gray-600">
        {isAuthReady ? "載入 D3 圖表庫中..." : "初始化中，請稍候..."}
      </div>
    </div>;
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
        userId={userId}
      />

      {/* 主要看板區域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 z-10 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 mr-2"
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedProjectId === null ? "總覽儀表板" : (projects.find(p => p.id === selectedProjectId)?.name || "專案看板")}
          </h1>
        </header>

        {selectedProjectId ? (
          <BoardView
            columns={taskColumns}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onOpenTask={(task) => setSelectedTask(task)}
            onAddTask={handleOpenLlmModal} // 改變為打開 LLM 彈窗
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
      
      {/* LLM 任務生成彈窗 */}
      {isLlmModalOpen && (
        <LlmTaskGeneratorModal
          onClose={handleCloseLlmModal}
          targetStatus={llmTargetStatus}
          onSaveTask={handleSaveStructuredTask}
        />
      )}
    </div>
  );
}


// --- LLM API 呼叫函數 ---
async function generateStructuredTask(prompt) {
    const systemPrompt = "您是一個專業的專案經理助理。請根據用戶提供的自然語言描述，將任務拆解並結構化為 JSON 格式。請準確估算預估工時和優先度。日期格式必須為 YYYY-MM-DD 或 null。";
    
    // JSON Schema for structured response
    const responseSchema = {
      type: "OBJECT",
      properties: {
        "content": { "type": "STRING", "description": "主任務的簡潔標題，例如: 整理 Q4 報表" },
        "dueDate": { "type": "STRING", "description": "任務的預計完成日期，格式為 YYYY-MM-DD。如果描述中未提及具體日期，則設為 null" },
        "estimatedEffortHours": { "type": "NUMBER", "description": "主任務的總預估工時（小時），總和所有子任務的估時。請使用數字格式（例如：3.5, 4）。如果未明確提及，則合理估算，並設為 null" },
        "priority": { "type": "STRING", "description": "建議的優先度，應為 '高', '中', 或 '低'" },
        "tags": {
          "type": "ARRAY",
          "items": { "type": "STRING" },
          "description": "與任務相關的標籤列表，例如: 報表、Q4"
        },
        "subtasks": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "content": { "type": "STRING" },
              "estimatedHours": { "type": "NUMBER", "description": "子任務的預估工時（小時），取整數或半小時" }
            },
            "required": ["content", "estimatedHours"]
          },
          "description": "拆解後包含內容和估時的子任務列表"
        }
      },
      "required": ["content", "subtasks", "priority", "tags", "dueDate", "estimatedEffortHours"]
    };

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { // 修正： 'config' 應為 'generationConfig'
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    };

    // 處理 API 呼叫和重試
    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API response error: ${response.status} - ${errorBody}`);
            }

            const result = await response.json();
            const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (jsonText) {
                return JSON.parse(jsonText);
            }
            throw new Error("LLM 響應中缺少 JSON 內容。");

        } catch (error) {
            console.error(`LLM 呼叫失敗 (嘗試 ${attempt + 1}/${maxRetries}):`, error);
            attempt++;
            if (attempt < maxRetries) {
                // 指數退避
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error("無法從 LLM 生成結構化任務。請檢查網路或 API 限制。");
            }
        }
    }
}


// --- LLM 任務生成彈窗元件 ---
function LlmTaskGeneratorModal({ onClose, targetStatus, onSaveTask }) {
    const [prompt, setPrompt] = useState("");
    const [structuredTask, setStructuredTask] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("請輸入任務描述。");
            return;
        }
        setError(null);
        setIsLoading(true);
        setStructuredTask(null);

        try {
            const result = await generateStructuredTask(prompt);
            setStructuredTask(result);
        } catch (e) {
            setError(e.message || "任務生成失敗。請稍後再試。");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
        if (structuredTask) {
            const success = await onSaveTask(structuredTask, targetStatus);
            if (success) {
                onClose();
            } else {
                setError("儲存到資料庫失敗。");
            }
        }
    };
    
    // 用戶可以編輯 LLM 的結果
    const handleEditStructuredTask = (name, value) => {
        setStructuredTask(prev => ({ ...prev, [name]: value }));
    };
    
    const handleEditSubtask = (index, field, value) => {
        const newSubtasks = structuredTask.subtasks.map((st, i) => 
            i === index ? { ...st, [field]: value } : st
        );
        setStructuredTask(prev => ({ ...prev, subtasks: newSubtasks }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b bg-blue-500 text-white rounded-t-xl">
                    <h2 className="text-2xl font-bold">💡 AI 任務生成器</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-600">
                        <CloseIcon color="white" />
                    </button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* 步驟 1: 輸入描述 */}
                    <div className="mb-6 border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">1. 輸入任務描述 (自然語言)</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows="3"
                            placeholder="例如：下週三前把 Q4 報表整理好，包含數據匯入、視覺化圖表與審核，負責人小陳。"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="mt-3 px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center"
                        >
                            {isLoading ? (
                                <span className="animate-spin mr-2">⚙️</span>
                            ) : (
                                <span className="mr-2">✨</span>
                            )}
                            {isLoading ? "AI 正在思考中..." : "生成結構化任務"}
                        </button>
                        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                    </div>

                    {/* 步驟 2: 預覽與編輯 */}
                    {structuredTask && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">2. 預覽與編輯結果</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 主要資訊 */}
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <h4 className="font-bold text-lg mb-3 border-b pb-2 text-blue-700">任務主體</h4>
                                    
                                    <FormGroup label="任務標題">
                                        <input 
                                            type="text" 
                                            value={structuredTask.content} 
                                            onChange={(e) => handleEditStructuredTask('content', e.target.value)}
                                        />
                                    </FormGroup>

                                    <FormGroup label="目標狀態">
                                        <input type="text" value={targetStatus.toUpperCase()} disabled className="bg-yellow-100 text-yellow-800 font-bold" />
                                    </FormGroup>
                                    
                                    <FormGroup label="預計到期日">
                                        <input 
                                            type="date" 
                                            value={structuredTask.dueDate || ''} 
                                            onChange={(e) => handleEditStructuredTask('dueDate', e.target.value)}
                                        />
                                    </FormGroup>
                                    
                                    <FormGroup label="建議優先度">
                                        <select
                                            value={structuredTask.priority || '中'}
                                            onChange={(e) => handleEditStructuredTask('priority', e.target.value)}
                                        >
                                            <option value="高">高</option>
                                            <option value="中">中</option>
                                            <option value="低">低</option>
                                        </select>
                                    </FormGroup>
                                    
                                    <FormGroup label="預估總工時 (h)">
                                        <input 
                                            type="number" 
                                            step="0.5"
                                            value={structuredTask.estimatedEffortHours || ''} 
                                            onChange={(e) => handleEditStructuredTask('estimatedEffortHours', parseFloat(e.target.value) || null)}
                                        />
                                    </FormGroup>

                                    <FormGroup label="標籤 (Tags)">
                                        <input 
                                            type="text" 
                                            value={(structuredTask.tags || []).join(', ')} 
                                            onChange={(e) => handleEditStructuredTask('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                                            placeholder="以逗號分隔，例如: 報表, Q4"
                                        />
                                    </FormGroup>
                                </div>
                                
                                {/* 子任務列表 */}
                                <div className="p-4 rounded-lg border bg-white shadow-inner">
                                    <h4 className="font-bold text-lg mb-3 border-b pb-2 text-gray-800">子任務拆解 ({structuredTask.subtasks.length} 項)</h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {(structuredTask.subtasks || []).map((subtask, index) => (
                                            <div key={index} className="flex space-x-2 items-center bg-gray-50 p-3 rounded-md border">
                                                <input
                                                    type="text"
                                                    value={subtask.content}
                                                    onChange={(e) => handleEditSubtask(index, 'content', e.target.value)}
                                                    className="flex-1 p-1 border rounded"
                                                    placeholder="子任務內容"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={subtask.estimatedHours}
                                                    onChange={(e) => handleEditSubtask(index, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                                    className="w-16 p-1 border rounded text-center"
                                                />
                                                <span className="text-sm text-gray-500">h</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 彈窗底部 */}
                <div className="flex justify-end p-5 border-t bg-gray-100 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 mr-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        取消並關閉
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!structuredTask || isLoading}
                        className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        確認並新增任務
                    </button>
                </div>
            </div>
        </div>
    );
}

// 輔助組件：表單群組
function FormGroup({ label, children }) {
    return (
        <div className="mb-3">
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            {React.Children.map(children, child => 
                React.cloneElement(child, {
                    className: `w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${child.props.className || ''}`
                })
            )}
        </div>
    );
}


// --- 總覽儀表板元件 ---

function OverviewDashboard({ overviewData, onOpenProjectModal, onSelectProject }) {
  const { projectStatusSummary, completionTrend } = overviewData;
  const hasProjects = projectStatusSummary.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">專案績效總覽</h2>
      
      {!hasProjects ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <div className="text-center text-gray-500 p-4">
            <p className="text-lg md:text-xl">目前沒有活躍的任務和專案。</p>
            <button
              onClick={onOpenProjectModal}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
            >
              🚀 建立第一個專案
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 專案進度條狀圖 */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              各專案任務狀態分佈
            </h3>
            <ProjectProgressBarChart 
              data={projectStatusSummary} 
              onSelectProject={onSelectProject} 
            />
            <p className="mt-4 text-sm text-gray-500">
                點擊 Y 軸的專案名稱可快速切換到該看板。
            </p>
          </div>

          {/* 任務完成趨勢線圖 */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              近期任務完成趨勢 (每日)
            </h3>
            <CompletionTrendLineChart data={completionTrend} />
            <p className="mt-4 text-sm text-gray-500">
                顯示過去完成的任務數量，反映團隊的工作效率。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// D3 專案進度條狀圖元件 (RWD 修正版)
function ProjectProgressBarChart({ data, onSelectProject }) {
  const chartContainerRef = useRef(null);
  const svgRef = useRef(null);

  const drawChart = useCallback((width) => {
    // 檢查 D3 是否已載入
    if (!data.length || typeof d3 === 'undefined') {
      return;
    }

    const margin = { top: 10, right: 30, bottom: 40, left: 120 }; // 增加左邊距
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = data.length * 60; // 每個專案 60px 高

    // 確保 SVG 容器高度能容納所有內容
    const svgHeight = chartHeight + margin.top + margin.bottom;

    // 清理舊圖表
    const svgRoot = d3.select(svgRef.current);
    svgRoot.selectAll('*').remove();
    
    // 設定 SVG 屬性
    svgRoot
      .attr("width", width)
      .attr("height", svgHeight);

    const svg = svgRoot
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 堆疊數據轉換
    const keys = ['todo', 'doing', 'done'];
    const stack = d3.stack().keys(keys);
    const stackedData = stack(data);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 1])
      .range([0, chartWidth]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.3);
      
    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(['#ef4444', '#f59e0b', '#10b981']); // Red, Amber, Green

    // 繪製 Y 軸
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
      .selectAll('text')
      .style('cursor', 'pointer')
      .attr("class", "hover:underline")
      .on('click', (event, d) => {
        const project = data.find(p => p.name === d);
        if (project) {
          onSelectProject(project.id);
        }
      })
      .attr("fill", "#1d4ed8")
      .attr("font-weight", "600");

    // 繪製條形圖
    svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d.data.name))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("rx", 4)
        .attr("ry", 4)
      .append("title") // 提示框
        .text(d => {
            const keyMap = { todo: '待辦', doing: '進行中', done: '已完成' };
            return `${d.data.name} - ${keyMap[d.key]}: ${d.data[d.key]}`;
        });

    // 圖例
    const legend = svg.append("g")
        .attr("text-anchor", "start")
        .attr("transform", `translate(0, ${chartHeight + 20})`)
        .style("font-size", "12px");

    keys.forEach((key, i) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(${i * 70}, 0)`);
        
        legendItem.append("rect")
            .attr("x", 0)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color(key))
            .attr("rx", 2);
        
        legendItem.append("text")
            .attr("x", 12)
            .attr("y", 9)
            .text(key === 'todo' ? '待辦' : key === 'doing' ? '進行中' : '已完成')
            .attr("fill", "#4b5563");
    });

  }, [data, onSelectProject]);

  useEffect(() => {
    // 只有當 D3 全域可用時才開始監聽大小變化和繪製
    if (typeof d3 === 'undefined') return;

    const chartEl = chartContainerRef.current;
    if (!chartEl) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) {
        return;
      }
      const { width } = entries[0].contentRect;
      drawChart(width);
    });

    resizeObserver.observe(chartEl);

    // 初始繪製
    drawChart(chartEl.clientWidth);

    return () => resizeObserver.unobserve(chartEl);
  }, [data, drawChart]);

  // 如果 D3 未載入，顯示佔位符
  if (typeof d3 === 'undefined') {
    return (
        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
            圖表庫載入中... 請稍候。
        </div>
    );
  }

  return (
    <div ref={chartContainerRef} className="w-full h-auto min-h-[150px]">
        <svg ref={svgRef}></svg>
    </div>
  );
}

// D3 任務完成趨勢線圖元件 (RWD 修正版)
function CompletionTrendLineChart({ data }) {
  const chartContainerRef = useRef(null);
  const svgRef = useRef(null);

  const drawChart = useCallback((width) => {
    // 檢查 D3 是否已載入
    if (typeof d3 === 'undefined') {
        return;
    }
    
    // 清理舊圖表
    const svgRoot = d3.select(svgRef.current);
    svgRoot.selectAll('*').remove();
    
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = width * 0.6 - margin.top - margin.bottom; // 保持長寬比
    const svgHeight = chartHeight + margin.top + margin.bottom;

    // 處理空數據
    if (!data.length) {
        svgRoot
            .attr("width", width)
            .attr("height", svgHeight)
            .append("text")
            .attr("x", width / 2)
            .attr("y", svgHeight / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#9ca3af")
            .text("尚無已完成的任務");
        return;
    }

    const svg = svgRoot
      .attr("width", width)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. X 軸比例尺 (時間)
    const x = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([0, chartWidth]);

    // 繪製 X 軸
    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%m/%d")))
      .attr("font-size", "10px")
      .attr("color", "#6b7280");

    // 2. Y 軸比例尺 (數量)
    const yMax = d3.max(data, d => d.count) || 1;
    const y = d3.scaleLinear()
      .domain([0, yMax + Math.ceil(yMax * 0.1)]) // 增加一點頂部空間
      .range([chartHeight, 0]);

    // 繪製 Y 軸
    svg.append("g")
      .call(d3.axisLeft(y).ticks(Math.min(yMax, 5)).tickFormat(d3.format("d")))
      .attr("font-size", "10px")
      .attr("color", "#6b7280");
      
    // 3. 繪製線條
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);
      
    // 4. 繪製圓點 + Tooltip
    // 由於我們在 iFrame 中運行，直接操作 document.body 上的 Tooltip 可能會被限制或導致樣式問題。
    // 在這裡，我們將使用簡單的 <title> 標籤作為提示。
    svg.selectAll("dot")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.count))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .style("cursor", "pointer")
      .append("title")
        .text(d => `完成: ${d.count} (${d3.timeFormat("%Y/%m/%d")(d.date)})`);


  }, [data]);

  useEffect(() => {
    // 只有當 D3 全域可用時才開始監聽大小變化和繪製
    if (typeof d3 === 'undefined') return;

    const chartEl = chartContainerRef.current;
    if (!chartEl) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) {
        return;
      }
      const { width } = entries[0].contentRect;
      drawChart(width);
    });

    resizeObserver.observe(chartEl);

    // 初始繪製
    drawChart(chartEl.clientWidth);

    return () => resizeObserver.unobserve(chartEl);
  }, [data, drawChart]);

  // 如果 D3 未載入，顯示佔位符
  if (typeof d3 === 'undefined') {
    return (
        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg min-h-[150px] flex items-center justify-center">
            圖表庫載入中... 請稍候。
        </div>
    );
  }

  return (
    <div ref={chartContainerRef} className="w-full h-auto min-h-[150px]">
        <svg ref={svgRef}></svg>
    </div>
  );
}


// --- 其他子元件 (保持不變) ---

// 側邊欄元件
function Sidebar({ isSidebarOpen, projects, selectedProjectId, onSelectProject, onOpenProjectModal, userId }) {
  return (
    // 添加 overflow-hidden 確保內容被裁切
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
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full text-left px-4 py-3 truncate ${
                project.id === selectedProjectId
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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            + 新增專案
          </button>
          <div className="mt-4 text-xs text-gray-400 truncate" title={`您的使用者 ID: ${userId}`}>
            User ID: {userId}
          </div>
        </div>
      </div>
    </nav>
  );
}

// 看板檢視元件
function BoardView({ columns, onDragStart, onDragOver, onDrop, onOpenTask, onAddTask, onCollapseSidebar }) {
  
  // 處理滾動事件
  const handleScroll = useCallback((e) => {
    // 如果水平滾動位置大於 0 (表示向右滾動了)
    if (e.currentTarget.scrollLeft > 0) {
      onCollapseSidebar();
    }
  }, [onCollapseSidebar]);

  return (
    <div 
      className="flex-1 flex gap-4 p-4 overflow-x-auto"
      onScroll={handleScroll} // 監聽滾動事件
    >
      {columns.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, column.id)}
          onOpenTask={onOpenTask}
          onAddTask={() => onAddTask(column.id)} // 改變為打開 LLM 彈窗
        />
      ))}
    </div>
  );
}

// 看板欄位元件
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
            key={task.id}
            task={task}
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={() => onOpenTask(task)}
          />
        ))}
      </div>
      <div className="p-2">
        <button
          onClick={onAddTask}
          className="w-full text-blue-600 font-medium hover:text-blue-800 hover:bg-gray-300 p-2 rounded-lg transition-colors border-2 border-dashed border-gray-400 hover:border-blue-500"
        >
          ✨ AI 生成/新增任務
        </button>
      </div>
    </div>
  );
}

// 任務卡片元件
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

// 任務詳情彈窗元件
function TaskModal({ task, onClose, onSave, onDelete }) {
  const [editedTask, setEditedTask] = useState(task);
  const [newSubtask, setNewSubtask] = useState("");

  const handleSave = () => {
    onSave(editedTask);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e, name) => {
      const value = parseFloat(e.target.value);
      setEditedTask(prev => ({ ...prev, [name]: isNaN(value) ? null : value }));
  };
  
  const handleDateChange = (e) => {
    setEditedTask(prev => ({ ...prev, dueDate: e.target.value ? e.target.value : null }));
  };
  
  const handleTagsChange = (e) => {
      const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t);
      setEditedTask(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleToggleSubtask = (subtaskId) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: crypto.randomUUID(), // 使用 crypto.randomUUID()
      content: newSubtask.trim(),
      estimatedHours: 0, // 新增子任務預設工時為 0
      completed: false
    };
    setEditedTask(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), subtask]
    }));
    setNewSubtask("");
  };

  const handleDeleteSubtask = (subtaskId) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };
  
  const handleSubtaskContentChange = (subtaskId, newContent) => {
      setEditedTask(prev => ({
          ...prev,
          subtasks: prev.subtasks.map(st =>
              st.id === subtaskId ? { ...st, content: newContent } : st
          )
      }));
  };
  
  const handleSubtaskHoursChange = (subtaskId, newHours) => {
      setEditedTask(prev => ({
          ...prev,
          subtasks: prev.subtasks.map(st =>
              st.id === subtaskId ? { ...st, estimatedHours: newHours } : st
          )
      }));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* 彈窗標題 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">編輯任務</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon />
          </button>
        </div>

        {/* 彈窗內容 */}
        <div className="p-6 overflow-y-auto">
          {/* 任務內容 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">任務標題</label>
          <input
            name="content"
            value={editedTask.content}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* 到期日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
              <input
                type="date"
                name="dueDate"
                value={editedTask.dueDate || ''}
                onChange={handleDateChange}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              />
            </div>
            
            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
              <select
                name="priority"
                value={editedTask.priority || '中'}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              >
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>
            
            {/* 預估工時 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">預估總工時 (h)</label>
              <input
                type="number"
                step="0.5"
                name="estimatedEffortHours"
                value={editedTask.estimatedEffortHours || ''}
                onChange={(e) => handleNumberChange(e, 'estimatedEffortHours')}
                placeholder="例如: 3.5"
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              />
            </div>
          </div>
          
          {/* 標籤 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">標籤 (Tags)</label>
            <input
              type="text"
              name="tags"
              value={(editedTask.tags || []).join(', ')}
              onChange={handleTagsChange}
              placeholder="以逗號分隔，例如: 報表, Q4"
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>


          {/* 子任務 */}
          <div className="mt-6">
            <h4 className="text-md font-bold text-gray-800 mb-3 border-b pb-2">子任務清單</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {(editedTask.subtasks || []).map(subtask => (
                <div key={subtask.id} className="flex items-center group bg-gray-50 p-3 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
                  />
                  <input
                    type="text"
                    value={subtask.content}
                    onChange={(e) => handleSubtaskContentChange(subtask.id, e.target.value)}
                    className={`ml-3 flex-1 text-gray-800 p-1 border rounded ${subtask.completed ? 'line-through bg-gray-100' : 'bg-white'}`}
                  />
                  <input
                      type="number"
                      step="0.5"
                      value={subtask.estimatedHours || 0}
                      onChange={(e) => handleSubtaskHoursChange(subtask.id, parseFloat(e.target.value) || 0)}
                      className="w-16 ml-2 p-1 border rounded text-center"
                      title="預估工時 (h)"
                  />
                  <span className="text-sm text-gray-500 ml-1 shrink-0">h</span>

                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="ml-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
            {/* 新增子任務 */}
            <div className="flex mt-4">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="新增子任務..."
                className="flex-1 p-2 border border-gray-300 rounded-l-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
              >
                新增
              </button>
            </div>
          </div>
        </div>

        {/* 彈窗底部 */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-800 font-medium flex items-center"
          >
            <TrashIcon /> 刪除任務
          </button>
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 新增專案彈窗元件
function AddProjectModal({ onClose, onSave }) {
  const [projectName, setProjectName] = useState("");

  const handleSave = () => {
    if (projectName.trim()) {
      onSave(projectName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">建立新專案</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">專案名稱</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="例如：網站重構、Q4 行銷計畫"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            建立
          </button>
        </div>
      </div>
    </div>
  );
}


// --- 圖示元件 ---

const ClockIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const ChecklistIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
  </svg>
);

const CloseIcon = ({ color = "currentColor" }) => (
  <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
);

// 漢堡選單圖示
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);