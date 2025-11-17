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
│   └── tasks.js            # 任務路由
├── .gitignore
├── package.json
├── README.md
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

## 環境變數說明

| 變數名稱 | 說明 | 預設值 | 必填 |
|---------|------|--------|------|
| PORT | 伺服器監聽的端口 | 5000 | 否 |
| NODE_ENV | 執行環境 | development | 否 |
| MONGODB_URI | MongoDB 連接字串 | - | 是 |
| JWT_SECRET | JWT 簽章密鑰 | - | 是 |
| JWT_EXPIRE | Token 過期時間 | 7d | 否 |
| CORS_ORIGIN | 允許的前端來源 | http://localhost:3000 | 否 |

## 開發注意事項

1. **密碼安全**: 使用 bcryptjs 加密，絕不儲存明文密碼
2. **JWT Token**: 預設 7 天過期，可在 .env 中調整
3. **CORS**: 預設只允許 localhost:3000，生產環境需調整
4. **資料驗證**: 使用 Mongoose schema 驗證
5. **錯誤處理**: 全域錯誤處理中介軟體統一處理

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

