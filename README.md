# 📝 ToDoList - AI 驅動的任務管理系統

一個功能完整的任務管理系統，採用前後端分離架構，支援多專案管理、拖放式看板、數據視覺化等功能。

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![Express](https://img.shields.io/badge/Express-4+-lightgrey)

## ✨ 主要功能

### 核心功能
- 🤖 **AI 智能助手** - 使用 LLM 自動拆解任務描述成結構化任務（NEW！）
- 🎯 **多專案管理** - 建立、編輯、刪除專案
- 📋 **看板系統** - 拖放式 Kanban（待辦、進行中、已完成）
- ✅ **任務管理** - 完整的任務生命週期管理
- 🏷️ **標籤系統** - 任務標籤、優先度、工時估算
- 📊 **數據視覺化** - D3.js 繪製專案進度和完成趨勢圖表
- 📱 **響應式設計** - 支援各種裝置尺寸

### 任務功能
- 🤖 **AI 自動拆解** - 輸入描述，自動生成任務、子任務、到期日、標籤和工時
- 子任務拆解與追蹤
- 到期日期與逾期提醒
- 預估工時管理
- 優先度設定（高、中、低）
- 標籤分類

### 視覺化
- 專案任務狀態分佈圖（D3.js 條狀圖）
- 任務完成趨勢圖（D3.js 折線圖）
- 總覽儀表板

## 🏗️ 技術架構

### 後端
- **框架**: Node.js + Express.js
- **資料庫**: MongoDB + Mongoose
- **認證**: JWT (JSON Web Token)
- **安全性**: bcryptjs 密碼加密
- **AI 整合**: OpenAI SDK + Ollama (本地 LLM)

### 前端
- **框架**: React 18
- **狀態管理**: React Context API
- **HTTP 客戶端**: Axios
- **視覺化**: D3.js
- **樣式**: Tailwind CSS

## 📋 系統需求

- Node.js 18 或更高版本
- MongoDB 6 或更高版本
- npm 或 yarn
- **Ollama** (用於 AI 功能，可選)

## 🚀 快速開始

### 1. 克隆專案

\`\`\`bash
git clone <repository-url>
cd ToDoList
\`\`\`

### 2. 安裝後端依賴

\`\`\`bash
cd backend
npm install
\`\`\`

### 3. 設定環境變數

在 `backend` 目錄下建立 `.env` 檔案：

\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/todolist

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# AI Configuration (可選，用於 AI 任務拆解功能)
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2
\`\`\`

### 3.5 設定 AI 功能（可選）

如果想使用 AI 任務拆解功能：

\`\`\`bash
# 1. 安裝 Ollama (https://ollama.ai/download)

# 2. 啟動 Ollama 服務
ollama serve

# 3. 下載模型
ollama pull llama3.2
\`\`\`

詳細設定請參考 [AI_SETUP.md](./AI_SETUP.md)

### 4. 啟動 MongoDB

確保 MongoDB 服務正在運行：

\`\`\`bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
\`\`\`

### 5. 啟動後端伺服器

\`\`\`bash
cd backend
npm run dev
\`\`\`

後端伺服器將在 `http://localhost:5000` 啟動

### 6. 安裝前端依賴

打開新的終端機視窗：

\`\`\`bash
cd frontend
npm install
\`\`\`

### 7. 啟動前端應用

\`\`\`bash
cd frontend
npm start
\`\`\`

前端應用將在 `http://localhost:3000` 啟動並自動開啟瀏覽器

## 📁 專案結構

\`\`\`
ToDoList/
├── backend/                 # 後端程式碼
│   ├── config/             # 配置檔案
│   │   └── database.js     # 資料庫連接
│   ├── controllers/        # 控制器
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/         # 中介軟體
│   │   ├── auth.js         # JWT 認證
│   │   └── errorHandler.js # 錯誤處理
│   ├── models/             # 資料模型
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/             # 路由定義
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── services/           # 服務層
│   │   └── llmService.js   # LLM AI 服務
│   ├── .gitignore
│   ├── package.json
│   ├── test-llm.js         # AI 功能測試腳本
│   └── server.js           # 伺服器入口
│
├── frontend/               # 前端程式碼
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # React 元件
│   │   │   ├── Dashboard.js
│   │   │   ├── LoginPage.js
│   │   │   ├── Sidebar.js
│   │   │   ├── BoardView.js
│   │   │   ├── KanbanColumn.js
│   │   │   ├── TaskCard.js
│   │   │   ├── TaskModal.js
│   │   │   ├── AddProjectModal.js
│   │   │   ├── OverviewDashboard.js
│   │   │   └── Icons.js
│   │   ├── contexts/       # Context API
│   │   │   └── AuthContext.js
│   │   ├── services/       # API 服務
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── .gitignore
│   └── package.json
│
├── sample/                 # 原始範例程式碼
│   └── index.js
│
└── README.md               # 本檔案
\`\`\`

## 🔌 API 端點

### 認證 API

| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| POST | `/api/auth/register` | 註冊新使用者 | 公開 |
| POST | `/api/auth/login` | 使用者登入 | 公開 |
| POST | `/api/auth/anonymous` | 匿名登入 | 公開 |
| GET | `/api/auth/me` | 取得當前使用者資訊 | 需認證 |

### 專案 API

| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| GET | `/api/projects` | 取得所有專案 | 需認證 |
| GET | `/api/projects/:id` | 取得單一專案 | 需認證 |
| POST | `/api/projects` | 建立新專案 | 需認證 |
| PUT | `/api/projects/:id` | 更新專案 | 需認證 |
| DELETE | `/api/projects/:id` | 刪除專案 | 需認證 |
| GET | `/api/projects/:id/stats` | 取得專案統計 | 需認證 |

### 任務 API

| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| GET | `/api/tasks` | 取得所有任務 | 需認證 |
| GET | `/api/tasks/:id` | 取得單一任務 | 需認證 |
| POST | `/api/tasks` | 建立新任務 | 需認證 |
| PUT | `/api/tasks/:id` | 更新任務 | 需認證 |
| PATCH | `/api/tasks/:id/status` | 更新任務狀態 | 需認證 |
| DELETE | `/api/tasks/:id` | 刪除任務 | 需認證 |
| **POST** | **`/api/tasks/ai/parse`** | **AI 任務拆解** | **需認證** |
| GET | `/api/tasks/analytics/completion-trend` | 取得完成趨勢 | 需認證 |
| GET | `/api/tasks/analytics/project-summary` | 取得專案摘要 | 需認證 |

詳細 API 文檔請參考 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

**AI 功能相關文檔：**
- [AI_SETUP.md](./AI_SETUP.md) - AI 功能設定與使用指南
- [TEST_AI_FEATURE.md](./TEST_AI_FEATURE.md) - AI 功能測試指南

## 🔒 安全性

- JWT Token 認證機制
- bcryptjs 密碼加密
- CORS 保護
- 輸入驗證
- 錯誤處理中介軟體

## 🎨 UI/UX 特色

- 現代化的 UI 設計
- 拖放式看板操作
- 響應式布局
- 流暢的動畫過渡
- 直覺的操作流程

## 📝 使用說明

### 註冊與登入
1. 開啟應用程式
2. 選擇「註冊」建立新帳號或「匿名登入」試用
3. 填寫必要資訊並送出

### 建立專案
1. 點擊側邊欄的「+ 新增專案」
2. 輸入專案名稱
3. 點擊「建立」

### 管理任務
1. 選擇一個專案
2. 點擊任一欄位底部的「+ 新增任務」
3. **（新功能）使用 AI 智能助手**：
   - 在彈窗頂部輸入任務描述
   - 點擊「✨ 使用 AI 自動拆解任務」
   - AI 會自動填充任務標題、子任務、到期日、標籤和工時
4. 或手動填寫任務詳情（標題、到期日、優先度等）
5. 可新增子任務進行任務拆解
6. 使用拖放功能改變任務狀態

### 查看總覽
1. 點擊側邊欄的「總覽」
2. 查看所有專案的任務分佈
3. 查看任務完成趨勢圖表

## 🛠️ 開發腳本

### 後端

\`\`\`bash
npm start       # 啟動生產環境伺服器
npm run dev     # 啟動開發環境伺服器（nodemon）
node test-llm.js # 測試 AI 功能（需先啟動 Ollama）
\`\`\`

### 前端

\`\`\`bash
npm start       # 啟動開發伺服器
npm run build   # 建置生產版本
npm test        # 執行測試
\`\`\`

## 📊 資料模型

### User（使用者）
- username: 使用者名稱
- email: 電子郵件
- password: 加密密碼
- isAnonymous: 是否為匿名使用者

### Project（專案）
- name: 專案名稱
- description: 專案描述
- userId: 所屬使用者
- color: 專案顏色

### Task（任務）
- content: 任務內容
- status: 狀態（todo/doing/done）
- projectId: 所屬專案
- userId: 所屬使用者
- dueDate: 到期日
- priority: 優先度
- tags: 標籤陣列
- subtasks: 子任務陣列
- estimatedEffortHours: 預估工時
- completedAt: 完成時間

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 👥 作者

ToDoList Development Team

## 📞 聯絡方式

如有問題或建議，歡迎聯繫我們。

---

**注意事項：**
- 請勿在生產環境中使用預設的 JWT_SECRET
- 建議使用環境變數管理敏感資訊
- 定期備份資料庫
- 保持依賴套件更新

