const Task = require('../models/Task');
const Project = require('../models/Project');
const { parseTaskDescription } = require('../services/llmService');

// @desc    取得所有任務（可依專案篩選）
// @route   GET /api/tasks?projectId=xxx
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    
    let query = { userId: req.user.id };
    
    if (projectId) {
      query.projectId = projectId;
    }
    
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name color')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得單一任務
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('projectId', 'name color');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到任務'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    建立新任務
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { content, status, projectId, dueDate, estimatedEffortHours, priority, tags, subtasks } = req.body;

    // 驗證必填欄位
    if (!content || !projectId) {
      return res.status(400).json({
        success: false,
        message: '請提供任務內容和專案 ID'
      });
    }

    // 驗證專案是否屬於當前使用者
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到專案'
      });
    }

    // 建立任務
    const task = await Task.create({
      content,
      status: status || 'todo',
      projectId,
      userId: req.user.id,
      dueDate: dueDate || null,
      estimatedEffortHours: estimatedEffortHours || null,
      priority: priority || '中',
      tags: tags || [],
      subtasks: subtasks || []
    });

    // Populate projectId 以保持資料格式一致
    await task.populate('projectId', 'name color');

    res.status(201).json({
      success: true,
      message: '任務建立成功',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新任務
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const { content, status, dueDate, estimatedEffortHours, priority, tags, subtasks } = req.body;

    let task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到任務'
      });
    }

    // 準備更新資料
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (estimatedEffortHours !== undefined) updateData.estimatedEffortHours = estimatedEffortHours;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;
    if (subtasks !== undefined) updateData.subtasks = subtasks;

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('projectId', 'name color');

    res.status(200).json({
      success: true,
      message: '任務更新成功',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新任務狀態
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['todo', 'doing', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '無效的狀態值'
      });
    }

    let task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到任務'
      });
    }

    task.status = status;
    await task.save();
    await task.populate('projectId', 'name color');

    res.status(200).json({
      success: true,
      message: '任務狀態更新成功',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    刪除任務
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到任務'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '任務刪除成功',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得任務完成趨勢（用於圖表）
// @route   GET /api/tasks/analytics/completion-trend
// @access  Private
exports.getCompletionTrend = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      userId: req.user.id,
      status: 'done',
      completedAt: { $ne: null }
    }).select('completedAt');

    // 按日期分組
    const trendData = {};
    tasks.forEach(task => {
      const date = new Date(task.completedAt).toISOString().split('T')[0];
      trendData[date] = (trendData[date] || 0) + 1;
    });

    // 轉換為陣列格式
    const result = Object.entries(trendData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得專案狀態摘要（用於總覽儀表板）
// @route   GET /api/tasks/analytics/project-summary
// @access  Private
exports.getProjectSummary = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user.id });
    
    const summary = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ projectId: project._id });
        
        return {
          id: project._id,
          name: project.name,
          todo: tasks.filter(t => t.status === 'todo').length,
          doing: tasks.filter(t => t.status === 'doing').length,
          done: tasks.filter(t => t.status === 'done').length,
          total: tasks.length
        };
      })
    );

    // 只返回有任務的專案
    const filteredSummary = summary.filter(p => p.total > 0);

    res.status(200).json({
      success: true,
      data: filteredSummary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    使用 AI 拆解任務描述
// @route   POST /api/tasks/ai/parse
// @access  Private
exports.parseTaskWithAI = async (req, res, next) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: '請提供任務描述'
      });
    }

    // 調用 LLM 服務解析任務
    const parsedTask = await parseTaskDescription(description);

    res.status(200).json({
      success: true,
      message: 'AI 任務拆解成功',
      data: parsedTask
    });
  } catch (error) {
    console.error('AI 任務拆解錯誤:', error);
    res.status(500).json({
      success: false,
      message: 'AI 任務拆解失敗',
      error: error.message
    });
  }
};

