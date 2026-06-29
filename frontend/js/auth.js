/* =========================================================
   Auth page logic — login / signup toggle + form submission
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, go straight to dashboard
  if (getToken()) {
    window.location.href = "dashboard.html";
    return;
  }

  const loginView = document.getElementById("login-view");
  const signupView = document.getElementById("signup-view");

  document.getElementById("show-signup").addEventListener("click", (e) => {
    e.preventDefault();
    loginView.style.display = "none";
    signupView.style.display = "block";
  });

  document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    signupView.style.display = "none";
    loginView.style.display = "block";
  });

  const loginError = document.getElementById("login-error");
  const signupError = document.getElementById("signup-error");

  // ---- Login ----
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";
    const btn = document.getElementById("login-btn");
    btn.disabled = true;
    btn.textContent = "Logging in...";

    try {
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      const data = await API.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      window.location.href = "dashboard.html";
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Log In";
    }
  });

  // ---- Signup ----
  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    signupError.style.display = "none";
    const btn = document.getElementById("signup-btn");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    try {
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;

      const data = await API.register({ name, email, password });
      setToken(data.token);
      setUser(data.user);
      window.location.href = "dashboard.html";
    } catch (err) {
      signupError.textContent = err.message;
      signupError.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  });
});