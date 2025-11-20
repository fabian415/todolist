# 故障排除指南

## 常見問題與解決方案

### 1. ResizeObserver 錯誤

#### 問題描述
```
ERROR
ResizeObserver loop completed with undelivered notifications.
```

這個錯誤通常在使用 D3.js 圖表或監聽元素大小變化時出現。

#### 原因
這是一個已知的瀏覽器問題，發生在 ResizeObserver 的回調執行時間過長時，瀏覽器無法在一幀內完成所有通知。**這個錯誤不會影響應用程式的實際功能**。

#### 解決方案

我們已經實施了兩層防護：

**1. 全域錯誤抑制**
在 `frontend/public/index.html` 中添加了錯誤攔截器：

```html
<script>
  window.addEventListener('error', function(e) {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded') {
      e.stopImmediatePropagation();
      return false;
    }
  });
</script>
```

**2. 優化的 ResizeObserver Hook**
創建了 `frontend/src/hooks/useResizeObserver.js`，包含：
- requestAnimationFrame 優化
- 防抖機制
- 正確的清理邏輯

#### 驗證
重新啟動前端應用，錯誤應該不再出現：

```bash
cd frontend
npm start
```

---

### 2. MongoDB 連接失敗

#### 問題描述
```
MongoNetworkError: connect ECONNREFUSED
```

#### 解決方案
1. 確認 MongoDB 服務是否運行：
   ```bash
   # Windows
   sc query MongoDB
   
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

2. 啟動 MongoDB：
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. 檢查 `backend/.env` 的連接字串：
   ```env
   MONGODB_URI=mongodb://admin:secret@localhost:27017/todolist?authSource=admin
   ```

---

### 3. 認證失敗

#### 問題描述
```
MongoServerError: Authentication failed
```

#### 解決方案
1. 確認 MongoDB 使用者名稱和密碼正確
2. 確認使用正確的 authSource
3. 如果密碼包含特殊字元，需要進行 URL 編碼：
   ```
   @ → %40
   : → %3A
   / → %2F
   ```

---

### 4. Port 已被佔用

#### 問題描述
```
Error: listen EADDRINUSE: address already in use :::5000
```

#### 解決方案

**選項 1：結束佔用進程**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**選項 2：更改 Port**
修改 `backend/.env`：
```env
PORT=5001
```

---

### 5. CORS 錯誤

#### 問題描述
```
Access to XMLHttpRequest has been blocked by CORS policy
```

#### 解決方案
1. 確認後端正在運行
2. 檢查 `backend/.env` 的 CORS 設定：
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```
3. 如果前端使用不同的 Port，需要更新 CORS_ORIGIN

---

### 6. Token 過期或無效

#### 問題描述
前端顯示「未授權」或自動登出

#### 解決方案
這是正常行為，Token 預設 7 天過期。解決方法：
1. 重新登入
2. 如需調整過期時間，修改 `backend/.env`：
   ```env
   JWT_EXPIRE=30d  # 30 天
   ```

---

### 7. npm install 失敗

#### 問題描述
```
npm ERR! code ENOENT
```

#### 解決方案
```bash
# 清除快取
npm cache clean --force

# 刪除舊檔案
rm -rf node_modules package-lock.json

# 重新安裝
npm install

# 如果還是失敗，切換 registry
npm config set registry https://registry.npmjs.org/
```

---

### 8. React 無法啟動（Node.js 17+）

#### 問題描述
```
Error: error:0308010C:digital envelope routines::unsupported
```

#### 解決方案
```bash
# Windows
set NODE_OPTIONS=--openssl-legacy-provider
npm start

# macOS/Linux
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```

或降級到 Node.js 16 LTS。

---

### 9. D3 圖表不顯示

#### 問題描述
總覽頁面的圖表空白

#### 可能原因與解決方案

**原因 1：沒有資料**
- 至少建立一個專案和任務
- 標記一些任務為「已完成」

**原因 2：D3.js 未載入**
```bash
cd frontend
npm install d3
```

**原因 3：瀏覽器控制台有錯誤**
- 打開瀏覽器開發者工具（F12）
- 查看 Console 標籤的錯誤訊息

---

### 10. 資料未同步

#### 問題描述
在其他標籤頁或裝置上看不到最新資料

#### 說明
當前版本使用定期輪詢（每 30 秒自動刷新），不是即時同步。解決方法：
1. 手動重新整理頁面
2. 等待自動刷新（30 秒）
3. 未來可升級為 WebSocket 實現即時同步

---

## 調試技巧

### 1. 檢查後端 API
```bash
# 測試健康狀態
curl http://localhost:5000/health

# 測試匿名登入
curl -X POST http://localhost:5000/api/auth/anonymous

# 測試專案列表（需要 token）
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/projects
```

### 2. 查看瀏覽器控制台
按 F12 打開開發者工具：
- **Console**：查看 JavaScript 錯誤
- **Network**：查看 API 請求和回應
- **Application** → **Local Storage**：查看儲存的 token

### 3. 查看 MongoDB 資料
```bash
mongosh "mongodb://admin:secret@localhost:27017/todolist?authSource=admin"

# 查看集合
show collections

# 查看使用者
db.users.find().pretty()

# 查看專案
db.projects.find().pretty()

# 查看任務
db.tasks.find().pretty()
```

### 4. 後端日誌
後端伺服器的 console 會顯示：
- API 請求記錄（使用 morgan）
- MongoDB 連接狀態
- 錯誤訊息

---

## 預防性維護

### 定期更新依賴
```bash
# 檢查過時的套件
npm outdated

# 更新套件
npm update
```

### 資料庫備份
```bash
# 備份 MongoDB
mongodump --uri="mongodb://admin:secret@localhost:27017/todolist?authSource=admin" --out=./backup

# 還原
mongorestore --uri="mongodb://admin:secret@localhost:27017/todolist?authSource=admin" ./backup/todolist
```

### 環境變數檢查
定期確認 `.env` 檔案：
- JWT_SECRET 不是預設值
- MongoDB 連接字串正確
- Port 設定無衝突

---

## 獲取更多幫助

1. 查看專案文檔：
   - [README.md](./README.md)
   - [QUICKSTART.md](./QUICKSTART.md)
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

2. 檢查 GitHub Issues

3. 啟用詳細日誌：
   ```env
   # backend/.env
   NODE_ENV=development
   ```

---

**最後更新**：2024-11-17





