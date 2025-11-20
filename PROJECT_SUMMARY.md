# 專案摘要 - ToDoList 任務管理系統

## 📋 專案概述

本專案將原本基於 Firebase 的單體式 React 應用程式，重構為**前後端分離**的現代化架構。

### 原始專案
- 單一 React 檔案（`sample/index.js`）
- 使用 Firebase Firestore 作為資料庫
- 使用 Firebase Auth 進行認證
- 整合 Gemini AI API
- D3.js 資料視覺化

### 重構後專案
- **前端**：React 18 + Tailwind CSS + D3.js
- **後端**：Node.js + Express.js + MongoDB
- **認證**：JWT Token
- **架構**：RESTful API

---

## 🏗️ 架構設計

### 後端架構 (Backend)

```
backend/
├── config/           # 配置檔案
│   └── database.js   # MongoDB 連接
├── controllers/      # 業務邏輯控制器
│   ├── authController.js      # 認證邏輯
│   ├── projectController.js   # 專案邏輯
│   └── taskController.js      # 任務邏輯
├── middleware/       # 中介軟體
│   ├── auth.js                # JWT 驗證
│   └── errorHandler.js        # 錯誤處理
├── models/           # 資料模型
│   ├── User.js                # 使用者 Schema
│   ├── Project.js             # 專案 Schema
│   └── Task.js                # 任務 Schema
├── routes/           # 路由定義
│   ├── auth.js
│   ├── projects.js
│   └── tasks.js
└── server.js         # 伺服器入口
```

**技術選型**：
- **Express.js**：輕量級 Web 框架
- **MongoDB + Mongoose**：NoSQL 資料庫，適合彈性資料結構
- **JWT**：無狀態認證，易於擴展
- **bcryptjs**：密碼加密
- **CORS**：跨域支援

### 前端架構 (Frontend)

```
frontend/
├── src/
│   ├── components/           # React 元件
│   │   ├── Dashboard.js          # 主儀表板
│   │   ├── LoginPage.js          # 登入頁
│   │   ├── Sidebar.js            # 側邊欄
│   │   ├── BoardView.js          # 看板視圖
│   │   ├── KanbanColumn.js       # 看板欄位
│   │   ├── TaskCard.js           # 任務卡片
│   │   ├── TaskModal.js          # 任務編輯
│   │   ├── AddProjectModal.js    # 新增專案
│   │   ├── OverviewDashboard.js  # 總覽儀表板
│   │   └── Icons.js              # 圖示元件
│   ├── contexts/             # 狀態管理
│   │   └── AuthContext.js        # 認證 Context
│   ├── services/             # API 服務
│   │   └── api.js                # API 封裝
│   ├── App.js                # 根元件
│   └── index.js              # 入口檔案
```

**技術選型**：
- **React 18**：最新版本，支援 Concurrent Mode
- **Context API**：全域狀態管理（認證狀態）
- **Axios**：HTTP 客戶端，支援攔截器
- **D3.js**：資料視覺化（圖表）
- **Tailwind CSS**：Utility-first CSS 框架

---

## 📊 資料模型設計

### User（使用者）
```javascript
{
  username: String,        // 使用者名稱
  email: String,          // 電子郵件（唯一）
  password: String,       // 加密密碼
  isAnonymous: Boolean,   // 是否為匿名使用者
  createdAt: Date         // 建立時間
}
```

### Project（專案）
```javascript
{
  name: String,           // 專案名稱
  description: String,    // 專案描述
  userId: ObjectId,       // 所屬使用者
  color: String,          // 專案顏色
  createdAt: Date,        // 建立時間
  updatedAt: Date         // 更新時間
}
```

### Task（任務）
```javascript
{
  content: String,                // 任務內容
  status: String,                 // 狀態（todo/doing/done）
  projectId: ObjectId,            // 所屬專案
  userId: ObjectId,               // 所屬使用者
  dueDate: Date,                  // 到期日
  estimatedEffortHours: Number,   // 預估工時
  priority: String,               // 優先度（高/中/低）
  tags: [String],                 // 標籤陣列
  subtasks: [{                    // 子任務陣列
    id: String,
    content: String,
    estimatedHours: Number,
    completed: Boolean
  }],
  completedAt: Date,              // 完成時間
  createdAt: Date,                // 建立時間
  updatedAt: Date                 // 更新時間
}
```

---

## 🔌 API 設計

### RESTful API 端點

#### 認證 API
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `POST /api/auth/anonymous` - 匿名登入
- `GET /api/auth/me` - 取得當前使用者

#### 專案 API
- `GET /api/projects` - 取得所有專案
- `GET /api/projects/:id` - 取得單一專案
- `POST /api/projects` - 建立專案
- `PUT /api/projects/:id` - 更新專案
- `DELETE /api/projects/:id` - 刪除專案
- `GET /api/projects/:id/stats` - 取得專案統計

#### 任務 API
- `GET /api/tasks` - 取得所有任務（支援篩選）
- `GET /api/tasks/:id` - 取得單一任務
- `POST /api/tasks` - 建立任務
- `PUT /api/tasks/:id` - 更新任務
- `PATCH /api/tasks/:id/status` - 更新任務狀態
- `DELETE /api/tasks/:id` - 刪除任務

#### 分析 API
- `GET /api/tasks/analytics/completion-trend` - 任務完成趨勢
- `GET /api/tasks/analytics/project-summary` - 專案摘要統計

---

## ✨ 核心功能實現

### 1. 認證系統
- JWT Token 認證
- 密碼 bcrypt 加密
- 支援一般註冊/登入
- 支援匿名登入（快速試用）
- Token 自動刷新機制

### 2. 專案管理
- CRUD 操作
- 專案與任務的關聯
- 刪除專案時級聯刪除任務

### 3. 任務管理
- 完整的任務生命週期
- 拖放式狀態更新
- 子任務拆解
- 標籤系統
- 優先度管理
- 到期日追蹤

### 4. 數據視覺化
- D3.js 條狀圖：專案任務狀態分佈
- D3.js 折線圖：任務完成趨勢
- 響應式圖表（支援各種螢幕尺寸）

### 5. 使用者體驗
- 響應式設計（RWD）
- 拖放操作
- 即時更新（每 30 秒自動刷新）
- 錯誤提示
- 載入狀態

---

## 🔒 安全性措施

### 後端安全
1. **密碼安全**
   - bcryptjs 加密（Salt rounds: 10）
   - 查詢時預設不返回密碼欄位

2. **JWT 安全**
   - 使用環境變數儲存 Secret
   - Token 設置過期時間（預設 7 天）
   - 請求攔截驗證

3. **輸入驗證**
   - Mongoose Schema 驗證
   - 控制器層二次驗證
   - 防止 NoSQL 注入

4. **CORS 保護**
   - 限制允許的來源
   - 憑證模式支援

### 前端安全
1. **Token 管理**
   - localStorage 儲存
   - 自動添加到 Header
   - 401 自動登出

2. **XSS 防護**
   - React 自動轉義
   - 避免 dangerouslySetInnerHTML

---

## 📈 效能優化

### 後端優化
1. **資料庫優化**
   - 建立索引（userId, projectId, status, completedAt）
   - 使用 populate 減少查詢次數
   - 選擇性欄位返回

2. **API 優化**
   - 支援查詢參數篩選
   - 分頁機制（可擴展）

### 前端優化
1. **React 優化**
   - useMemo 快取計算結果
   - useCallback 避免不必要的重新渲染
   - 條件渲染減少 DOM 操作

2. **網路優化**
   - Axios 請求攔截器
   - 錯誤統一處理
   - 自動重試機制（可擴展）

---

## 🚀 部署建議

### 開發環境
- 後端：`npm run dev`（nodemon）
- 前端：`npm start`（React Dev Server）
- MongoDB：本地安裝

### 生產環境

#### 後端部署
1. **平台選擇**：Heroku、AWS、DigitalOcean、Render
2. **資料庫**：MongoDB Atlas（雲端）
3. **環境變數**：使用平台提供的環境變數管理
4. **Process Manager**：PM2

#### 前端部署
1. **建置**：`npm run build`
2. **平台選擇**：Vercel、Netlify、AWS S3 + CloudFront
3. **環境變數**：設定 REACT_APP_API_URL

---

## 📝 與原始專案的差異

### 移除的功能
1. **Firebase 整合**
   - Firestore → MongoDB
   - Firebase Auth → JWT
   - 移除 Firebase SDK

2. **Gemini AI 整合**
   - 原本的 AI 任務生成功能
   - 可作為未來擴展功能

3. **即時同步**
   - Firebase 的 onSnapshot → 定期輪詢
   - 可改用 WebSocket 實現即時同步

### 新增的功能
1. **完整的後端 API**
2. **JWT 認證系統**
3. **RESTful API 設計**
4. **更好的錯誤處理**
5. **完整的專案文檔**

### 保留的功能
1. **多專案管理** ✅
2. **拖放式看板** ✅
3. **任務子任務系統** ✅
4. **標籤與優先度** ✅
5. **D3.js 視覺化** ✅
6. **響應式設計** ✅

---

## 🎯 未來擴展方向

### 短期目標
1. **WebSocket 支援**：實現即時同步
2. **AI 整合**：恢復 Gemini API 任務生成功能
3. **測試覆蓋**：單元測試 + 整合測試
4. **分頁功能**：處理大量資料

### 中期目標
1. **團隊協作**：多使用者協作、權限管理
2. **檔案上傳**：任務附件功能
3. **通知系統**：到期提醒、Email 通知
4. **進階分析**：更多統計圖表

### 長期目標
1. **行動應用**：React Native 版本
2. **桌面應用**：Electron 版本
3. **第三方整合**：Google Calendar、Slack 等
4. **AI 助理**：智慧任務排程與建議

---

## 📚 學習資源

### 技術文檔
- [Node.js 官方文檔](https://nodejs.org/)
- [Express.js 文檔](https://expressjs.com/)
- [MongoDB 文檔](https://docs.mongodb.com/)
- [React 文檔](https://react.dev/)
- [D3.js 文檔](https://d3js.org/)

### 最佳實踐
- [REST API 設計指南](https://restfulapi.net/)
- [JWT 最佳實踐](https://tools.ietf.org/html/rfc7519)
- [React 最佳實踐](https://react.dev/learn)

---

## 👥 專案團隊

ToDoList Development Team

## 📄 授權

MIT License

---

**建立日期**：2024-11-17
**最後更新**：2024-11-17
**版本**：1.0.0





