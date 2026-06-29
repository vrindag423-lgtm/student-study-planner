/* =========================================================
   planner.js — weekly planner with day navigation, today's
   schedule, subject breakdown and a 7-day grid overview.
   ========================================================= */

let currentWeekStart = getStartOfWeek(new Date());
let weekTasksCache = [];

/** Returns a Date set to the Sunday (00:00) of the week containing `date` */
function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function isSameDay(d1, d2) {
  return formatDateKey(d1) === formatDateKey(d2);
}

async function loadPlanner() {
  await Promise.all([loadWeekGrid(), loadTodaySchedule(), loadSubjectBreakdown()]);
}

/** Fetches tasks for the current week range and renders the 7-day grid */
async function loadWeekGrid() {
  const gridEl = document.getElementById("week-grid");
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  updateWeekLabel(weekEnd);

  try {
    const from = formatDateKey(currentWeekStart);
    const to = formatDateKey(weekEnd);
    const { tasks } = await API.getTasks(`?from=${from}&to=${to}`);
    weekTasksCache = tasks;

    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = "";
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);

      const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
      const isToday = isSameDay(day, today);

      html += `
        <div class="week-day ${isToday ? "today" : ""}">
          <div class="week-day-header">
            <span>${dayNames[i]}</span>
            <span class="day-num">${day.getDate()}</span>
          </div>
          ${
            dayTasks.length
              ? dayTasks
                  .map(
                    (t) => `
                <div class="week-task priority-${t.priority}" style="${t.status === "completed" ? "opacity:0.5; text-decoration:line-through;" : ""}">
                  ${escapeHtml(t.title)}
                </div>`
                  )
                  .join("")
              : `<div style="font-size:0.74rem; color:var(--text-muted);">No tasks</div>`
          }
        </div>
      `;
    }
    gridEl.innerHTML = html;
  } catch (err) {
    gridEl.innerHTML = `<div class="empty-state">Failed to load weekly tasks.</div>`;
    showToast(err.message, "error");
  }
}

function updateWeekLabel(weekEnd) {
  const opts = { day: "numeric", month: "short" };
  const label = `${currentWeekStart.toLocaleDateString(undefined, opts)} – ${weekEnd.toLocaleDateString(undefined, opts)}`;
  document.getElementById("week-range-label").textContent = label;
}

/** Loads and renders today's tasks, sorted by due time, for the schedule panel */
async function loadTodaySchedule() {
  const listEl = document.getElementById("today-schedule-list");
  const today = new Date();
  document.getElementById("today-date-label").textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  try {
    const todayKey = formatDateKey(today);
    const { tasks } = await API.getTasks(`?from=${todayKey}&to=${todayKey}`);

    if (tasks.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No tasks scheduled for today.</div>`;
      return;
    }

    const sorted = [...tasks].sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));
    listEl.innerHTML = sorted.map(renderTaskCard).join("");
    bindTaskListEvents(listEl, sorted, loadPlanner);
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">Failed to load today's schedule.</div>`;
  }
}

/** Loads aggregate stats and renders a simple subject-wise breakdown list */
async function loadSubjectBreakdown() {
  const listEl = document.getElementById("subject-breakdown-list");
  try {
    const stats = await API.getStats();

    if (!stats.subjects || stats.subjects.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Add tasks with subjects to see a breakdown.</div>`;
      return;
    }

    const maxCount = Math.max(...stats.subjects.map((s) => s.count));
    listEl.innerHTML = stats.subjects
      .sort((a, b) => b.count - a.count)
      .map(
        (s) => `
        <div style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
            <span style="font-weight:600;">${escapeHtml(s.subject)}</span>
            <span style="color:var(--text-muted);">${s.count} task${s.count === 1 ? "" : "s"}</span>
          </div>
          <div class="progress-bar-track" style="height:8px;">
            <div class="progress-bar-fill" style="width:${(s.count / maxCount) * 100}%;"></div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">Failed to load subject breakdown.</div>`;
  }
}

document.getElementById("prev-week-btn").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  loadWeekGrid();
});

document.getElementById("next-week-btn").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  loadWeekGrid();
});

document.getElementById("this-week-btn").addEventListener("click", () => {
  currentWeekStart = getStartOfWeek(new Date());
  loadWeekGrid();
});

document.addEventListener("DOMContentLoaded", () => {
  setOnTaskSaved(loadPlanner);
  loadPlanner();
});