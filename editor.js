/* ═══════════════════════════════════════════════════════════════
   EDITOR.JS — Editor de Proposta (Fase 2)
   Tela editável antes de gerar o PDF
   ═══════════════════════════════════════════════════════════════ */

const EDITOR_KEY = "orc_editor_rascunho_v1";

/* ─── ESTADO DO EDITOR ──────────────────────────────────────── */

let _estado = null; // proposta carregada no editor

function getEstado() { return _estado; }

/* ─── CARREGAR PROPOSTA NO EDITOR ───────────────────────────── */

function carregarEditor() {
  const raw = sessionStorage.getItem(EDITOR_KEY);
  if (!raw) {
    document.getElementById("editor-erro").style.display = "block";
    document.getElementById("editor-corpo").style.display = "none";
    return;
  }
  _estado = JSON.parse(raw);
  const pf = (typeof getPerfilAtivo === "function") ? getPerfilAtivo() : null;
  _estado._perfil = pf || {};
  renderEditor();
}

function renderEditor() {
  const e = _estado;
  const pf = e._perfil || {};
  const nomePf = pf.tipo === "pj" ? (pf.nomeEmpresa || pf.nome || "—") : (pf.nome || "—");

  /* ── cabeçalho do preview ── */
  _setTxt("ed-nome-pf",    nomePf);
  _setTxt("ed-doc-pf",     _docLabel(pf));
  _setTxt("ed-email-pf",   pf.mostrarEmail && pf.email ? pf.email : "");
  _setTxt("ed-tel-pf",     pf.mostrarTelefone && pf.telefone ? pf.telefone : "");
  _setTxt("ed-end-pf",     pf.mostrarEndereco && pf.endereco ? pf.endereco : "");

  /* logo */
  const logoEl = document.getElementById("ed-logo");
  if (logoEl) {
    if (pf.logo) { logoEl.src = pf.logo; logoEl.style.display = "block"; }
    else         { logoEl.style.display = "none"; }
  }

  /* assinatura */
  const assinEl = document.getElementById("ed-assinatura-img");
  if (assinEl) {
    if (e.assinatura || pf.assinatura) {
      assinEl.src = e.assinatura || pf.assinatura;
      assinEl.style.display = "block";
    } else {
      assinEl.style.display = "none";
    }
  }

  /* ── dados da proposta ── */
  _setEdit("ed-numero",   e.numero);
  _setEdit("ed-data",     e.data);
  _setEdit("ed-titulo",   e.titulo   || "PROPOSTA COMERCIAL");
  _setEdit("ed-cliente",  e.cliente);
  _setEdit("ed-tipo",     e.tipo);
  _setEdit("ed-contato",  e.contato  || "");
  _setEdit("ed-validade", e.validadeFormatada || e.validade || "");
  _setEdit("ed-obs",      e.obs      || "");

  /* ── condições ── */
  _setEdit("ed-cond-pagamento",  e.condPagamento  || "50% na aprovação + 50% na entrega");
  _setEdit("ed-cond-revisoes",   e.condRevisoes   || "Revisões incluídas conforme briefing aprovado");
  _setEdit("ed-cond-alteracoes", e.condAlteracoes || "Alterações fora do escopo serão orçadas separadamente");

  /* ── PIX ── */
  const pixWrap = document.getElementById("ed-pix-wrap");
  if (pixWrap) {
    const pixStr = pf.mostrarPix && pf.pixChave
      ? `PIX (${pf.pixTipo}): ${pf.pixChave}`
      : (e.pixTexto || "");
    _setEdit("ed-pix-texto", pixStr);
    pixWrap.style.display = pixStr ? "block" : "none";
  }

  /* ── itens ── */
  renderItensEditor();

  /* ── resumo financeiro ── */
  renderResumoEditor();

  /* ── nome na assinatura ── */
  _setEdit("ed-assin-nome",  e.assinNome  || nomePf);
  _setEdit("ed-assin-cargo", e.assinCargo || "Designer Gráfico & Videomaker");

  /* ── campo assinatura cliente ── */
  _setEdit("ed-cli-assin-label", e.cliAssinLabel || "Assinatura do cliente");
  _setEdit("ed-cli-nome-label",  e.cliNomeLabel  || e.cliente || "Cliente");
}

function _docLabel(pf) {
  if (!pf) return "";
  if (pf.tipo === "pj" && pf.mostrarCpfCnpj && pf.cnpj) return "CNPJ: " + pf.cnpj;
  if (pf.tipo === "pf" && pf.mostrarCpfCnpj && pf.cpf)  return "CPF: "  + pf.cpf;
  return "";
}

/* ─── ITENS EDITÁVEIS ───────────────────────────────────────── */

function renderItensEditor() {
  const tbody = document.getElementById("ed-itens-tbody");
  if (!tbody) return;
  const itens = _estado.itens || [];
  tbody.innerHTML = itens.map((item, i) => `
    <tr data-idx="${i}" class="ed-item-row">
      <td class="ed-td-desc">
        <div contenteditable="true" class="ed-cel" data-field="desc" data-idx="${i}"
             onblur="atualizarItem(${i},'desc',this.textContent)">${_esc(item.desc)}</div>
      </td>
      <td class="ed-td-qtd">
        <input type="number" class="ed-inp-num" value="${item.qtd}" min="1" step="1"
               onchange="atualizarItemNum(${i},'qtd',this.value)">
      </td>
      <td class="ed-td-unit">
        <input type="number" class="ed-inp-num" value="${item.unit}" min="0" step="0.01"
               onchange="atualizarItemNum(${i},'unit',this.value)">
      </td>
      <td class="ed-td-sub ed-val">${_RS(item.sub)}</td>
      <td class="ed-td-del">
        <button class="ed-btn-del" onclick="deletarItem(${i})" title="Remover">×</button>
      </td>
    </tr>
  `).join("") + `
    <tr>
      <td colspan="5">
        <button class="ed-btn-add-item" onclick="adicionarItemEditor()">+ Adicionar linha</button>
      </td>
    </tr>`;
}

function atualizarItem(idx, field, val) {
  if (!_estado.itens[idx]) return;
  _estado.itens[idx][field] = val.trim();
  recalcEstado();
  renderResumoEditor();
}

function atualizarItemNum(idx, field, val) {
  if (!_estado.itens[idx]) return;
  _estado.itens[idx][field] = parseFloat(val) || 0;
  _estado.itens[idx].sub = _estado.itens[idx].qtd * _estado.itens[idx].unit;
  recalcEstado();
  renderItensEditor();
  renderResumoEditor();
}

function deletarItem(idx) {
  _estado.itens.splice(idx, 1);
  recalcEstado();
  renderItensEditor();
  renderResumoEditor();
}

function adicionarItemEditor() {
  _estado.itens.push({ desc: "Novo serviço", qtd: 1, unit: 0, sub: 0 });
  renderItensEditor();
  renderResumoEditor();
  // foca o último campo desc
  setTimeout(() => {
    const rows = document.querySelectorAll(".ed-item-row");
    const last = rows[rows.length - 1];
    if (last) last.querySelector(".ed-cel")?.focus();
  }, 50);
}

/* ─── RESUMO FINANCEIRO ─────────────────────────────────────── */

function recalcEstado() {
  const itens = _estado.itens || [];
  _estado.subtotal = itens.reduce((s, i) => s + (i.sub || 0), 0);
  // recalcula total com os fatores originais
  let t = _estado.subtotal;
  t *= (_estado.tipoFator  || 1);
  t *= (_estado.cxFator    || 1);
  t *= (_estado.urgFator   || 1);
  t *= (_estado.freqFator  || 1);
  if (_estado.descPct > 0) t *= (1 - _estado.descPct / 100);
  _estado.total = Math.round(t * 100) / 100;
}

function renderResumoEditor() {
  const e = _estado;
  const sub = e.subtotal || 0;
  const total = e.total || 0;

  _setTxt("ed-r-sub",   _RS(sub));
  _setTxt("ed-r-total", _RS(total));

  const adjWrap = document.getElementById("ed-r-ajustes");
  if (!adjWrap) return;
  const adjs = [];
  if (e.tipoFator  && e.tipoFator  !== 1) adjs.push(`<div class="ed-adj"><span>Tipo cliente</span><span class="ed-adj-v ed-r">x${e.tipoFator.toFixed(2)}</span></div>`);
  if (e.cxFator    && e.cxFator    !== 1) adjs.push(`<div class="ed-adj"><span>Complexidade</span><span class="ed-adj-v ${e.cxFator>1?'ed-r':'ed-g'}">x${e.cxFator.toFixed(2)}</span></div>`);
  if (e.urgFator   && e.urgFator   !== 1) adjs.push(`<div class="ed-adj"><span>Urgência</span><span class="ed-adj-v ed-r">x${e.urgFator.toFixed(2)}</span></div>`);
  if (e.freqFator  && e.freqFator  !== 1) adjs.push(`<div class="ed-adj"><span>Frequência</span><span class="ed-adj-v ed-g">x${e.freqFator.toFixed(2)}</span></div>`);
  if (e.descPct    && e.descPct    >  0)  adjs.push(`<div class="ed-adj"><span>Desconto</span><span class="ed-adj-v ed-g">-${e.descPct}%</span></div>`);
  adjWrap.innerHTML = adjs.join("");
}

/* ─── COLETAR ESTADO DO DOM ANTES DE GERAR PDF ──────────────── */

function coletarEstadoDom() {
  const e = _estado;
  e.titulo         = _getTxt("ed-titulo")        || "PROPOSTA COMERCIAL";
  e.numero         = _getTxt("ed-numero")        || e.numero;
  e.data           = _getTxt("ed-data")          || e.data;
  e.cliente        = _getTxt("ed-cliente")       || e.cliente;
  e.tipo           = _getTxt("ed-tipo")          || e.tipo;
  e.contato        = _getTxt("ed-contato")       || "";
  e.obs            = _getTxt("ed-obs")           || "";
  e.condPagamento  = _getTxt("ed-cond-pagamento")  || "";
  e.condRevisoes   = _getTxt("ed-cond-revisoes")   || "";
  e.condAlteracoes = _getTxt("ed-cond-alteracoes") || "";
  e.pixTexto       = _getTxt("ed-pix-texto")     || "";
  e.assinNome      = _getTxt("ed-assin-nome")    || "";
  e.assinCargo     = _getTxt("ed-assin-cargo")   || "";
  e.cliAssinLabel  = _getTxt("ed-cli-assin-label") || "Assinatura do cliente";
  e.cliNomeLabel   = _getTxt("ed-cli-nome-label")  || "";
}

/* ─── GERAR PDF A PARTIR DO EDITOR ─────────────────────────── */

async function gerarPDFEditor() {
  coletarEstadoDom();
  const e = _estado;
  const pf = e._perfil || {};
  toast("Gerando PDF...", "#1a4a7a");

  try {
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
    const bold  = s => doc.setFont("helvetica", s === false ? "normal" : "bold");
    const size  = n => doc.setFontSize(n);
    const RS    = v => "R$ " + Number(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});

    /* ── fundo ── */
    F("#0b0b0f"); doc.rect(0,0,W,H,"F");
    F("#16a04b"); doc.rect(0,0,4,H,"F");
    F("#0d1a0f"); doc.rect(4,0,W-4,52,"F");
    F("#1dd668"); doc.rect(4,52,W-4,0.8,"F");

    /* ── logo ── */
    const logoSrc = pf.logo || null;
    if (logoSrc) {
      await new Promise(resolve => {
        const img = new Image();
        img.onload  = () => { try { doc.addImage(img,"PNG",ml,8,26,26); } catch(e){} resolve(); };
        img.onerror = () => resolve();
        img.src = logoSrc;
      });
    }

    /* ── cabeçalho texto ── */
    const nomePf = pf.tipo === "pj" ? (pf.nomeEmpresa || pf.nome || "—") : (pf.nome || "—");
    C("#1dd668"); bold(); size(20); doc.text(nomePf.toUpperCase(), W-mr, 20, { align: "right" });
    C("#9999b0"); bold(false); size(7); doc.text(e.assinCargo?.toUpperCase() || "DESIGNER GRAFICO & VIDEOMAKER", W-mr, 27, { align: "right" });
    const subInfos = [];
    if (pf.mostrarEndereco && pf.endereco) subInfos.push(pf.endereco);
    if (pf.mostrarEmail    && pf.email)    subInfos.push(pf.email);
    if (pf.mostrarTelefone && pf.telefone) subInfos.push(pf.telefone);
    if (pf.mostrarCpfCnpj) {
      if (pf.tipo === "pj" && pf.cnpj) subInfos.push("CNPJ: " + pf.cnpj);
      else if (pf.cpf)                  subInfos.push("CPF: " + pf.cpf);
    }
    C("#5a5a72"); size(6.5); doc.text(subInfos.join("  ·  ") || "", W-mr, 33, { align: "right" });

    /* ── badge proposta ── */
    F("#16a04b"); doc.roundedRect(ml,38,70,9,2,2,"F");
    C("#ffffff"); bold(); size(7.5); doc.text((e.titulo || "PROPOSTA COMERCIAL").toUpperCase(), ml+35, 44, { align: "center" });
    C("#9999b0"); bold(false); size(7.5); doc.text("Nº " + e.numero, W-mr, 43, { align: "right" });
    C("#5a5a72"); size(6.5); doc.text("Emitida em: " + e.data, W-mr, 49, { align: "right" });

    /* ── destinatário ── */
    y = 62;
    F("#111116"); S("#1dd668"); doc.setLineWidth(0.4);
    doc.roundedRect(ml,y,cw,26,3,3,"FD");
    F("#1dd668"); doc.roundedRect(ml,y,3,26,2,2,"F");
    C("#9999b0"); bold(false); size(6.5); doc.text("DESTINATÁRIO", ml+8, y+7);
    C("#eeeef5"); bold(); size(12); doc.text(e.cliente || "—", ml+8, y+15);
    C("#9999b0"); bold(false); size(7.5); doc.text(e.tipo + (e.contato ? "   |   " + e.contato : ""), ml+8, y+22);
    y += 34;

    /* ── tabela de serviços ── */
    F("#1a1a24"); doc.roundedRect(ml,y,cw,9,2,2,"F");
    C("#1dd668"); bold(); size(7);
    doc.text("DESCRIÇÃO DO SERVIÇO", ml+4, y+6);
    doc.text("QTD",   ml+96, y+6, { align: "right" });
    doc.text("UNIT.", ml+128, y+6, { align: "right" });
    doc.text("SUBTOTAL", ml+cw-1, y+6, { align: "right" });
    y += 12;

    (e.itens || []).forEach((l, i) => {
      if (i%2===0) { F("#111116"); doc.rect(ml,y-1,cw,10,"F"); }
      F("#16a04b"); doc.rect(ml,y-1,2,10,"F");
      C("#eeeef5"); bold(false); size(8.5); doc.text(l.desc || "—", ml+5, y+5);
      C("#9999b0"); size(8); doc.text(l.qtd+"x", ml+96, y+5, { align:"right" });
      doc.text(RS(l.unit), ml+128, y+5, { align:"right" });
      C("#1dd668"); bold(); size(8.5); doc.text(RS(l.sub), ml+cw-1, y+5, { align:"right" });
      y += 10;
    });

    /* ── subtotal + ajustes ── */
    S("#2a2a36"); doc.setLineWidth(0.3); doc.line(ml,y,W-mr,y); y += 6;
    C("#5a5a72"); bold(false); size(7.5);
    doc.text("Subtotal bruto:", ml+cw-50, y);
    doc.text(RS(e.subtotal), ml+cw-1, y, { align:"right" }); y += 5;

    const ajsArr = [];
    if (e.tipoFator && e.tipoFator!==1) ajsArr.push({k:"Tipo de cliente", v:"x"+e.tipoFator.toFixed(2), cor:"#ff4466"});
    if (e.cxFator   && e.cxFator!==1)   ajsArr.push({k:"Complexidade",    v:"x"+e.cxFator.toFixed(2),   cor:e.cxFator>1?"#ff4466":"#1dd668"});
    if (e.urgFator  && e.urgFator!==1)   ajsArr.push({k:"Urgência",        v:"x"+e.urgFator.toFixed(2),  cor:"#ff4466"});
    if (e.freqFator && e.freqFator!==1)  ajsArr.push({k:"Frequência",      v:"x"+e.freqFator.toFixed(2), cor:"#1dd668"});
    if (e.descPct   && e.descPct>0)      ajsArr.push({k:"Desconto manual",  v:"-"+e.descPct+"%",          cor:"#1dd668"});
    ajsArr.forEach(aj => {
      C("#9999b0"); bold(false); size(7.5); doc.text(aj.k+":", ml+cw-50, y);
      C(aj.cor); bold(); size(7.5); doc.text(aj.v, ml+cw-1, y, { align:"right" }); y += 5;
    });
    y += 4;

    /* ── total ── */
    F("#0a3d20"); doc.roundedRect(ml,y,cw,26,3,3,"F");
    S("#1dd668"); doc.setLineWidth(0.5); doc.roundedRect(ml,y,cw,26,3,3,"S");
    C("#aaffcc"); bold(false); size(6.5); doc.text("VALOR TOTAL DA PROPOSTA", W/2, y+8, {align:"center"});
    C("#ffffff"); bold(); size(20); doc.text(RS(e.total), W/2, y+20, {align:"center"});
    y += 34;

    /* ── PIX ── */
    if (e.pixTexto) {
      F("#0b2318"); S("#1dd668"); doc.setLineWidth(0.3);
      doc.roundedRect(ml,y,cw,12,2,2,"FD");
      C("#1dd668"); bold(); size(7); doc.text("PAGAMENTO", ml+5, y+5);
      C("#9999b0"); bold(false); size(7.5); doc.text(e.pixTexto, ml+5, y+9);
      y += 18;
    }

    /* ── observações ── */
    if (e.obs) {
      const obsLines = doc.splitTextToSize(e.obs, cw-12);
      const obsH = 14 + obsLines.length*5;
      F("#0b1a0f"); S("#16a04b"); doc.setLineWidth(0.3);
      doc.roundedRect(ml,y,cw,obsH,2,2,"FD");
      F("#16a04b"); doc.roundedRect(ml,y,3,obsH,2,2,"F");
      C("#1dd668"); bold(); size(7); doc.text("OBSERVAÇÕES", ml+8, y+7);
      C("#9999b0"); bold(false); size(7.5); doc.text(obsLines, ml+8, y+13);
      y += obsH+8;
    }

    /* ── condições gerais ── */
    const valStr = e.validadeFormatada || e.validade || "não definida";
    const conds = [
      "Validade desta proposta: " + valStr,
      "Pagamento: " + (e.condPagamento || "50% na aprovação + 50% na entrega"),
      e.condRevisoes   || "Revisões incluídas conforme briefing aprovado",
      e.condAlteracoes || "Alterações fora do escopo serão orçadas separadamente",
    ];
    F("#111116"); S("#2a2a36"); doc.setLineWidth(0.3);
    const condH = 6 + conds.length*5 + 4;
    doc.roundedRect(ml,y,cw,condH,2,2,"FD");
    C("#eeeef5"); bold(); size(7); doc.text("CONDIÇÕES GERAIS", ml+4, y+6);
    C("#9999b0"); bold(false); size(7);
    conds.forEach((c,i) => { doc.text("- "+c, ml+4, y+12+i*5); });
    y += condH + 10;

    /* ── assinaturas ── */
    const asX1 = ml;
    const asX2 = W - mr - 58;
    const asW  = 56;

    // assinatura do prestador (direita)
    if (e.assinatura || pf.assinatura) {
      const assSrc = e.assinatura || pf.assinatura;
      await new Promise(resolve => {
        const img = new Image();
        img.onload  = () => { try { doc.addImage(img,"PNG",asX2,y,asW,16); } catch(e2){} resolve(); };
        img.onerror = () => resolve();
        img.src = assSrc;
      });
    }

    // linhas de assinatura
    S("#343444"); doc.setLineWidth(0.5);
    doc.line(asX1, y+18, asX1+asW, y+18);  // cliente (esquerda)
    doc.line(asX2, y+18, asX2+asW, y+18);  // prestador (direita)

    C("#eeeef5"); bold(); size(7.5);
    doc.text(e.assinNome || nomePf, asX2+asW/2, y+24, {align:"center"});
    doc.text(e.cliNomeLabel || e.cliente || "Cliente", asX1+asW/2, y+24, {align:"center"});

    C("#9999b0"); bold(false); size(6.5);
    doc.text(e.assinCargo || "Designer Gráfico & Videomaker", asX2+asW/2, y+29, {align:"center"});
    doc.text(e.cliAssinLabel || "Assinatura do cliente", asX1+asW/2, y+29, {align:"center"});

    y += 36;

    /* ── rodapé ── */
    F("#0d1a0f"); doc.rect(4,H-12,W-4,12,"F");
    F("#1dd668"); doc.rect(4,H-12,W-4,0.6,"F");
    C("#9999b0"); bold(false); size(6.5);
    const rodapePartes = [nomePf, e.assinCargo || "Designer Gráfico & Videomaker"];
    if (pf.mostrarEndereco && pf.endereco) rodapePartes.push(pf.endereco);
    if (e.pixTexto) rodapePartes.push(e.pixTexto);
    doc.text(rodapePartes.join("  ·  "), W/2, H-6, {align:"center"});
    C("#5a5a72"); size(6);
    doc.text("Documento gerado em " + e.data + "  ·  " + e.numero, W/2, H-2, {align:"center"});

    /* ── salvar ── */
    const nomeArq = (e.cliente||"proposta").replace(/\s+/g,"-").toLowerCase().replace(/[^a-z0-9\-]/g,"");
    doc.save("proposta-" + nomeArq + ".pdf");
    toast("PDF gerado com sucesso!", "#16a04b");

  } catch(err) {
    console.error(err);
    toast("Erro ao gerar PDF", "#c0253d");
  }
}

/* ─── SALVAR COMO RASCUNHO ──────────────────────────────────── */

function salvarRascunho() {
  coletarEstadoDom();
  sessionStorage.setItem(EDITOR_KEY, JSON.stringify(_estado));
  toast("Rascunho salvo!", "#16a04b");
}

/* ─── VOLTAR ────────────────────────────────────────────────── */

function voltarOrcamento() {
  if (confirm("Voltar para o orçamento? As edições feitas aqui serão perdidas.")) {
    window.location.href = "index.html";
  }
}

/* ─── UPLOAD DE LOGO / ASSINATURA INLINE ───────────────────── */

function uploadLogoInline() {
  _uploadImg(src => {
    const el = document.getElementById("ed-logo");
    if (el) { el.src = src; el.style.display = "block"; }
    _estado.logoOverride = src;
    _estado._perfil.logo = src;
  });
}

function uploadAssinaturaInline() {
  _uploadImg(src => {
    const el = document.getElementById("ed-assinatura-img");
    if (el) { el.src = src; el.style.display = "block"; }
    _estado.assinatura = src;
  });
}

function _uploadImg(cb) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => cb(ev.target.result);
    r.readAsDataURL(file);
  };
  inp.click();
}

/* ─── CANVAS DE ASSINATURA (inline no editor) ───────────────── */

let _cvs, _cvsCtx, _cvsDraw = false;

function abrirCanvasEditor() {
  const modal = document.getElementById("modal-assin-editor");
  if (!modal) return;
  modal.style.display = "flex";
  _cvs = document.getElementById("canvas-assin-editor");
  _cvsCtx = _cvs.getContext("2d");
  _cvsCtx.clearRect(0,0,_cvs.width,_cvs.height);
  _cvsCtx.strokeStyle = "#eeeef5";
  _cvsCtx.lineWidth = 2.5;
  _cvsCtx.lineCap = "round";
  _cvsCtx.lineJoin = "round";
  const pos = e => { const r = _cvs.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
  const posT = e => { const r = _cvs.getBoundingClientRect(), t = e.touches[0]; return [t.clientX-r.left, t.clientY-r.top]; };
  _cvs.onmousedown  = e => { _cvsDraw = true; _cvsCtx.beginPath(); _cvsCtx.moveTo(...pos(e)); };
  _cvs.onmousemove  = e => { if (!_cvsDraw) return; _cvsCtx.lineTo(...pos(e)); _cvsCtx.stroke(); };
  _cvs.onmouseup    = () => { _cvsDraw = false; };
  _cvs.ontouchstart = e => { e.preventDefault(); _cvsDraw = true; _cvsCtx.beginPath(); _cvsCtx.moveTo(...posT(e)); };
  _cvs.ontouchmove  = e => { e.preventDefault(); if (!_cvsDraw) return; _cvsCtx.lineTo(...posT(e)); _cvsCtx.stroke(); };
  _cvs.ontouchend   = () => { _cvsDraw = false; };
}

function limparCanvasEditor() { if (_cvsCtx) _cvsCtx.clearRect(0,0,_cvs.width,_cvs.height); }

function salvarCanvasEditor() {
  if (!_cvs) return;
  const src = _cvs.toDataURL("image/png");
  _estado.assinatura = src;
  const el = document.getElementById("ed-assinatura-img");
  if (el) { el.src = src; el.style.display = "block"; }
  fecharCanvasEditor();
  toast("Assinatura salva!", "#16a04b");
}

function fecharCanvasEditor() {
  const modal = document.getElementById("modal-assin-editor");
  if (modal) modal.style.display = "none";
}

/* ─── HELPERS ────────────────────────────────────────────────── */

function _setTxt(id, v)  { const el = document.getElementById(id); if (el) el.textContent = v || ""; }
function _getTxt(id)     { const el = document.getElementById(id); return el ? el.textContent.trim() : ""; }
function _setEdit(id, v) { const el = document.getElementById(id); if (!el) return; el.tagName === "TEXTAREA" || el.tagName === "INPUT" ? el.value = v || "" : el.textContent = v || ""; }
function _esc(s)         { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function _RS(v)          { return "R$ " + Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }

window.toast = window.toast || function(msg, cor) {
  const el = document.getElementById("ed-toast");
  if (!el) return;
  el.textContent = msg;
  el.style.borderColor = cor || "var(--brd)";
  el.classList.add("on");
  setTimeout(() => el.classList.remove("on"), 2400);
};

/* ─── EXPORTS ────────────────────────────────────────────────── */
window.carregarEditor        = carregarEditor;
window.gerarPDFEditor        = gerarPDFEditor;
window.salvarRascunho        = salvarRascunho;
window.voltarOrcamento       = voltarOrcamento;
window.atualizarItem         = atualizarItem;
window.atualizarItemNum      = atualizarItemNum;
window.deletarItem           = deletarItem;
window.adicionarItemEditor   = adicionarItemEditor;
window.uploadLogoInline      = uploadLogoInline;
window.uploadAssinaturaInline= uploadAssinaturaInline;
window.abrirCanvasEditor     = abrirCanvasEditor;
window.limparCanvasEditor    = limparCanvasEditor;
window.salvarCanvasEditor    = salvarCanvasEditor;
window.fecharCanvasEditor    = fecharCanvasEditor;