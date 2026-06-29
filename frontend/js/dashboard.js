/* =========================================================
   dashboard.js — loads stats, pending tasks and upcoming
   deadlines for the dashboard page.
   ========================================================= */

let dashboardTasksCache = [];

async function loadDashboard() {
  await Promise.all([loadStats(), loadDashboardTasks(), loadUpcoming()]);
}

async function loadStats() {
  try {
    const stats = await API.getStats();
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-completed").textContent = stats.completed;
    document.getElementById("stat-pending").textContent = stats.pending;
    document.getElementById("stat-progress").textContent = `${stats.progress}%`;
    document.getElementById("progress-bar").style.width = `${stats.progress}%`;
    document.getElementById("progress-text").textContent = `${stats.progress}% complete`;
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function loadDashboardTasks() {
  const listEl = document.getElementById("dashboard-task-list");
  try {
    const { tasks } = await API.getTasks("?status=pending&sort=");
    dashboardTasksCache = tasks;

    if (tasks.length === 0) {
      listEl.innerHTML = `<div class="empty-state">🎉 No pending tasks. You're all caught up!</div>`;
      return;
    }

    // Show top 6 most urgent pending tasks
    const topTasks = tasks.slice(0, 6);
    listEl.innerHTML = topTasks.map(renderTaskCard).join("");
    bindTaskListEvents(listEl, dashboardTasksCache, loadDashboard);
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">Failed to load tasks.</div>`;
    showToast(err.message, "error");
  }
}

async function loadUpcoming() {
  const listEl = document.getElementById("upcoming-list");
  try {
    const { tasks } = await API.getUpcoming();

    if (tasks.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No deadlines in the next 7 days.</div>`;
      return;
    }

    listEl.innerHTML = tasks
      .map((task) => {
        const d = new Date(task.dueDate);
        const day = d.getDate();
        const month = d.toLocaleDateString(undefined, { month: "short" });
        return `
          <div class="deadline-item">
            <div class="deadline-date"><span class="day">${day}</span><span class="month">${month}</span></div>
            <div class="deadline-info">
              <div class="d-title">${escapeHtml(task.title)}</div>
              <div class="d-sub">${escapeHtml(task.subject)} · ${task.priority} priority</div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">Failed to load deadlines.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setOnTaskSaved(loadDashboard);
  loadDashboard();
});