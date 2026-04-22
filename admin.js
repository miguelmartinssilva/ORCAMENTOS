/* ═══════════════════════════════════════════════════════════════
   ADMIN.JS — Painel unificado
   Corrigido: sem overrides frágeis, storage bar, export/import
   ═══════════════════════════════════════════════════════════════ */

if (!sessaoValida()) { window.location.href = "login.html"; }

/* ── LOGOUT ── */
document.getElementById("logout-btn").addEventListener("click", function () {
  if (confirm("Deseja sair do painel?")) {
    encerrarSessao();
    window.location.href = "login.html";
  }
});

/* ── ALTERAR LOGIN ── */
document.getElementById("save-login").addEventListener("click", async function () {
  const newUser = document.getElementById("new-user").value.trim();
  const newPass = document.getElementById("new-pass").value.trim();
  const msg     = document.getElementById("save-msg");
  if (!newUser || !newPass) {
    msg.textContent = "Preencha usuário e senha.";
    msg.classList.remove("ok");
    return;
  }
  const hash = await hashSenha(newPass);
  localStorage.setItem(ADMIN_USER_KEY, newUser);
  localStorage.setItem(ADMIN_PASS_KEY + "_hash", hash);
  localStorage.removeItem(ADMIN_PASS_KEY);
  document.getElementById("new-pass").value = "";
  msg.textContent = "✓ Novo acesso salvo!";
  msg.classList.add("ok");
  setTimeout(() => { msg.textContent = ""; }, 3000);
});

/* ── STATS NO TOPO ── */
function renderStats() {
  let hist = [];
  try {
    hist = JSON.parse(localStorage.getItem(HIST_KEY)) || [];
  } catch (e) {
    console.warn("[admin] Histórico corrompido, usando vazio.", e);
    hist = [];
  }
  const total    = hist.length;
  const soma     = hist.reduce((s, h) => s + (Number(h.total) || 0), 0);
  const aceitas  = hist.filter(h => h.status === "aceita").length;
  const perdidas = hist.filter(h => h.status === "perdida").length;
  const fechadas = aceitas + perdidas;
  const taxa     = fechadas > 0 ? Math.round((aceitas / fechadas) * 100) : null;
  const ticket   = total > 0 ? soma / total : 0;

  const fmtK = v => v >= 1000
    ? "R$" + (v / 1000).toFixed(1).replace(".", ",") + "k"
    : "R$" + Math.round(v).toLocaleString("pt-BR");

  const el = id => document.getElementById(id);
  if (el("stat-total"))   el("stat-total").textContent   = total;
  if (el("stat-receita")) el("stat-receita").textContent = fmtK(soma);
  if (el("stat-taxa"))    el("stat-taxa").textContent    = taxa !== null ? taxa + "%" : "—";
  if (el("stat-ticket"))  el("stat-ticket").textContent  = fmtK(ticket);
}

/* ── STORAGE BAR ── */
function renderStorageBar() {
  const fill = document.getElementById("storage-fill");
  const used = document.getElementById("storage-used");
  const pct  = document.getElementById("storage-pct");
  if (!fill) return;

  // Estimate used bytes (each char = ~2 bytes in UTF-16)
  let bytes = 0;
  try {
    for (const key of Object.keys(localStorage)) {
      bytes += ((localStorage.getItem(key) || "").length * 2);
    }
  } catch {}

  const LIMIT = 5 * 1024 * 1024; // 5MB typical limit
  const percent = Math.min(100, Math.round((bytes / LIMIT) * 100));
  const kb = (bytes / 1024).toFixed(0);

  fill.style.width = percent + "%";
  fill.className = "storage-bar-fill" +
    (percent >= 80 ? " danger" : percent >= 50 ? " warn" : "");
  if (used) used.textContent = kb + " KB usados";
  if (pct)  pct.textContent  = percent + "%";
}

/* ── EXPORT BACKUP ── */
function exportarBackup() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "4.0",
    historico: localStorage.getItem(HIST_KEY),
    perfis:    localStorage.getItem(PERFIS_KEY),
    perfilAtivo: localStorage.getItem(PERFIL_ATIVO_KEY),
    servicos:  localStorage.getItem(SERVICOS_KEY),
    pacotes:   localStorage.getItem(PACOTES_KEY),
    contador:  localStorage.getItem(CONTADOR_KEY),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "backup-orcamentos-" + new Date().toISOString().slice(0,10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
  if (typeof toast === "function") toast("✓ Backup exportado!", "#16a04b");
}

/* ── IMPORT BACKUP ── */
function importarBackup() {
  if (!confirm("Importar backup? Os dados atuais serão SUBSTITUÍDOS. Continue?")) return;
  const input = document.createElement("input");
  input.type  = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.historico  != null) localStorage.setItem(HIST_KEY,          data.historico);
        if (data.perfis     != null) localStorage.setItem(PERFIS_KEY,        data.perfis);
        if (data.perfilAtivo!= null) localStorage.setItem(PERFIL_ATIVO_KEY,  data.perfilAtivo);
        if (data.servicos   != null) localStorage.setItem(SERVICOS_KEY,      data.servicos);
        if (data.pacotes    != null) localStorage.setItem(PACOTES_KEY,       data.pacotes);
        if (data.contador   != null) localStorage.setItem(CONTADOR_KEY,      data.contador);
        if (typeof toast === "function") toast("✓ Backup importado! Recarregando...", "#16a04b");
        setTimeout(() => location.reload(), 1200);
      } catch (err) {
        alert("Arquivo inválido ou corrompido.");
        console.error("[admin] Import error:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ── LIMPAR HISTÓRICO ── */
function limparHistoricoAdmin() {
  if (!confirm("Apagar TODO o histórico de orçamentos? Esta ação não pode ser desfeita.")) return;
  localStorage.removeItem(HIST_KEY);
  renderStats();
  renderStorageBar();
  if (typeof toast === "function") toast("Histórico apagado.", "#5a5a72");
}

/* Expose functions for onclick handlers */
window.exportarBackup      = exportarBackup;
window.importarBackup      = importarBackup;
window.limparHistoricoAdmin = limparHistoricoAdmin;

/* ── INIT ── */
renderStats();
renderStorageBar();
