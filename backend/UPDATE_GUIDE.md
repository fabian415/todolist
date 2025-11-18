# LLM 服務更新指南

## 🎯 更新目的
將 `/api/tasks/ai/parse` 端點的 LLM 實現從 OpenAI 客戶端遷移到使用 `gaisService.js` 的 `chat` 方法。

## 📋 更新步驟

### 1. 更新依賴項
由於移除了 `openai` 套件，需要更新 node_modules：

```bash
cd backend
npm install
```

這會根據更新後的 `package.json` 重新安裝依賴項。

### 2. 環境變數配置
確保 `.env` 文件中包含以下配置：

```env
# Ollama 配置
OLLAMA_HOST=http://localhost:11434
GAIS_MODEL=llama3

# 如果使用 GAIS 平台註冊
APP_TOKEN=your_app_token_here
GAIS_HOST=localhost
GAIS_PORT=8000
```

**注意**：以下環境變數已不再使用：
- `OLLAMA_BASE_URL` → 改用 `OLLAMA_HOST`
- `OLLAMA_MODEL` → 改用 `GAIS_MODEL`

### 3. 啟動服務
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### 4. 驗證功能

#### 方法 1：使用 curl
```bash
# 先登入取得 token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your_email@example.com", "password": "your_password"}'

# 使用返回的 token 測試 AI 拆解
curl -X POST http://localhost:5000/api/tasks/ai/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "description": "開發用戶認證系統，包括註冊、登入、密碼重設功能"
  }'
```

#### 方法 2：使用前端界面
1. 登入系統
2. 進入任務建立頁面
3. 輸入複雜的任務描述
4. 點擊「AI 智能拆解」按鈕
5. 檢查返回的結構化任務數據

### 5. 預期響應格式
```json
{
  "success": true,
  "message": "AI 任務拆解成功",
  "data": {
    "content": "開發用戶認證系統",
    "dueDate": null,
    "priority": "高",
    "tags": ["開發", "認證", "安全"],
    "assignee": null,
    "estimatedEffortHours": 24,
    "subtasks": [
      {
        "content": "實現用戶註冊功能",
        "estimatedHours": 6,
        "completed": false
      },
      {
        "content": "實現用戶登入功能",
        "estimatedHours": 6,
        "completed": false
      },
      {
        "content": "實現密碼重設功能",
        "estimatedHours": 8,
        "completed": false
      },
      {
        "content": "編寫單元測試",
        "estimatedHours": 4,
        "completed": false
      }
    ]
  }
}
```

## 🔍 故障排除

### 問題 1：連接 Ollama 失敗
**錯誤訊息**：`Ollama 呼叫失敗: connect ECONNREFUSED`

**解決方案**：
1. 確認 Ollama 服務是否運行：
   ```bash
   # 檢查 Ollama 進程
   curl http://localhost:11434/api/tags
   ```
2. 如果未運行，啟動 Ollama 服務
3. 檢查 `OLLAMA_HOST` 環境變數是否正確

### 問題 2：模型不存在
**錯誤訊息**：`model 'llama3' not found`

**解決方案**：
```bash
# 下載所需的模型
ollama pull llama3

# 或使用其他可用的模型
ollama list
```
然後更新 `.env` 文件中的 `GAIS_MODEL`。

### 問題 3：JSON 解析失敗
**錯誤訊息**：`無法解析 LLM 返回的 JSON 數據`

**可能原因**：
- 模型返回的不是有效的 JSON 格式
- 模型能力不足，無法理解指令

**解決方案**：
1. 使用更強大的模型（如 llama3.2, mistral）
2. 檢查 system prompt 是否正確指定 JSON 格式要求
3. 查看控制台日誌，了解實際返回的內容

## 📊 性能比較

| 指標 | 舊實現 (OpenAI 客戶端) | 新實現 (GAIS Service) |
|------|------------------------|----------------------|
| 依賴項大小 | ~2.5 MB | ~0 MB (使用現有 axios) |
| 響應方式 | 非流式 | 流式 |
| 配置集中度 | 分散 | 集中在 gaisService |
| 與 GAIS 整合 | 無 | 完整整合 |

## 🎓 技術細節

### 流式響應處理
新實現使用流式響應，可以即時接收 LLM 的輸出：

```javascript
for await (const chunk of response.data) {
  const lines = chunk.toString().split('\n').filter(line => line.trim());
  for (const line of lines) {
    const json = JSON.parse(line);
    if (json.message && json.message.content) {
      content += json.message.content;
    }
  }
}
```

這種方式：
- ✅ 減少記憶體佔用
- ✅ 可以實現進度顯示（未來功能）
- ✅ 更符合 Ollama API 的設計

### 錯誤處理
保留了原有的容錯機制：
- 自動提取 JSON 內容
- 數據驗證和標準化
- 詳細的錯誤日誌

## 📚 相關文件
- [遷移詳細說明](./MIGRATION_TO_GAIS_SERVICE.md)
- [GAIS Service 文檔](./services/gaisService.js)
- [LLM Service 文檔](./services/llmService.js)

## ✅ 檢查清單
- [ ] 已執行 `npm install` 更新依賴項
- [ ] 已更新 `.env` 環境變數
- [ ] Ollama 服務正在運行
- [ ] 所需的模型已下載
- [ ] 已測試 AI 任務拆解功能
- [ ] 功能運作正常

## 🆘 需要幫助？
如遇到問題，請檢查：
1. 控制台錯誤日誌
2. Ollama 服務狀態
3. 環境變數配置
4. 網路連接

---
更新日期：2025-11-17

