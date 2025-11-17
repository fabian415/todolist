const express = require('express');
const router = express.Router();
const gaisService = require('../services/gaisService');

/**
 * @route   GET /api/ping
 * @desc    健康檢查端點（GAIS 必要）
 * @access  Public
 */
router.get('/ping', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/diagnosis
 * @desc    診斷端點，回傳系統狀態（GAIS 必要）
 * @access  Public
 */
router.get('/diagnosis', async (req, res) => {
  try {
    const diagnosis = await gaisService.getDiagnosis();
    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   POST /api/reregister
 * @desc    重新註冊端點，允許 GAIS 要求應用重新註冊（GAIS 必要）
 * @access  Public
 */
router.post('/reregister', async (req, res) => {
  console.log('📢 收到 GAIS 重新註冊請求');
  
  try {
    const success = await gaisService.registerApp();
    
    if (success) {
      res.json({
        success: true,
        message: '應用程式重新註冊成功',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: '應用程式重新註冊失敗',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('❌ 重新註冊失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /api/gais/status
 * @desc    取得 GAIS 註冊狀態
 * @access  Public
 */
router.get('/gais/status', (req, res) => {
  const status = gaisService.getStatus();
  res.json(status);
});

/**
 * @route   GET /api/gais/config
 * @desc    取得應用程式配置資訊
 * @access  Public
 */
router.get('/gais/config', (req, res) => {
  res.json({
    appName: gaisService.appName,
    appTitle: gaisService.appTitle,
    appVersion: gaisService.appVersion,
    appDescription: gaisService.appDescription,
    gaisModel: gaisService.gaisModel,
    gaisServer: gaisService.gaisServer,
  });
});

/**
 * @route   POST /api/chat
 * @desc    聊天端點，與 AI 模型互動（選用功能）
 * @access  Public
 */
router.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  // 驗證輸入
  if (!message || !Array.isArray(history)) {
    return res.status(400).json({ 
      error: '無效的輸入',
      message: '需要 message (string) 和 history (array)' 
    });
  }

  // 建立訊息陣列
  const messages = [
    ...history.map(msg => ({ 
      role: msg.role, 
      content: msg.content 
    })),
    { role: 'user', content: message },
  ];

  try {
    console.log('🤖 呼叫 Ollama:', { model: gaisService.gaisModel, messages });
    
    const response = await gaisService.chat(messages);

    // 設定 SSE 標頭
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 處理串流回應
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        if (line) {
          try {
            const data = JSON.parse(line);
            
            if (data.message && data.message.content) {
              res.write(`data: ${JSON.stringify({ 
                message: { content: data.message.content } 
              })}\n\n`);
            } else if (data.done === true) {
              res.write('data: [DONE]\n\n');
            }
          } catch (error) {
            console.error('❌ 解析 chunk 失敗:', error, 'Line:', line);
            res.write(`data: ${JSON.stringify({ 
              error: '解析回應失敗' 
            })}\n\n`);
          }
        }
      });
    });

    response.data.on('end', () => {
      console.log('✅ 串流結束');
      if (!res.finished) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    response.data.on('error', (error) => {
      console.error('❌ 串流錯誤:', error);
      if (!res.finished) {
        res.write(`data: ${JSON.stringify({ 
          error: '串流錯誤', 
          message: error.message 
        })}\n\n`);
        res.end();
      }
    });
  } catch (error) {
    console.error('❌ 聊天錯誤:', error.message);
    
    if (!res.finished) {
      res.write(`data: ${JSON.stringify({ 
        error: '無法與 AI 模型通訊', 
        message: error.message 
      })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;

