import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const { login, register, anonymousLogin, error } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    try {
      let result;
      if (isRegisterMode) {
        if (!formData.username || !formData.email || !formData.password) {
          setLocalError('請填寫所有欄位');
          setIsLoading(false);
          return;
        }
        result = await register(formData);
      } else {
        if (!formData.email || !formData.password) {
          setLocalError('請填寫電子郵件和密碼');
          setIsLoading(false);
          return;
        }
        result = await login({
          email: formData.email,
          password: formData.password
        });
      }

      if (!result.success) {
        setLocalError(result.error);
      }
    } catch (err) {
      setLocalError('發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setLocalError('');
    
    try {
      const result = await anonymousLogin();
      if (!result.success) {
        setLocalError(result.error);
      }
    } catch (err) {
      setLocalError('匿名登入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo 和標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 ToDoList</h1>
          <p className="text-gray-600">AI 驅動的任務管理系統</p>
        </div>

        {/* 錯誤訊息 */}
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {localError || error}
          </div>
        )}

        {/* 表單 */}
        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用者名稱
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入使用者名稱"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電子郵件
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入密碼"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '處理中...' : isRegisterMode ? '註冊' : '登入'}
          </button>
        </form>

        {/* 切換登入/註冊 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setLocalError('');
            }}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            {isRegisterMode ? '已有帳號？立即登入' : '沒有帳號？立即註冊'}
          </button>
        </div>

        {/* 分隔線 */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-4 text-gray-500 text-sm">或</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 匿名登入 */}
        <button
          onClick={handleAnonymousLogin}
          disabled={isLoading}
          className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          👤 匿名登入（試用）
        </button>

        {/* 說明文字 */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          使用匿名登入可以快速體驗系統功能，但資料不會永久保存。
        </p>
      </div>
    </div>
  );
}

export default LoginPage;



