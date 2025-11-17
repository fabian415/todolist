// ===== Express 框架 =====
const express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cors = require('cors');
const axios = require('axios');

// 配置
const APP_NAME = process.env.APP_NAME;
const APP_VERSION = process.env.APP_VERSION;
const APP_TITLE = process.env.APP_TITLE;
const APP_DESCRIPTION = process.env.APP_DESCRIPTION;
const APP_LOGO = process.env.APP_LOGO;

const APP_HOST = process.env.APP_HOST;
const APP_PORT = process.env.APP_PORT;
const APP_TOKEN = process.env.APP_TOKEN;

const GAIS_HOST = process.env.GAIS_HOST;
const GAIS_PORT = process.env.GAIS_PORT;
const GAIS_SERVER = `http://${GAIS_HOST}:${GAIS_PORT}`;
const GAIS_MODEL = process.env.GAIS_MODEL;
const GAIS_PROTOCOL = process.env.GAIS_PROTOCOL;

let OLLAMA_HOST = process.env.OLLAMA_HOST;

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

// 工具函數：將檔案轉換為 Base64
function toBase64(filePath) {
  try {
    const format = path.extname(filePath).substring(1);
    const imageData = fs.readFileSync(filePath);
    const base64Data = imageData.toString('base64');
    return `data:image/${format};base64,${base64Data}`;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return null;
  }
}

// 註冊應用到 GAIS
async function registerApp() {
  console.log('Registering app to GAIS...');
  try {
    const response = await axios.post(
      `${GAIS_SERVER}/api/apps/register`,
      {
        protocol: GAIS_PROTOCOL,
        properties: {
          name: APP_NAME,
          version: APP_VERSION,
          title: APP_TITLE,
          description: APP_DESCRIPTION,
          logo: toBase64(path.join(__dirname, 'logo.png')),
          // 🔥 修改：現在 backend 直接服務前端
          url: `http://${APP_NAME}-app:${APP_PORT}`,
          ping: '/api/ping',
          diagnosis: '/api/diagnosis',
          reregister: '/api/reregister',
        },
        resources: ['ollama'],
      },
      {
        headers: {
          Authorization: `Bearer ${APP_TOKEN}`,
        },
      }
    );

    if (response.status === 200) {
      console.log('✅ App registered successfully');
    }
  } catch (error) {
    console.error('❌ Failed to register app:', error.message);
  }
}

// 取消註冊應用
async function unregisterApp() {
  try {
    await axios.delete(
      `${GAIS_SERVER}/api/apps/register/${APP_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${APP_TOKEN}`,
        },
      }
    );
    console.log('✅ App unregistered successfully');
  } catch (error) {
    console.error('❌ Failed to unregister app:', error.message);
  }
}

// ========== API Routes（必須在靜態檔案之前） ==========

// 1. Ping 端點
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'running',
  });
});

// 2. Diagnosis 端點
app.get('/api/diagnosis', (req, res) => {
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
  });
});

// 3. Reregister 端點
app.post('/api/reregister', async (req, res) => {
  console.log('📢 GenAI Studio 要求重新註冊');
  try {
    await registerApp();
    res.json({
      success: true,
      message: 'App reregistered successfully',
    });
  } catch (error) {
    console.error('❌ 重新註冊失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. 聊天端點
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || !Array.isArray(history)) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const messages = [
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message },
  ];

  try {
    console.log('Calling Ollama:', { model: GAIS_MODEL, messages });
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      {
        model: GAIS_MODEL,
        messages,
        stream: true,
      },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      console.log('Raw chunk:', chunk.toString());
      lines.forEach(line => {
        console.log('Processing line:', line);
        if (line) {
          try {
            const data = JSON.parse(line);
            console.log('Parsed data:', data);
            if (data.message && data.message.content) {
              res.write(`data: ${JSON.stringify({ message: { content: data.message.content } })}\n\n`);
              console.log('Sending to client:', { message: { content: data.message.content } });
            } else if (data.done === true) {
              console.log('Stream done detected');
              res.write('data: [DONE]\n\n');
            }
          } catch (error) {
            console.error('Error parsing chunk:', error, 'Line:', line);
            res.write(`data: ${JSON.stringify({ error: 'Failed to parse response' })}\n\n`);
          }
        }
      });
    });

    response.data.on('end', () => {
      console.log('Stream ended');
      if (!res.finished) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.finished) {
        res.write(`data: ${JSON.stringify({ error: 'Stream error', message: error.message })}\n\n`);
        res.end();
      }
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    if (!res.finished) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to communicate with AI model', message: error.message })}\n\n`);
      res.end();
    }
  }
});

// 5. 取得配置資訊
app.get('/api/config', (req, res) => {
  res.json({
    appName: APP_NAME,
    appTitle: APP_TITLE,
    appVersion: APP_VERSION,
    appDescription: APP_DESCRIPTION,
    model: GAIS_MODEL,
  });
});

// ========== 靜態檔案服務（必須在 API 之後） ==========

// 服務 /apps/wun 路徑的靜態檔案
app.use('/apps/wun', express.static(path.join(__dirname, 'frontend-build')));

// 服務根路徑的靜態檔案
app.use('/', express.static(path.join(__dirname, 'frontend-build')));

// 處理 SPA 路由（必須放在最後）
app.get('/apps/wun/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-build', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-build', 'index.html'));
});

// ========== 啟動伺服器 ==========
const server = app.listen(APP_PORT, APP_HOST, async () => {
  console.log(`🚀 Server running at http://${APP_HOST}:${APP_PORT}`);
  console.log('📝 Attempting to register to GenAI Studio...');
  await registerApp();
});

// ========== 優雅關閉 ==========
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  await unregisterApp();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  await unregisterApp();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});