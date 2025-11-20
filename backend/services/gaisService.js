const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 載入專案根目錄的 .env 文件，並支援變數替換
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
if (!myEnv.error) {
  dotenvExpand.expand(myEnv);
}

/**
 * GAIS (GenAI Studio) 整合服務
 * 負責應用程式與 GAIS 平台的註冊、註銷和通訊
 */
class GAISService {
  constructor() {
    // 應用程式配置
    this.appName = process.env.APP_NAME || 'todolist';
    this.appVersion = process.env.APP_VERSION || '1.0.0';
    this.appTitle = process.env.APP_TITLE || 'ToDoList 專案管理系統';
    this.appDescription = process.env.APP_DESCRIPTION || '一個功能完整的專案與任務管理系統';
    this.appLogo = process.env.APP_LOGO || 'logo.png';
    
    // 網路配置
    this.appHost = process.env.APP_HOST;
    this.appPort = process.env.APP_PORT;
    this.appToken = process.env.APP_TOKEN;
    
    // GAIS 伺服器配置
    this.gaisHost = process.env.GAIS_HOST || 'localhost';
    this.gaisPort = process.env.GAIS_PORT || 8000;
    this.gaisServer = `http://${this.gaisHost}:${this.gaisPort}`;
    this.gaisProtocol = process.env.GAIS_PROTOCOL || 'v1';
    this.gaisModel = process.env.GAIS_MODEL || 'llama3';
    
    // Ollama 配置
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    
    // 註冊狀態
    this.isRegistered = false;
  }

  /**
   * 將圖片檔案轉換為 Base64 編碼
   * @param {string} filePath - 圖片檔案路徑
   * @returns {string|null} Base64 編碼的圖片資料或 null
   */
  toBase64(filePath) {
    try {
      const format = path.extname(filePath).substring(1);
      const imageData = fs.readFileSync(filePath);
      const base64Data = imageData.toString('base64');
      return `data:image/${format};base64,${base64Data}`;
    } catch (error) {
      console.error('❌ 轉換圖片為 Base64 失敗:', error.message);
      return null;
    }
  }

  /**
   * 註冊應用程式到 GAIS 平台
   * @returns {Promise<boolean>} 註冊是否成功
   */
  async registerApp() {
    // 如果沒有配置 GAIS，跳過註冊
    if (!this.appToken) {
      console.log('⚠️  未配置 APP_TOKEN，跳過 GAIS 註冊');
      return false;
    }

    console.log('📝 正在註冊應用程式到 GAIS...');
    
    try {
      const logoPath = path.join(__dirname, '..', this.appLogo);
      const logoBase64 = this.toBase64(logoPath);
      console.log(JSON.stringify(
        {
          protocol: this.gaisProtocol,
          properties: {
            name: this.appName,
            version: this.appVersion,
            title: this.appTitle,
            description: this.appDescription,
            logo: logoBase64,
            // 應用程式的訪問 URL
            url: `http://${this.appName}-app:${this.appPort}`,
            // GAIS 平台會定期呼叫這些端點
            ping: '/api/ping',
            diagnosis: '/api/diagnosis',
            reregister: '/api/reregister',
          },
          resources: ['ollama'], // 需要的資源
        }));


      const response = await axios.post(
        `${this.gaisServer}/api/apps/register`,
        {
          protocol: this.gaisProtocol,
          properties: {
            name: this.appName,
            version: this.appVersion,
            title: this.appTitle,
            description: this.appDescription,
            logo: logoBase64,
            // 應用程式的訪問 URL
            url: `http://${this.appName}-app:${this.appPort}`,
            // GAIS 平台會定期呼叫這些端點
            ping: '/api/ping',
            diagnosis: '/api/diagnosis',
            reregister: '/api/reregister',
          },
          resources: ['ollama'], // 需要的資源
        },
        {
          headers: {
            Authorization: `Bearer ${this.appToken}`,
          },
          timeout: 5000, // 5 秒超時
        }
      );

      if (response.status === 200) {
        this.isRegistered = true;
        console.log('✅ 應用程式註冊成功');
        return true;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ 無法連接到 GAIS 伺服器，請確認 GAIS 是否運行中');
      } else if (error.response) {
        console.error('❌ 註冊失敗:', error.response.data?.message || error.message);
      } else {
        console.error('❌ 註冊失敗:', error.message);
      }
      this.isRegistered = false;
      return false;
    }
  }

  /**
   * 從 GAIS 平台註銷應用程式
   * @returns {Promise<boolean>} 註銷是否成功
   */
  async unregisterApp() {
    if (!this.isRegistered || !this.appToken) {
      return false;
    }

    try {
      await axios.delete(
        `${this.gaisServer}/api/apps/register/${this.appName}`,
        {
          headers: {
            Authorization: `Bearer ${this.appToken}`,
          },
          timeout: 5000,
        }
      );
      
      this.isRegistered = false;
      console.log('✅ 應用程式註銷成功');
      return true;
    } catch (error) {
      console.error('❌ 註銷失敗:', error.message);
      return false;
    }
  }

  /**
   * 取得應用程式狀態資訊
   * @returns {object} 狀態資訊
   */
  getStatus() {
    return {
      registered: this.isRegistered,
      appName: this.appName,
      appVersion: this.appVersion,
      gaisServer: this.gaisServer,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 取得診斷資訊
   * @returns {Promise<object>} 診斷資訊
   */
  async getDiagnosis() {
    const mongoose = require('mongoose');
    
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        gais: this.isRegistered ? 'registered' : 'not_registered',
      },
      configuration: {
        appName: this.appName,
        appVersion: this.appVersion,
        gaisServer: this.gaisServer,
        gaisModel: this.gaisModel,
      },
    };
  }

  /**
   * 呼叫 Ollama API 進行聊天
   * @param {Array} messages - 對話訊息陣列
   * @returns {Promise<Response>} Axios 回應
   */
  async chat(messages) {
    console.log("================================");
    console.log(`${this.ollamaHost}/api/chat`,
        {
          model: this.gaisModel,
          messages,
          stream: true,
        },
        { responseType: 'stream' });
    console.log("================================");
    try {
      const response = await axios.post(
        `${this.ollamaHost}/api/chat`,
        {
          model: this.gaisModel,
          messages,
          stream: true,
        },
        { responseType: 'stream', 
          timeout: 180000 
        }
      );
      
      return response;
    } catch (error) {
      console.error('❌ Ollama 呼叫失敗:', error.message);
      throw error;
    }
  }
}

// 建立單例
const gaisService = new GAISService();

module.exports = gaisService;

