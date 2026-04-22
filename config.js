/* ═══════════════════════════════════════════════════════════════
   CONFIG.JS — Constantes globais e utilitários de segurança
   ═══════════════════════════════════════════════════════════════ */

/* ─── CHAVES DE LOCALSTORAGE ───────────────────────────────────── */
const HIST_KEY          = "historico_orcamentos_miguel";
const SERVICOS_KEY      = "servicos_miguel";
const PACOTES_KEY       = "pacotes_miguel";
const PERFIS_KEY        = "orc_perfis_v1";
const PERFIL_ATIVO_KEY  = "orc_perfil_ativo_v1";
const ADMIN_SESSION_KEY = "miguel_admin_session";
const ADMIN_USER_KEY    = "miguel_admin_user";
const ADMIN_PASS_KEY    = "miguel_admin_pass";
const CONTADOR_KEY      = "orc_contador_v1";

/* ─── DURAÇÃO DA SESSÃO ────────────────────────────────────────── */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; /* 8 horas */

/* ─── LIMITE DE AVISO DO STORAGE ───────────────────────────────── */
const STORAGE_WARN_BYTES = 3_000_000; /* ~3MB */

/* ─── SANITIZAÇÃO XSS ──────────────────────────────────────────── */
/**
 * Escapa HTML para uso seguro em innerHTML.
 * Usa o parser do próprio browser — sem dependências externas.
 */
function esc(str) {
  if (str === null || str === undefined) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

/* ─── HASH DE SENHA (SHA-256 via Web Crypto API) ───────────────── */
async function hashSenha(senha) {
  const encoder = new TextEncoder();
  const data     = encoder.encode(senha);
  const hashBuf  = await crypto.subtle.digest("SHA-256", data);
  const hashArr  = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ─── GERENCIAMENTO DE SESSÃO SEGURA ───────────────────────────── */
function criarSessao() {
  const sessao = {
    on:      true,
    expires: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessao));
}

function sessaoValida() {
  try {
    const raw  = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const sess = JSON.parse(raw);
    /* compatibilidade com sessão antiga (string "on") */
    if (sess === "on" || sess?.on === true && !sess?.expires) return true;
    if (sess?.on && sess?.expires && Date.now() < sess.expires) return true;
    /* sessão expirada — limpar */
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  } catch {
    return false;
  }
}

function encerrarSessao() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

/* ─── VERIFICAÇÃO DE STORAGE ───────────────────────────────────── */
function verificarStorage() {
  try {
    const hist    = localStorage.getItem(HIST_KEY) || "";
    const perfis  = localStorage.getItem(PERFIS_KEY) || "";
    const total   = hist.length + perfis.length;
    if (total > STORAGE_WARN_BYTES && typeof toast === "function") {
      toast("Armazenamento quase cheio — considere exportar e limpar o histórico", "#e88a00");
    }
  } catch { /* silencioso */ }
}

/* ─── MÁSCARA DE WHATSAPP ──────────────────────────────────────── */
function aplicarMascaraWpp(input) {
  if (!input) return;
  input.addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) {
      v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
    } else if (v.length > 2) {
      v = "(" + v.slice(0, 2) + ") " + v.slice(2);
    } else if (v.length > 0) {
      v = "(" + v;
    }
    this.value = v;
  });
}

/* ─── EXPORTS GLOBAIS ──────────────────────────────────────────── */
window.esc               = esc;
window.hashSenha         = hashSenha;
window.criarSessao       = criarSessao;
window.sessaoValida      = sessaoValida;
window.encerrarSessao    = encerrarSessao;
window.verificarStorage  = verificarStorage;
window.aplicarMascaraWpp = aplicarMascaraWpp;
