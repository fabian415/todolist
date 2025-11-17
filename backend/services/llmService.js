const OpenAI = require('openai');

// 初始化 OpenAI 客户端，配置为使用 Ollama
const client = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama 不需要真實的 API key，但客戶端要求必須提供
});

/**
 * 使用 LLM 將用戶輸入的描述拆解成結構化任務
 * @param {string} userInput - 用戶輸入的任務描述
 * @param {Date} currentDate - 當前日期，用於計算相對時間
 * @returns {Promise<Object>} 結構化的任務數據
 */
async function parseTaskDescription(userInput, currentDate = new Date()) {
  try {
    const systemPrompt = `你是一個專業的任務管理助手。你的工作是將用戶的任務描述拆解成結構化的任務數據。

請分析用戶的輸入，並提取以下資訊：
1. 主任務標題（簡潔明確）
2. 到期日（如果提到"下週三"、"明天"等相對時間，請計算具體日期）
3. 子任務列表（將複雜任務拆解成 2-5 個可執行的子任務）
4. 每個子任務的預估工時（單位：小時）
5. 相關標籤（2-4 個關鍵詞）
6. 優先度（高/中/低）
7. 負責人（如果有提到）

當前日期是：${currentDate.toLocaleDateString('zh-TW', { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit',
  weekday: 'long'
})}

請以 JSON 格式回覆，格式如下：
{
  "content": "主任務標題",
  "dueDate": "2025-11-20",
  "priority": "高",
  "tags": ["標籤1", "標籤2"],
  "assignee": "負責人姓名",
  "estimatedEffortHours": 7.5,
  "subtasks": [
    {
      "content": "子任務 1 描述",
      "estimatedHours": 2
    },
    {
      "content": "子任務 2 描述",
      "estimatedHours": 4
    }
  ]
}

注意事項：
- 如果無法確定到期日，設為 null
- 如果沒有提到負責人，設為 null
- 優先度只能是：高、中、低
- 預估工時要合理（0.5-8 小時為宜）
- 子任務要具體可執行
- 只回覆 JSON，不要有其他文字說明`;

    const userPrompt = `請拆解以下任務描述：

${userInput}`;

    const response = await client.chat.completions.create({
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // 降低隨機性，確保輸出更穩定
      response_format: { type: 'json_object' } // 要求回應 JSON 格式
    });

    const content = response.choices[0].message.content;
    let parsedData;
    
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      // 如果 JSON 解析失敗，嘗試提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('無法解析 LLM 返回的 JSON 數據');
      }
    }

    // 驗證和標準化數據
    const result = {
      content: parsedData.content || '未命名任務',
      dueDate: parsedData.dueDate || null,
      priority: ['高', '中', '低'].includes(parsedData.priority) ? parsedData.priority : '中',
      tags: Array.isArray(parsedData.tags) ? parsedData.tags : [],
      assignee: parsedData.assignee || null,
      estimatedEffortHours: typeof parsedData.estimatedEffortHours === 'number' 
        ? parsedData.estimatedEffortHours 
        : null,
      subtasks: Array.isArray(parsedData.subtasks) 
        ? parsedData.subtasks.map(st => ({
            content: st.content || '',
            estimatedHours: typeof st.estimatedHours === 'number' ? st.estimatedHours : 0,
            completed: false
          }))
        : []
    };

    return result;
  } catch (error) {
    console.error('LLM 服務錯誤:', error);
    throw new Error(`LLM 服務錯誤: ${error.message}`);
  }
}

/**
 * 測試 Ollama 連接是否正常
 * @returns {Promise<boolean>} 連接是否成功
 */
async function testConnection() {
  try {
    const response = await client.chat.completions.create({
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });
    return true;
  } catch (error) {
    console.error('Ollama 連接測試失敗:', error.message);
    return false;
  }
}

module.exports = {
  parseTaskDescription,
  testConnection
};



