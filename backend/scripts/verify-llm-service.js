/**
 * LLM 服務驗證腳本
 * 用於驗證從 OpenAI 客戶端遷移到 GAIS Service 後的功能
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { parseTaskDescription, testConnection } = require('../services/llmService');

async function verify() {
  console.log('🔍 開始驗證 LLM 服務...\n');
  console.log('=' .repeat(60));
  
  // 1. 檢查環境變數
  console.log('\n📋 步驟 1：檢查環境變數');
  console.log('-'.repeat(60));
  
  const requiredEnvVars = {
    'OLLAMA_HOST': process.env.OLLAMA_HOST || 'http://localhost:11434',
    'GAIS_MODEL': process.env.GAIS_MODEL || 'llama3',
  };
  
  console.log('環境變數配置：');
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    console.log(`  ${key}: ${value}`);
  }
  
  // 2. 測試連接
  console.log('\n📡 步驟 2：測試 Ollama 連接');
  console.log('-'.repeat(60));
  
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Ollama 連接成功');
    } else {
      console.log('❌ Ollama 連接失敗');
      console.log('\n建議：');
      console.log('  1. 確認 Ollama 服務是否運行：curl http://localhost:11434/api/tags');
      console.log('  2. 檢查 OLLAMA_HOST 環境變數是否正確');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ 連接測試失敗:', error.message);
    console.log('\n錯誤詳情:', error);
    process.exit(1);
  }
  
  // 3. 測試簡單任務拆解
  console.log('\n🧪 步驟 3：測試簡單任務拆解');
  console.log('-'.repeat(60));
  
  const simpleTask = '開發用戶登入功能';
  console.log(`輸入：${simpleTask}`);
  
  try {
    const result1 = await parseTaskDescription(simpleTask);
    console.log('✅ 簡單任務拆解成功');
    console.log(`  - 任務標題: ${result1.content}`);
    console.log(`  - 優先度: ${result1.priority}`);
    console.log(`  - 標籤: [${result1.tags.join(', ')}]`);
    console.log(`  - 子任務數量: ${result1.subtasks.length}`);
    console.log(`  - 預估工時: ${result1.estimatedEffortHours || '未指定'} 小時`);
  } catch (error) {
    console.log('❌ 簡單任務拆解失敗:', error.message);
    console.log('\n錯誤詳情:', error);
    process.exit(1);
  }
  
  // 4. 測試複雜任務拆解
  console.log('\n🧪 步驟 4：測試複雜任務拆解');
  console.log('-'.repeat(60));
  
  const complexTask = '建立完整的電商系統，包括商品管理、購物車、訂單處理和支付功能，需要在下週五前完成';
  console.log(`輸入：${complexTask.substring(0, 50)}...`);
  
  try {
    const result2 = await parseTaskDescription(complexTask);
    console.log('✅ 複雜任務拆解成功');
    console.log(`  - 任務標題: ${result2.content}`);
    console.log(`  - 優先度: ${result2.priority}`);
    console.log(`  - 到期日: ${result2.dueDate || '未指定'}`);
    console.log(`  - 標籤: [${result2.tags.join(', ')}]`);
    console.log(`  - 子任務數量: ${result2.subtasks.length}`);
    
    if (result2.subtasks.length > 0) {
      console.log('  - 子任務清單:');
      result2.subtasks.forEach((subtask, index) => {
        console.log(`    ${index + 1}. ${subtask.content} (${subtask.estimatedHours}h)`);
      });
    }
  } catch (error) {
    console.log('❌ 複雜任務拆解失敗:', error.message);
    console.log('\n錯誤詳情:', error);
    process.exit(1);
  }
  
  // 5. 驗證 JSON 格式
  console.log('\n📝 步驟 5：驗證輸出格式');
  console.log('-'.repeat(60));
  
  try {
    const result3 = await parseTaskDescription('測試任務');
    
    // 檢查必要欄位
    const requiredFields = ['content', 'priority', 'tags', 'subtasks'];
    const missingFields = requiredFields.filter(field => !(field in result3));
    
    if (missingFields.length === 0) {
      console.log('✅ 輸出格式正確，包含所有必要欄位');
    } else {
      console.log('❌ 輸出格式錯誤，缺少欄位:', missingFields.join(', '));
      process.exit(1);
    }
    
    // 檢查數據類型
    if (typeof result3.content !== 'string') {
      console.log('❌ content 欄位類型錯誤，應為 string');
      process.exit(1);
    }
    
    if (!Array.isArray(result3.tags)) {
      console.log('❌ tags 欄位類型錯誤，應為 array');
      process.exit(1);
    }
    
    if (!Array.isArray(result3.subtasks)) {
      console.log('❌ subtasks 欄位類型錯誤，應為 array');
      process.exit(1);
    }
    
    console.log('✅ 數據類型驗證通過');
    
  } catch (error) {
    console.log('❌ 格式驗證失敗:', error.message);
    process.exit(1);
  }
  
  // 總結
  console.log('\n' + '='.repeat(60));
  console.log('🎉 所有驗證測試通過！');
  console.log('='.repeat(60));
  console.log('\n✅ LLM 服務已成功遷移到 GAIS Service');
  console.log('✅ 所有功能正常運作');
  console.log('✅ 輸出格式符合預期');
  console.log('\n📌 下一步：');
  console.log('  1. 在開發環境中測試完整的 API 端點');
  console.log('  2. 使用前端界面進行用戶測試');
  console.log('  3. 準備部署到生產環境');
  console.log('\n💡 提示：使用以下命令測試 API 端點：');
  console.log('  curl -X POST http://localhost:5000/api/tasks/ai/parse \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('    -d \'{"description": "你的任務描述"}\'');
  console.log('');
}

// 執行驗證
verify().catch(error => {
  console.error('\n💥 驗證過程發生未預期的錯誤:');
  console.error(error);
  process.exit(1);
});

