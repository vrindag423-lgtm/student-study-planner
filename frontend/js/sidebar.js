/* =========================================================
   Sidebar behavior — mobile toggle, active link, user info, logout
   ========================================================= */

function initSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.querySelector(".menu-toggle");
  const overlay = document.querySelector(".overlay-bg");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay?.classList.toggle("active");
    });
  }
  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    overlay.classList.remove("active");
  });

  // Highlight active link based on current page
  const current = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });

  // Populate user info
  const user = getUser();
  const nameEls = document.querySelectorAll(".user-name");
  const initialEls = document.querySelectorAll(".user-initial");
  const emailEls = document.querySelectorAll(".user-email");
  if (user) {
    nameEls.forEach((el) => (el.textContent = user.name));
    emailEls.forEach((el) => (el.textContent = user.email));
    initialEls.forEach((el) => (el.textContent = user.name?.charAt(0)?.toUpperCase() || "U"));
  }

  // Logout
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await API.logout();
      } catch (err) {
        // ignore network errors on logout
      } finally {
        clearToken();
        clearUser();
        window.location.href = "index.html";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  if (window.initThemeToggle) window.initThemeToggle();
});