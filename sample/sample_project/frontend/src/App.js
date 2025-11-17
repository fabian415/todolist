import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const messagesEndRef = useRef(null);

  // API 基礎 URL - 動態提取 APP_NAME
  const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://172.22.12.118:3000/api';  // 開發環境
    }
    // 生產環境：檢查是否在 /apps/{appName} 路徑下
    if (window.location.pathname.startsWith('/apps/')) {
      const pathParts = window.location.pathname.split('/');
      return `/${pathParts[1]}/${pathParts[2]}/api`;  // /apps/{appName}/api
    }
    return '/api';  // 獨立部署
  };

  const API_BASE_URL = getApiBaseUrl();

  // 自動滾動到最新訊息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 載入配置
  useEffect(() => {
    console.log('API Base URL:', API_BASE_URL);
    fetch(`${API_BASE_URL}/config`)
      .then(res => {
        if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Config loaded:', data);
        setConfig(data);
      })
      .catch(err => console.error('Failed to load config:', err));
  }, [API_BASE_URL]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending to:', `${API_BASE_URL}/chat`);

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      // 只在開始時添加 assistant 訊息
      setMessages(prev => [...prev, assistantMessage]);

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value);
          console.log('Raw SSE chunk:', chunk);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              console.log('Raw data:', data);
              if (data === '[DONE]') {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);
                console.log('Parsed SSE data:', parsed);
                if (parsed.message?.content) {
                  assistantMessage.content += parsed.message.content;
                  // 使用函數式更新確保最新狀態
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...assistantMessage,
                      content: assistantMessage.content,
                    };
                    return newMessages;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error || 'Server error');
                }
              } catch (e) {
                console.error('Parse error:', e, 'Line:', line);
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: `解析錯誤：${e.message}`,
                    timestamp: new Date().toISOString(),
                    isError: true,
                  },
                ]);
                done = true;
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `錯誤：${error.message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      // 延遲一點時間確保狀態更新
      setTimeout(scrollToBottom, 0);
    }
  };

  // 清除對話
  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{config?.appTitle || 'GenAI Studio App Demo'}</h1>
        {config && (
          <p className="app-subtitle">
            {config.appDescription} | Model: {config.model}
          </p>
        )}
        <p className="app-api-info" style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
          API: {API_BASE_URL}
        </p>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>開始對話吧！在下方輸入您的訊息。</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}
              >
                <div className="message-role">
                  {msg.role === 'user' ? '👤 您' : '🤖 AI'}
                </div>
                <div className="message-content">
                  {msg.content}
                </div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant">
              <div className="message-role">🤖 AI</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-container" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="輸入訊息..."
            disabled={isLoading}
            className="message-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            發送
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={messages.length === 0}
            className="clear-button"
          >
            清除
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;