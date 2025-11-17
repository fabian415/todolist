# 🔌 GAIS (GenAI Studio) 整合說明

本文檔說明如何將 ToDoList 應用程式整合到 GenAI Studio (GAIS) 平台。

## 📋 目錄

- [什麼是 GAIS](#什麼是-gais)
- [整合架構](#整合架構)
- [環境配置](#環境配置)
- [API 端點](#api-端點)
- [註冊流程](#註冊流程)
- [測試驗證](#測試驗證)
- [故障排除](#故障排除)

## 什麼是 GAIS

GenAI Studio (GAIS) 是一個統一的 AI 應用管理平台，允許多個 AI 應用程式註冊並透過統一介面提供服務。

### GAIS 整合的優勢

- 🎯 **集中管理** - 在單一平台管理多個 AI 應用
- 🔄 **自動發現** - GAIS 可自動發現和註冊應用
- 📊 **健康監控** - 定期健康檢查和診斷
- 🚀 **快速部署** - 簡化的部署和配置流程
- 🤝 **資源共享** - 共享 Ollama 等 AI 資源

## 整合架構

```
┌─────────────────────────────────────────────────────────┐
│                      GAIS Platform                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Application Registry                     │  │
│  │  - Health Check (ping)                            │  │
│  │  - Diagnostics                                     │  │
│  │  - Auto Re-registration                           │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ HTTP/HTTPS
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  ToDoList Application                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │          GAIS Integration Layer                  │   │
│  │  - gaisService.js (Service)                     │   │
│  │  - gais.js (Routes)                             │   │
│  │  - Registration Logic                            │   │
│  │  - Health Endpoints                              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Application Core                        │   │
│  │  - Task Management                               │   │
│  │  - Project Management                            │   │
│  │  - User Authentication                           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 環境配置

### 必要環境變數

在 `backend/.env` 檔案中配置以下變數：

```env
# ==========================================
# GAIS 基本配置
# ==========================================

# 應用程式基本資訊
APP_NAME=todolist                      # 應用程式唯一識別名稱
APP_VERSION=1.0.0                      # 版本號
APP_TITLE=ToDoList 專案管理系統         # 顯示標題
APP_DESCRIPTION=一個功能完整的專案與任務管理系統，整合 AI 智能助手
APP_LOGO=./logo.png                    # Logo 檔案路徑

# 應用程式網路配置
APP_HOST=0.0.0.0                       # 監聽主機（0.0.0.0 允許外部訪問）
APP_PORT=5000                          # 服務埠號
APP_TOKEN=your_gais_app_token_here     # GAIS 認證 Token（必須設定）

# ==========================================
# GAIS 伺服器配置
# ==========================================

GAIS_HOST=localhost                    # GAIS 伺服器主機
GAIS_PORT=8000                         # GAIS 伺服器埠號
GAIS_PROTOCOL=v1                       # API 協定版本
GAIS_MODEL=llama3                      # 使用的 AI 模型

# ==========================================
# Ollama 配置（可選）
# ==========================================

OLLAMA_HOST=http://localhost:11434     # Ollama 服務地址
```

### 配置說明

#### APP_TOKEN
- **重要性**: 🔴 必須設定
- **用途**: 用於向 GAIS 平台認證應用程式
- **取得方式**: 從 GAIS 管理介面取得
- **注意**: 保持此 Token 安全，不要提交到版本控制

#### APP_NAME
- **重要性**: 🔴 必須設定
- **用途**: 應用程式在 GAIS 平台的唯一識別符
- **命名規則**: 小寫字母、數字、連字號
- **範例**: `todolist`, `task-manager`, `my-app-v2`

#### APP_HOST
- **預設值**: `0.0.0.0`
- **用途**: 決定應用程式監聽的網路介面
- **`0.0.0.0`**: 監聽所有網路介面（生產環境）
- **`localhost`**: 僅監聽本地介面（開發環境）

## API 端點

應用程式提供以下 GAIS 必要端點：

### 1. Health Check - `/api/ping`

**用途**: GAIS 定期呼叫此端點檢查應用程式是否運行中

**方法**: `GET`

**回應範例**:
```json
{
  "status": "running",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

**測試**:
```bash
curl http://localhost:5000/api/ping
```

### 2. Diagnosis - `/api/diagnosis`

**用途**: 提供應用程式健康狀態和配置資訊

**方法**: `GET`

**回應範例**:
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

**測試**:
```bash
curl http://localhost:5000/api/diagnosis
```

### 3. Re-registration - `/api/reregister`

**用途**: 允許 GAIS 要求應用程式重新註冊

**方法**: `POST`

**回應範例**:
```json
{
  "success": true,
  "message": "應用程式重新註冊成功",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

**測試**:
```bash
curl -X POST http://localhost:5000/api/reregister
```

### 4. GAIS Status - `/api/gais/status`

**用途**: 查詢當前 GAIS 註冊狀態

**方法**: `GET`

**回應範例**:
```json
{
  "registered": true,
  "appName": "todolist",
  "appVersion": "1.0.0",
  "gaisServer": "http://localhost:8000",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

### 5. Configuration - `/api/gais/config`

**用途**: 取得應用程式配置資訊

**方法**: `GET`

**回應範例**:
```json
{
  "appName": "todolist",
  "appTitle": "ToDoList 專案管理系統",
  "appVersion": "1.0.0",
  "appDescription": "一個功能完整的專案與任務管理系統",
  "gaisModel": "llama3",
  "gaisServer": "http://localhost:8000"
}
```

### 6. AI Chat - `/api/chat`

**用途**: 與 AI 模型進行對話（支援 SSE 串流）

**方法**: `POST`

**請求範例**:
```json
{
  "message": "幫我分析這個專案的任務狀態",
  "history": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "你好！有什麼我可以幫忙的嗎？"
    }
  ]
}
```

**回應**: Server-Sent Events (SSE) 串流

## 註冊流程

### 自動註冊

應用程式啟動時會自動嘗試註冊到 GAIS：

1. **啟動應用程式**
   ```bash
   cd backend
   npm start
   ```

2. **註冊過程**
   - 應用程式啟動
   - 讀取環境變數
   - 嘗試連接 GAIS 伺服器
   - 發送註冊請求
   - 顯示註冊結果

3. **成功訊息**
   ```
   🚀 Server running at http://0.0.0.0:5000
   📝 嘗試註冊到 GenAI Studio (GAIS)...
   ✅ 應用程式註冊成功
   ```

4. **失敗訊息**
   ```
   ❌ 無法連接到 GAIS 伺服器，請確認 GAIS 是否運行中
   ```
   或
   ```
   ⚠️  未配置 APP_TOKEN，跳過 GAIS 註冊
   ```

### 手動重新註冊

如果需要手動重新註冊：

```bash
curl -X POST http://localhost:5000/api/reregister
```

### 優雅關閉

應用程式關閉時會自動從 GAIS 註銷：

```bash
# 發送終止信號
Ctrl+C

# 輸出
⚠️  收到 SIGINT 信號，正在優雅關閉...
✅ 應用程式註銷成功
✅ 伺服器已關閉
```

## 測試驗證

### 1. 驗證環境配置

```bash
# 檢查環境變數
cd backend
cat .env | grep -E "APP_|GAIS_"
```

### 2. 測試健康端點

```bash
# 測試 Ping
curl http://localhost:5000/api/ping

# 測試 Diagnosis
curl http://localhost:5000/api/diagnosis

# 測試狀態
curl http://localhost:5000/api/gais/status
```

### 3. 驗證註冊狀態

```bash
# 檢查應用程式日誌
npm start

# 應該看到成功註冊訊息
# ✅ 應用程式註冊成功
```

### 4. 測試重新註冊

```bash
curl -X POST http://localhost:5000/api/reregister
```

### 5. 測試 AI 聊天（如果配置了 Ollama）

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好",
    "history": []
  }'
```

## 故障排除

### 問題 1: 無法連接到 GAIS

**症狀**:
```
❌ 無法連接到 GAIS 伺服器，請確認 GAIS 是否運行中
```

**解決方案**:
1. 確認 GAIS 伺服器正在運行
2. 檢查 `GAIS_HOST` 和 `GAIS_PORT` 配置
3. 測試網路連接：
   ```bash
   curl http://localhost:8000/health
   ```

### 問題 2: 認證失敗

**症狀**:
```
❌ 註冊失敗: Unauthorized
```

**解決方案**:
1. 確認 `APP_TOKEN` 已正確設定
2. 檢查 Token 是否有效
3. 聯繫 GAIS 管理員取得正確的 Token

### 問題 3: 跳過註冊

**症狀**:
```
⚠️  未配置 APP_TOKEN，跳過 GAIS 註冊
```

**解決方案**:
1. 在 `.env` 檔案中設定 `APP_TOKEN`
2. 重新啟動應用程式

### 問題 4: Logo 載入失敗

**症狀**:
```
❌ 轉換圖片為 Base64 失敗
```

**解決方案**:
1. 確認 `backend/logo.png` 存在
2. 檢查檔案權限
3. 更新 `APP_LOGO` 環境變數指向正確路徑

### 問題 5: 診斷端點回傳錯誤

**症狀**:
```json
{
  "status": "error",
  "services": {
    "database": "disconnected"
  }
}
```

**解決方案**:
1. 確認 MongoDB 正在運行
2. 檢查資料庫連接字串
3. 查看應用程式日誌

## 實作細節

### 核心檔案

#### 1. `backend/services/gaisService.js`
GAIS 整合的核心服務類別，處理：
- 應用程式註冊
- 應用程式註銷
- 狀態管理
- 診斷資訊
- Ollama 通訊

#### 2. `backend/routes/gais.js`
GAIS 相關的 API 路由定義，包含：
- `/api/ping` - 健康檢查
- `/api/diagnosis` - 診斷資訊
- `/api/reregister` - 重新註冊
- `/api/gais/status` - 狀態查詢
- `/api/gais/config` - 配置資訊
- `/api/chat` - AI 聊天

#### 3. `backend/server.js`
應用程式主入口，整合：
- 啟動時自動註冊
- 優雅關閉處理（SIGTERM, SIGINT）
- 路由配置

### 註冊資料結構

發送到 GAIS 的註冊資料：

```javascript
{
  protocol: "v1",
  properties: {
    name: "todolist",
    version: "1.0.0",
    title: "ToDoList 專案管理系統",
    description: "一個功能完整的專案與任務管理系統",
    logo: "data:image/png;base64,iVBORw0KGgo...",
    url: "http://todolist-app:5000",
    ping: "/api/ping",
    diagnosis: "/api/diagnosis",
    reregister: "/api/reregister"
  },
  resources: ["ollama"]
}
```

## 最佳實踐

### 1. 環境變數管理
- ✅ 使用 `.env` 檔案管理配置
- ✅ 不要將 `.env` 提交到版本控制
- ✅ 提供 `env.example` 作為範本
- ✅ 為不同環境使用不同配置

### 2. 錯誤處理
- ✅ 捕獲所有可能的錯誤
- ✅ 提供清晰的錯誤訊息
- ✅ 記錄詳細的錯誤日誌
- ✅ 優雅降級（GAIS 不可用時仍可運行）

### 3. 健康監控
- ✅ 實作完整的健康檢查
- ✅ 提供詳細的診斷資訊
- ✅ 監控關鍵服務狀態
- ✅ 定期測試端點可用性

### 4. 安全性
- ✅ 使用環境變數儲存敏感資訊
- ✅ 驗證所有輸入
- ✅ 實作適當的超時處理
- ✅ 限制 API 訪問頻率

## 進階配置

### Docker 部署

在 Docker 環境中的配置範例：

```yaml
# docker-compose.yml
services:
  todolist-app:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - APP_NAME=todolist
      - APP_HOST=0.0.0.0
      - APP_PORT=5000
      - GAIS_HOST=gais-server
      - GAIS_PORT=8000
    networks:
      - gais-network

networks:
  gais-network:
    external: true
```

### 多實例部署

如果部署多個應用程式實例：

```env
# 實例 1
APP_NAME=todolist-01
APP_PORT=5001

# 實例 2
APP_NAME=todolist-02
APP_PORT=5002
```

## 相關資源

- [GAIS 官方文檔](https://docs.gais.ai)
- [ToDoList API 文檔](./API_DOCUMENTATION.md)
- [後端 README](./backend/README.md)
- [故障排除指南](./TROUBLESHOOTING.md)

## 更新日誌

### v1.0.0 (2025-11-17)
- ✅ 初始 GAIS 整合實作
- ✅ 實作自動註冊/註銷
- ✅ 新增健康檢查端點
- ✅ 新增診斷資訊端點
- ✅ 新增 AI 聊天端點
- ✅ 支援優雅關閉

## 支援

如有問題或需要協助，請：
1. 查閱本文檔的故障排除章節
2. 檢查應用程式日誌
3. 聯繫技術支援團隊

---

**最後更新**: 2025-11-17  
**版本**: 1.0.0  
**維護者**: ToDoList Development Team

