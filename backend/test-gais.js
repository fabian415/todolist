#!/usr/bin/env node

/**
 * GAIS 整合功能測試腳本
 * 用於驗證 GAIS 相關的 API 端點和功能
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.APP_HOST 
  ? `http://${process.env.APP_HOST}:${process.env.PORT || 5000}`
  : 'http://localhost:5000';

console.log('🧪 GAIS 整合功能測試');
console.log('═'.repeat(50));
console.log(`API Base URL: ${API_BASE}`);
console.log('═'.repeat(50));
console.log('');

// 測試計數器
let passedTests = 0;
let failedTests = 0;

/**
 * 執行測試並顯示結果
 */
async function runTest(name, testFn) {
  try {
    console.log(`🔍 測試: ${name}`);
    await testFn();
    console.log(`✅ 通過: ${name}\n`);
    passedTests++;
  } catch (error) {
    console.error(`❌ 失敗: ${name}`);
    console.error(`   錯誤: ${error.message}\n`);
    failedTests++;
  }
}

/**
 * 測試 1: Ping 端點
 */
async function testPing() {
  const response = await axios.get(`${API_BASE}/api/ping`);
  
  if (response.status !== 200) {
    throw new Error(`狀態碼錯誤: ${response.status}`);
  }
  
  if (response.data.status !== 'running') {
    throw new Error('狀態不正確');
  }
  
  console.log(`   回應: ${JSON.stringify(response.data)}`);
}

/**
 * 測試 2: Diagnosis 端點
 */
async function testDiagnosis() {
  const response = await axios.get(`${API_BASE}/api/diagnosis`);
  
  if (response.status !== 200) {
    throw new Error(`狀態碼錯誤: ${response.status}`);
  }
  
  if (response.data.status !== 'success') {
    throw new Error('診斷狀態不正確');
  }
  
  if (!response.data.services) {
    throw new Error('缺少 services 資訊');
  }
  
  console.log(`   資料庫狀態: ${response.data.services.database}`);
  console.log(`   GAIS 狀態: ${response.data.services.gais}`);
}

/**
 * 測試 3: GAIS 狀態端點
 */
async function testGaisStatus() {
  const response = await axios.get(`${API_BASE}/api/gais/status`);
  
  if (response.status !== 200) {
    throw new Error(`狀態碼錯誤: ${response.status}`);
  }
  
  if (!response.data.appName) {
    throw new Error('缺少 appName');
  }
  
  console.log(`   應用名稱: ${response.data.appName}`);
  console.log(`   應用版本: ${response.data.appVersion}`);
  console.log(`   註冊狀態: ${response.data.registered ? '已註冊' : '未註冊'}`);
}

/**
 * 測試 4: GAIS 配置端點
 */
async function testGaisConfig() {
  const response = await axios.get(`${API_BASE}/api/gais/config`);
  
  if (response.status !== 200) {
    throw new Error(`狀態碼錯誤: ${response.status}`);
  }
  
  if (!response.data.appName) {
    throw new Error('缺少 appName');
  }
  
  console.log(`   應用名稱: ${response.data.appName}`);
  console.log(`   應用標題: ${response.data.appTitle}`);
  console.log(`   GAIS 模型: ${response.data.gaisModel}`);
}

/**
 * 測試 5: 重新註冊端點
 */
async function testReregister() {
  const response = await axios.post(`${API_BASE}/api/reregister`);
  
  if (response.status !== 200) {
    throw new Error(`狀態碼錯誤: ${response.status}`);
  }
  
  if (response.data.success === undefined) {
    throw new Error('回應格式不正確');
  }
  
  console.log(`   重新註冊: ${response.data.success ? '成功' : '失敗'}`);
  if (response.data.message) {
    console.log(`   訊息: ${response.data.message}`);
  }
}

/**
 * 測試 6: 健康檢查端點（根路由）
 */
async function testHealthCheck() {
  const response = await axios.get(`${API_BASE}/health`);
  
  if (response.status !== 200) {
    throw new Error(`狀態碼錯誤: ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('健康檢查失敗');
  }
  
  console.log(`   訊息: ${response.data.message}`);
}

/**
 * 主測試流程
 */
async function main() {
  console.log('開始執行測試...\n');
  
  // 執行所有測試
  await runTest('Health Check (根路由)', testHealthCheck);
  await runTest('Ping 端點', testPing);
  await runTest('Diagnosis 端點', testDiagnosis);
  await runTest('GAIS 狀態端點', testGaisStatus);
  await runTest('GAIS 配置端點', testGaisConfig);
  await runTest('重新註冊端點', testReregister);
  
  // 顯示測試摘要
  console.log('═'.repeat(50));
  console.log('測試摘要:');
  console.log(`✅ 通過: ${passedTests} 個測試`);
  console.log(`❌ 失敗: ${failedTests} 個測試`);
  console.log('═'.repeat(50));
  
  // 退出碼
  process.exit(failedTests > 0 ? 1 : 0);
}

// 執行測試
main().catch(error => {
  console.error('\n❌ 測試執行失敗:');
  console.error(error);
  process.exit(1);
});

