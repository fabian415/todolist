const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const gaisService = require('./services/gaisService');

// 載入專案根目錄的 .env 文件，並支援變數替換
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!myEnv.error) {
  dotenvExpand.expand(myEnv);
}

// 連接資料庫
connectDB();

// 初始化 Express
const app = express();

// 中介軟體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 設定
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 日誌記錄（只在開發環境）
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 路由
// GAIS 相關路由（必須在最前面，確保 /api/ping 等端點可以正常訪問）
app.use('/api', require('./routes/gais'));

// 應用程式路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ToDoList API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      tasks: '/api/tasks'
    }
  });
});

// 健康檢查
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到請求的端點'
  });
});

// 全域錯誤處理
app.use(errorHandler);

// 啟動伺服器
const APP_PORT = process.env.APP_PORT || 5000;
const APP_HOST = process.env.APP_HOST || '0.0.0.0';
const server = app.listen(APP_PORT, APP_HOST, async () => {
  console.log(`
╔════════════════════════════════════════╗
║   ToDoList API Server                 ║
║   Environment: ${process.env.NODE_ENV || 'development'.padEnd(21)}║
║   Port: ${APP_PORT.toString().padEnd(31)}║
║   URL: http://localhost:${APP_PORT.toString().padEnd(18)}║
╚════════════════════════════════════════╝
  `);
  
  // 嘗試註冊到 GAIS
  console.log('📝 嘗試註冊到 GenAI Studio (GAIS)...');
  await gaisService.registerApp();
});

// 處理未捕獲的異常
process.on('unhandledRejection', (err) => {
  console.error(`未處理的 Promise 拒絕: ${err.message}`);
  server.close(() => process.exit(1));
});

// 優雅關閉處理
process.on('SIGTERM', async () => {
  console.log('⚠️  收到 SIGTERM 信號，正在優雅關閉...');
  
  // 從 GAIS 註銷
  await gaisService.unregisterApp();
  
  // 關閉伺服器
  server.close(() => {
    console.log('✅ 伺服器已關閉');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('⚠️  收到 SIGINT 信號，正在優雅關閉...');
  
  // 從 GAIS 註銷
  await gaisService.unregisterApp();
  
  // 關閉伺服器
  server.close(() => {
    console.log('✅ 伺服器已關閉');
    process.exit(0);
  });
});

module.exports = app;

