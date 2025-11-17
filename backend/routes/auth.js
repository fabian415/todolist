const express = require('express');
const router = express.Router();
const { register, login, anonymousLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// 公開路由
router.post('/register', register);
router.post('/login', login);
router.post('/anonymous', anonymousLogin);

// 受保護路由
router.get('/me', protect, getMe);

module.exports = router;

