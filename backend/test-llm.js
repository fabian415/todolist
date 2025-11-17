/**
 * LLM 服務測試腳本
 * 用於驗證 Ollama 連接和任務解析功能
 * 
 * 使用方法：
 * node test-llm.js
 */

require('dotenv').config();
const { parseTaskDescription, testConnection } = require('./services/llmService');

const testCases = [
  {
    name: '測試案例 1：完整資訊',
    input: '下週三前把 Q4 報表整理好，包含數據匯入、視覺化圖表與審核，負責人小陳。'
  },
  {
    name: '測試案例 2：簡單任務',
    input: '明天完成網站首頁設計，包含 RWD 適配'
  },
  {
    name: '測試案例 3：複雜專案',
    input: '本月底前完成電商系統開發，需要用戶註冊登入、商品管理、購物車、訂單處理和金流串接功能，高優先度。'
  }
];

async function runTests() {
  console.log('🚀 開始測試 LLM 服務...\n');
  
  // 測試連接
  console.log('📡 測試 Ollama 連接...');
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error('❌ Ollama 連接失敗！');
    console.error('請確認：');
    console.error('  1. Ollama 已安裝並啟動（執行: ollama serve）');
    console.error('  2. 模型已下載（執行: ollama pull llama3.2）');
    console.error('  3. OLLAMA_BASE_URL 配置正確');
    process.exit(1);
  }
  
  console.log('✅ Ollama 連接成功！\n');
  console.log('═══════════════════════════════════════════════\n');
  
  // 執行測試案例
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`🧪 ${testCase.name}`);
    console.log(`📝 輸入: "${testCase.input}"\n`);
    
    try {
      const startTime = Date.now();
      const result = await parseTaskDescription(testCase.input);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('✅ 解析成功！');
      console.log(`⏱️  耗時: ${duration} 秒\n`);
      console.log('📊 結果:');
      console.log(`   主任務: ${result.content}`);
      console.log(`   到期日: ${result.dueDate || '未設定'}`);
      console.log(`   優先度: ${result.priority}`);
      console.log(`   標籤: ${result.tags.join(', ')}`);
      console.log(`   負責人: ${result.assignee || '未指定'}`);
      console.log(`   預估工時: ${result.estimatedEffortHours || 0} 小時`);
      console.log(`   子任務數量: ${result.subtasks.length}`);
      
      if (result.subtasks.length > 0) {
        console.log('   子任務明細:');
        result.subtasks.forEach((subtask, index) => {
          console.log(`     ${index + 1}. ${subtask.content} (${subtask.estimatedHours}h)`);
        });
      }
      
      console.log('\n' + '═'.repeat(47) + '\n');
      
    } catch (error) {
      console.error('❌ 解析失敗！');
      console.error(`錯誤訊息: ${error.message}\n`);
      console.log('═'.repeat(47) + '\n');
    }
    
    // 避免請求過於頻繁
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('🎉 測試完成！\n');
  
  // 顯示配置資訊
  console.log('⚙️  當前配置:');
  console.log(`   OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1'}`);
  console.log(`   OLLAMA_MODEL: ${process.env.OLLAMA_MODEL || 'llama3.2'}`);
  console.log('\n');
}

// 執行測試
runTests().catch(error => {
  console.error('💥 測試過程發生錯誤:', error);
  process.exit(1);
});


