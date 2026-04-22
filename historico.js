/* ═══════════════════════════════════════════════════════════════
   HISTORICO.JS — Fase 4
   Melhorias: status pipeline, filtros, busca, dashboard métricas
   ═══════════════════════════════════════════════════════════════ */


const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", cor: "#5a5a72", bg: "rgba(90,90,114,.18)",  borda: "rgba(90,90,114,.35)"  },
  enviada:  { label: "Enviada",  cor: "#6aaeff", bg: "rgba(26,74,122,.18)",  borda: "rgba(80,150,255,.35)" },
  aceita:   { label: "Aceita",   cor: "#1dd668", bg: "rgba(22,160,75,.18)",  borda: "rgba(29,214,104,.35)" },
  perdida:  { label: "Perdida",  cor: "#ff4466", bg: "rgba(155,28,53,.18)",  borda: "rgba(255,68,102,.35)" },
};

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", cor: "#5a5a72", bg: "rgba(90,90,114,.18)",  borda: "rgba(90,90,114,.35)"  },
  enviada:  { label: "Enviada",  cor: "#6aaeff", bg: "rgba(26,74,122,.18)",  borda: "rgba(80,150,255,.35)" },
  aceita:   { label: "Aceita",   cor: "#1dd668", bg: "rgba(22,160,75,.18)",  borda: "rgba(29,214,104,.35)" },
  perdida:  { label: "Perdida",  cor: "#ff4466", bg: "rgba(155,28,53,.18)",  borda: "rgba(255,68,102,.35)" },
};

function getHistorico() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; }
  catch { return []; }
}

function saveHistorico(lista) {
  localStorage.setItem(HIST_KEY, JSON.stringify(lista));
}

function money(v) {
  return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function atualizarStatus(id, novoStatus) {
  const lista = getHistorico();
  const idx   = lista.findIndex(h => h.id === id);
  if (idx < 0) return;
  lista[idx].status = novoStatus;
  saveHistorico(lista);
  renderDashboard();
  renderHistorico();
}

function duplicarOrc(id) {
  localStorage.setItem("orcamento_carregar", JSON.stringify({ id, modo: "duplicar" }));
  window.location.href = "index.html";
}

function editarOrc(id) {
  localStorage.setItem("orcamento_carregar", JSON.stringify({ id, modo: "editar" }));
  window.location.href = "index.html";
}

function abrirEditorOrc(id) {
  const orc = getHistorico().find(h => h.id === id);
  if (!orc) return;
  sessionStorage.setItem("orc_editor_rascunho_v1", JSON.stringify(orc));
  window.location.href = "editor.html";
}

function apagarHistorico(id) {
  if (!confirm("Excluir este orçamento do histórico?")) return;
  saveHistorico(getHistorico().filter(h => h.id !== id));
  renderDashboard();
  renderHistorico();
}

function limparHistorico() {
  if (!confirm("Deseja apagar TODO o histórico? Esta ação não pode ser desfeita.")) return;
  localStorage.removeItem(HIST_KEY);
  renderDashboard();
  renderHistorico();
}

/* ── DASHBOARD ── */
function renderDashboard() {
  const wrap = document.getElementById("hist-dashboard");
  if (!wrap) return;
  const lista = getHistorico();
  if (!lista.length) { wrap.innerHTML = ""; return; }

  const total   = lista.length;
  const soma    = lista.reduce((s, h) => s + (Number(h.total) || 0), 0);
  const aceitas = lista.filter(h => h.status === "aceita").length;
  const perdidas= lista.filter(h => h.status === "perdida").length;
  const fechadas= aceitas + perdidas;
  const taxa    = fechadas > 0 ? Math.round((aceitas / fechadas) * 100) : 0;
  const ticket  = total   > 0 ? soma / total : 0;

  wrap.innerHTML = `
    <div class="dash-grid">
      <div class="dash-card">
        <div class="dash-val">${total}</div>
        <div class="dash-lbl">Propostas</div>
      </div>
      <div class="dash-card">
        <div class="dash-val dash-green">${money(soma)}</div>
        <div class="dash-lbl">Valor total gerado</div>
      </div>
      <div class="dash-card">
        <div class="dash-val ${taxa >= 50 ? "dash-green" : taxa > 0 ? "dash-yellow" : ""}">${taxa}%</div>
        <div class="dash-lbl">Taxa de fechamento</div>
      </div>
      <div class="dash-card">
        <div class="dash-val">${money(ticket)}</div>
        <div class="dash-lbl">Ticket médio</div>
      </div>
    </div>
  `;
}

/* ── FILTROS ── */
function getFiltros() {
  return {
    busca:  (document.getElementById("hist-busca")?.value  || "").toLowerCase().trim(),
    status: document.getElementById("hist-status")?.value  || "todos",
    ordem:  document.getElementById("hist-ordem")?.value   || "recente",
  };
}

function aplicarFiltros(lista) {
  const { busca, status, ordem } = getFiltros();
  let result = lista.filter(orc => {
    const matchStatus = status === "todos" || (orc.status || "rascunho") === status;
    const matchBusca  = !busca ||
      (orc.cliente || "").toLowerCase().includes(busca) ||
      (orc.numero  || "").toLowerCase().includes(busca) ||
      (orc.tipo    || "").toLowerCase().includes(busca);
    return matchStatus && matchBusca;
  });
  result.sort((a, b) => {
    if (ordem === "recente") return b.id - a.id;
    if (ordem === "antigo")  return a.id - b.id;
    if (ordem === "maior")   return (Number(b.total) || 0) - (Number(a.total) || 0);
    if (ordem === "menor")   return (Number(a.total) || 0) - (Number(b.total) || 0);
    return 0;
  });
  return result;
}

/* ── RENDER ── */
function renderHistorico() {
  const root  = document.getElementById("hist-list");
  const todos = getHistorico();
  const lista = aplicarFiltros(todos);

  _atualizarContagensStatus(todos);

  if (!lista.length) {
    root.innerHTML = `<div class="hist-empty">${todos.length ? "Nenhum resultado para este filtro." : "Nenhum orçamento salvo ainda."}</div>`;
    return;
  }

  root.innerHTML = `<div class="hist-list">${lista.map(orc => _cardHtml(orc)).join("")}</div>`;
}

function _cardHtml(orc) {
  const st  = orc.status || "rascunho";
  const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.rascunho;
  const opts = Object.entries(STATUS_CONFIG).map(([k, v]) =>
    `<option value="${k}" ${k === st ? "selected" : ""}>${v.label}</option>`
  ).join("");

  return `
    <article class="hist-card" style="--st-cor:${cfg.cor};--st-bg:${cfg.bg};--st-brd:${cfg.borda}">
      <div class="hist-head">
        <div class="hist-head-info">
          <div class="hist-title">${esc(orc.cliente)}</div>
          <div class="hist-meta">#${esc(orc.numero)} · ${esc(orc.data)}</div>
          <div class="hist-meta">${esc(orc.tipo)}${orc.contato ? " · " + esc(orc.contato) : ""}</div>
        </div>
        <div class="hist-head-right">
          <div class="hist-total">${money(orc.total)}</div>
          <select class="status-sel" onchange="atualizarStatus(${orc.id}, this.value)"
                  style="color:${cfg.cor};border-color:${cfg.borda};background:${cfg.bg}">
            ${opts}
          </select>
        </div>
      </div>
      <div class="hist-items">
        ${orc.itens.map(item => `
          <div class="hist-item">
            <span>${esc(item.desc)}</span>
            <strong>${item.qtd}x · ${money(item.sub)}</strong>
          </div>`).join("")}
      </div>
      ${orc.obs ? `<div class="hist-obs"><strong>Obs:</strong> ${esc(orc.obs)}</div>` : ""}
      <div class="hist-actions">
        <button class="btn-mini btn-dup"    onclick="duplicarOrc(${orc.id})">⧉ Duplicar</button>
        <button class="btn-mini btn-edit"   onclick="editarOrc(${orc.id})">✎ Editar</button>
        <button class="btn-mini btn-editor" onclick="abrirEditorOrc(${orc.id})">📝 Editor</button>
        <button class="btn-mini btn-delete" onclick="apagarHistorico(${orc.id})">Excluir</button>
      </div>
    </article>
  `;
}

function _atualizarContagensStatus(lista) {
  const c = { todos: lista.length, rascunho: 0, enviada: 0, aceita: 0, perdida: 0 };
  lista.forEach(h => { const s = h.status || "rascunho"; if (c[s] !== undefined) c[s]++; });
  Object.keys(c).forEach(k => { const el = document.getElementById("cnt-" + k); if (el) el.textContent = c[k]; });
}

function filtrarPor(status) {
  const sel = document.getElementById("hist-status");
  if (sel) sel.value = status;
  renderHistorico();
  document.querySelectorAll(".pill-status").forEach(p => p.classList.remove("ativo"));
  document.getElementById("pill-" + status)?.classList.add("ativo");
}

renderDashboard();
renderHistorico();
