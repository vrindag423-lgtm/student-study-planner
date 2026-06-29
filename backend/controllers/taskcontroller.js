const Task = require("../models/Task");

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, subject, priority, dueDate, dueTime } = req.body;

    if (!title || !subject || !dueDate) {
      return res.status(400).json({ message: "Title, subject and due date are required" });
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      subject,
      priority,
      dueDate,
      dueTime,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

// @desc    Get all tasks for logged-in user (supports filtering & search)
// @route   GET /api/tasks?subject=&priority=&status=&search=&sort=
const getTasks = async (req, res) => {
  try {
    const { subject, priority, status, search, sort, from, to } = req.query;

    const query = { user: req.user._id };

    if (subject) query.subject = subject;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (from || to) {
      query.dueDate = {};
      if (from) query.dueDate.$gte = new Date(from);
      if (to) query.dueDate.$lte = new Date(to);
    }

    let sortOption = { dueDate: 1 };
    if (sort === "priority") sortOption = { priority: 1, dueDate: 1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const tasks = await Task.find(query).sort(sortOption);
    res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const fields = ["title", "description", "subject", "priority", "dueDate", "dueTime", "status"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    if (req.body.status === "completed" && !task.completedAt) {
      task.completedAt = new Date();
    } else if (req.body.status === "pending") {
      task.completedAt = null;
    }

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

// @desc    Toggle task completion status
// @route   PATCH /api/tasks/:id/complete
const toggleComplete = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = task.status === "completed" ? "pending" : "completed";
    task.completedAt = task.status === "completed" ? new Date() : null;

    await task.save();
    res.status(200).json({ message: "Task status updated", task });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task status", error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/tasks/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const total = await Task.countDocuments({ user: userId });
    const completed = await Task.countDocuments({ user: userId, status: "completed" });
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const subjectsAgg = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      total,
      completed,
      pending,
      progress,
      subjects: subjectsAgg.map((s) => ({ subject: s._id, count: s.count })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
};

// @desc    Get upcoming deadlines (next 7 days, not completed)
// @route   GET /api/tasks/upcoming
const getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const tasks = await Task.find({
      user: req.user._id,
      status: "pending",
      dueDate: { $gte: now, $lte: nextWeek },
    }).sort({ dueDate: 1 });

    res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch upcoming deadlines", error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  toggleComplete,
  deleteTask,
  getStats,
  getUpcoming,
};