# API 文檔

## 基本資訊

- **Base URL**: `http://localhost:5000/api`
- **認證方式**: Bearer Token (JWT)
- **內容類型**: `application/json`

## 認證流程

### 1. 取得 Token

透過註冊或登入取得 JWT Token：

\`\`\`bash
POST /api/auth/login
\`\`\`

### 2. 使用 Token

在後續請求的 Header 中加入：

\`\`\`
Authorization: Bearer <your_token_here>
\`\`\`

---

## 認證 API

### 註冊

建立新的使用者帳號。

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **權限**: 公開

**請求 Body**:
\`\`\`json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
\`\`\`

**成功回應** (201):
\`\`\`json
{
  "success": true,
  "message": "註冊成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
\`\`\`

**錯誤回應** (400):
\`\`\`json
{
  "success": false,
  "message": "請提供所有必填欄位"
}
\`\`\`

---

### 登入

使用電子郵件和密碼登入。

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **權限**: 公開

**請求 Body**:
\`\`\`json
{
  "email": "john@example.com",
  "password": "password123"
}
\`\`\`

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
\`\`\`

**錯誤回應** (401):
\`\`\`json
{
  "success": false,
  "message": "電子郵件或密碼錯誤"
}
\`\`\`

---

### 匿名登入

建立臨時的匿名使用者帳號。

- **URL**: `/api/auth/anonymous`
- **方法**: `POST`
- **權限**: 公開

**成功回應** (201):
\`\`\`json
{
  "success": true,
  "message": "匿名登入成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "username": "訪客_abc123",
      "isAnonymous": true
    }
  }
}
\`\`\`

---

### 取得當前使用者資訊

取得已登入使用者的詳細資訊。

- **URL**: `/api/auth/me`
- **方法**: `GET`
- **權限**: 需認證

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "isAnonymous": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

---

## 專案 API

### 取得所有專案

取得當前使用者的所有專案。

- **URL**: `/api/projects`
- **方法**: `GET`
- **權限**: 需認證

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "網站重構專案",
      "description": "重新設計公司網站",
      "userId": "507f1f77bcf86cd799439011",
      "color": "#3B82F6",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

---

### 取得單一專案

取得特定專案的詳細資訊。

- **URL**: `/api/projects/:id`
- **方法**: `GET`
- **權限**: 需認證

**URL 參數**:
- `id`: 專案 ID

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "網站重構專案",
    "description": "重新設計公司網站",
    "userId": "507f1f77bcf86cd799439011",
    "color": "#3B82F6",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**錯誤回應** (404):
\`\`\`json
{
  "success": false,
  "message": "找不到專案"
}
\`\`\`

---

### 建立專案

建立新的專案。

- **URL**: `/api/projects`
- **方法**: `POST`
- **權限**: 需認證

**請求 Body**:
\`\`\`json
{
  "name": "Q4 行銷計畫",
  "description": "第四季度行銷活動規劃",
  "color": "#10B981"
}
\`\`\`

**成功回應** (201):
\`\`\`json
{
  "success": true,
  "message": "專案建立成功",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Q4 行銷計畫",
    "description": "第四季度行銷活動規劃",
    "userId": "507f1f77bcf86cd799439011",
    "color": "#10B981",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

---

### 更新專案

更新現有專案的資訊。

- **URL**: `/api/projects/:id`
- **方法**: `PUT`
- **權限**: 需認證

**URL 參數**:
- `id`: 專案 ID

**請求 Body**:
\`\`\`json
{
  "name": "Q4 行銷計畫（已更新）",
  "description": "更新後的描述",
  "color": "#EF4444"
}
\`\`\`

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "message": "專案更新成功",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Q4 行銷計畫（已更新）",
    "description": "更新後的描述",
    "color": "#EF4444"
  }
}
\`\`\`

---

### 刪除專案

刪除專案及其所有相關任務。

- **URL**: `/api/projects/:id`
- **方法**: `DELETE`
- **權限**: 需認證

**URL 參數**:
- `id`: 專案 ID

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "message": "專案刪除成功",
  "data": {}
}
\`\`\`

---

### 取得專案統計

取得專案的統計資料。

- **URL**: `/api/projects/:id/stats`
- **方法**: `GET`
- **權限**: 需認證

**URL 參數**:
- `id`: 專案 ID

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "data": {
    "total": 10,
    "todo": 3,
    "doing": 4,
    "done": 3,
    "highPriority": 2,
    "overdue": 1
  }
}
\`\`\`

---

## 任務 API

### 取得所有任務

取得任務列表，可依專案或狀態篩選。

- **URL**: `/api/tasks`
- **方法**: `GET`
- **權限**: 需認證

**查詢參數**:
- `projectId` (可選): 專案 ID
- `status` (可選): 任務狀態 (todo/doing/done)

**範例**:
\`\`\`
GET /api/tasks?projectId=507f1f77bcf86cd799439013&status=todo
\`\`\`

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "content": "設計首頁版面",
      "status": "todo",
      "projectId": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "網站重構專案",
        "color": "#3B82F6"
      },
      "userId": "507f1f77bcf86cd799439011",
      "dueDate": "2024-01-15",
      "priority": "高",
      "tags": ["設計", "UI"],
      "subtasks": [],
      "estimatedEffortHours": 8,
      "completedAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

---

### 取得單一任務

取得特定任務的詳細資訊。

- **URL**: `/api/tasks/:id`
- **方法**: `GET`
- **權限**: 需認證

**URL 參數**:
- `id`: 任務 ID

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "content": "設計首頁版面",
    "status": "todo",
    "projectId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "網站重構專案"
    },
    "dueDate": "2024-01-15",
    "priority": "高",
    "tags": ["設計", "UI"],
    "subtasks": [
      {
        "id": "subtask_1",
        "content": "設計 Header",
        "estimatedHours": 2,
        "completed": false
      }
    ],
    "estimatedEffortHours": 8
  }
}
\`\`\`

---

### 建立任務

建立新的任務。

- **URL**: `/api/tasks`
- **方法**: `POST`
- **權限**: 需認證

**請求 Body**:
\`\`\`json
{
  "content": "實作登入功能",
  "status": "todo",
  "projectId": "507f1f77bcf86cd799439013",
  "dueDate": "2024-01-20",
  "priority": "高",
  "tags": ["開發", "後端"],
  "estimatedEffortHours": 6,
  "subtasks": [
    {
      "content": "建立 API 端點",
      "estimatedHours": 3
    },
    {
      "content": "實作 JWT 驗證",
      "estimatedHours": 3
    }
  ]
}
\`\`\`

**成功回應** (201):
\`\`\`json
{
  "success": true,
  "message": "任務建立成功",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "content": "實作登入功能",
    "status": "todo",
    "projectId": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "dueDate": "2024-01-20",
    "priority": "高",
    "tags": ["開發", "後端"],
    "estimatedEffortHours": 6,
    "subtasks": [
      {
        "id": "generated_id_1",
        "content": "建立 API 端點",
        "estimatedHours": 3,
        "completed": false
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

---

### 更新任務

更新現有任務的資訊。

- **URL**: `/api/tasks/:id`
- **方法**: `PUT`
- **權限**: 需認證

**URL 參數**:
- `id`: 任務 ID

**請求 Body**:
\`\`\`json
{
  "content": "實作登入功能（已更新）",
  "status": "doing",
  "priority": "中",
  "tags": ["開發", "後端", "安全性"]
}
\`\`\`

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "message": "任務更新成功",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "content": "實作登入功能（已更新）",
    "status": "doing",
    "priority": "中",
    "tags": ["開發", "後端", "安全性"]
  }
}
\`\`\`

---

### 更新任務狀態

快速更新任務的狀態。

- **URL**: `/api/tasks/:id/status`
- **方法**: `PATCH`
- **權限**: 需認證

**URL 參數**:
- `id`: 任務 ID

**請求 Body**:
\`\`\`json
{
  "status": "done"
}
\`\`\`

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "message": "任務狀態更新成功",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "status": "done",
    "completedAt": "2024-01-05T10:30:00.000Z"
  }
}
\`\`\`

---

### 刪除任務

刪除特定任務。

- **URL**: `/api/tasks/:id`
- **方法**: `DELETE`
- **權限**: 需認證

**URL 參數**:
- `id`: 任務 ID

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "message": "任務刪除成功",
  "data": {}
}
\`\`\`

---

### 取得任務完成趨勢

取得任務完成趨勢資料，用於繪製圖表。

- **URL**: `/api/tasks/analytics/completion-trend`
- **方法**: `GET`
- **權限**: 需認證

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "count": 3
    },
    {
      "date": "2024-01-02",
      "count": 5
    },
    {
      "date": "2024-01-03",
      "count": 2
    }
  ]
}
\`\`\`

---

### 取得專案摘要

取得所有專案的任務狀態摘要。

- **URL**: `/api/tasks/analytics/project-summary`
- **方法**: `GET`
- **權限**: 需認證

**成功回應** (200):
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "網站重構專案",
      "todo": 3,
      "doing": 4,
      "done": 5,
      "total": 12
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "name": "Q4 行銷計畫",
      "todo": 2,
      "doing": 1,
      "done": 3,
      "total": 6
    }
  ]
}
\`\`\`

---

## 錯誤碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 400 | 請求參數錯誤 |
| 401 | 未授權（需要登入或 Token 無效） |
| 404 | 找不到資源 |
| 500 | 伺服器內部錯誤 |

## 錯誤回應格式

所有錯誤都會返回以下格式：

\`\`\`json
{
  "success": false,
  "message": "錯誤描述訊息"
}
\`\`\`

在開發環境中，還會額外包含 `stack` 欄位：

\`\`\`json
{
  "success": false,
  "message": "錯誤描述訊息",
  "stack": "Error stack trace..."
}
\`\`\`

---

## 使用範例

### 使用 curl

\`\`\`bash
# 註冊
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username":"john","email":"john@example.com","password":"123456"}'

# 登入
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"john@example.com","password":"123456"}'

# 取得專案列表（需要 Token）
curl -X GET http://localhost:5000/api/projects \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
\`\`\`

### 使用 JavaScript (Axios)

\`\`\`javascript
import axios from 'axios';

// 設定 Base URL 和 Token
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': \`Bearer \${localStorage.getItem('token')}\`
  }
});

// 取得專案列表
const getProjects = async () => {
  const response = await api.get('/projects');
  console.log(response.data);
};

// 建立新任務
const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  console.log(response.data);
};
\`\`\`

---

**最後更新**: 2024-01-01

