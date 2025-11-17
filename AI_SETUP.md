# AI 任務拆解功能設定指南

## 功能概述

此功能使用 LLM（通過 Ollama）自動將用戶的任務描述拆解成結構化的任務數據，包括：

- 主任務標題
- 子任務列表（含預估工時）
- 到期日
- 優先度（高/中/低）
- 標籤
- 預估總工時

## 前置需求

### 1. 安裝 Ollama

**Windows/Mac/Linux:**
```bash
# 訪問官網下載安裝
https://ollama.ai/download
```

### 2. 啟動 Ollama 服務

```bash
ollama serve
```

### 3. 下載模型

推薦使用以下模型之一：

```bash
# 推薦：Llama 3.2（平衡性能與準確度）
ollama pull llama3.2

# 或者使用其他模型
ollama pull mistral
ollama pull qwen2.5
ollama pull deepseek-r1:1.5b
```

## 後端配置

在 `backend/.env` 文件中添加以下配置：

```env
# Ollama LLM 設定
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2
```

**配置說明：**
- `OLLAMA_BASE_URL`: Ollama API 的基礎 URL（默認為本地）
- `OLLAMA_MODEL`: 要使用的模型名稱

## 使用方法

### 1. 在前端新增任務時

1. 點擊「新增任務」按鈕
2. 在任務彈窗頂部會看到「🤖 AI 智能助手」區域
3. 在文本框中輸入任務描述，例如：

```
下週三前把 Q4 報表整理好，包含數據匯入、視覺化圖表與審核，負責人小陳。
```

4. 點擊「✨ 使用 AI 自動拆解任務」按鈕
5. AI 會自動填充以下欄位：
   - 任務標題
   - 到期日
   - 優先度
   - 標籤
   - 預估工時
   - 子任務列表

### 2. API 端點

也可以直接調用 API：

**請求：**
```bash
POST /api/tasks/ai/parse
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "下週三前把 Q4 報表整理好，包含數據匯入、視覺化圖表與審核，負責人小陳。"
}
```

**回應：**
```json
{
  "success": true,
  "message": "AI 任務拆解成功",
  "data": {
    "content": "整理 Q4 報表",
    "dueDate": "2025-11-19",
    "priority": "高",
    "tags": ["報表", "Q4"],
    "assignee": "小陳",
    "estimatedEffortHours": 7.5,
    "subtasks": [
      {
        "content": "匯入數據",
        "estimatedHours": 2,
        "completed": false
      },
      {
        "content": "建立視覺化",
        "estimatedHours": 4,
        "completed": false
      },
      {
        "content": "審核與修正",
        "estimatedHours": 1.5,
        "completed": false
      }
    ]
  }
}
```

## 故障排除

### 問題 1：AI 解析失敗

**可能原因：**
1. Ollama 服務未啟動
2. 模型未下載
3. 端口衝突

**解決方法：**
```bash
# 檢查 Ollama 是否運行
curl http://localhost:11434/v1/models

# 重啟 Ollama
ollama serve

# 確認模型已下載
ollama list
```

### 問題 2：回應時間過長

**解決方法：**
1. 使用更小的模型（如 `llama3.2`）
2. 確保系統有足夠的記憶體
3. 考慮使用 GPU 加速

### 問題 3：解析結果不準確

**解決方法：**
1. 提供更詳細的任務描述
2. 使用更強大的模型（如 `qwen2.5`）
3. 在描述中明確指出到期日、負責人等資訊

## 技術架構

```
用戶輸入
    ↓
前端 TaskModal.js
    ↓
API: POST /api/tasks/ai/parse
    ↓
taskController.parseTaskWithAI()
    ↓
llmService.parseTaskDescription()
    ↓
Ollama (通過 OpenAI API 格式)
    ↓
結構化任務數據
    ↓
自動填充表單
```

## 自定義 Prompt

如需修改 AI 解析邏輯，編輯 `backend/services/llmService.js` 中的 `systemPrompt`：

```javascript
const systemPrompt = `你是一個專業的任務管理助手...`;
```

## 性能建議

1. **本地部署**: 使用 Ollama 本地運行，無需網路連接
2. **模型選擇**: 
   - 快速回應：`llama3.2` (較小)
   - 高準確度：`qwen2.5` (較大)
3. **快取**: 考慮快取常見任務模式的解析結果
4. **批次處理**: 如需處理多個任務，可批次調用 API

## 進階配置

### 使用遠端 Ollama 服務

```env
OLLAMA_BASE_URL=http://remote-server:11434/v1
```

### 調整模型參數

在 `llmService.js` 中修改：

```javascript
const response = await client.chat.completions.create({
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  temperature: 0.3,  // 降低隨機性
  max_tokens: 1000,  // 限制回應長度
  // ...
});
```

## 安全性考量

1. ✅ 所有 API 端點都需要身份驗證
2. ✅ 輸入驗證防止注入攻擊
3. ✅ 錯誤處理不洩漏敏感資訊
4. ✅ 使用本地 Ollama，數據不離開伺服器

## 授權與依賴

- **OpenAI SDK**: MIT License
- **Ollama**: MIT License
- **使用的模型**: 請查看各模型的授權條款

## 更新記錄

### v1.0.0 (2025-11-17)
- ✨ 初始版本
- 🤖 支援任務自動拆解
- 📊 支援預估工時計算
- 🏷️ 自動標籤提取
- 📅 智能日期解析

## 支援

如有問題或建議，請：
1. 檢查本文件的故障排除部分
2. 查看 Ollama 官方文檔：https://ollama.ai/docs
3. 提交 Issue 或聯繫開發團隊

