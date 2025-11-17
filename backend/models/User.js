const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '請輸入使用者名稱'],
    unique: true,
    trim: true,
    minlength: [3, '使用者名稱至少需要 3 個字元'],
    maxlength: [50, '使用者名稱不能超過 50 個字元']
  },
  email: {
    type: String,
    required: [true, '請輸入電子郵件'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      '請輸入有效的電子郵件地址'
    ]
  },
  password: {
    type: String,
    required: [true, '請輸入密碼'],
    minlength: [6, '密碼至少需要 6 個字元'],
    select: false // 預設查詢時不返回密碼
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 儲存前加密密碼
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 比對密碼
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


