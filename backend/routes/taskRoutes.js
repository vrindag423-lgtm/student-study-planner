const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  toggleComplete,
  deleteTask,
  getStats,
  getUpcoming,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/stats", getStats);
router.get("/upcoming", getUpcoming);

router.route("/").get(getTasks).post(createTask);

router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

router.patch("/:id/complete", toggleComplete);

module.exports = router;