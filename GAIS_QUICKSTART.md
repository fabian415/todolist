# 🚀 GAIS 整合快速開始指南

本指南將幫助您在 5 分鐘內完成 GAIS 整合設定並開始使用。

## 📋 前置條件

- ✅ Node.js 18+ 已安裝
- ✅ MongoDB 正在運行
- ✅ 已有 GAIS 伺服器運行（或準備連接到 GAIS）
- ✅ 已取得 GAIS 認證 Token（APP_TOKEN）

## 🔧 快速設定（3 步驟）

### 步驟 1: 配置環境變數

編輯 `backend/.env` 檔案，加入 GAIS 配置：

```env
# GAIS 配置
APP_NAME=todolist
APP_VERSION=1.0.0
APP_TITLE=ToDoList 專案管理系統
APP_DESCRIPTION=一個功能完整的專案與任務管理系統，整合 AI 智能助手
APP_LOGO=./logo.png
APP_HOST=0.0.0.0
APP_PORT=5000
APP_TOKEN=your_gais_app_token_here     # ⚠️ 必須設定！

GAIS_HOST=localhost                     # GAIS 伺服器位址
GAIS_PORT=8000                          # GAIS 伺服器端口
GAIS_PROTOCOL=v1
GAIS_MODEL=llama3

OLLAMA_HOST=http://localhost:11434
```

**⚠️ 重要**: 請將 `APP_TOKEN` 替換為您從 GAIS 管理介面取得的實際 Token。

### 步驟 2: 安裝依賴

```bash
cd backend
npm install
```

### 步驟 3: 啟動應用程式

```bash
npm start
# 或開發模式
npm run dev
```

## ✅ 驗證安裝

啟動應用程式後，您應該看到類似以下的輸出：

```
╔════════════════════════════════════════╗
║   ToDoList API Server                 ║
║   Environment: development             ║
║   Port: 5000                          ║
║   URL: http://localhost:5000          ║
╚════════════════════════════════════════╝

📝 嘗試註冊到 GenAI Studio (GAIS)...
✅ 應用程式註冊成功
```

如果看到 `✅ 應用程式註冊成功`，恭喜！您已成功完成 GAIS 整合。

## 🧪 快速測試

### 測試 1: 使用測試腳本（推薦）

```bash
cd backend
node test-gais.js
```

您應該看到所有測試通過：

```
🧪 GAIS 整合功能測試
══════════════════════════════════════════════════
✅ 通過: Health Check (根路由)
✅ 通過: Ping 端點
✅ 通過: Diagnosis 端點
✅ 通過: GAIS 狀態端點
✅ 通過: GAIS 配置端點
✅ 通過: 重新註冊端點
══════════════════════════════════════════════════
✅ 通過: 6 個測試
❌ 失敗: 0 個測試
```

### 測試 2: 手動測試 API 端點

打開新的終端機視窗，執行以下命令：

#### 測試健康檢查
```bash
curl http://localhost:5000/api/ping
```

**預期輸出**:
```json
{
  "status": "running",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

#### 測試診斷資訊
```bash
curl http://localhost:5000/api/diagnosis
```

**預期輸出**:
```json
{
  "status": "success",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "services": {
    "database": "connected",
    "gais": "registered"
  },
  "configuration": {
    "appName": "todolist",
    "appVersion": "1.0.0",
    "gaisServer": "http://localhost:8000",
    "gaisModel": "llama3"
  }
}
```

#### 查看 GAIS 註冊狀態
```bash
curl http://localhost:5000/api/gais/status
```

**預期輸出**:
```json
{
  "registered": true,
  "appName": "todolist",
  "appVersion": "1.0.0",
  "gaisServer": "http://localhost:8000",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

## 🔄 常見情境

### 情境 1: 重新註冊到 GAIS

```bash
curl -X POST http://localhost:5000/api/reregister
```

### 情境 2: 查看應用程式配置

```bash
curl http://localhost:5000/api/gais/config
```

### 情境 3: 測試 AI 聊天功能

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "history": []}'
```

## ❌ 故障排除

### 問題: 顯示「未配置 APP_TOKEN，跳過 GAIS 註冊」

**解決方法**:
1. 確認 `.env` 檔案中已設定 `APP_TOKEN`
2. 確認 Token 值不是 `your_gais_app_token_here`
3. 重新啟動應用程式

### 問題: 顯示「無法連接到 GAIS 伺服器」

**解決方法**:
1. 確認 GAIS 伺服器正在運行
2. 檢查 `GAIS_HOST` 和 `GAIS_PORT` 設定是否正確
3. 測試網路連接：
   ```bash
   curl http://localhost:8000/health
   ```

### 問題: 顯示「註冊失敗: Unauthorized」

**解決方法**:
1. 確認 `APP_TOKEN` 是否有效
2. 聯繫 GAIS 管理員取得正確的 Token
3. 檢查 Token 是否已過期

### 問題: 資料庫狀態顯示 "disconnected"

**解決方法**:
1. 確認 MongoDB 正在運行
2. 檢查 `MONGODB_URI` 設定
3. 測試資料庫連接

## 📚 下一步

恭喜完成 GAIS 整合！接下來您可以：

1. 📖 閱讀詳細文檔：[GAIS_INTEGRATION.md](./GAIS_INTEGRATION.md)
2. 🔌 探索 GAIS API 端點
3. 🤖 測試 AI 聊天功能
4. 🚀 部署到生產環境

## 🆘 需要幫助？

- 📖 詳細文檔：[GAIS_INTEGRATION.md](./GAIS_INTEGRATION.md)
- 🐛 故障排除：[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 📝 API 文檔：[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 💡 提示

### 開發環境

如果只是在開發環境測試，且沒有 GAIS 伺服器：
- 不設定 `APP_TOKEN`，應用程式會跳過 GAIS 註冊
- 應用程式仍可正常運行所有其他功能

### 生產環境

生產環境部署時：
1. 確保所有 GAIS 環境變數都正確設定
2. 使用有效的 `APP_TOKEN`
3. 設定正確的 `GAIS_HOST` 和 `GAIS_PORT`
4. 考慮使用 HTTPS 加密通訊

---

**最後更新**: 2025-11-17  
**版本**: 1.0.0

