/* =========================================================
   tasks-common.js
   Shared logic for the Add/Edit Task modal and task-card
   rendering, used across dashboard.html, tasks.html and
   planner.html. Each page's own script (dashboard.js /
   tasks.js / planner.js) calls into these helpers and
   supplies a callback to refresh its own view after a
   create / update / delete / toggle action.
   ========================================================= */

requireAuth();

const taskModal = document.getElementById("task-modal");
const taskForm = document.getElementById("task-form");
const modalTitleEl = document.getElementById("modal-title");
const saveTaskBtn = document.getElementById("save-task-btn");

let onTaskSavedCallback = null;

/** Open the modal in "create" mode (no task) or "edit" mode (task supplied) */
function openTaskModal(task = null) {
  taskForm.reset();
  document.getElementById("task-id").value = "";
  document.getElementById("task-priority").value = "Medium";
  document.getElementById("task-due-time").value = "23:59";

  if (task) {
    modalTitleEl.textContent = "Edit Task";
    saveTaskBtn.textContent = "Update Task";
    document.getElementById("task-id").value = task._id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-subject").value = task.subject;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-due-date").value = task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "";
    document.getElementById("task-due-time").value = task.dueTime || "23:59";
  } else {
    modalTitleEl.textContent = "New Task";
    saveTaskBtn.textContent = "Save Task";
  }

  taskModal.classList.add("active");
}

function closeTaskModal() {
  taskModal.classList.remove("active");
  taskForm.reset();
}

document.getElementById("close-modal")?.addEventListener("click", closeTaskModal);
document.getElementById("cancel-modal")?.addEventListener("click", closeTaskModal);
taskModal?.addEventListener("click", (e) => {
  if (e.target === taskModal) closeTaskModal();
});

document.getElementById("add-task-btn")?.addEventListener("click", () => openTaskModal());

/** Submit handler shared by every page — create or update depending on task-id */
taskForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Saving...";

  const id = document.getElementById("task-id").value;
  const payload = {
    title: document.getElementById("task-title").value.trim(),
    description: document.getElementById("task-description").value.trim(),
    subject: document.getElementById("task-subject").value.trim(),
    priority: document.getElementById("task-priority").value,
    dueDate: document.getElementById("task-due-date").value,
    dueTime: document.getElementById("task-due-time").value,
  };

  try {
    if (id) {
      await API.updateTask(id, payload);
      showToast("Task updated successfully");
    } else {
      await API.createTask(payload);
      showToast("Task created successfully");
    }
    closeTaskModal();
    if (typeof onTaskSavedCallback === "function") onTaskSavedCallback();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    saveTaskBtn.disabled = false;
    saveTaskBtn.textContent = id ? "Update Task" : "Save Task";
  }
});

/** Register a callback to run after any successful create/update from the modal */
function setOnTaskSaved(callback) {
  onTaskSavedCallback = callback;
}

/** Toggle a task's completion status, then run the supplied refresh callback */
async function toggleTaskComplete(id, onDone) {
  try {
    await API.toggleComplete(id);
    if (typeof onDone === "function") onDone();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/** Delete a task after confirmation, then run the supplied refresh callback */
async function deleteTaskById(id, onDone) {
  if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
  try {
    await API.deleteTask(id);
    showToast("Task deleted");
    if (typeof onDone === "function") onDone();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/** Format an ISO date string into a short readable label, e.g. "26 Jun" */
function formatShortDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Returns true if a task's due date/time is in the past and it's still pending */
function isOverdue(task) {
  if (task.status === "completed") return false;
  const due = new Date(task.dueDate);
  if (task.dueTime) {
    const [h, m] = task.dueTime.split(":").map(Number);
    due.setHours(h, m, 0, 0);
  }
  return due.getTime() < Date.now();
}

/**
 * Render a single task as an HTML string for the task list.
 * Used by dashboard.js, tasks.js and planner.js.
 */
function renderTaskCard(task) {
  const overdue = isOverdue(task);
  const dueLabel = `${formatShortDate(task.dueDate)} · ${task.dueTime || "23:59"}`;

  return `
    <div class="task-card priority-${task.priority} ${task.status === "completed" ? "completed" : ""}" data-id="${task._id}">
      <div class="task-checkbox ${task.status === "completed" ? "checked" : ""}" data-action="toggle" data-id="${task._id}">
        ${task.status === "completed" ? "✓" : ""}
      </div>
      <div class="task-info">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ""}
        <div class="task-meta">
          <span class="badge badge-subject">${escapeHtml(task.subject)}</span>
          <span class="badge badge-priority-${task.priority}">${task.priority}</span>
          <span class="badge badge-due ${overdue ? "overdue" : ""}">${overdue ? "Overdue · " : "Due "}${dueLabel}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon" data-action="edit" data-id="${task._id}" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon" data-action="delete" data-id="${task._id}" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
}

/** Basic HTML escaping to avoid markup injection from task text fields */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Attach click handling for a container of rendered task cards.
 * Delegates toggle / edit / delete actions based on data-action attribute.
 */
function bindTaskListEvents(containerEl, tasks, onRefresh) {
  containerEl.querySelectorAll("[data-action]").forEach((el) => {
    const id = el.getAttribute("data-id");
    const action = el.getAttribute("data-action");

    el.addEventListener("click", () => {
      if (action === "toggle") {
        toggleTaskComplete(id, onRefresh);
      } else if (action === "delete") {
        deleteTaskById(id, onRefresh);
      } else if (action === "edit") {
        const task = tasks.find((t) => t._id === id);
        if (task) openTaskModal(task);
      }
    });
  });
}