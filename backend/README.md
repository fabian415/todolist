# ToDoList Backend

Node.js + Express.js + MongoDB 後端 API 伺服器

## 快速開始

### 1. 安裝依賴

\`\`\`bash
npm install
\`\`\`

### 2. 設定環境變數

複製 `.env.example` 並重新命名為 `.env`，然後修改相關設定：

\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/todolist
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
\`\`\`

### 3. 確保 MongoDB 運行中

\`\`\`bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
\`\`\`

### 4. 啟動伺服器

開發環境（使用 nodemon）：
\`\`\`bash
npm run dev
\`\`\`

生產環境：
\`\`\`bash
npm start
\`\`\`

### 5. 測試 API

訪問 `http://localhost:5000` 應該會看到：

\`\`\`json
{
  "success": true,
  "message": "ToDoList API Server",
  "version": "1.0.0"
}
\`\`\`

## 專案結構

\`\`\`
backend/
├── config/
│   └── database.js         # MongoDB 連接配置
├── controllers/
│   ├── authController.js   # 認證相關控制器
│   ├── projectController.js # 專案相關控制器
│   └── taskController.js   # 任務相關控制器
├── middleware/
│   ├── auth.js             # JWT 認證中介軟體
│   └── errorHandler.js     # 全域錯誤處理
├── models/
│   ├── User.js             # 使用者資料模型
│   ├── Project.js          # 專案資料模型
│   └── Task.js             # 任務資料模型
├── routes/
│   ├── auth.js             # 認證路由
│   ├── projects.js         # 專案路由
│   ├── tasks.js            # 任務路由
│   └── gais.js             # GAIS 整合路由
├── services/
│   ├── llmService.js       # LLM AI 服務
│   └── gaisService.js      # GAIS 整合服務
├── .gitignore
├── package.json
├── README.md
├── logo.png                # 應用程式 Logo（用於 GAIS）
└── server.js               # 伺服器入口檔案
\`\`\`

## API 端點

詳細 API 文檔請參考專案根目錄的 [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `POST /api/auth/anonymous` - 匿名登入
- `GET /api/auth/me` - 取得當前使用者

### 專案
- `GET /api/projects` - 取得所有專案
- `POST /api/projects` - 建立專案
- `GET /api/projects/:id` - 取得單一專案
- `PUT /api/projects/:id` - 更新專案
- `DELETE /api/projects/:id` - 刪除專案

### 任務
- `GET /api/tasks` - 取得所有任務
- `POST /api/tasks` - 建立任務
- `GET /api/tasks/:id` - 取得單一任務
- `PUT /api/tasks/:id` - 更新任務
- `PATCH /api/tasks/:id/status` - 更新任務狀態
- `DELETE /api/tasks/:id` - 刪除任務
- `POST /api/tasks/ai/parse` - AI 任務拆解

### GAIS 整合
- `GET /api/ping` - 健康檢查
- `GET /api/diagnosis` - 系統診斷
- `POST /api/reregister` - 重新註冊到 GAIS
- `GET /api/gais/status` - GAIS 註冊狀態
- `GET /api/gais/config` - 應用程式配置
- `POST /api/chat` - AI 聊天（SSE 串流）

## 環境變數說明

### 基本配置

| 變數名稱 | 說明 | 預設值 | 必填 |
|---------|------|--------|------|
| PORT | 伺服器監聽的端口 | 5000 | 否 |
| NODE_ENV | 執行環境 | development | 否 |
| MONGODB_URI | MongoDB 連接字串 | - | 是 |
| JWT_SECRET | JWT 簽章密鑰 | - | 是 |
| JWT_EXPIRE | Token 過期時間 | 7d | 否 |
| CORS_ORIGIN | 允許的前端來源 | http://localhost:3000 | 否 |

### AI 功能配置（可選）

| 變數名稱 | 說明 | 預設值 | 必填 |
|---------|------|--------|------|
| OLLAMA_BASE_URL | Ollama API 地址 | http://localhost:11434/v1 | 否 |
| OLLAMA_MODEL | 使用的 AI 模型 | llama3.2 | 否 |
| OPENAI_API_KEY | OpenAI API 金鑰 | - | 否 |

### GAIS 整合配置（可選）

| 變數名稱 | 說明 | 預設值 | 必填 |
|---------|------|--------|------|
| APP_NAME | 應用程式唯一名稱 | todolist | 否* |
| APP_VERSION | 應用程式版本 | 1.0.0 | 否 |
| APP_TITLE | 應用程式顯示標題 | ToDoList 專案管理系統 | 否 |
| APP_DESCRIPTION | 應用程式描述 | - | 否 |
| APP_LOGO | Logo 檔案路徑 | ./logo.png | 否 |
| APP_HOST | 監聽主機 | 0.0.0.0 | 否 |
| APP_PORT | 應用程式端口 | 5000 | 否 |
| APP_TOKEN | GAIS 認證 Token | - | 是* |
| GAIS_HOST | GAIS 伺服器主機 | localhost | 否 |
| GAIS_PORT | GAIS 伺服器端口 | 8000 | 否 |
| GAIS_PROTOCOL | GAIS API 版本 | v1 | 否 |
| GAIS_MODEL | GAIS 使用的模型 | llama3 | 否 |
| OLLAMA_HOST | Ollama 服務地址 | http://localhost:11434 | 否 |

\* 如果要啟用 GAIS 整合，`APP_TOKEN` 為必填

## 開發注意事項

1. **密碼安全**: 使用 bcryptjs 加密，絕不儲存明文密碼
2. **JWT Token**: 預設 7 天過期，可在 .env 中調整
3. **CORS**: 預設只允許 localhost:3000，生產環境需調整
4. **資料驗證**: 使用 Mongoose schema 驗證
5. **錯誤處理**: 全域錯誤處理中介軟體統一處理
6. **GAIS 整合**: 
   - 啟動時自動註冊到 GAIS（如果配置了 APP_TOKEN）
   - 關閉時自動註銷
   - 未配置 GAIS 時應用程式仍可正常運行

## GAIS 整合

本應用程式支援整合 GenAI Studio (GAIS) 平台。

### 快速設定

1. 在 `.env` 中設定 GAIS 相關變數（參考 `env.example`）
2. 確保設定 `APP_TOKEN`
3. 啟動應用程式，會自動註冊到 GAIS

### 測試 GAIS 功能

```bash
# 測試健康檢查
curl http://localhost:5000/api/ping

# 測試診斷
curl http://localhost:5000/api/diagnosis

# 查看註冊狀態
curl http://localhost:5000/api/gais/status

# 手動重新註冊
curl -X POST http://localhost:5000/api/reregister
```

### 詳細文檔

詳細的 GAIS 整合說明請參考：[GAIS_INTEGRATION.md](../GAIS_INTEGRATION.md)

## 故障排除

### MongoDB 連接失敗

檢查 MongoDB 服務是否運行：
\`\`\`bash
# Windows
sc query MongoDB

# macOS/Linux  
sudo systemctl status mongod
\`\`\`

### Port 已被佔用

修改 `.env` 中的 `PORT` 設定，或結束佔用該 Port 的程序。

### Token 驗證失敗

確認：
1. JWT_SECRET 是否正確設定
2. 前端是否正確傳送 Authorization Header
3. Token 是否過期

## 授權

MIT License



