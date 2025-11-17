// 全域錯誤處理中介軟體
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose 錯誤處理
  
  // 錯誤的 ObjectId
  if (err.name === 'CastError') {
    const message = '找不到資源';
    error = { message, statusCode: 404 };
  }

  // Mongoose 重複欄位錯誤
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} 已經存在`;
    error = { message, statusCode: 400 };
  }

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '伺服器錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

