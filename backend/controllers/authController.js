const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    註冊新使用者
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 檢查必填欄位
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '請提供所有必填欄位'
      });
    }

    // 建立使用者
    const user = await User.create({
      username,
      email,
      password
    });

    // 產生 Token
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: '註冊成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    使用者登入
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 檢查必填欄位
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '請提供電子郵件和密碼'
      });
    }

    // 查詢使用者（包含密碼欄位）
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      });
    }

    // 驗證密碼
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      });
    }

    // 產生 Token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: '登入成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    匿名登入
// @route   POST /api/auth/anonymous
// @access  Public
exports.anonymousLogin = async (req, res, next) => {
  try {
    // 產生隨機的匿名使用者資訊
    const randomId = Math.random().toString(36).substring(7);
    const username = `訪客_${randomId}`;
    const email = `guest_${randomId}@anonymous.local`;
    const password = Math.random().toString(36).substring(7);

    // 建立匿名使用者
    const user = await User.create({
      username,
      email,
      password,
      isAnonymous: true
    });

    // 產生 Token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '匿名登入成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          isAnonymous: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得當前使用者資訊
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAnonymous: user.isAnonymous,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};



