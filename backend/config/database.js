const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // 這些選項在新版本的 mongoose 中已經是預設值，但為了相容性保留
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB 連接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB 連接錯誤: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

