# 🚀 快速啟動指南

5 分鐘內啟動並運行 ToDoList 專案！

## 📋 前置需求

確認已安裝以下軟體：

- ✅ Node.js 18+ ([下載](https://nodejs.org/))
- ✅ MongoDB 6+ ([下載](https://www.mongodb.com/try/download/community))
- ✅ npm 或 yarn

檢查版本：
```bash
node --version   # 應該顯示 v18.x.x 或更高
npm --version    # 應該顯示 8.x.x 或更高
mongod --version # 應該顯示 6.x.x 或更高
```

---

## ⚡ 快速啟動（3 個終端機視窗）

### 終端機 1：啟動 MongoDB

```bash
# Windows
net start MongoDB

# macOS (使用 Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

驗證 MongoDB 是否運行：
```bash
# 連接到 MongoDB
mongosh
# 應該會看到 MongoDB shell 提示符
```

---

### 終端機 2：啟動後端

```bash
# 1. 進入後端目錄
cd backend

# 2. 安裝依賴
npm install

# 3. 建立環境變數檔案
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env

# 4. 編輯 .env（如果需要）
# 使用文字編輯器開啟 .env 並修改以下內容：

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/todolist
JWT_SECRET=my_super_secret_key_change_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000

# 5. 啟動開發伺服器
npm run dev
```

✅ 看到以下訊息表示成功：
```
╔════════════════════════════════════════╗
║   ToDoList API Server                 ║
║   Environment: development            ║
║   Port: 5000                          ║
║   URL: http://localhost:5000          ║
╚════════════════════════════════════════╝
MongoDB 連接成功: localhost
```

測試後端：
```bash
# 開啟瀏覽器訪問
http://localhost:5000

# 或使用 curl
curl http://localhost:5000
```

---

### 終端機 3：啟動前端

```bash
# 1. 進入前端目錄（從專案根目錄）
cd frontend

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm start
```

✅ 瀏覽器會自動開啟 `http://localhost:3000`

---

## 🎉 開始使用

1. **選擇登入方式**
   - 👤 **匿名登入**（推薦新手）：無需註冊，立即體驗
   - 📝 **註冊新帳號**：永久保存資料
   - 🔑 **已有帳號登入**

2. **建立第一個專案**
   - 點擊側邊欄的 "**+ 新增專案**"
   - 輸入專案名稱（例如：我的第一個專案）
   - 點擊 "**建立**"

3. **新增任務**
   - 在任一欄位（待辦事項/進行中/已完成）點擊 "**+ 新增任務**"
   - 填寫任務資訊
   - 點擊 "**儲存**"

4. **拖放任務**
   - 用滑鼠拖動任務卡片
   - 放到不同的欄位以改變狀態

5. **查看總覽**
   - 點擊側邊欄的 "**總覽**"
   - 查看所有專案的統計資料和完成趨勢圖表

---

## 🔧 常見問題

### Q1: MongoDB 連接失敗

**錯誤訊息**：`MongoNetworkError: connect ECONNREFUSED`

**解決方案**：
```bash
# 確認 MongoDB 是否運行
# Windows
sc query MongoDB

# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# 如果沒運行，啟動它
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

### Q2: Port 5000 已被佔用

**錯誤訊息**：`Error: listen EADDRINUSE: address already in use :::5000`

**解決方案**：

**選項 1**：結束佔用 Port 5000 的程序
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**選項 2**：更改後端 Port
```bash
# 編輯 backend/.env
PORT=5001

# 同時需要更新前端 API URL（如果有設定）
```

---

### Q3: 前端無法連接到後端

**錯誤訊息**：瀏覽器控制台顯示 `Network Error` 或 `CORS Error`

**檢查清單**：
1. ✅ 後端是否正在運行？
2. ✅ 後端 URL 是否正確？（預設 `http://localhost:5000`）
3. ✅ CORS 設定是否正確？（檢查 `backend/.env` 的 `CORS_ORIGIN`）

**解決方案**：
```bash
# 確認後端運行
curl http://localhost:5000

# 檢查 CORS 設定
# backend/.env
CORS_ORIGIN=http://localhost:3000
```

---

### Q4: npm install 失敗

**錯誤訊息**：`npm ERR! code ENOENT` 或網路錯誤

**解決方案**：
```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安裝
npm install

# 如果還是失敗，試試切換 npm registry
npm config set registry https://registry.npmjs.org/
```

---

### Q5: React 開發伺服器無法啟動

**錯誤訊息**：`Error: error:0308010C:digital envelope routines::unsupported`

**解決方案**（針對 Node.js 17+）：
```bash
# Windows
set NODE_OPTIONS=--openssl-legacy-provider
npm start

# macOS/Linux
export NODE_OPTIONS=--openssl-legacy-provider
npm start

# 或者降級到 Node.js 16 LTS
```

---

## 📊 驗證安裝

### 測試後端 API

```bash
# 1. 測試根端點
curl http://localhost:5000

# 2. 測試健康檢查
curl http://localhost:5000/health

# 3. 測試匿名登入
curl -X POST http://localhost:5000/api/auth/anonymous
```

### 測試前端

1. 開啟 `http://localhost:3000`
2. 應該看到登入頁面
3. 點擊 "**匿名登入**"
4. 成功進入儀表板

---

## 🎯 下一步

現在你已經成功啟動專案了！可以：

1. 📖 閱讀 [README.md](./README.md) 了解完整功能
2. 📚 查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 學習 API 使用
3. 🏗️ 閱讀 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) 了解架構設計
4. 💻 開始開發你的功能！

---

## 🆘 需要幫助？

- 📧 提交 Issue
- 💬 查看文檔
- 🔍 搜尋常見問題

---

## 🎊 恭喜！

你已經成功啟動 ToDoList 專案了！

Happy Coding! 🚀

---

**提示**：建議將此頁面加入書籤，方便日後參考。

