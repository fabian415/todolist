import axios from 'axios';

// 建立 axios 實例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器 - 自動添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器 - 統一處理錯誤
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 伺服器回應錯誤
      if (error.response.status === 401) {
        // Token 無效或過期，清除本地資料並重新導向登入
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      const message = error.response.data?.message || '發生錯誤';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // 請求已發送但沒有收到回應
      return Promise.reject(new Error('無法連接到伺服器'));
    } else {
      // 其他錯誤
      return Promise.reject(error);
    }
  }
);

// ==================== 認證 API ====================

export const authAPI = {
  // 註冊
  register: (userData) => api.post('/auth/register', userData),
  
  // 登入
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 匿名登入
  anonymousLogin: () => api.post('/auth/anonymous'),
  
  // 取得當前使用者資訊
  getMe: () => api.get('/auth/me')
};

// ==================== 專案 API ====================

export const projectAPI = {
  // 取得所有專案
  getAll: () => api.get('/projects'),
  
  // 取得單一專案
  getById: (id) => api.get(`/projects/${id}`),
  
  // 建立專案
  create: (projectData) => api.post('/projects', projectData),
  
  // 更新專案
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  
  // 刪除專案
  delete: (id) => api.delete(`/projects/${id}`),
  
  // 取得專案統計
  getStats: (id) => api.get(`/projects/${id}/stats`)
};

// ==================== 任務 API ====================

export const taskAPI = {
  // 取得所有任務（可篩選）
  getAll: (params = {}) => api.get('/tasks', { params }),
  
  // 取得單一任務
  getById: (id) => api.get(`/tasks/${id}`),
  
  // 建立任務
  create: (taskData) => api.post('/tasks', taskData),
  
  // 更新任務
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  
  // 更新任務狀態
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  
  // 刪除任務
  delete: (id) => api.delete(`/tasks/${id}`),
  
  // 取得完成趨勢
  getCompletionTrend: () => api.get('/tasks/analytics/completion-trend'),
  
  // 取得專案摘要
  getProjectSummary: () => api.get('/tasks/analytics/project-summary'),
  
  // AI 任務拆解
  parseWithAI: (description) => api.post('/tasks/ai/parse', { description })
};

export default api;

