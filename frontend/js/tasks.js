/* =========================================================
   tasks.js — full task list page with search, filter & sort
   ========================================================= */

let allTasksCache = [];
let searchDebounceTimer = null;

const searchInput = document.getElementById("search-input");
const filterSubject = document.getElementById("filter-subject");
const filterPriority = document.getElementById("filter-priority");
const filterStatus = document.getElementById("filter-status");
const filterSort = document.getElementById("filter-sort");
const clearFiltersBtn = document.getElementById("clear-filters-btn");
const taskListEl = document.getElementById("full-task-list");
const taskCountLabel = document.getElementById("task-count-label");

function buildQueryString() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (filterSubject.value) params.set("subject", filterSubject.value);
  if (filterPriority.value) params.set("priority", filterPriority.value);
  if (filterStatus.value) params.set("status", filterStatus.value);
  if (filterSort.value) params.set("sort", filterSort.value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function loadAllTasksForFilters() {
  // Used once to populate the subject dropdown with distinct subjects
  try {
    const { tasks } = await API.getTasks();
    const subjects = [...new Set(tasks.map((t) => t.subject))].sort();
    filterSubject.innerHTML =
      `<option value="">All Subjects</option>` +
      subjects.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  } catch (err) {
    // non-critical — silently ignore
  }
}

async function loadFullTaskList() {
  taskListEl.innerHTML = `<div class="empty-state">Loading tasks...</div>`;
  try {
    const { tasks, count } = await API.getTasks(buildQueryString());
    allTasksCache = tasks;

    taskCountLabel.textContent = `${count} Task${count === 1 ? "" : "s"} Found`;

    if (tasks.length === 0) {
      taskListEl.innerHTML = `<div class="empty-state">No tasks match your filters. Try adjusting them or add a new task.</div>`;
      return;
    }

    taskListEl.innerHTML = tasks.map(renderTaskCard).join("");
    bindTaskListEvents(taskListEl, allTasksCache, loadFullTaskList);
  } catch (err) {
    taskListEl.innerHTML = `<div class="empty-state">Failed to load tasks.</div>`;
    showToast(err.message, "error");
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(loadFullTaskList, 350);
});

[filterSubject, filterPriority, filterStatus, filterSort].forEach((el) => {
  el.addEventListener("change", loadFullTaskList);
});

clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  filterSubject.value = "";
  filterPriority.value = "";
  filterStatus.value = "";
  filterSort.value = "";
  loadFullTaskList();
});

document.addEventListener("DOMContentLoaded", async () => {
  setOnTaskSaved(async () => {
    await loadAllTasksForFilters();
    await loadFullTaskList();
  });
  await loadAllTasksForFilters();
  await loadFullTaskList();
});