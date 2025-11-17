# 🚀 AI 功能快速啟動指南

這是一個 5 分鐘快速設定 AI 任務拆解功能的指南。

## 📋 前置檢查清單

- [ ] Node.js 已安裝
- [ ] MongoDB 正在運行
- [ ] 後端和前端已安裝依賴

## ⚡ 快速設定（5 步驟）

### 步驟 1：安裝 Ollama (2 分鐘)

**Windows/Mac/Linux:**
訪問 https://ollama.ai/download 下載並安裝

或使用命令：

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 下載 .exe 安裝檔並執行
```

### 步驟 2：啟動 Ollama 並下載模型 (2 分鐘)

```bash
# 啟動 Ollama 服務（在一個終端機視窗）
ollama serve

# 在另一個終端機，下載模型
ollama pull llama3.2
```

**提示：** 模型下載大約需要 1-2 分鐘（取決於網路速度）

### 步驟 3：配置環境變數 (30 秒)

編輯 `backend/.env`，添加以下內容：

```env
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2
```

### 步驟 4：測試後端連接 (30 秒)

```bash
cd backend
node test-llm.js
```

**預期輸出：**
```
🚀 開始測試 LLM 服務...
📡 測試 Ollama 連接...
✅ Ollama 連接成功！
```

如果看到錯誤，請檢查：
1. Ollama 服務是否在運行（`ollama serve`）
2. 模型是否已下載（`ollama list`）

### 步驟 5：啟動應用並測試 (1 分鐘)

```bash
# 確保後端正在運行
cd backend
npm run dev

# 確保前端正在運行（新終端機）
cd frontend
npm start
```

**測試 AI 功能：**
1. 登入系統
2. 進入任一專案
3. 點擊「+ 新增任務」
4. 在頂部 AI 智能助手區域輸入：
   ```
   明天完成首頁設計，包含 RWD 適配和優化
   ```
5. 點擊「✨ 使用 AI 自動拆解任務」
6. 等待 3-10 秒
7. ✅ 任務表單應該自動填充！

## 🎉 完成！

如果一切正常，你應該看到：
- ✅ 任務標題自動填入
- ✅ 子任務列表已生成
- ✅ 到期日已設定
- ✅ 標籤已添加
- ✅ 預估工時已計算

## 🔧 故障排除

### 問題 1：Ollama 連接失敗

**檢查：**
```bash
# 測試 Ollama 是否運行
curl http://localhost:11434/v1/models

# 如果失敗，重啟 Ollama
ollama serve
```

### 問題 2：模型未找到

**檢查：**
```bash
# 列出已安裝的模型
ollama list

# 如果沒有 llama3.2，下載它
ollama pull llama3.2
```

### 問題 3：AI 回應太慢

**解決方案：**
1. 使用更小的模型：
   ```bash
   ollama pull llama3.2  # 已經是較小的模型
   ```
2. 確保系統有足夠記憶體（建議 8GB+）
3. 關閉其他佔用資源的程序

### 問題 4：前端看不到 AI 區域

**檢查：**
1. 確保是在「新增任務」模式（不是編輯現有任務）
2. 清除瀏覽器快取並重新整理
3. 檢查瀏覽器控制台是否有錯誤

## 📝 測試案例

嘗試這些輸入來測試 AI：

### 簡單任務
```
明天完成登入頁面設計
```

### 中等任務
```
本週五前完成購物車功能，包含加入購物車、更新數量和結帳流程
```

### 複雜任務
```
下個月前完成電商網站開發，包含用戶系統、商品管理、購物車、訂單處理和金流串接，高優先度
```

## 🎓 進階配置

### 使用不同的模型

```bash
# 嘗試其他模型（可能更準確但較慢）
ollama pull mistral
ollama pull qwen2.5

# 更新 .env
OLLAMA_MODEL=mistral
```

### 調整 AI 參數

編輯 `backend/services/llmService.js`：

```javascript
const response = await client.chat.completions.create({
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  temperature: 0.3,  // 降低 = 更確定，提高 = 更創意
  max_tokens: 1000,  // 限制回應長度
});
```

## 📚 更多資源

- **完整設定指南**: [AI_SETUP.md](./AI_SETUP.md)
- **詳細測試指南**: [TEST_AI_FEATURE.md](./TEST_AI_FEATURE.md)
- **Ollama 官方文檔**: https://ollama.ai/docs
- **專案 README**: [README.md](./README.md)

## 💡 提示

1. **第一次使用時 AI 可能較慢**（正在載入模型）
2. **描述越詳細，結果越準確**
3. **可以重複使用 AI 來改進結果**
4. **如果結果不理想，試試不同的描述方式**

## ✅ 檢查清單

完成後，確認這些項目：

- [ ] Ollama 已安裝並運行
- [ ] 模型已下載（llama3.2）
- [ ] 環境變數已配置
- [ ] 後端測試成功（test-llm.js）
- [ ] 前端 UI 顯示 AI 區域
- [ ] 能成功使用 AI 解析任務
- [ ] 結果準確度可接受

**需要幫助？** 查看 [TEST_AI_FEATURE.md](./TEST_AI_FEATURE.md) 中的詳細故障排除指南。

---

**預估完成時間:** 5-10 分鐘（取決於網路速度和系統配置）

🎊 祝你使用愉快！

