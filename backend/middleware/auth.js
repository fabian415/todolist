const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保護路由 - 驗證 JWT Token
exports.protect = async (req, res, next) => {
  let token;

  // 從 Header 取得 Token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 確認 Token 存在
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授權，請先登入'
    });
  }

  try {
    // 驗證 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 將使用者資訊加入 request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '找不到使用者'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token 無效或已過期'
    });
  }
};

// 產生 JWT Token
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};



