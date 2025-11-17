const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getCompletionTrend,
  getProjectSummary,
  parseTaskWithAI
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// 所有路由都需要認證
router.use(protect);

// AI 功能端點
router.post('/ai/parse', parseTaskWithAI);

// 分析端點
router.get('/analytics/completion-trend', getCompletionTrend);
router.get('/analytics/project-summary', getProjectSummary);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);

module.exports = router;

