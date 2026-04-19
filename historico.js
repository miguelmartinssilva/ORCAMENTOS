const HIST_KEY = "historico_orcamentos_miguel";

function getHistorico() {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistorico(lista) {
  localStorage.setItem(HIST_KEY, JSON.stringify(lista));
}

function money(v) {
  return `R$ ${Number(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function duplicarOrc(id) {
  localStorage.setItem("orcamento_carregar", JSON.stringify({ id: id, modo: "duplicar" }));
  window.location.href = "index.html";
}

function editarOrc(id) {
  localStorage.setItem("orcamento_carregar", JSON.stringify({ id: id, modo: "editar" }));
  window.location.href = "index.html";
}

function apagarHistorico(id) {
  const lista = getHistorico().filter((item) => item.id !== id);
  saveHistorico(lista);
  renderHistorico();
}

function limparHistorico() {
  if (!confirm("Deseja apagar todo o histórico?")) return;
  localStorage.removeItem(HIST_KEY);
  renderHistorico();
}

function renderHistorico() {
  const root = document.getElementById("hist-list");
  const lista = getHistorico();

  if (!lista.length) {
    root.innerHTML = `<div class="hist-empty">Nenhum orçamento salvo ainda.</div>`;
    return;
  }

  root.innerHTML = `
    <div class="hist-list">
      ${lista.map((orc) => `
        <article class="hist-card">
          <div class="hist-head">
            <div>
              <div class="hist-title">${orc.cliente}</div>
              <div class="hist-meta">#${orc.numero} · ${orc.data}</div>
              <div class="hist-meta">${orc.tipo}${orc.contato ? " · " + orc.contato : ""}</div>
            </div>
            <div class="hist-total">${money(orc.total)}</div>
          </div>

          <div class="hist-items">
            ${orc.itens.map((item) => `
              <div class="hist-item">
                <span>${item.desc}</span>
                <strong>${item.qtd}x · ${money(item.sub)}</strong>
              </div>
            `).join("")}
          </div>

          ${orc.obs ? `<div class="hist-obs"><strong>Obs:</strong> ${orc.obs}</div>` : ""}

          <div class="hist-actions">
            <button class="btn-mini btn-dup"    onclick="duplicarOrc(${orc.id})">⧉ Duplicar</button>
            <button class="btn-mini btn-edit"   onclick="editarOrc(${orc.id})">✎ Editar</button>
            <button class="btn-mini btn-delete" onclick="apagarHistorico(${orc.id})">Excluir</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

renderHistorico();