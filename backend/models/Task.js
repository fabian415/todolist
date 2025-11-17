const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, '請輸入任務內容'],
    trim: true,
    maxlength: [200, '任務內容不能超過 200 個字元']
  },
  status: {
    type: String,
    enum: ['todo', 'doing', 'done'],
    default: 'todo'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  estimatedEffortHours: {
    type: Number,
    default: null,
    min: 0
  },
  priority: {
    type: String,
    enum: ['高', '中', '低'],
    default: '中'
  },
  tags: [{
    type: String,
    trim: true
  }],
  subtasks: [subtaskSchema],
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引優化
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ userId: 1, completedAt: 1 });

// 當任務標記為完成時，自動設置 completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);

