const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// 所有路由都需要認證
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.get('/:id/stats', getProjectStats);

module.exports = router;





