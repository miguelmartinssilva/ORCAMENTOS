/* ═══════════════════════════════════════════════════════════════
   LOGIN.JS — Autenticação segura com hash SHA-256 + sessão com TTL
   ═══════════════════════════════════════════════════════════════ */

/* Redirecionar se já estiver logado */
if (sessaoValida()) {
  window.location.href = "admin.html";
}

/* ─── MIGRAÇÃO AUTOMÁTICA DE SENHAS ────────────────────────────
   Se o usuário ainda tem a senha em texto claro, converte
   para hash na primeira vez que carregar a página.
   ────────────────────────────────────────────────────────────── */
(async function migrarSenhaAntiga() {
  const passRaw  = localStorage.getItem(ADMIN_PASS_KEY);
  const passHash = localStorage.getItem(ADMIN_PASS_KEY + "_hash");
  if (passHash) return;
  const senhaParaHashar = passRaw || "1234";
  const hash = await hashSenha(senhaParaHashar);
  localStorage.setItem(ADMIN_PASS_KEY + "_hash", hash);
  if (!localStorage.getItem(ADMIN_USER_KEY)) {
    localStorage.setItem(ADMIN_USER_KEY, "admin");
  }
  localStorage.removeItem(ADMIN_PASS_KEY);
})();

/* ─── FORM DE LOGIN ─────────────────────────────────────────── */
const form = document.getElementById("login-form");
const msg  = document.getElementById("login-msg");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const btnSubmit = form.querySelector("button[type=submit]");
  btnSubmit.disabled    = true;
  btnSubmit.textContent = "Verificando...";

  const userInput = document.getElementById("user").value.trim();
  const passInput = document.getElementById("pass").value.trim();

  const userSalvo = localStorage.getItem(ADMIN_USER_KEY) || "admin";
  let hashSalvo   = localStorage.getItem(ADMIN_PASS_KEY + "_hash");

  if (!hashSalvo) {
    hashSalvo = await hashSenha("1234");
    localStorage.setItem(ADMIN_PASS_KEY + "_hash", hashSalvo);
  }

  const hashInput = await hashSenha(passInput);

  if (userInput === userSalvo && hashInput === hashSalvo) {
    criarSessao();
    window.location.href = "admin.html";
    return;
  }

  btnSubmit.disabled    = false;
  btnSubmit.textContent = "Entrar";
  msg.textContent = "Usuário ou senha incorretos.";
  document.getElementById("pass").value = "";
  document.getElementById("pass").focus();
});
