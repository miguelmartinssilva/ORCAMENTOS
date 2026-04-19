const HIST_KEY     = "historico_orcamentos_miguel";
const SERVICOS_KEY = "servicos_miguel";
const PACOTES_KEY  = "pacotes_miguel";
const MEU_NUM      = "5563999999999";

const $ = (id) => document.getElementById(id);
const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const RS  = (v) => `R$ ${fmt(v)}`;

/* ─── SERVIÇOS ─────────────────────────────────────────────────────────── */

const SERVICOS_PADRAO = [
  { id: 1, nome: "Post para Redes Sociais", unidade: "por arte",   preco: 35  },
  { id: 2, nome: "Banner",                  unidade: "por arte",   preco: 80  },
  { id: 3, nome: "Logotipo",                unidade: "por pacote", preco: 350 },
  { id: 4, nome: "Video / Reels",           unidade: "por video",  preco: 150 },
  { id: 5, nome: "Cobertura de Evento",     unidade: "por hora",   preco: 200 },
  { id: 6, nome: "Transmissao ao Vivo",     unidade: "por hora",   preco: 250 },
];

function getServicos() {
  try { return JSON.parse(localStorage.getItem(SERVICOS_KEY)) || SERVICOS_PADRAO; }
  catch { return SERVICOS_PADRAO; }
}

function salvarServicos(lista) {
  localStorage.setItem(SERVICOS_KEY, JSON.stringify(lista));
}

function renderCatalogo() {
  const wrap = $("catalogo-lista");
  if (!wrap) return;
  wrap.innerHTML = getServicos().map(s => `
    <button class="srv-btn" onclick="adicionarServico(${s.id})">
      <span class="srv-nome">${s.nome}</span>
      <span class="srv-preco">${RS(s.preco)}</span>
      <span class="srv-uni">${s.unidade}</span>
    </button>
  `).join("");
}

function adicionarServico(id) {
  const s = getServicos().find(x => x.id === id);
  if (!s) return;
  addRow(s.nome, 1, s.preco);
  toast("+ " + s.nome + " adicionado!");
  verificarSugestaoPacote();
}

function renderAdminServicos() {
  const wrap = $("admin-servicos-lista");
  if (!wrap) return;
  wrap.innerHTML = getServicos().map(s => `
    <div class="srv-admin-row" id="srow-${s.id}">
      <input class="srv-admin-nome"  type="text"   value="${s.nome}"    placeholder="Nome"/>
      <input class="srv-admin-preco" type="number" value="${s.preco}"   min="0" step="0.01" placeholder="Preco"/>
      <input class="srv-admin-uni"   type="text"   value="${s.unidade}" placeholder="Unidade"/>
      <button class="srv-admin-del" onclick="deletarServico(${s.id})">×</button>
    </div>
  `).join("");
}

function salvarAdminServicos() {
  const rows = document.querySelectorAll(".srv-admin-row");
  const lista = [...rows].map(row => ({
    id:      parseInt(row.id.replace("srow-", "")),
    nome:    row.querySelector(".srv-admin-nome").value.trim(),
    preco:   parseFloat(row.querySelector(".srv-admin-preco").value) || 0,
    unidade: row.querySelector(".srv-admin-uni").value.trim(),
  })).filter(s => s.nome);
  salvarServicos(lista);
  renderCatalogo();
  toast("Servicos salvos!", "#16a04b");
}

function deletarServico(id) {
  salvarServicos(getServicos().filter(s => s.id !== id));
  renderAdminServicos();
  renderCatalogo();
}

function novoServico() {
  const lista = getServicos();
  const novoId = Math.max(0, ...lista.map(s => s.id)) + 1;
  lista.push({ id: novoId, nome: "", unidade: "por arte", preco: 0 });
  salvarServicos(lista);
  renderAdminServicos();
}

/* ─── PACOTES INTELIGENTES ─────────────────────────────────────────────── */

const PACOTES_PADRAO = [
  { id: 1, nome: "Pacote 10 Posts",     servico: "Post para Redes Sociais", qtd: 10, precoTotal: 120, descricao: "Ideal para 1 mês de conteúdo" },
  { id: 2, nome: "Pacote 20 Posts",     servico: "Post para Redes Sociais", qtd: 20, precoTotal: 200, descricao: "2 meses · economia de R$ 50" },
  { id: 3, nome: "Pacote Identidade",   servico: "Logotipo",                qtd: 1,  precoTotal: 300, descricao: "Logo + cartão de visita" },
  { id: 4, nome: "Pacote Reels Mensal", servico: "Video / Reels",           qtd: 4,  precoTotal: 500, descricao: "4 vídeos por mês" },
  { id: 5, nome: "Pacote Evento Full",  servico: "Cobertura de Evento",     qtd: 4,  precoTotal: 700, descricao: "Cobertura + edição inclusa" },
];

function getPacotes() {
  try { return JSON.parse(localStorage.getItem(PACOTES_KEY)) || PACOTES_PADRAO; }
  catch { return PACOTES_PADRAO; }
}

function salvarPacotesLS(lista) {
  localStorage.setItem(PACOTES_KEY, JSON.stringify(lista));
}

function renderPacotes() {
  const wrap = $("pacotes-lista");
  if (!wrap) return;
  wrap.innerHTML = getPacotes().map(p => {
    const servicos = getServicos();
    const srv = servicos.find(s => s.nome === p.servico);
    const precoNormal = srv ? srv.preco * p.qtd : p.precoTotal;
    const economia = precoNormal - p.precoTotal;
    const pct = precoNormal > 0 ? Math.round((economia / precoNormal) * 100) : 0;
    return `
      <div class="pacote-card">
        <div class="pacote-top">
          <span class="pacote-nome">${p.nome}</span>
          ${economia > 0 ? `<span class="pacote-badge">-${pct}%</span>` : ""}
        </div>
        <span class="pacote-desc">${p.descricao}</span>
        <div class="pacote-precos">
          ${economia > 0 ? `<span class="pacote-de">${RS(precoNormal)}</span>` : ""}
          <span class="pacote-por">${RS(p.precoTotal)}</span>
        </div>
        ${economia > 0 ? `<span class="pacote-eco">💰 Economia de ${RS(economia)}</span>` : ""}
        <button class="pacote-btn" onclick="adicionarPacote(${p.id})">+ Adicionar à proposta</button>
      </div>
    `;
  }).join("");
}

function adicionarPacote(id) {
  const p = getPacotes().find(x => x.id === id);
  if (!p) return;
  addRow(p.nome + " · " + p.descricao, 1, p.precoTotal);
  toast("Pacote adicionado: " + p.nome);
  $("sugestao-pacote") && ($("sugestao-pacote").style.display = "none");
}

/* Sugestão automática de pacote quando o usuário adiciona posts avulsos */
function verificarSugestaoPacote() {
  const wrap = $("sugestao-pacote");
  if (!wrap) return;
  const linhas = getLinhas();
  const totalPostsAvulso = linhas
    .filter(l => l.desc.toLowerCase().includes("post") || l.desc.toLowerCase().includes("rede"))
    .reduce((a, l) => a + l.qtd, 0);

  if (totalPostsAvulso >= 8) {
    const p20 = getPacotes().find(p => p.qtd === 20 && p.servico === "Post para Redes Sociais");
    const p10 = getPacotes().find(p => p.qtd === 10 && p.servico === "Post para Redes Sociais");
    const pacote = totalPostsAvulso >= 15 ? p20 : p10;
    if (pacote) {
      const srv = getServicos().find(s => s.nome === "Post para Redes Sociais");
      const precoNormal = srv ? srv.preco * pacote.qtd : pacote.precoTotal;
      const economia = precoNormal - pacote.precoTotal;
      wrap.innerHTML = `
        <div class="sugestao-inner">
          <span class="sugestao-icon">💡</span>
          <div class="sugestao-txt">
            <strong>Dica de economia!</strong>
            <span>Com ${totalPostsAvulso} posts, o <b>${pacote.nome}</b> te economiza <b>${RS(economia)}</b>.</span>
          </div>
          <button class="sugestao-btn" onclick="adicionarPacote(${pacote.id})">Aplicar pacote</button>
          <button class="sugestao-fechar" onclick="this.closest('#sugestao-pacote').style.display='none'">×</button>
        </div>
      `;
      wrap.style.display = "block";
    }
  } else {
    wrap.style.display = "none";
  }
}

/* ─── ADMIN DE PACOTES ─────────────────────────────────────────────────── */

function renderAdminPacotes() {
  const wrap = $("admin-pacotes-lista");
  if (!wrap) return;
  const servicos = getServicos();
  const optsServico = servicos.map(s => `<option value="${s.nome}">${s.nome}</option>`).join("");
  wrap.innerHTML = getPacotes().map(p => `
    <div class="srv-admin-row pacote-admin-row" id="prow-${p.id}">
      <input class="pac-nome"  type="text"   value="${p.nome}"       placeholder="Nome do pacote"/>
      <select class="pac-serv">${optsServico.replace(`value="${p.servico}"`, `value="${p.servico}" selected`)}</select>
      <input class="pac-qtd"   type="number" value="${p.qtd}"        min="1" placeholder="Qtd"/>
      <input class="pac-preco" type="number" value="${p.precoTotal}" min="0" step="0.01" placeholder="Preço"/>
      <input class="pac-desc"  type="text"   value="${p.descricao}"  placeholder="Descrição" style="grid-column:1/-2"/>
      <button class="srv-admin-del" onclick="deletarPacote(${p.id})">×</button>
    </div>
  `).join("");
}

function salvarAdminPacotes() {
  const rows = document.querySelectorAll(".pacote-admin-row");
  const lista = [...rows].map(row => ({
    id:         parseInt(row.id.replace("prow-", "")),
    nome:       row.querySelector(".pac-nome").value.trim(),
    servico:    row.querySelector(".pac-serv").value,
    qtd:        parseInt(row.querySelector(".pac-qtd").value) || 1,
    precoTotal: parseFloat(row.querySelector(".pac-preco").value) || 0,
    descricao:  row.querySelector(".pac-desc").value.trim(),
  })).filter(p => p.nome);
  salvarPacotesLS(lista);
  renderPacotes();
  toast("Pacotes salvos!", "#16a04b");
}

function novoPacote() {
  const lista = getPacotes();
  const novoId = Math.max(0, ...lista.map(p => p.id)) + 1;
  lista.push({ id: novoId, nome: "", servico: getServicos()[0]?.nome || "", qtd: 1, precoTotal: 0, descricao: "" });
  salvarPacotesLS(lista);
  renderAdminPacotes();
}

function deletarPacote(id) {
  salvarPacotesLS(getPacotes().filter(p => p.id !== id));
  renderAdminPacotes();
  renderPacotes();
}

/* ─── TOAST ─────────────────────────────────────────────────────────────── */

function toast(msg, cor) {
  cor = cor || "#16a04b";
  const t = $("toast");
  t.textContent = msg;
  t.style.background = cor;
  t.classList.add("on");
  setTimeout(function() { t.classList.remove("on"); }, 2700);
}

/* ─── HISTÓRICO ─────────────────────────────────────────────────────────── */

function getHistorico() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; }
  catch { return []; }
}

function salvarHistorico(item) {
  const hist = getHistorico();
  hist.unshift(item);
  localStorage.setItem(HIST_KEY, JSON.stringify(hist));
}

/* ─── EDIÇÃO RÁPIDA / DUPLICAR ORÇAMENTO ───────────────────────────────── */

/**
 * Carrega um orçamento do histórico para o formulário.
 * modo = "editar" → mantém id original (versão nova sobrescreve)
 * modo = "duplicar" → gera novo id/numero
 */
function carregarOrcamento(id, modo) {
  const hist = getHistorico();
  const orc  = hist.find(h => h.id === id);
  if (!orc) { toast("Orçamento não encontrado", "#c0253d"); return; }

  // Limpar formulário sem chamar addRow no final
  $("cli-nome").value     = "";
  $("cli-contato").value  = "";
  $("obs").value          = "";
  $("desc").value         = "";
  $("cli-tipo").value     = "1.00";
  const d = new Date();
  d.setDate(d.getDate() + 7);
  $("cli-validade").value = d.toISOString().split("T")[0];
  document.querySelector('input[name="freq"][value="1.00"]').checked = true;
  document.querySelector('input[name="urg"][value="1.00"]').checked  = true;
  document.querySelector('input[name="cx"][value="1.00"]').checked   = true;
  $("tbody").innerHTML = "";
  lid = 0;
  $("proposta-wrap").classList.remove("on");

  // Preencher com dados do orçamento
  $("cli-nome").value    = orc.cliente !== "(cliente nao informado)" ? orc.cliente : "";
  $("cli-contato").value = orc.contato || "";
  $("obs").value         = orc.obs     || "";
  if (orc.descPct) $("desc").value = orc.descPct;
  if (orc.validade) $("cli-validade").value = orc.validade;

  // Tentar restaurar fator de tipo
  const tipoOpts = [...$("cli-tipo").options];
  const tipoMatch = tipoOpts.find(o => parseFloat(o.value) === orc.tipoFator);
  if (tipoMatch) $("cli-tipo").value = tipoMatch.value;

  // Urgência / frequência / complexidade
  const tryCheck = (name, val) => {
    const el = document.querySelector(`input[name="${name}"][value="${val.toFixed(2)}"]`);
    if (el) el.checked = true;
  };
  if (orc.urgFator)  tryCheck("urg",  orc.urgFator);
  if (orc.freqFator) tryCheck("freq", orc.freqFator);
  if (orc.cxFator)   tryCheck("cx",   orc.cxFator);

  // Itens
  orc.itens.forEach(l => addRow(l.desc, l.qtd, l.unit));
  recalc();

  const acao = modo === "duplicar" ? "duplicado" : "carregado para edição";
  toast(`Orçamento ${acao}!`, "#1a4a7a");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Feedback visual no campo do cliente
  if ($("cli-nome")) {
    $("cli-nome").focus();
    $("cli-nome").style.outline = "2px solid var(--g3)";
    setTimeout(() => { $("cli-nome").style.outline = ""; }, 2000);
  }
}

function duplicarOrcamento(id) { carregarOrcamento(id, "duplicar"); }
function editarOrcamento(id)    { carregarOrcamento(id, "editar"); }

/* ─── INICIALIZAÇÃO ─────────────────────────────────────────────────────── */

(function() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  if ($("cli-validade")) $("cli-validade").value = d.toISOString().split("T")[0];
  renderCatalogo();
  renderAdminServicos();
  renderPacotes();
  renderAdminPacotes();
})();

/* ─── LINHAS DA TABELA ──────────────────────────────────────────────────── */

let lid = 0;

function addRow(desc, qtd, unit) {
  desc = desc || ""; qtd = qtd || 1; unit = unit || 200;
  const tb = $("tbody");
  const id = ++lid;
  const tr = document.createElement("tr");
  tr.id = "r" + id;
  tr.innerHTML =
    '<td class="td-d"><input type="text" placeholder="Descricao do servico" value="' + desc + '" oninput="recalc(); verificarSugestaoPacote()"></td>' +
    '<td class="td-q"><input type="number" min="1" value="' + qtd + '" oninput="recalc(); verificarSugestaoPacote()"></td>' +
    '<td class="td-u"><input type="number" min="0" step="0.01" value="' + unit + '" oninput="recalc()"></td>' +
    '<td class="td-s" id="s' + id + '">' + RS(qtd * unit) + '</td>' +
    '<td class="td-x"><button class="btn-del" onclick="delRow(' + id + ')">×</button></td>';
  tb.appendChild(tr);
  recalc();
}

function delRow(id) {
  const el = $("r" + id);
  if (el) el.remove();
  recalc();
  verificarSugestaoPacote();
}

function getLinhas() {
  return [...$("tbody").querySelectorAll("tr")].map(function(tr) {
    const ins = tr.querySelectorAll("input");
    const desc = ins[0] ? ins[0].value.trim() : "";
    const qtd  = parseFloat(ins[1] ? ins[1].value : 0) || 0;
    const unit = parseFloat(ins[2] ? ins[2].value : 0) || 0;
    const sub  = qtd * unit;
    const sid  = tr.id.slice(1);
    const sel  = $("s" + sid);
    if (sel) sel.textContent = RS(sub);
    return { desc, qtd, unit, sub };
  }).filter(l => l.desc && l.qtd > 0);
}

function recalc() {
  const ls   = getLinhas();
  const sub  = ls.reduce((a, l) => a + l.sub, 0);
  const tipo = parseFloat($("cli-tipo").value) || 1;
  const cx   = parseFloat(document.querySelector("input[name=cx]:checked")   ? document.querySelector("input[name=cx]:checked").value   : 1) || 1;
  const urg  = parseFloat(document.querySelector("input[name=urg]:checked")  ? document.querySelector("input[name=urg]:checked").value  : 1) || 1;
  const freq = parseFloat(document.querySelector("input[name=freq]:checked") ? document.querySelector("input[name=freq]:checked").value : 1) || 1;
  const descPct = parseFloat($("desc") ? $("desc").value : 0) || 0;
  const total   = Math.round(sub * tipo * cx * urg * freq * (1 - descPct / 100) * 100) / 100;

  const tipoLbl = $("cli-tipo").options[$("cli-tipo").selectedIndex] ? $("cli-tipo").options[$("cli-tipo").selectedIndex].text : "";
  $("res-tipo-label").textContent = tipoLbl;
  $("res-tipo-fator").textContent = "x" + tipo.toFixed(2);

  $("r-sub").textContent   = RS(sub);
  $("r-tipo").textContent  = "x" + tipo.toFixed(2);
  $("r-cx").textContent    = "x" + cx.toFixed(2);
  $("r-urg").textContent   = urg  !== 1 ? "x" + urg.toFixed(2)  : "—";
  $("r-freq").textContent  = freq !== 1 ? "x" + freq.toFixed(2) : "—";
  $("r-desc").textContent  = descPct > 0 ? "-" + descPct + "%" : "—";
  $("r-total").innerHTML   = "<sup>R$</sup> " + fmt(total);

  $("f-eco").textContent   = "R$ " + Math.round(total * 0.85).toLocaleString("pt-BR");
  $("f-ideal").textContent = "R$ " + Math.round(total).toLocaleString("pt-BR");
  $("f-prem").textContent  = "R$ " + Math.round(total * 1.25).toLocaleString("pt-BR");

  return { ls, sub, tipo, cx, urg, freq, descPct, total };
}

/* ─── MONTAR / GERAR PROPOSTA ───────────────────────────────────────────── */

function montarOrcamento() {
  const d   = recalc();
  const now = new Date();
  return {
    id:      Date.now(),
    numero:  "MM-" + now.getFullYear() + String(now.getMonth()+1).padStart(2,"0") + String(now.getDate()).padStart(2,"0") + "-" + String(now.getHours()).padStart(2,"0") + String(now.getMinutes()).padStart(2,"0"),
    data:    now.toLocaleDateString("pt-BR"),
    cliente: $("cli-nome").value.trim() || "(cliente nao informado)",
    contato: $("cli-contato").value.trim(),
    tipo:    $("cli-tipo").options[$("cli-tipo").selectedIndex].text,
    validade: $("cli-validade").value,
    obs:      $("obs").value.trim(),
    itens:    d.ls,
    subtotal: d.sub,
    total:    d.total,
    tipoFator: d.tipo,
    cxFator:   d.cx,
    urgFator:  d.urg,
    freqFator: d.freq,
    descPct:   d.descPct,
  };
}

function gerarProposta() {
  const d = recalc();
  if (!d.ls.length) { toast("Adicione pelo menos 1 servico", "#c0253d"); return; }
  const orc = montarOrcamento();
  salvarHistorico(orc);
  $("p-num").textContent      = "#" + orc.numero;
  $("p-data").textContent     = orc.data;
  $("p-cli-nome").textContent = orc.cliente;
  $("p-cli-sub").textContent  = orc.tipo + (orc.contato ? " · " + orc.contato : "");
  $("p-itens").innerHTML = orc.itens.map(l =>
    "<tr><td class='in'>" + l.desc + "</td><td class='iq'>" + l.qtd + "x</td><td class='iu'>" + RS(l.unit) + "</td><td class='sv'>" + RS(l.sub) + "</td></tr>"
  ).join("");

  const adjs = [];
  if (orc.tipoFator !== 1) adjs.push("<div class='padj-l'><span class='pk'>Tipo cliente</span><span class='pv r'>x" + orc.tipoFator.toFixed(2) + "</span></div>");
  if (orc.cxFator   !== 1) adjs.push("<div class='padj-l'><span class='pk'>Complexidade</span><span class='pv " + (orc.cxFator > 1 ? "r" : "g") + "'>x" + orc.cxFator.toFixed(2) + "</span></div>");
  if (orc.urgFator  !== 1) adjs.push("<div class='padj-l'><span class='pk'>Urgencia</span><span class='pv r'>x" + orc.urgFator.toFixed(2) + "</span></div>");
  if (orc.freqFator !== 1) adjs.push("<div class='padj-l'><span class='pk'>Frequencia</span><span class='pv g'>x" + orc.freqFator.toFixed(2) + "</span></div>");
  if (orc.descPct   >  0)  adjs.push("<div class='padj-l'><span class='pk'>Desconto manual</span><span class='pv g'>-" + orc.descPct + "%</span></div>");
  $("p-adj").innerHTML = adjs.join("");

  $("p-total").innerHTML = "<sup>R$</sup> " + fmt(orc.total);
  if (orc.obs) { $("p-obs").textContent = orc.obs; $("p-obs-w").style.display = "block"; }
  else          { $("p-obs-w").style.display = "none"; }
  $("p-val").textContent = orc.validade ? new Date(orc.validade + "T12:00:00").toLocaleDateString("pt-BR") : "(nao definida)";
  $("proposta-wrap").classList.add("on");
  setTimeout(() => $("proposta-wrap").scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  toast("Proposta gerada e salva!");
}

/* ─── ENVIO E EXPORTAÇÃO ─────────────────────────────────────────────────── */

function enviarWpp() {
  const d = recalc();
  if (!d.ls.length) { toast("Adicione pelo menos 1 servico", "#c0253d"); return; }
  const orc = montarOrcamento();
  const valStr = orc.validade ? new Date(orc.validade + "T12:00:00").toLocaleDateString("pt-BR") : "7 dias";
  const numeroCliente = (orc.contato || "").replace(/\D/g, "");
  if (!numeroCliente) { toast("Digite o WhatsApp do cliente", "#c0253d"); return; }
  let numeroFinal = numeroCliente;
  if (!numeroFinal.startsWith("55")) numeroFinal = "55" + numeroFinal;
  let m = "Ola! Segue a proposta de *Miguel Martins*:\n\n";
  if (orc.cliente) m += "*Cliente:* " + orc.cliente + "\n";
  m += "*Tipo:* " + orc.tipo + "\n";
  if (orc.contato) m += "*Contato:* " + orc.contato + "\n";
  m += "*Data:* " + orc.data + "\n\n";
  m += "SERVICOS\n";
  orc.itens.forEach(l => { m += "- " + l.desc + "\n  " + l.qtd + "x " + RS(l.unit) + " = *" + RS(l.sub) + "*\n"; });
  m += "\n*TOTAL: " + RS(orc.total) + "*\n";
  m += "*Validade:* " + valStr + "\n";
  if (orc.obs) m += "\n*Obs:* " + orc.obs + "\n";
  window.open("https://wa.me/" + numeroFinal + "?text=" + encodeURIComponent(m), "_blank");
}

async function capturarProposta() {
  if (!$("proposta-wrap").classList.contains("on")) {
    gerarProposta();
    await new Promise(r => setTimeout(r, 400));
  }
  return await html2canvas($("proposta-el"), { backgroundColor: "#111116", scale: 2, useCORS: true, logging: false });
}

async function gerarPNG() {
  const d = recalc();
  if (!d.ls.length) { toast("Adicione pelo menos 1 servico", "#c0253d"); return; }
  toast("Gerando imagem...", "#1a4a7a");
  try {
    const canvas = await capturarProposta();
    const link = document.createElement("a");
    link.download = "proposta-miguel-" + Date.now() + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast("Imagem baixada!", "#16a04b");
  } catch(e) { console.error(e); toast("Erro ao gerar imagem", "#c0253d"); }
}

async function gerarPDF() {
  const d = recalc();
  if (!d.ls.length) { toast("Adicione pelo menos 1 servico", "#c0253d"); return; }
  toast("Gerando PDF...", "#1a4a7a");
  try {
    const orc = montarOrcamento();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const W = 210, H = 297, ml = 16, mr = 16, cw = W - ml - mr;
    let y = 0;
    const h2rgb = h => {
      if (!h || !h.startsWith("#")) return [200,200,200];
      if (h.length === 4) h = "#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
      return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    };
    const F = h => doc.setFillColor(...h2rgb(h));
    const S = h => doc.setDrawColor(...h2rgb(h));
    const C = h => doc.setTextColor(...h2rgb(h));
    const bold = s => doc.setFont("helvetica", s === false ? "normal" : "bold");
    const size = n => doc.setFontSize(n);

    F("#0b0b0f"); doc.rect(0,0,W,H,"F");
    F("#16a04b"); doc.rect(0,0,4,H,"F");
    F("#0d1a0f"); doc.rect(4,0,W-4,52,"F");
    F("#1dd668"); doc.rect(4,52,W-4,0.8,"F");

    await new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = () => { try { doc.addImage(img,"PNG",ml,8,26,26); } catch(e){} resolve(); };
      img.onerror = () => resolve();
      img.src = "IMG/LOGO.png";
    });

    C("#1dd668"); bold(); size(22); doc.text("MIGUEL MARTINS", W-mr, 20, { align: "right" });
    C("#9999b0"); bold(false); size(7.5); doc.text("DESIGNER GRAFICO & VIDEOMAKER", W-mr, 27, { align: "right" });
    C("#5a5a72"); size(6.5); doc.text("Taipas do Tocantins  .  TO  .  Brasil", W-mr, 33, { align: "right" });

    F("#16a04b"); doc.roundedRect(ml,38,62,9,2,2,"F");
    C("#ffffff"); bold(); size(7.5); doc.text("PROPOSTA COMERCIAL", ml+31, 44, { align: "center" });
    C("#9999b0"); bold(false); size(7.5); doc.text("No " + orc.numero, W-mr, 43, { align: "right" });
    C("#5a5a72"); size(6.5); doc.text("Emitida em: " + orc.data, W-mr, 49, { align: "right" });

    y = 62;
    F("#111116"); S("#1dd668"); doc.setLineWidth(0.4);
    doc.roundedRect(ml,y,cw,26,3,3,"FD");
    F("#1dd668"); doc.roundedRect(ml,y,3,26,2,2,"F");
    C("#9999b0"); bold(false); size(6.5); doc.text("DESTINATARIO", ml+8, y+7);
    C("#eeeef5"); bold(); size(12); doc.text(orc.cliente, ml+8, y+15);
    C("#9999b0"); bold(false); size(7.5); doc.text(orc.tipo+(orc.contato?"   |   "+orc.contato:""), ml+8, y+22);
    y += 34;

    F("#1a1a24"); doc.roundedRect(ml,y,cw,9,2,2,"F");
    C("#1dd668"); bold(); size(7);
    doc.text("DESCRICAO DO SERVICO", ml+4, y+6);
    doc.text("QTD", ml+96, y+6, { align: "right" });
    doc.text("UNIT.", ml+128, y+6, { align: "right" });
    doc.text("SUBTOTAL", ml+cw-1, y+6, { align: "right" });
    y += 12;

    orc.itens.forEach((l,i) => {
      if (i%2===0) { F("#111116"); doc.rect(ml,y-1,cw,10,"F"); }
      F("#16a04b"); doc.rect(ml,y-1,2,10,"F");
      C("#eeeef5"); bold(false); size(8.5); doc.text(l.desc, ml+5, y+5);
      C("#9999b0"); size(8); doc.text(l.qtd+"x", ml+96, y+5, { align:"right" });
      doc.text(RS(l.unit), ml+128, y+5, { align:"right" });
      C("#1dd668"); bold(); size(8.5); doc.text(RS(l.sub), ml+cw-1, y+5, { align:"right" });
      y += 10;
    });

    S("#2a2a36"); doc.setLineWidth(0.3); doc.line(ml,y,W-mr,y);
    y += 6;
    C("#5a5a72"); bold(false); size(7.5);
    doc.text("Subtotal bruto:", ml+cw-50, y);
    doc.text(RS(orc.subtotal), ml+cw-1, y, { align:"right" });
    y += 5;

    const ajustes = [];
    if (orc.tipoFator!==1) ajustes.push({k:"Tipo de cliente", v:"x"+orc.tipoFator.toFixed(2), cor:"#ff4466"});
    if (orc.cxFator!==1)   ajustes.push({k:"Complexidade",    v:"x"+orc.cxFator.toFixed(2),   cor:orc.cxFator>1?"#ff4466":"#1dd668"});
    if (orc.urgFator!==1)  ajustes.push({k:"Urgencia",        v:"x"+orc.urgFator.toFixed(2),  cor:"#ff4466"});
    if (orc.freqFator!==1) ajustes.push({k:"Frequencia",      v:"x"+orc.freqFator.toFixed(2), cor:"#1dd668"});
    if (orc.descPct>0)     ajustes.push({k:"Desconto manual",  v:"-"+orc.descPct+"%",          cor:"#1dd668"});
    ajustes.forEach(aj => {
      C("#9999b0"); bold(false); size(7.5); doc.text(aj.k+":", ml+cw-50, y);
      C(aj.cor); bold(); size(7.5); doc.text(aj.v, ml+cw-1, y, { align:"right" });
      y += 5;
    });
    y += 4;

    F("#0a3d20"); doc.roundedRect(ml,y,cw,26,3,3,"F");
    S("#1dd668"); doc.setLineWidth(0.5); doc.roundedRect(ml,y,cw,26,3,3,"S");
    C("#aaffcc"); bold(false); size(6.5); doc.text("VALOR TOTAL DA PROPOSTA", W/2, y+8, {align:"center"});
    C("#ffffff"); bold(); size(20); doc.text("R$ "+fmt(orc.total), W/2, y+20, {align:"center"});
    y += 34;

    if (orc.obs) {
      const obsLines = doc.splitTextToSize(orc.obs, cw-12);
      const obsH = 14 + obsLines.length*5;
      F("#0b1a0f"); S("#16a04b"); doc.setLineWidth(0.3);
      doc.roundedRect(ml,y,cw,obsH,2,2,"FD");
      F("#16a04b"); doc.roundedRect(ml,y,3,obsH,2,2,"F");
      C("#1dd668"); bold(); size(7); doc.text("OBSERVACOES", ml+8, y+7);
      C("#9999b0"); bold(false); size(7.5); doc.text(obsLines, ml+8, y+13);
      y += obsH+8;
    }

    const valStr2 = orc.validade ? new Date(orc.validade+"T12:00:00").toLocaleDateString("pt-BR") : "nao definida";
    const conds = [
      "Validade desta proposta: " + valStr2,
      "Pagamento: 50% na aprovacao + 50% na entrega.",
      "Revisoes incluidas conforme briefing aprovado.",
      "Alteracoes fora do escopo serao orcadas separadamente.",
    ];
    F("#111116"); S("#2a2a36"); doc.setLineWidth(0.3);
    doc.roundedRect(ml,y,cw,6+conds.length*5+4,2,2,"FD");
    C("#eeeef5"); bold(); size(7); doc.text("CONDICOES GERAIS", ml+4, y+6);
    C("#9999b0"); bold(false); size(7);
    conds.forEach((c,i) => { doc.text("- "+c, ml+4, y+12+i*5); });
    y += 6+conds.length*5+10;

    const asX = W-mr-58;
    S("#343444"); doc.setLineWidth(0.5); doc.line(asX,y,W-mr,y);
    C("#eeeef5"); bold(); size(8); doc.text("Miguel Martins", asX+29, y+6, {align:"center"});
    C("#9999b0"); bold(false); size(6.5);
    doc.text("Designer Grafico & Videomaker", asX+29, y+11, {align:"center"});
    doc.text("Taipas do Tocantins - TO", asX+29, y+16, {align:"center"});

    F("#0d1a0f"); doc.rect(4,H-12,W-4,12,"F");
    F("#1dd668"); doc.rect(4,H-12,W-4,0.6,"F");
    C("#9999b0"); bold(false); size(6.5);
    doc.text("Miguel Martins  .  Designer Grafico & Videomaker  .  Taipas do Tocantins - TO", W/2, H-6, {align:"center"});
    C("#5a5a72"); size(6);
    doc.text("Documento gerado em "+orc.data+"  .  "+orc.numero, W/2, H-2, {align:"center"});

    const nomeArq = orc.cliente.replace(/\s+/g,"-").toLowerCase().replace(/[^a-z0-9\-]/g,"");
    doc.save("proposta-"+nomeArq+".pdf");
    toast("PDF gerado!", "#16a04b");
  } catch(e) { console.error(e); toast("Erro ao gerar PDF", "#c0253d"); }
}

/* ─── LIMPAR ─────────────────────────────────────────────────────────────── */

function limpar() {
  $("cli-nome").value    = "";
  $("cli-contato").value = "";
  $("obs").value         = "";
  $("desc").value        = "";
  $("cli-tipo").value    = "1.00";
  const d = new Date();
  d.setDate(d.getDate() + 7);
  $("cli-validade").value = d.toISOString().split("T")[0];
  document.querySelector('input[name="freq"][value="1.00"]').checked = true;
  document.querySelector('input[name="urg"][value="1.00"]').checked  = true;
  document.querySelector('input[name="cx"][value="1.00"]').checked   = true;
  $("tbody").innerHTML = "";
  lid = 0;
  $("proposta-wrap").classList.remove("on");
  $("sugestao-pacote") && ($("sugestao-pacote").style.display = "none");
  addRow("", 1, 200);
  toast("Formulario limpo!", "#5a5a72");
}

/* ─── EXPORTS ─────────────────────────────────────────────────────────────── */

window.addRow                = addRow;
window.delRow                = delRow;
window.recalc                = recalc;
window.gerarProposta         = gerarProposta;
window.enviarWpp             = enviarWpp;
window.gerarPDF              = gerarPDF;
window.gerarPNG              = gerarPNG;
window.limpar                = limpar;
window.adicionarServico      = adicionarServico;
window.novoServico           = novoServico;
window.deletarServico        = deletarServico;
window.salvarAdminServicos   = salvarAdminServicos;
window.adicionarPacote       = adicionarPacote;
window.novoPacote            = novoPacote;
window.deletarPacote         = deletarPacote;
window.salvarAdminPacotes    = salvarAdminPacotes;
window.verificarSugestaoPacote = verificarSugestaoPacote;
window.duplicarOrcamento     = duplicarOrcamento;
window.editarOrcamento       = editarOrcamento;

addRow("", 1, 200);