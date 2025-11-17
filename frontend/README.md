# ToDoList Frontend

React 18 前端應用程式

## 功能特色

- ⚛️ React 18 with Hooks
- 🎨 Tailwind CSS
- 📊 D3.js 資料視覺化
- 🔐 JWT 認證
- 📱 響應式設計
- 🎯 拖放式看板

## 快速開始

### 1. 安裝依賴

\`\`\`bash
npm install
\`\`\`

### 2. 啟動開發伺服器

\`\`\`bash
npm start
\`\`\`

應用程式將在 `http://localhost:3000` 啟動

### 3. 建置生產版本

\`\`\`bash
npm run build
\`\`\`

建置檔案將輸出到 `build/` 目錄

## 專案結構

\`\`\`
frontend/
├── public/
│   └── index.html              # HTML 模板
├── src/
│   ├── components/             # React 元件
│   │   ├── Dashboard.js        # 主要儀表板
│   │   ├── LoginPage.js        # 登入頁面
│   │   ├── Sidebar.js          # 側邊欄
│   │   ├── BoardView.js        # 看板視圖
│   │   ├── KanbanColumn.js     # 看板欄位
│   │   ├── TaskCard.js         # 任務卡片
│   │   ├── TaskModal.js        # 任務編輯彈窗
│   │   ├── AddProjectModal.js  # 新增專案彈窗
│   │   ├── OverviewDashboard.js # 總覽儀表板（含 D3 圖表）
│   │   └── Icons.js            # 圖示元件
│   ├── contexts/
│   │   └── AuthContext.js      # 認證 Context
│   ├── services/
│   │   └── api.js              # API 服務層
│   ├── App.js                  # 根元件
│   ├── index.js                # 應用程式入口
│   └── index.css               # 全域樣式
├── .gitignore
├── package.json
└── README.md
\`\`\`

## 環境變數

在 `frontend` 目錄建立 `.env` 檔案（可選）：

\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

如果不設定，預設會使用 `http://localhost:5000/api`

## 主要元件說明

### App.js
應用程式根元件，管理認證狀態和路由。

### AuthContext.js
提供全域認證狀態管理，包括：
- 使用者資訊
- Token 管理
- 登入/註冊/登出功能

### Dashboard.js
主要的應用程式介面，包含：
- 側邊欄（專案列表）
- 看板視圖或總覽儀表板
- 任務管理功能

### OverviewDashboard.js
總覽儀表板，包含：
- 專案任務狀態分佈圖（D3.js 條狀圖）
- 任務完成趨勢圖（D3.js 折線圖）

### api.js
API 服務層，包含：
- Axios 配置
- 請求/回應攔截器
- 所有 API 呼叫函數

## 使用說明

### 登入
1. 開啟應用程式
2. 選擇「註冊」或「登入」
3. 或使用「匿名登入」快速體驗

### 建立專案
1. 點擊側邊欄的「+ 新增專案」
2. 輸入專案名稱
3. 點擊「建立」

### 管理任務
1. 選擇一個專案
2. 點擊「+ 新增任務」
3. 填寫任務資訊
4. 拖放任務卡片以改變狀態

### 查看總覽
1. 點擊側邊欄的「總覽」
2. 查看所有專案的統計資料
3. 查看任務完成趨勢

## 開發指南

### 新增元件

在 `src/components/` 目錄下建立新元件：

\`\`\`jsx
import React from 'react';

function MyComponent() {
  return (
    <div>
      My Component
    </div>
  );
}

export default MyComponent;
\`\`\`

### 新增 API 呼叫

在 `src/services/api.js` 中新增：

\`\`\`javascript
export const myAPI = {
  getData: () => api.get('/my-endpoint'),
  postData: (data) => api.post('/my-endpoint', data)
};
\`\`\`

### 使用 Context

在元件中使用 AuthContext：

\`\`\`jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      Welcome, {user.username}
      <button onClick={logout}>登出</button>
    </div>
  );
}
\`\`\`

## 可用腳本

- `npm start` - 啟動開發伺服器
- `npm run build` - 建置生產版本
- `npm test` - 執行測試
- `npm run eject` - 彈出 Create React App 配置（不可逆！）

## 瀏覽器支援

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 故障排除

### 無法連接到後端

確認：
1. 後端伺服器是否運行在 `http://localhost:5000`
2. CORS 設定是否正確
3. 網路連接是否正常

### Token 過期

重新登入即可取得新的 Token。

### 圖表無法顯示

確認 D3.js 是否正確安裝：
\`\`\`bash
npm install d3
\`\`\`

## 授權

MIT License

