const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// 載入環境變數
dotenv.config();

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
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ToDoList API Server                 ║
║   Environment: ${process.env.NODE_ENV || 'development'.padEnd(21)}║
║   Port: ${PORT.toString().padEnd(31)}║
║   URL: http://localhost:${PORT.toString().padEnd(18)}║
╚════════════════════════════════════════╝
  `);
});

// 處理未捕獲的異常
process.on('unhandledRejection', (err) => {
  console.error(`未處理的 Promise 拒絕: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;

