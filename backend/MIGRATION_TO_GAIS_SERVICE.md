# 遷移到 GAIS Service

## 概述
本次更新將 `llmService.js` 中的 LLM 實現從 OpenAI 客戶端遷移到使用 `gaisService.js` 的 `chat` 方法。

## 更改內容

### 1. `backend/services/llmService.js`

#### 之前的實現
- 使用 `openai` npm 套件
- 透過 OpenAI 客戶端庫調用 Ollama API
- 非流式響應

#### 現在的實現
- 使用 `gaisService.js` 的 `chat` 方法
- 直接透過 Axios 調用 Ollama API
- 處理流式響應

### 2. 主要變更

#### `parseTaskDescription` 函數
```javascript
// 之前
const client = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

const response = await client.chat.completions.create({
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.3,
  response_format: { type: 'json_object' }
});

const content = response.choices[0].message.content;

// 現在
const gaisService = require('./gaisService');

const response = await gaisService.chat([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt }
]);

// 處理流式響應
let content = '';
for await (const chunk of response.data) {
  const lines = chunk.toString().split('\n').filter(line => line.trim());
  for (const line of lines) {
    try {
      const json = JSON.parse(line);
      if (json.message && json.message.content) {
        content += json.message.content;
      }
      if (json.done) {
        break;
      }
    } catch (e) {
      // 忽略無法解析的行
    }
  }
}
```

#### `testConnection` 函數
同樣更新為使用 `gaisService.chat` 方法並處理流式響應。

### 3. 優勢

1. **統一的服務層**：所有 LLM 調用現在都通過 `gaisService`，便於維護和監控
2. **移除重複依賴**：不再需要 `openai` npm 套件
3. **更好的集成**：與 GAIS 平台的整合更加緊密
4. **配置集中化**：所有 Ollama 相關配置都在 `gaisService` 中管理

### 4. 注意事項

- **流式響應處理**：新實現需要正確處理 Ollama 的流式響應格式
- **錯誤處理**：保持了相同的錯誤處理機制
- **JSON 解析**：保留了 JSON 提取的容錯機制

### 5. 環境變數

以下環境變數現在由 `gaisService` 統一管理：
- `OLLAMA_HOST`：Ollama 服務器地址（默認：http://localhost:11434）
- `GAIS_MODEL`：使用的模型名稱（默認：llama3）

不再需要的環境變數：
- `OLLAMA_BASE_URL`（被 `OLLAMA_HOST` 取代）
- `OLLAMA_MODEL`（被 `GAIS_MODEL` 取代）

### 6. 測試建議

測試 AI 任務拆解功能：
```bash
curl -X POST http://localhost:5000/api/tasks/ai/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"description": "開發用戶登入功能，包括前端表單和後端 API"}'
```

### 7. 回滾計畫

如需回滾到舊版本：
1. 恢復 `llmService.js` 中的 OpenAI 客戶端實現
2. 重新安裝 `openai` 套件：`npm install openai@^6.9.0`
3. 確保 `OLLAMA_BASE_URL` 和 `OLLAMA_MODEL` 環境變數已配置

## 完成日期
2025-11-17

