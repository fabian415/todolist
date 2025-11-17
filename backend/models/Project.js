const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '請輸入專案名稱'],
    trim: true,
    maxlength: [100, '專案名稱不能超過 100 個字元']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '專案描述不能超過 500 個字元']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Tailwind 藍色
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虛擬欄位：取得該專案的任務數量
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true
});

// 刪除專案時，同時刪除相關的任務
projectSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await this.model('Task').deleteMany({ projectId: this._id });
  next();
});

module.exports = mongoose.model('Project', projectSchema);


