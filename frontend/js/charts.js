/* =========================================================
   charts.js — NEW FILE (additive only)
   Renders the dashboard analytics chart using Chart.js.
   This file does not alter any existing logic in api.js,
   dashboard.js, tasks.js, planner.js, tasks-common.js,
   auth.js, sidebar.js or theme.js. It simply reuses the
   existing API.getStats() call to feed a chart.
   ========================================================= */

async function renderCompletionChart() {
  const canvas = document.getElementById("completionChart");
  if (!canvas || typeof Chart === "undefined") return;

  try {
    const stats = await API.getStats();

    const styles = getComputedStyle(document.documentElement);
    const successColor = styles.getPropertyValue("--success").trim() || "#10b981";
    const amberColor = styles.getPropertyValue("--accent-amber").trim() || "#f59e0b";
    const textColor = styles.getPropertyValue("--text-muted").trim() || "#6b7280";
    const surfaceColor = styles.getPropertyValue("--bg").trim() || "#ffffff";

    // Destroy any previous instance (e.g. on theme toggle re-render) to avoid duplicates
    if (window._completionChartInstance) {
      window._completionChartInstance.destroy();
    }

    window._completionChartInstance = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Completed", "Pending"],
        datasets: [
          {
            data: [stats.completed, stats.pending],
            backgroundColor: [successColor, amberColor],
            borderColor: surfaceColor,
            borderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} task${ctx.raw === 1 ? "" : "s"}`,
            },
          },
        },
      },
    });
  } catch (err) {
    // Non-critical: if stats fail to load, the chart card simply stays empty.
    console.warn("Could not render completion chart:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", renderCompletionChart);
document.addEventListener("DOMContentLoaded", renderSubjectChart);

async function renderSubjectChart() {
  const canvas = document.getElementById("subjectChart");
  if (!canvas || typeof Chart === "undefined") return;

  try {
    const stats = await API.getStats();
    if (!stats.subjects || stats.subjects.length === 0) return;

    const styles = getComputedStyle(document.documentElement);
    const primaryColor = styles.getPropertyValue("--primary").trim() || "#4f46e5";
    const textMuted = styles.getPropertyValue("--text-muted").trim() || "#6b7280";
    const gridColor = styles.getPropertyValue("--border").trim() || "rgba(0,0,0,0.08)";

    const sorted = [...stats.subjects].sort((a, b) => b.count - a.count);

    if (window._subjectChartInstance) {
      window._subjectChartInstance.destroy();
    }

    window._subjectChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels: sorted.map((s) => s.subject),
        datasets: [
          {
            label: "Tasks",
            data: sorted.map((s) => s.count),
            backgroundColor: primaryColor,
            borderRadius: 8,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { color: textMuted, precision: 0 }, grid: { color: gridColor } },
          y: { ticks: { color: textMuted }, grid: { display: false } },
        },
      },
    });
  } catch (err) {
    console.warn("Could not render subject chart:", err.message);
  }
}


// Re-render with new theme colors when the user toggles light/dark mode
document.querySelectorAll(".theme-toggle").forEach((btn) => {
  btn.addEventListener("click", () => setTimeout(() => {
    renderCompletionChart();
    renderSubjectChart();
  }, 50));
});

// Keep charts in sync whenever a task is created/updated/completed/deleted via the modal
const _origSetOnTaskSaved = window.setOnTaskSaved;
if (typeof _origSetOnTaskSaved === "function") {
  const existingCallbackSetter = setOnTaskSaved;
  window.setOnTaskSaved = function (callback) {
    existingCallbackSetter(async () => {
      await callback();
      renderCompletionChart();
      renderSubjectChart();
    });
  };
}