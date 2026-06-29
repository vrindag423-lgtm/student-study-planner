/* =========================================================
   Theme toggle — persists light/dark preference in localStorage
   ========================================================= */

(function () {
  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sp_theme", theme);
    document.querySelectorAll(".theme-toggle .icon-sun").forEach((el) => {
      el.style.display = theme === "dark" ? "block" : "none";
    });
    document.querySelectorAll(".theme-toggle .icon-moon").forEach((el) => {
      el.style.display = theme === "dark" ? "none" : "block";
    });
  };

  const savedTheme = localStorage.getItem("sp_theme") || "light";
  applyTheme(savedTheme);

  window.initThemeToggle = function () {
    const toggleBtns = document.querySelectorAll(".theme-toggle");
    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(current === "dark" ? "light" : "dark");
      });
    });
  };
})();