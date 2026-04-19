const ADMIN_SESSION_KEY = "miguel_admin_session";
const ADMIN_USER_KEY = "miguel_admin_user";
const ADMIN_PASS_KEY = "miguel_admin_pass";

const defaultUser = localStorage.getItem(ADMIN_USER_KEY) || "admin";
const defaultPass = localStorage.getItem(ADMIN_PASS_KEY) || "1234";

const form = document.getElementById("login-form");
const msg = document.getElementById("login-msg");

if (localStorage.getItem(ADMIN_SESSION_KEY) === "on") {
  window.location.href = "admin.html";
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (user === defaultUser && pass === defaultPass) {
    localStorage.setItem(ADMIN_SESSION_KEY, "on");
    window.location.href = "admin.html";
    return;
  }

  msg.textContent = "Usuário ou senha incorretos.";
});
