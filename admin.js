const ADMIN_SESSION_KEY = "miguel_admin_session";
const ADMIN_USER_KEY = "miguel_admin_user";
const ADMIN_PASS_KEY = "miguel_admin_pass";
const HIST_KEY = "historico_orcamentos_miguel";

if (localStorage.getItem(ADMIN_SESSION_KEY) !== "on") {
  window.location.href = "login.html";
}

document.getElementById("logout-btn").addEventListener("click", function () {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.href = "login.html";
});

document.getElementById("save-login").addEventListener("click", function () {
  const newUser = document.getElementById("new-user").value.trim();
  const newPass = document.getElementById("new-pass").value.trim();
  const msg = document.getElementById("save-msg");

  if (!newUser || !newPass) {
    msg.textContent = "Preencha usuário e senha.";
    msg.classList.remove("ok");
    return;
  }

  localStorage.setItem(ADMIN_USER_KEY, newUser);
  localStorage.setItem(ADMIN_PASS_KEY, newPass);

  msg.textContent = "Novo login salvo com sucesso.";
  msg.classList.add("ok");
});

function renderStats() {
  const stats = document.getElementById("stats");
  let historico = [];

  try {
    historico = JSON.parse(localStorage.getItem(HIST_KEY)) || [];
  } catch {
    historico = [];
  }

  const totalOrcamentos = historico.length;
  const soma = historico.reduce((acc, item) => acc + (Number(item.total) || 0), 0);

  stats.innerHTML = `
    <div class="stat-line">
      <span>Total de orçamentos</span>
      <strong>${totalOrcamentos}</strong>
    </div>
    <div class="stat-line">
      <span>Valor acumulado</span>
      <strong>R$ ${soma.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
    </div>
  `;
}

renderStats();
