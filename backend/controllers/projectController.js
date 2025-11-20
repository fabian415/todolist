const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    取得所有專案
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('taskCount');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得單一專案
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到專案'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    建立新專案
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '請提供專案名稱'
      });
    }

    const project = await Project.create({
      name,
      description,
      color,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: '專案建立成功',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新專案
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    let project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到專案'
      });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, color },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: '專案更新成功',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    刪除專案
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到專案'
      });
    }

    // 刪除專案相關的所有任務
    await Task.deleteMany({ projectId: project._id });

    // 刪除專案
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '專案刪除成功',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得專案統計資料
// @route   GET /api/projects/:id/stats
// @access  Private
exports.getProjectStats = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到專案'
      });
    }

    const tasks = await Task.find({ projectId: project._id });

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      doing: tasks.filter(t => t.status === 'doing').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority: tasks.filter(t => t.priority === '高').length,
      overdue: tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};





