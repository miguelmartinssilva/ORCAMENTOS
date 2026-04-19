/* ═══════════════════════════════════════════════════════════════
   PERFIS.JS — Módulo de Perfis & Configurações
   Fase 1 do sistema profissional de orçamentos
   ═══════════════════════════════════════════════════════════════ */

const PERFIS_KEY        = "orc_perfis_v1";
const PERFIL_ATIVO_KEY  = "orc_perfil_ativo_v1";

/* ── ESTRUTURA PADRÃO DE PERFIL ─────────────────────────────── */

function perfilPadrao(id) {
  return {
    id,
    nome:        "Miguel Martins",
    tipo:        "pf",          // "pf" | "pj"
    cpf:         "",
    cnpj:        "",
    nomeEmpresa: "",
    telefone:    "",
    whatsapp:    "",
    email:       "",
    endereco:    "",
    pixTipo:     "cpf",        // cpf | email | telefone | aleatoria
    pixChave:    "",
    logo:        "",           // base64
    assinatura:  "",           // base64
    // visibilidade no PDF
    mostrarCpfCnpj:  true,
    mostrarPix:      true,
    mostrarEndereco: false,
    mostrarEmail:    true,
    mostrarTelefone: true,
    cor:         "#16a04b",    // cor de identificação do perfil
  };
}

/* ── CRUD DE PERFIS ─────────────────────────────────────────── */

function getPerfis() {
  try {
    const raw = localStorage.getItem(PERFIS_KEY);
    const lista = raw ? JSON.parse(raw) : [];
    if (!lista.length) {
      const inicial = perfilPadrao(1);
      salvarPerfis([inicial]);
      return [inicial];
    }
    return lista;
  } catch { return [perfilPadrao(1)]; }
}

function salvarPerfis(lista) {
  localStorage.setItem(PERFIS_KEY, JSON.stringify(lista));
}

function getPerfilAtivo() {
  const perfis = getPerfis();
  const idAtivo = parseInt(localStorage.getItem(PERFIL_ATIVO_KEY)) || perfis[0]?.id;
  return perfis.find(p => p.id === idAtivo) || perfis[0];
}

function setPerfilAtivo(id) {
  localStorage.setItem(PERFIL_ATIVO_KEY, id);
}

function criarPerfil() {
  const lista = getPerfis();
  const novoId = Math.max(0, ...lista.map(p => p.id)) + 1;
  const novo = perfilPadrao(novoId);
  novo.nome = "Novo Perfil";
  lista.push(novo);
  salvarPerfis(lista);
  return novo;
}

function apagarPerfil(id) {
  const lista = getPerfis().filter(p => p.id !== id);
  if (!lista.length) return false; // nunca apagar o último
  salvarPerfis(lista);
  if (getPerfilAtivo()?.id === id) setPerfilAtivo(lista[0].id);
  return true;
}

function salvarPerfilEditado(dados) {
  const lista = getPerfis();
  const idx = lista.findIndex(p => p.id === dados.id);
  if (idx >= 0) lista[idx] = { ...lista[idx], ...dados };
  else lista.push(dados);
  salvarPerfis(lista);
}

/* ── RENDERIZAÇÃO DA TELA DE PERFIS ─────────────────────────── */

function renderPerfisPage() {
  renderListaPerfis();
  const ativo = getPerfilAtivo();
  if (ativo) abrirEdicaoPerfil(ativo.id);
}

function renderListaPerfis() {
  const wrap = document.getElementById("perfis-lista");
  if (!wrap) return;
  const perfis  = getPerfis();
  const ativoId = getPerfilAtivo()?.id;

  wrap.innerHTML = perfis.map(p => {
    const isAtivo = p.id === ativoId;
    const iniciais = (p.tipo === "pj" ? p.nomeEmpresa || p.nome : p.nome)
      .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
    return `
      <div class="perfil-item ${isAtivo ? "ativo" : ""}" onclick="selecionarPerfil(${p.id})">
        <div class="perfil-avatar" style="background:${p.cor}22;border-color:${isAtivo ? p.cor : "transparent"}">
          ${p.logo
            ? `<img src="${p.logo}" style="width:100%;height:100%;object-fit:contain;border-radius:50%">`
            : `<span style="color:${p.cor};font-weight:700;font-size:.9rem">${iniciais || "?"}</span>`}
        </div>
        <div class="perfil-info">
          <div class="perfil-nome">${p.tipo === "pj" ? (p.nomeEmpresa || p.nome) : p.nome}</div>
          <div class="perfil-sub">${p.tipo === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}${isAtivo ? " · <span class='ativo-badge'>ativo</span>" : ""}</div>
        </div>
      </div>`;
  }).join("") + `
    <button class="btn-novo-perfil" onclick="novoPerfil()">+ Novo perfil</button>`;
}

function selecionarPerfil(id) {
  setPerfilAtivo(id);
  renderListaPerfis();
  abrirEdicaoPerfil(id);
  toast("Perfil ativo alterado!", "#16a04b");
  // atualiza seletores em outras páginas se existirem
  if (typeof renderSeletorPerfil === "function") renderSeletorPerfil();
}

function novoPerfil() {
  const novo = criarPerfil();
  setPerfilAtivo(novo.id);
  renderListaPerfis();
  abrirEdicaoPerfil(novo.id);
}

function abrirEdicaoPerfil(id) {
  const perfil = getPerfis().find(p => p.id === id);
  if (!perfil) return;
  const form = document.getElementById("perfil-form");
  if (!form) return;

  // preenche campos
  _setVal("pf-id",           perfil.id);
  _setVal("pf-nome",         perfil.nome);
  _setVal("pf-tipo",         perfil.tipo);
  _setVal("pf-nome-empresa", perfil.nomeEmpresa);
  _setVal("pf-cpf",          perfil.cpf);
  _setVal("pf-cnpj",         perfil.cnpj);
  _setVal("pf-telefone",     perfil.telefone);
  _setVal("pf-whatsapp",     perfil.whatsapp);
  _setVal("pf-email",        perfil.email);
  _setVal("pf-endereco",     perfil.endereco);
  _setVal("pf-pix-tipo",     perfil.pixTipo);
  _setVal("pf-pix-chave",    perfil.pixChave);
  _setVal("pf-cor",          perfil.cor);
  _setCheck("pf-vis-doc",    perfil.mostrarCpfCnpj);
  _setCheck("pf-vis-pix",    perfil.mostrarPix);
  _setCheck("pf-vis-end",    perfil.mostrarEndereco);
  _setCheck("pf-vis-email",  perfil.mostrarEmail);
  _setCheck("pf-vis-tel",    perfil.mostrarTelefone);

  // preview de logo e assinatura
  _imgPreview("logo-preview",       perfil.logo,       "Logo");
  _imgPreview("assinatura-preview", perfil.assinatura, "Assinatura");

  // mostra/esconde campos PJ
  toggleTipoCampos(perfil.tipo);
  // título do botão apagar
  const btnApagar = document.getElementById("btn-apagar-perfil");
  if (btnApagar) {
    btnApagar.style.display = getPerfis().length > 1 ? "block" : "none";
    btnApagar.onclick = () => confirmarApagarPerfil(id);
  }

  form.style.display = "block";
  document.getElementById("perfil-form-titulo").textContent =
    perfil.tipo === "pj" ? (perfil.nomeEmpresa || perfil.nome) : perfil.nome;
}

function toggleTipoCampos(tipo) {
  const campoPJ = document.getElementById("campo-pj");
  const campoPF = document.getElementById("campo-pf");
  const campoDoc = document.getElementById("campo-documento");
  if (campoPJ) campoPJ.style.display  = tipo === "pj" ? "block" : "none";
  if (campoPF) campoPF.style.display  = tipo === "pf" ? "block" : "none";
  if (campoDoc) {
    const label = campoDoc.querySelector("label");
    const input = campoDoc.querySelector("input");
    if (label) label.textContent = tipo === "pj" ? "CNPJ" : "CPF";
    if (input) {
      input.id = tipo === "pj" ? "pf-cnpj" : "pf-cpf";
      input.placeholder = tipo === "pj" ? "00.000.000/0001-00" : "000.000.000-00";
    }
  }
}

function salvarFormPerfil() {
  const id = parseInt(_getVal("pf-id"));
  const tipo = _getVal("pf-tipo");
  const dados = {
    id,
    tipo,
    nome:            _getVal("pf-nome"),
    nomeEmpresa:     _getVal("pf-nome-empresa"),
    cpf:             tipo === "pf" ? _getVal("pf-cpf")  : "",
    cnpj:            tipo === "pj" ? _getVal("pf-cnpj") : "",
    telefone:        _getVal("pf-telefone"),
    whatsapp:        _getVal("pf-whatsapp"),
    email:           _getVal("pf-email"),
    endereco:        _getVal("pf-endereco"),
    pixTipo:         _getVal("pf-pix-tipo"),
    pixChave:        _getVal("pf-pix-chave"),
    cor:             _getVal("pf-cor") || "#16a04b",
    mostrarCpfCnpj:  _getCheck("pf-vis-doc"),
    mostrarPix:      _getCheck("pf-vis-pix"),
    mostrarEndereco: _getCheck("pf-vis-end"),
    mostrarEmail:    _getCheck("pf-vis-email"),
    mostrarTelefone: _getCheck("pf-vis-tel"),
    // imagens mantém as que já estão (upload separado)
    logo:        getPerfis().find(p => p.id === id)?.logo || "",
    assinatura:  getPerfis().find(p => p.id === id)?.assinatura || "",
  };
  salvarPerfilEditado(dados);
  renderListaPerfis();
  document.getElementById("perfil-form-titulo").textContent =
    dados.tipo === "pj" ? (dados.nomeEmpresa || dados.nome) : dados.nome;
  toast("Perfil salvo com sucesso!", "#16a04b");
  if (typeof renderSeletorPerfil === "function") renderSeletorPerfil();
}

function confirmarApagarPerfil(id) {
  const perfil = getPerfis().find(p => p.id === id);
  const nome = perfil?.tipo === "pj" ? (perfil.nomeEmpresa || perfil.nome) : perfil?.nome;
  if (!confirm(`Apagar o perfil "${nome}"? Esta ação não pode ser desfeita.`)) return;
  apagarPerfil(id);
  renderPerfisPage();
  toast("Perfil apagado.", "#5a5a72");
}

/* ── UPLOAD DE IMAGENS ──────────────────────────────────────── */

function uploadImagem(campo, previewId, tipo) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target.result;
      const id = parseInt(_getVal("pf-id"));
      const lista = getPerfis();
      const idx = lista.findIndex(p => p.id === id);
      if (idx >= 0) lista[idx][campo] = base64;
      salvarPerfis(lista);
      _imgPreview(previewId, base64, tipo);
      toast(tipo + " salva!", "#16a04b");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function removerImagem(campo, previewId, tipo) {
  const id = parseInt(_getVal("pf-id"));
  const lista = getPerfis();
  const idx = lista.findIndex(p => p.id === id);
  if (idx >= 0) lista[idx][campo] = "";
  salvarPerfis(lista);
  _imgPreview(previewId, "", tipo);
  toast(tipo + " removida.", "#5a5a72");
}

function _imgPreview(previewId, src, label) {
  const wrap = document.getElementById(previewId);
  if (!wrap) return;
  wrap.innerHTML = src
    ? `<img src="${src}" style="max-height:80px;max-width:160px;object-fit:contain;border-radius:8px;border:1px solid var(--brd)">
       <button class="btn-rem-img" onclick="removerImagem('${previewId === 'logo-preview' ? 'logo' : 'assinatura'}','${previewId}','${label}')">× remover</button>`
    : `<span class="img-placeholder">Nenhuma imagem</span>`;
}

/* ── CANVAS DE ASSINATURA ───────────────────────────────────── */

let _canvas, _ctx, _desenhandoAssinatura = false;

function abrirCanvasAssinatura() {
  const modal = document.getElementById("modal-assinatura");
  if (!modal) return;
  modal.style.display = "flex";
  _canvas = document.getElementById("canvas-assinatura");
  _ctx = _canvas.getContext("2d");
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  _ctx.strokeStyle = "#eeeef5";
  _ctx.lineWidth = 2.5;
  _ctx.lineCap = "round";
  _ctx.lineJoin = "round";

  _canvas.onmousedown  = e => { _desenhandoAssinatura = true; _ctx.beginPath(); _ctx.moveTo(..._pos(e)); };
  _canvas.onmousemove  = e => { if (!_desenhandoAssinatura) return; _ctx.lineTo(..._pos(e)); _ctx.stroke(); };
  _canvas.onmouseup    = () => { _desenhandoAssinatura = false; };
  _canvas.ontouchstart = e => { e.preventDefault(); _desenhandoAssinatura = true; _ctx.beginPath(); _ctx.moveTo(..._posTouch(e)); };
  _canvas.ontouchmove  = e => { e.preventDefault(); if (!_desenhandoAssinatura) return; _ctx.lineTo(..._posTouch(e)); _ctx.stroke(); };
  _canvas.ontouchend   = () => { _desenhandoAssinatura = false; };
}

function _pos(e) {
  const r = _canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}
function _posTouch(e) {
  const r = _canvas.getBoundingClientRect();
  const t = e.touches[0];
  return [t.clientX - r.left, t.clientY - r.top];
}

function limparCanvas() {
  if (_ctx) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
}

function salvarCanvasAssinatura() {
  if (!_canvas) return;
  const base64 = _canvas.toDataURL("image/png");
  const id = parseInt(_getVal("pf-id"));
  const lista = getPerfis();
  const idx = lista.findIndex(p => p.id === id);
  if (idx >= 0) lista[idx].assinatura = base64;
  salvarPerfis(lista);
  _imgPreview("assinatura-preview", base64, "Assinatura");
  fecharModalAssinatura();
  toast("Assinatura salva!", "#16a04b");
}

function fecharModalAssinatura() {
  const modal = document.getElementById("modal-assinatura");
  if (modal) modal.style.display = "none";
}

/* ── SELETOR DE PERFIL (para index.html e outras páginas) ───── */

function renderSeletorPerfil() {
  const sel = document.getElementById("seletor-perfil");
  if (!sel) return;
  const perfis  = getPerfis();
  const ativoId = getPerfilAtivo()?.id;
  sel.innerHTML = perfis.map(p => {
    const nome = p.tipo === "pj" ? (p.nomeEmpresa || p.nome) : p.nome;
    return `<option value="${p.id}" ${p.id === ativoId ? "selected" : ""}>${nome} (${p.tipo === "pj" ? "PJ" : "PF"})</option>`;
  }).join("");
}

function onMudarPerfilAtivo(id) {
  setPerfilAtivo(parseInt(id));
  toast("Perfil alterado!", "#16a04b");
}

/* ── HELPERS ────────────────────────────────────────────────── */

function _getVal(id)        { return document.getElementById(id)?.value ?? ""; }
function _setVal(id, v)     { const el = document.getElementById(id); if (el) el.value = v ?? ""; }
function _getCheck(id)      { return document.getElementById(id)?.checked ?? false; }
function _setCheck(id, v)   { const el = document.getElementById(id); if (el) el.checked = !!v; }

/* ── EXPORTS GLOBAIS ────────────────────────────────────────── */

window.getPerfis             = getPerfis;
window.getPerfilAtivo        = getPerfilAtivo;
window.setPerfilAtivo        = setPerfilAtivo;
window.renderPerfisPage      = renderPerfisPage;
window.renderListaPerfis     = renderListaPerfis;
window.selecionarPerfil      = selecionarPerfil;
window.novoPerfil            = novoPerfil;
window.abrirEdicaoPerfil     = abrirEdicaoPerfil;
window.salvarFormPerfil      = salvarFormPerfil;
window.confirmarApagarPerfil = confirmarApagarPerfil;
window.toggleTipoCampos      = toggleTipoCampos;
window.uploadImagem          = uploadImagem;
window.removerImagem         = removerImagem;
window.abrirCanvasAssinatura = abrirCanvasAssinatura;
window.limparCanvas          = limparCanvas;
window.salvarCanvasAssinatura= salvarCanvasAssinatura;
window.fecharModalAssinatura = fecharModalAssinatura;
window.renderSeletorPerfil   = renderSeletorPerfil;
window.onMudarPerfilAtivo    = onMudarPerfilAtivo;