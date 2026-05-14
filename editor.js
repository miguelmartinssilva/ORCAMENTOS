/* ═══════════════════════════════════════════════════════════════
   EDITOR.JS — Editor visual de proposta
   Carrega dados de sessionStorage "orc_editor_rascunho_v1",
   permite edição inline e gera PDF final.
   ═══════════════════════════════════════════════════════════════ */

const SESSION_KEY_EDITOR = "orc_editor_rascunho_v1";

/* ─── ESTADO INTERNO ──────────────────────────────────────────── */
let _estado = null;
let _logoBase64     = "";
let _assinaturaBase64 = "";

/* ─── HELPERS ─────────────────────────────────────────────────── */
const $e  = id => document.getElementById(id);
const fmtE = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const RSe  = v => "R$ " + fmtE(v);

/* ─── CARREGAR EDITOR ─────────────────────────────────────────── */
function carregarEditor() {
  const raw = sessionStorage.getItem(SESSION_KEY_EDITOR);

  if (!raw) {
    $e("editor-corpo").style.display = "none";
    $e("editor-erro").style.display  = "block";
    return;
  }

  try {
    _estado = JSON.parse(raw);
  } catch {
    $e("editor-corpo").style.display = "none";
    $e("editor-erro").style.display  = "block";
    return;
  }

  /* ── Dados do prestador (perfil ativo) ── */
  const pf = (typeof getPerfilAtivo === "function") ? getPerfilAtivo() : null;
  if (pf) {
    const nomePF = pf.tipo === "pj" ? (pf.nomeEmpresa || pf.nome) : pf.nome;
    $e("ed-nome-pf").textContent = nomePF || "—";

    const docPF = pf.tipo === "pj"
      ? (pf.cnpj   ? "CNPJ: " + pf.cnpj   : "")
      : (pf.cpf    ? "CPF: "  + pf.cpf    : "");
    $e("ed-doc-pf").textContent = docPF;

    $e("ed-email-pf").textContent   = (pf.mostrarEmail    && pf.email)    ? pf.email    : "";
    $e("ed-tel-pf").textContent     = (pf.mostrarTelefone && pf.telefone) ? pf.telefone : "";
    $e("ed-end-pf").textContent     = (pf.mostrarEndereco && pf.endereco) ? pf.endereco : "";

    /* Logo do perfil */
    if (pf.logo) {
      _logoBase64 = pf.logo;
      $e("ed-logo").src = pf.logo;
      $e("ed-logo").style.display = "block";
    }

    /* Assinatura do perfil */
    if (pf.assinatura) {
      _assinaturaBase64 = pf.assinatura;
      $e("ed-assinatura-img").src = pf.assinatura;
      $e("ed-assinatura-img").style.display = "block";
    }

    /* Nome/cargo na assinatura */
    $e("ed-assin-nome").textContent  = nomePF || "";
    $e("ed-assin-cargo").textContent = pf.tipo === "pj" ? "Responsável" : "Designer / Videomaker";

    /* Pix */
    if (pf.mostrarPix && pf.pixChave) {
      $e("ed-pix-texto").textContent = "PIX (" + pf.pixTipo + "): " + pf.pixChave;
      $e("ed-pix-wrap").style.display = "block";
    } else {
      $e("ed-pix-wrap").style.display = "none";
    }
  } else {
    $e("ed-nome-pf").textContent    = "Miguel Martins";
    $e("ed-pix-wrap").style.display = "none";
  }

  /* ── Dados da proposta ── */
  $e("ed-numero").textContent  = _estado.numero  || "";
  $e("ed-data").textContent    = _estado.data     || new Date().toLocaleDateString("pt-BR");
  $e("ed-cliente").textContent = _estado.cliente  || "";
  $e("ed-tipo").textContent    = _estado.tipo     || "";
  $e("ed-contato").textContent = _estado.contato  || "";
  $e("ed-obs").value           = _estado.obs      || "";

  /* Validade formatada */
  if (_estado.validade) {
    try {
      $e("ed-validade").value = new Date(_estado.validade + "T12:00:00").toLocaleDateString("pt-BR");
    } catch { $e("ed-validade").value = _estado.validade; }
  }

  /* Condições */
  if (_estado.condPagamento)  $e("ed-cond-pagamento").value   = _estado.condPagamento;
  if (_estado.condRevisoes)   $e("ed-cond-revisoes").value    = _estado.condRevisoes;
  if (_estado.condAlteracoes) $e("ed-cond-alteracoes").value  = _estado.condAlteracoes;

  /* Cliente na linha de assinatura */
  $e("ed-cli-nome-label").value = _estado.cliente || "";

  /* ── Itens ── */
  renderItensEditor();
  recalcEditor();
}

/* ─── RENDERIZAR ITENS ────────────────────────────────────────── */
function renderItensEditor() {
  const tbody = $e("ed-itens-tbody");
  if (!tbody || !_estado) return;
  tbody.innerHTML = (_estado.itens || []).map((item, idx) => `
    <tr class="ed-item-row" data-idx="${idx}">
      <td class="ed-td-desc">
        <div class="ed-cel" contenteditable="true"
             oninput="atualizarItemEditor(${idx},'desc',this.textContent)"
        >${esc(item.desc)}</div>
      </td>
      <td class="ed-td-qtd">
        <input class="ed-inp-num" type="number" min="1" value="${item.qtd}"
               oninput="atualizarItemEditor(${idx},'qtd',this.value)">
      </td>
      <td class="ed-td-unit">
        <input class="ed-inp-num" type="number" min="0" step="0.01" value="${item.unit}"
               oninput="atualizarItemEditor(${idx},'unit',this.value)">
      </td>
      <td class="ed-td-sub ed-val">${RSe(item.sub || item.qtd * item.unit)}</td>
      <td class="ed-td-del">
        <button class="ed-btn-del" onclick="removerItemEditor(${idx})">×</button>
      </td>
    </tr>
  `).join("") + `
    <tr>
      <td colspan="5">
        <button class="ed-btn-add-item" onclick="adicionarItemEditor()">+ Nova linha de serviço</button>
      </td>
    </tr>
  `;
}

/* ─── EDIÇÃO DE ITEM ──────────────────────────────────────────── */
function atualizarItemEditor(idx, campo, valor) {
  if (!_estado || !_estado.itens[idx]) return;
  if (campo === "desc") {
    _estado.itens[idx].desc = valor.trim();
  } else {
    _estado.itens[idx][campo] = parseFloat(valor) || 0;
  }
  _estado.itens[idx].sub = (_estado.itens[idx].qtd || 0) * (_estado.itens[idx].unit || 0);

  /* Atualizar subtotal da linha sem re-renderizar */
  const rows = $e("ed-itens-tbody").querySelectorAll(".ed-item-row");
  if (rows[idx]) {
    const subCell = rows[idx].querySelector(".ed-td-sub");
    if (subCell) subCell.textContent = RSe(_estado.itens[idx].sub);
  }
  recalcEditor();
}

function adicionarItemEditor() {
  if (!_estado) return;
  _estado.itens.push({ desc: "Novo serviço", qtd: 1, unit: 0, sub: 0 });
  renderItensEditor();
  recalcEditor();
}

function removerItemEditor(idx) {
  if (!_estado) return;
  _estado.itens.splice(idx, 1);
  renderItensEditor();
  recalcEditor();
}

/* ─── RECALCULAR TOTAIS ───────────────────────────────────────── */
function recalcEditor() {
  if (!_estado) return;
  const sub = _estado.itens.reduce((s, i) => s + (i.sub || i.qtd * i.unit || 0), 0);

  /* Aplicar fatores */
  const tf  = _estado.tipoFator || 1;
  const cxf = _estado.cxFator   || 1;
  const uf  = _estado.urgFator  || 1;
  const ff  = _estado.freqFator || 1;
  const dp  = _estado.descPct   || 0;
  const total = Math.round(sub * tf * cxf * uf * ff * (1 - dp / 100) * 100) / 100;

  _estado.subtotal = sub;
  _estado.total    = total;

  $e("ed-r-sub").textContent  = RSe(sub);
  $e("ed-r-total").textContent = fmtE(total);

  /* Ajustes */
  const adjs = [];
  if (tf  !== 1) adjs.push(`<div class="ed-adj"><span>Tipo cliente</span><span class="ed-adj-v ed-r">x${tf.toFixed(2)}</span></div>`);
  if (cxf !== 1) adjs.push(`<div class="ed-adj"><span>Complexidade</span><span class="ed-adj-v ${cxf > 1 ? "ed-r" : "ed-g"}">x${cxf.toFixed(2)}</span></div>`);
  if (uf  !== 1) adjs.push(`<div class="ed-adj"><span>Urgência</span><span class="ed-adj-v ed-r">x${uf.toFixed(2)}</span></div>`);
  if (ff  !== 1) adjs.push(`<div class="ed-adj"><span>Frequência</span><span class="ed-adj-v ed-g">x${ff.toFixed(2)}</span></div>`);
  if (dp  >  0)  adjs.push(`<div class="ed-adj"><span>Desconto</span><span class="ed-adj-v ed-g">-${dp}%</span></div>`);
  $e("ed-r-ajustes").innerHTML = adjs.join("");
}

/* ─── COLETAR ESTADO DO DOM (para templates.js) ───────────────── */
function coletarEstadoDom() {
  if (!_estado) return;
  _estado.obs             = $e("ed-obs").value.trim();
  _estado.condPagamento   = $e("ed-cond-pagamento").value.trim();
  _estado.condRevisoes    = $e("ed-cond-revisoes").value.trim();
  _estado.condAlteracoes  = $e("ed-cond-alteracoes").value.trim();
  _estado.cliente         = $e("ed-cliente").textContent.trim();
  _estado.contato         = $e("ed-contato").textContent.trim();
  _estado.numero          = $e("ed-numero").textContent.trim();
}

function getEstado() {
  coletarEstadoDom();
  return _estado;
}

/* ─── SALVAR RASCUNHO ─────────────────────────────────────────── */
function salvarRascunho() {
  if (!_estado) return;
  coletarEstadoDom();

  /* Atualizar no histórico */
  try {
    const hist = JSON.parse(localStorage.getItem(HIST_KEY)) || [];
    const idx  = hist.findIndex(h => h.id === _estado.id);
    if (idx >= 0) {
      hist[idx] = { ...hist[idx], ..._estado };
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
    }
  } catch { /* silencioso */ }

  /* Manter na sessão */
  sessionStorage.setItem(SESSION_KEY_EDITOR, JSON.stringify(_estado));
  toast("Rascunho salvo!", "#16a04b");
}

/* ─── VOLTAR ──────────────────────────────────────────────────── */
function voltarOrcamento() {
  window.location.href = "historico.html";
}

/* ─── LOGO ────────────────────────────────────────────────────── */
function uploadLogoInline() {
  const input = document.createElement("input");
  input.type  = "file";
  input.accept = "image/*";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      _logoBase64 = ev.target.result;
      $e("ed-logo").src = _logoBase64;
      $e("ed-logo").style.display = "block";
      toast("Logo atualizado!", "#16a04b");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

/* ─── ASSINATURA (upload) ─────────────────────────────────────── */
function uploadAssinaturaInline() {
  const input = document.createElement("input");
  input.type  = "file";
  input.accept = "image/*";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      _assinaturaBase64 = ev.target.result;
      $e("ed-assinatura-img").src = _assinaturaBase64;
      $e("ed-assinatura-img").style.display = "block";
      toast("Assinatura carregada!", "#16a04b");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

/* ─── ASSINATURA (canvas) ─────────────────────────────────────── */
let _canvasDrawing = false;
let _canvasCtx     = null;

function abrirCanvasEditor() {
  const modal  = $e("modal-assin-editor");
  const canvas = $e("canvas-assin-editor");
  modal.style.display = "flex";
  _canvasCtx = canvas.getContext("2d");
  _canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  _canvasCtx.strokeStyle = "#eeeef5";
  _canvasCtx.lineWidth   = 2;
  _canvasCtx.lineCap     = "round";
  _canvasCtx.lineJoin    = "round";

  const getPos = ev => {
    const rect = canvas.getBoundingClientRect();
    const src  = ev.touches ? ev.touches[0] : ev;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  canvas.onmousedown  = canvas.ontouchstart = ev => {
    ev.preventDefault();
    _canvasDrawing = true;
    const p = getPos(ev);
    _canvasCtx.beginPath();
    _canvasCtx.moveTo(p.x, p.y);
  };
  canvas.onmousemove  = canvas.ontouchmove = ev => {
    ev.preventDefault();
    if (!_canvasDrawing) return;
    const p = getPos(ev);
    _canvasCtx.lineTo(p.x, p.y);
    _canvasCtx.stroke();
  };
  canvas.onmouseup    = canvas.ontouchend  = () => { _canvasDrawing = false; };
}

function fecharCanvasEditor() {
  $e("modal-assin-editor").style.display = "none";
}

function limparCanvasEditor() {
  const canvas = $e("canvas-assin-editor");
  if (_canvasCtx) _canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

function salvarCanvasEditor() {
  const canvas = $e("canvas-assin-editor");
  _assinaturaBase64 = canvas.toDataURL("image/png");
  $e("ed-assinatura-img").src = _assinaturaBase64;
  $e("ed-assinatura-img").style.display = "block";
  fecharCanvasEditor();
  toast("Assinatura salva!", "#16a04b");
}

/* ─── GERAR PDF ───────────────────────────────────────────────── */
async function gerarPDFEditor() {
  if (!_estado) { toast("Nenhuma proposta carregada.", "#c0253d"); return; }
  coletarEstadoDom();
  toast("Gerando PDF...", "#1a4a7a");

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const W = 210, H = 297, ml = 16, mr = 16, cw = W - ml - mr;
    let y = 0;

    const h2rgb = h => {
      if (!h || !h.startsWith("#")) return [200, 200, 200];
      if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    };
    const F    = h => doc.setFillColor(...h2rgb(h));
    const S    = h => doc.setDrawColor(...h2rgb(h));
    const C    = h => doc.setTextColor(...h2rgb(h));
    const bold = s => doc.setFont("helvetica", s === false ? "normal" : "bold");
    const size = n => doc.setFontSize(n);

    /* Fundo */
    F("#0b0b0f"); doc.rect(0, 0, W, H, "F");
    F("#16a04b"); doc.rect(0, 0, 4, H, "F");
    F("#0d1a0f"); doc.rect(4, 0, W - 4, 52, "F");
    F("#1dd668"); doc.rect(4, 52, W - 4, 0.8, "F");

    /* Logo */
    if (_logoBase64) {
      try { doc.addImage(_logoBase64, "PNG", ml, 8, 26, 26); } catch (e) {}
    }

    /* Nome do prestador */
    const pf      = (typeof getPerfilAtivo === "function") ? getPerfilAtivo() : null;
    const nomePDF = $e("ed-nome-pf").textContent || (pf ? (pf.tipo === "pj" ? (pf.nomeEmpresa || pf.nome) : pf.nome) : "Miguel Martins");
    const endPDF  = (pf && pf.mostrarEndereco && pf.endereco) ? pf.endereco : "";
    const pixLinha = (pf && pf.mostrarPix && pf.pixChave) ? ("PIX (" + pf.pixTipo + "): " + pf.pixChave) : "";

    C("#1dd668"); bold(); size(22); doc.text(nomePDF.toUpperCase(), W - mr, 20, { align: "right" });
    C("#9999b0"); bold(false); size(7.5); doc.text("DESIGNER GRAFICO & VIDEOMAKER", W - mr, 27, { align: "right" });
    if (endPDF) { C("#5a5a72"); size(6.5); doc.text(endPDF, W - mr, 33, { align: "right" }); }

    /* Badge proposta */
    const tituloDoc = $e("ed-titulo").textContent || "PROPOSTA COMERCIAL";
    F("#16a04b"); doc.roundedRect(ml, 38, 70, 9, 2, 2, "F");
    C("#ffffff"); bold(); size(7.5); doc.text(tituloDoc.toUpperCase(), ml + 35, 44, { align: "center" });
    C("#9999b0"); bold(false); size(7.5); doc.text("Nº " + ($e("ed-numero").textContent || _estado.numero), W - mr, 43, { align: "right" });
    C("#5a5a72"); size(6.5); doc.text("Emitida em: " + ($e("ed-data").textContent || _estado.data), W - mr, 49, { align: "right" });

    /* Cliente */
    y = 62;
    F("#111116"); S("#1dd668"); doc.setLineWidth(0.4);
    doc.roundedRect(ml, y, cw, 26, 3, 3, "FD");
    F("#1dd668"); doc.roundedRect(ml, y, 3, 26, 2, 2, "F");
    C("#9999b0"); bold(false); size(6.5); doc.text("DESTINATÁRIO", ml + 8, y + 7);
    const cliNome = $e("ed-cliente").textContent || _estado.cliente || "(cliente não informado)";
    const cliSub  = ($e("ed-tipo").textContent || _estado.tipo || "") + ($e("ed-contato").textContent ? "   |   " + $e("ed-contato").textContent : "");
    C("#eeeef5"); bold(); size(12); doc.text(cliNome, ml + 8, y + 15);
    C("#9999b0"); bold(false); size(7.5); doc.text(cliSub, ml + 8, y + 22);
    y += 34;

    /* Tabela de itens */
    F("#1a1a24"); doc.roundedRect(ml, y, cw, 9, 2, 2, "F");
    C("#1dd668"); bold(); size(7);
    doc.text("DESCRIÇÃO DO SERVIÇO", ml + 4, y + 6);
    doc.text("QTD", ml + 96, y + 6, { align: "right" });
    doc.text("UNIT.", ml + 128, y + 6, { align: "right" });
    doc.text("SUBTOTAL", ml + cw - 1, y + 6, { align: "right" });
    y += 12;

    _estado.itens.forEach((l, i) => {
      if (i % 2 === 0) { F("#111116"); doc.rect(ml, y - 1, cw, 10, "F"); }
      F("#16a04b"); doc.rect(ml, y - 1, 2, 10, "F");
      const sub = l.sub || l.qtd * l.unit;
      C("#eeeef5"); bold(false); size(8.5); doc.text(l.desc || "", ml + 5, y + 5);
      C("#9999b0"); size(8); doc.text(l.qtd + "x", ml + 96, y + 5, { align: "right" });
      doc.text(RSe(l.unit), ml + 128, y + 5, { align: "right" });
      C("#1dd668"); bold(); size(8.5); doc.text(RSe(sub), ml + cw - 1, y + 5, { align: "right" });
      y += 10;
    });

    /* Resumo */
    S("#2a2a36"); doc.setLineWidth(0.3); doc.line(ml, y, W - mr, y);
    y += 6;
    C("#5a5a72"); bold(false); size(7.5);
    doc.text("Subtotal bruto:", ml + cw - 50, y);
    doc.text(RSe(_estado.subtotal || 0), ml + cw - 1, y, { align: "right" });
    y += 5;

    const ajustes = [];
    if ((_estado.tipoFator || 1) !== 1) ajustes.push({ k: "Tipo de cliente", v: "x" + _estado.tipoFator.toFixed(2), cor: "#ff4466" });
    if ((_estado.cxFator   || 1) !== 1) ajustes.push({ k: "Complexidade",    v: "x" + _estado.cxFator.toFixed(2),   cor: _estado.cxFator > 1 ? "#ff4466" : "#1dd668" });
    if ((_estado.urgFator  || 1) !== 1) ajustes.push({ k: "Urgência",        v: "x" + _estado.urgFator.toFixed(2),  cor: "#ff4466" });
    if ((_estado.freqFator || 1) !== 1) ajustes.push({ k: "Frequência",      v: "x" + _estado.freqFator.toFixed(2), cor: "#1dd668" });
    if ((_estado.descPct   || 0) >   0) ajustes.push({ k: "Desconto manual", v: "-" + _estado.descPct + "%",         cor: "#1dd668" });
    ajustes.forEach(aj => {
      C("#9999b0"); bold(false); size(7.5); doc.text(aj.k + ":", ml + cw - 50, y);
      C(aj.cor); bold(); size(7.5); doc.text(aj.v, ml + cw - 1, y, { align: "right" });
      y += 5;
    });
    y += 4;

    /* Total */
    F("#0a3d20"); doc.roundedRect(ml, y, cw, 26, 3, 3, "F");
    S("#1dd668"); doc.setLineWidth(0.5); doc.roundedRect(ml, y, cw, 26, 3, 3, "S");
    C("#aaffcc"); bold(false); size(6.5); doc.text("VALOR TOTAL DA PROPOSTA", W / 2, y + 8, { align: "center" });
    C("#ffffff"); bold(); size(20); doc.text("R$ " + fmtE(_estado.total || 0), W / 2, y + 20, { align: "center" });
    y += 34;

    /* Pix */
    if (pf && pf.mostrarPix && pf.pixChave) {
      F("#0b2318"); S("#16a04b"); doc.setLineWidth(0.3);
      doc.roundedRect(ml, y, cw, 14, 2, 2, "FD");
      C("#1dd668"); bold(); size(6.5); doc.text("PAGAMENTO", ml + 4, y + 6);
      C("#9999b0"); bold(false); size(7.5); doc.text(pixLinha, ml + 4, y + 11);
      y += 22;
    }

    /* Observações */
    const obsTexto = $e("ed-obs").value.trim();
    if (obsTexto) {
      const obsLines = doc.splitTextToSize(obsTexto, cw - 12);
      const obsH = 14 + obsLines.length * 5;
      F("#0b1a0f"); S("#16a04b"); doc.setLineWidth(0.3);
      doc.roundedRect(ml, y, cw, obsH, 2, 2, "FD");
      F("#16a04b"); doc.roundedRect(ml, y, 3, obsH, 2, 2, "F");
      C("#1dd668"); bold(); size(7); doc.text("OBSERVAÇÕES", ml + 8, y + 7);
      C("#9999b0"); bold(false); size(7.5); doc.text(obsLines, ml + 8, y + 13);
      y += obsH + 8;
    }

    /* Condições */
    const conds = [
      "Validade: " + ($e("ed-validade").value || "a combinar"),
      $e("ed-cond-pagamento").value   || "50% na aprovação + 50% na entrega.",
      $e("ed-cond-revisoes").value    || "Revisões incluídas conforme briefing aprovado.",
      $e("ed-cond-alteracoes").value  || "Alterações fora do escopo serão orçadas separadamente.",
    ];
    F("#111116"); S("#2a2a36"); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, 6 + conds.length * 5 + 4, 2, 2, "FD");
    C("#eeeef5"); bold(); size(7); doc.text("CONDIÇÕES GERAIS", ml + 4, y + 6);
    C("#9999b0"); bold(false); size(7);
    conds.forEach((c, i) => { doc.text("- " + c, ml + 4, y + 12 + i * 5); });
    y += 6 + conds.length * 5 + 10;

    /* Assinaturas */
    const asX = W - mr - 58;
    S("#343444"); doc.setLineWidth(0.5); doc.line(asX, y, W - mr, y);
    if (_assinaturaBase64) {
      try { doc.addImage(_assinaturaBase64, "PNG", asX, y - 14, 58, 12); } catch (e) {}
    }
    const assinNome  = $e("ed-assin-nome").textContent  || nomePDF;
    const assinCargo = $e("ed-assin-cargo").textContent || "Designer / Videomaker";
    C("#eeeef5"); bold(); size(8); doc.text(assinNome, asX + 29, y + 6, { align: "center" });
    C("#9999b0"); bold(false); size(6.5); doc.text(assinCargo, asX + 29, y + 11, { align: "center" });
    if (endPDF) doc.text(endPDF, asX + 29, y + 16, { align: "center" });

    /* Rodapé */
    F("#0d1a0f"); doc.rect(4, H - 12, W - 4, 12, "F");
    F("#1dd668"); doc.rect(4, H - 12, W - 4, 0.6, "F");
    C("#9999b0"); bold(false); size(6.5);
    const rodape = nomePDF + "  .  Designer Gráfico & Videomaker" + (endPDF ? "  .  " + endPDF : "") + (pixLinha ? "  .  " + pixLinha : "");
    doc.text(rodape, W / 2, H - 6, { align: "center" });
    C("#5a5a72"); size(6);
    doc.text("Documento gerado em " + (_estado.data || "") + "  .  " + (_estado.numero || ""), W / 2, H - 2, { align: "center" });

    /* Salvar */
    const nomeArq = ($e("ed-cliente").textContent || "proposta").replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-]/g, "");
    doc.save("proposta-" + nomeArq + ".pdf");
    toast("PDF gerado!", "#16a04b");

  } catch (e) {
    console.error("[editor] gerarPDFEditor:", e);
    toast("Erro ao gerar PDF", "#c0253d");
  }
}

/* ─── EXPORTS ─────────────────────────────────────────────────── */
window.carregarEditor       = carregarEditor;
window.voltarOrcamento      = voltarOrcamento;
window.salvarRascunho       = salvarRascunho;
window.gerarPDFEditor       = gerarPDFEditor;
window.adicionarItemEditor  = adicionarItemEditor;
window.removerItemEditor    = removerItemEditor;
window.atualizarItemEditor  = atualizarItemEditor;
window.uploadLogoInline     = uploadLogoInline;
window.uploadAssinaturaInline = uploadAssinaturaInline;
window.abrirCanvasEditor    = abrirCanvasEditor;
window.fecharCanvasEditor   = fecharCanvasEditor;
window.limparCanvasEditor   = limparCanvasEditor;
window.salvarCanvasEditor   = salvarCanvasEditor;
window.coletarEstadoDom     = coletarEstadoDom;
window.getEstado            = getEstado;
