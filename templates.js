/* ═══════════════════════════════════════════════════════════════
   TEMPLATES.JS — Fase 3 · Sistema de Templates de Proposta
   Salva: localStorage  key: "orc_templates_v1"
   ═══════════════════════════════════════════════════════════════ */

const TEMPLATES_KEY = "orc_templates_v1";

/* ── TEMPLATES PADRÃO ───────────────────────────────────────── */

const TEMPLATES_PADRAO = [
  {
    id: 1,
    nome: "Identidade Visual",
    categoria: "branding",
    cor: "#7c3aed",
    icone: "🎨",
    descricao: "Logo, paleta de cores e tipografia",
    itens: [
      { desc: "Logotipo principal", qtd: 1, unit: 350, sub: 350 },
      { desc: "Variações do logo (horizontal, ícone, monocromático)", qtd: 1, unit: 120, sub: 120 },
      { desc: "Paleta de cores + tipografia", qtd: 1, unit: 80, sub: 80 },
      { desc: "Manual de identidade visual (PDF)", qtd: 1, unit: 150, sub: 150 },
    ],
    condPagamento: "50% na aprovação + 50% na entrega final",
    condRevisoes: "Até 3 rodadas de revisão inclusas no briefing",
    condAlteracoes: "Alterações fora do escopo serão orçadas separadamente",
    obs: "Entrega: arquivos em AI, PDF, PNG e SVG. Prazo estimado: 10 dias úteis.",
  },
  {
    id: 2,
    nome: "Social Media Mensal",
    categoria: "social",
    cor: "#0891b2",
    icone: "📱",
    descricao: "Posts, stories e artes para redes sociais",
    itens: [
      { desc: "Post para feed (Instagram/Facebook)", qtd: 12, unit: 35, sub: 420 },
      { desc: "Stories animado", qtd: 8, unit: 45, sub: 360 },
      { desc: "Capa para destaque (highlight)", qtd: 5, unit: 25, sub: 125 },
    ],
    condPagamento: "Pagamento até o dia 5 de cada mês",
    condRevisoes: "1 rodada de revisão por arte",
    condAlteracoes: "Alterações estruturais após aprovação serão cobradas à parte",
    obs: "Artes entregues semanalmente. Cronograma combinado no início do contrato.",
  },
  {
    id: 3,
    nome: "Cobertura de Evento",
    categoria: "evento",
    cor: "#dc2626",
    icone: "📸",
    descricao: "Cobertura fotográfica e de vídeo",
    itens: [
      { desc: "Cobertura fotográfica do evento", qtd: 4, unit: 200, sub: 800 },
      { desc: "Edição e entrega de fotos selecionadas", qtd: 1, unit: 150, sub: 150 },
      { desc: "Vídeo de cobertura (até 2 min)", qtd: 1, unit: 350, sub: 350 },
    ],
    condPagamento: "100% antecipado para reserva da data",
    condRevisoes: "Edição inclusa conforme briefing. 1 revisão de corte de vídeo.",
    condAlteracoes: "Edições adicionais serão orçadas separadamente",
    obs: "Entrega: até 7 dias úteis após o evento. Fotos em alta resolução + vídeo MP4.",
  },
  {
    id: 4,
    nome: "Site Institucional",
    categoria: "web",
    cor: "#16a04b",
    icone: "🌐",
    descricao: "Criação e design de site completo",
    itens: [
      { desc: "Design das telas (até 5 páginas)", qtd: 1, unit: 600, sub: 600 },
      { desc: "Desenvolvimento e publicação", qtd: 1, unit: 800, sub: 800 },
      { desc: "Configuração de domínio e hospedagem", qtd: 1, unit: 150, sub: 150 },
      { desc: "Treinamento de uso (1h)", qtd: 1, unit: 100, sub: 100 },
    ],
    condPagamento: "30% na contratação, 40% na entrega do design, 30% na publicação",
    condRevisoes: "Até 2 rodadas de revisão no design antes do desenvolvimento",
    condAlteracoes: "Novas páginas ou funcionalidades serão orçadas separadamente",
    obs: "Prazo estimado: 20 dias úteis. Inclui responsivo (mobile e desktop).",
  },
  {
    id: 5,
    nome: "Reels / Vídeo para Redes",
    categoria: "video",
    cor: "#ea580c",
    icone: "🎬",
    descricao: "Produção e edição de vídeos curtos",
    itens: [
      { desc: "Roteiro e storyboard", qtd: 1, unit: 100, sub: 100 },
      { desc: "Gravação (meia diária)", qtd: 1, unit: 300, sub: 300 },
      { desc: "Edição de vídeo (até 60s)", qtd: 1, unit: 150, sub: 150 },
      { desc: "Legendas animadas + trilha", qtd: 1, unit: 80, sub: 80 },
    ],
    condPagamento: "50% na aprovação do roteiro + 50% na entrega",
    condRevisoes: "1 rodada de revisão no corte final",
    condAlteracoes: "Regravações por mudança de briefing serão cobradas separadamente",
    obs: "Entrega em formato MP4 1080p. Otimizado para Instagram, TikTok e YouTube Shorts.",
  },
];

/* ── CRUD DE TEMPLATES ──────────────────────────────────────── */

function getTemplates() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    const lista = raw ? JSON.parse(raw) : [];
    if (!lista.length) {
      salvarTemplates(TEMPLATES_PADRAO);
      return TEMPLATES_PADRAO;
    }
    return lista;
  } catch { return TEMPLATES_PADRAO; }
}

function salvarTemplates(lista) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(lista));
}

function deletarTemplate(id) {
  const lista = getTemplates().filter(t => t.id !== id);
  salvarTemplates(lista);
  renderGaleriaTemplates();
  toastTpl("Template excluído.", "#5a5a72");
}

function duplicarTemplate(id) {
  const lista = getTemplates();
  const orig  = lista.find(t => t.id === id);
  if (!orig) return;
  const novoId = Math.max(0, ...lista.map(t => t.id)) + 1;
  const copia  = { ...orig, id: novoId, nome: orig.nome + " (cópia)" };
  lista.push(copia);
  salvarTemplates(lista);
  renderGaleriaTemplates();
  toastTpl("Template duplicado!", "#16a04b");
}

/* ── SALVAR PROPOSTA COMO TEMPLATE ───────────────────────────
   Chamado pelo editor.html (botão "Salvar como template")
   Recebe o objeto _estado do editor
   ──────────────────────────────────────────────────────────── */
function salvarComoTemplate(estado) {
  if (!estado || !estado.itens || !estado.itens.length) {
    toastTpl("Adicione itens antes de salvar como template.", "#c0253d");
    return;
  }

  const nome = prompt("Nome para este template:\n(Ex: Identidade Visual, Social Media Mensal…)");
  if (!nome || !nome.trim()) return;

  const categoria = prompt(
    "Categoria (escolha uma):\nbranding, social, evento, web, video, outro",
    "outro"
  ) || "outro";

  const lista   = getTemplates();
  const novoId  = Math.max(0, ...lista.map(t => t.id)) + 1;

  const template = {
    id:            novoId,
    nome:          nome.trim(),
    categoria:     categoria.trim().toLowerCase(),
    cor:           _corPorCategoria(categoria),
    icone:         _iconePorCategoria(categoria),
    descricao:     estado.obs || "",
    itens:         estado.itens.map(i => ({ ...i })),
    condPagamento:  estado.condPagamento  || "50% na aprovação + 50% na entrega",
    condRevisoes:   estado.condRevisoes   || "Revisões incluídas conforme briefing aprovado",
    condAlteracoes: estado.condAlteracoes || "Alterações fora do escopo serão orçadas separadamente",
    obs:            estado.obs            || "",
  };

  lista.push(template);
  salvarTemplates(lista);
  toastTpl("Template \"" + template.nome + "\" salvo!", "#16a04b");
  return template;
}

function _corPorCategoria(cat) {
  const mapa = {
    branding: "#7c3aed", social: "#0891b2", evento: "#dc2626",
    web: "#16a04b", video: "#ea580c", outro: "#9999b0",
  };
  return mapa[cat] || "#9999b0";
}

function _iconePorCategoria(cat) {
  const mapa = {
    branding: "🎨", social: "📱", evento: "📸",
    web: "🌐", video: "🎬", outro: "📄",
  };
  return mapa[cat] || "📄";
}

/* ── APLICAR TEMPLATE → REDIRECIONA PARA INDEX.HTML ────────── */

function aplicarTemplate(id) {
  const tpl = getTemplates().find(t => t.id === id);
  if (!tpl) return;
  sessionStorage.setItem("orc_template_aplicar", JSON.stringify(tpl));
  window.location.href = "index.html";
}

/* ── APLICAR TEMPLATE → REDIRECIONA PARA EDITOR.HTML ───────── */

function aplicarTemplateEditor(id) {
  const tpl = getTemplates().find(t => t.id === id);
  if (!tpl) return;

  // Monta um estado para o editor a partir do template
  const now    = new Date();
  const estado = {
    id:      Date.now(),
    numero:  "TPL-" + now.getFullYear() + String(now.getMonth()+1).padStart(2,"0") + String(now.getDate()).padStart(2,"0"),
    data:    now.toLocaleDateString("pt-BR"),
    cliente: "",
    tipo:    "Novo cliente",
    contato: "",
    validade: "",
    obs:     tpl.obs || "",
    itens:   tpl.itens.map(i => ({ ...i })),
    subtotal: tpl.itens.reduce((s, i) => s + (i.sub || 0), 0),
    total:    tpl.itens.reduce((s, i) => s + (i.sub || 0), 0),
    tipoFator: 1, cxFator: 1, urgFator: 1, freqFator: 1, descPct: 0,
    condPagamento:  tpl.condPagamento,
    condRevisoes:   tpl.condRevisoes,
    condAlteracoes: tpl.condAlteracoes,
    _fromTemplate:  tpl.nome,
  };

  sessionStorage.setItem("orc_editor_rascunho_v1", JSON.stringify(estado));
  window.location.href = "editor.html";
}

/* ── RENDERIZAR GALERIA ─────────────────────────────────────── */

function renderGaleriaTemplates() {
  const wrap = document.getElementById("galeria-templates");
  if (!wrap) return;

  const lista     = getTemplates();
  const filtro    = document.getElementById("filtro-cat")?.value || "todos";
  const busca     = (document.getElementById("busca-tpl")?.value || "").toLowerCase();

  const filtrados = lista.filter(t => {
    const matchCat   = filtro === "todos" || t.categoria === filtro;
    const matchBusca = !busca || t.nome.toLowerCase().includes(busca) || (t.descricao || "").toLowerCase().includes(busca);
    return matchCat && matchBusca;
  });

  if (!filtrados.length) {
    wrap.innerHTML = `<div class="tpl-empty">Nenhum template encontrado.</div>`;
    return;
  }

  wrap.innerHTML = filtrados.map(t => {
    const total = t.itens.reduce((s, i) => s + (i.sub || 0), 0);
    const numItens = t.itens.length;
    return `
      <article class="tpl-card" style="--tpl-cor:${t.cor}">
        <div class="tpl-card-top">
          <div class="tpl-icone">${t.icone || "📄"}</div>
          <div class="tpl-info">
            <div class="tpl-nome">${t.nome}</div>
            <div class="tpl-cat">${_labelCategoria(t.categoria)}</div>
          </div>
          <div class="tpl-menu">
            <button class="tpl-menu-btn" onclick="toggleMenuTpl(${t.id})" title="Opções">⋯</button>
            <div class="tpl-dropdown" id="tpl-drop-${t.id}">
              <button onclick="duplicarTemplate(${t.id}); toggleMenuTpl(${t.id})">⧉ Duplicar</button>
              <button onclick="editarTemplate(${t.id}); toggleMenuTpl(${t.id})">✎ Editar nome</button>
              <button class="danger" onclick="if(confirm('Excluir este template?')) deletarTemplate(${t.id})">× Excluir</button>
            </div>
          </div>
        </div>

        ${t.descricao ? `<p class="tpl-desc">${t.descricao}</p>` : ""}

        <div class="tpl-itens-preview">
          ${t.itens.slice(0, 3).map(i => `
            <div class="tpl-item-row">
              <span>${i.desc}</span>
              <span class="tpl-item-val">${i.qtd}x · ${_RS(i.unit)}</span>
            </div>
          `).join("")}
          ${numItens > 3 ? `<div class="tpl-item-mais">+ ${numItens - 3} item${numItens - 3 > 1 ? "s" : ""}</div>` : ""}
        </div>

        <div class="tpl-footer">
          <div class="tpl-total">
            <span class="tpl-total-lbl">Total estimado</span>
            <span class="tpl-total-val">${_RS(total)}</span>
          </div>
          <div class="tpl-acoes">
            <button class="tpl-btn-editor" onclick="aplicarTemplateEditor(${t.id})">
              ✏️ Abrir no editor
            </button>
            <button class="tpl-btn-usar" onclick="aplicarTemplate(${t.id})">
              + Usar agora
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function _labelCategoria(cat) {
  const mapa = {
    branding: "Branding", social: "Social Media", evento: "Evento",
    web: "Web", video: "Vídeo", outro: "Outro",
  };
  return mapa[cat] || cat;
}

function toggleMenuTpl(id) {
  // Fecha todos os outros
  document.querySelectorAll(".tpl-dropdown").forEach(d => {
    if (d.id !== "tpl-drop-" + id) d.classList.remove("open");
  });
  document.getElementById("tpl-drop-" + id)?.classList.toggle("open");
}

// Fechar menus ao clicar fora
document.addEventListener("click", e => {
  if (!e.target.closest(".tpl-menu")) {
    document.querySelectorAll(".tpl-dropdown").forEach(d => d.classList.remove("open"));
  }
});

function editarTemplate(id) {
  const lista = getTemplates();
  const tpl   = lista.find(t => t.id === id);
  if (!tpl) return;
  const novo = prompt("Novo nome:", tpl.nome);
  if (!novo || !novo.trim()) return;
  tpl.nome = novo.trim();
  salvarTemplates(lista);
  renderGaleriaTemplates();
  toastTpl("Nome atualizado!", "#16a04b");
}

/* ── CARREGAR TEMPLATE APLICADO NO INDEX.HTML ───────────────── */

function carregarTemplateAplicado() {
  const raw = sessionStorage.getItem("orc_template_aplicar");
  if (!raw) return;
  sessionStorage.removeItem("orc_template_aplicar");

  const tpl = JSON.parse(raw);

  // Limpa o formulário
  if (typeof limpar === "function") limpar();

  // Pequeno delay para o limpar() terminar
  setTimeout(() => {
    // Remove a linha vazia que o limpar() adiciona
    const tbody = document.getElementById("tbody");
    if (tbody) tbody.innerHTML = "";
    if (typeof lid !== "undefined") window.lid = 0;

    // Adiciona os itens do template
    if (typeof addRow === "function") {
      tpl.itens.forEach(i => addRow(i.desc, i.qtd, i.unit));
    }

    // Preenche observações
    const obsEl = document.getElementById("obs");
    if (obsEl && tpl.obs) obsEl.value = tpl.obs;

    if (typeof recalc === "function") recalc();
    if (typeof toast  === "function") toast("Template \"" + tpl.nome + "\" aplicado!");
  }, 80);
}

/* ── HELPERS ────────────────────────────────────────────────── */

function _RS(v) {
  return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toastTpl(msg, cor) {
  // Usa o toast global se existir, senão cria um temporário
  if (typeof toast === "function") { toast(msg, cor); return; }
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = cor || "#16a04b";
  el.classList.add("on");
  setTimeout(() => el.classList.remove("on"), 2700);
}

/* ── EXPORTS GLOBAIS ────────────────────────────────────────── */

window.getTemplates             = getTemplates;
window.salvarTemplates          = salvarTemplates;
window.deletarTemplate          = deletarTemplate;
window.duplicarTemplate         = duplicarTemplate;
window.salvarComoTemplate       = salvarComoTemplate;
window.aplicarTemplate          = aplicarTemplate;
window.aplicarTemplateEditor    = aplicarTemplateEditor;
window.renderGaleriaTemplates   = renderGaleriaTemplates;
window.toggleMenuTpl            = toggleMenuTpl;
window.editarTemplate           = editarTemplate;
window.carregarTemplateAplicado = carregarTemplateAplicado;
