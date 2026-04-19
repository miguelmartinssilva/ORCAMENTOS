const HIST_KEY = "historico_orcamentos_miguel";
const MEU_NUM = "5563999999999";

const $ = (id) => document.getElementById(id);
const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const RS = (v) => `R$ ${fmt(v)}`;

function toast(msg, cor = "#16a04b") {
  const t = $("toast");
  t.textContent = msg;
  t.style.background = cor;
  t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 2700);
}

function getHistorico() {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY)) || [];
  } catch {
    return [];
  }
}

function salvarHistorico(item) {
  const hist = getHistorico();
  hist.unshift(item);
  localStorage.setItem(HIST_KEY, JSON.stringify(hist));
}

(() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  $("cli-validade").value = d.toISOString().split("T")[0];
})();

let lid = 0;

function addRow(desc = "", qtd = 1, unit = 200) {
  const tb = $("tbody");
  const id = ++lid;
  const tr = document.createElement("tr");
  tr.id = `r${id}`;
  tr.innerHTML = `
    <td class="td-d"><input type="text" placeholder="Descrição do serviço" value="${desc}" oninput="recalc()"></td>
    <td class="td-q"><input type="number" min="1" value="${qtd}" oninput="recalc()"></td>
    <td class="td-u"><input type="number" min="0" step="0.01" value="${unit}" oninput="recalc()"></td>
    <td class="td-s" id="s${id}">${RS(qtd * unit)}</td>
    <td class="td-x"><button class="btn-del" onclick="delRow(${id})">×</button></td>
  `;
  tb.appendChild(tr);
  recalc();
}

function delRow(id) {
  const el = $(`r${id}`);
  if (el) el.remove();
  recalc();
}

function getLinhas() {
  return [...$("tbody").querySelectorAll("tr")]
    .map((tr) => {
      const ins = tr.querySelectorAll("input");
      const desc = ins[0]?.value.trim() || "";
      const qtd = parseFloat(ins[1]?.value) || 0;
      const unit = parseFloat(ins[2]?.value) || 0;
      const sub = qtd * unit;
      const sid = tr.id.slice(1);
      const sel = $(`s${sid}`);
      if (sel) sel.textContent = RS(sub);
      return { desc, qtd, unit, sub };
    })
    .filter((l) => l.desc && l.qtd > 0);
}

function recalc() {
  const ls = getLinhas();
  const sub = ls.reduce((a, l) => a + l.sub, 0);
  const tipo = parseFloat($("cli-tipo").value) || 1;
  const cx = parseFloat(document.querySelector("input[name=cx]:checked")?.value) || 1;
  const urg = parseFloat(document.querySelector("input[name=urg]:checked")?.value) || 1;
  const freq = parseFloat(document.querySelector("input[name=freq]:checked")?.value) || 1;
  const descPct = parseFloat($("desc")?.value) || 0;
  const total = Math.round(sub * tipo * cx * urg * freq * (1 - descPct / 100) * 100) / 100;

  const tipoLbl = $("cli-tipo").options[$("cli-tipo").selectedIndex]?.text || "";
  $("res-tipo-label").textContent = tipoLbl;
  $("res-tipo-fator").textContent = `×${tipo.toFixed(2)}`;

  $("r-sub").textContent = RS(sub);
  $("r-tipo").textContent = `×${tipo.toFixed(2)}`;
  $("r-cx").textContent = `×${cx.toFixed(2)}`;
  $("r-urg").textContent = urg !== 1 ? `×${urg.toFixed(2)}` : "—";
  $("r-freq").textContent = freq !== 1 ? `×${freq.toFixed(2)}` : "—";
  $("r-desc").textContent = descPct > 0 ? `−${descPct}%` : "—";
  $("r-total").innerHTML = `<sup>R$</sup> ${fmt(total)}`;

  $("f-eco").textContent = `R$ ${Math.round(total * 0.85).toLocaleString("pt-BR")}`;
  $("f-ideal").textContent = `R$ ${Math.round(total).toLocaleString("pt-BR")}`;
  $("f-prem").textContent = `R$ ${Math.round(total * 1.25).toLocaleString("pt-BR")}`;

  return { ls, sub, tipo, cx, urg, freq, descPct, total };
}

function montarOrcamento() {
  const d = recalc();
  const now = new Date();
  return {
    id: Date.now(),
    numero: `MM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`,
    data: now.toLocaleDateString("pt-BR"),
    cliente: $("cli-nome").value.trim() || "(cliente não informado)",
    contato: $("cli-contato").value.trim(),
    tipo: $("cli-tipo").options[$("cli-tipo").selectedIndex].text,
    validade: $("cli-validade").value,
    obs: $("obs").value.trim(),
    itens: d.ls,
    subtotal: d.sub,
    total: d.total,
    tipoFator: d.tipo,
    cxFator: d.cx,
    urgFator: d.urg,
    freqFator: d.freq,
    descPct: d.descPct
  };
}

function gerarProposta() {
  const d = recalc();
  if (!d.ls.length) {
    toast("⚠️ Adicione pelo menos 1 serviço", "#c0253d");
    return;
  }

  const orc = montarOrcamento();
  salvarHistorico(orc);

  $("p-num").textContent = `#${orc.numero}`;
  $("p-data").textContent = orc.data;
  $("p-cli-nome").textContent = orc.cliente;
  $("p-cli-sub").textContent = `${orc.tipo}${orc.contato ? " · " + orc.contato : ""}`;

  $("p-itens").innerHTML = orc.itens.map((l) => `
    <tr>
      <td class="in">${l.desc}</td>
      <td class="iq">${l.qtd}×</td>
      <td class="iu">${RS(l.unit)}</td>
      <td class="sv">${RS(l.sub)}</td>
    </tr>
  `).join("");

  const adjs = [];
  if (orc.tipoFator !== 1) adjs.push(`<div class="padj-l"><span class="pk">Tipo cliente</span><span class="pv r">×${orc.tipoFator.toFixed(2)}</span></div>`);
  if (orc.cxFator !== 1) adjs.push(`<div class="padj-l"><span class="pk">Complexidade</span><span class="pv ${orc.cxFator > 1 ? "r" : "g"}">×${orc.cxFator.toFixed(2)}</span></div>`);
  if (orc.urgFator !== 1) adjs.push(`<div class="padj-l"><span class="pk">Urgência</span><span class="pv r">×${orc.urgFator.toFixed(2)}</span></div>`);
  if (orc.freqFator !== 1) adjs.push(`<div class="padj-l"><span class="pk">Frequência</span><span class="pv g">×${orc.freqFator.toFixed(2)}</span></div>`);
  if (orc.descPct > 0) adjs.push(`<div class="padj-l"><span class="pk">Desconto manual</span><span class="pv g">−${orc.descPct}%</span></div>`);
  $("p-adj").innerHTML = adjs.join("");

  $("p-total").innerHTML = `<sup>R$</sup> ${fmt(orc.total)}`;

  if (orc.obs) {
    $("p-obs").textContent = orc.obs;
    $("p-obs-w").style.display = "block";
  } else {
    $("p-obs-w").style.display = "none";
  }

  $("p-val").textContent = orc.validade
    ? new Date(orc.validade + "T12:00:00").toLocaleDateString("pt-BR")
    : "(não definida)";

  $("proposta-wrap").classList.add("on");
  setTimeout(() => $("proposta-wrap").scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  toast("✅ Proposta gerada e salva no histórico!");
}

function enviarWpp() {
  const d = recalc();
  if (!d.ls.length) {
    toast("⚠️ Adicione pelo menos 1 serviço", "#c0253d");
    return;
  }

  const orc = montarOrcamento();
  const valStr = orc.validade
    ? new Date(orc.validade + "T12:00:00").toLocaleDateString("pt-BR")
    : "7 dias";

  const numeroCliente = (orc.contato || "").replace(/\D/g, "");

  if (!numeroCliente) {
    toast("⚠️ Digite o WhatsApp do cliente", "#c0253d");
    return;
  }

  let numeroFinal = numeroCliente;
  if (!numeroFinal.startsWith("55")) {
    numeroFinal = "55" + numeroFinal;
  }

  let m = `Olá! 👋 Segue a proposta de *Miguel Martins*:\n\n`;
  if (orc.cliente) m += `👤 *Cliente:* ${orc.cliente}\n`;
  m += `📋 *Tipo:* ${orc.tipo}\n`;
  if (orc.contato) m += `📱 *Contato:* ${orc.contato}\n`;
  m += `📅 *Data:* ${orc.data}\n\n`;
  m += `━━━━━━━━━━━━━━━━\n📦 *SERVIÇOS*\n━━━━━━━━━━━━━━━━\n`;

  orc.itens.forEach((l) => {
    m += `▸ ${l.desc}\n  ${l.qtd}× ${RS(l.unit)} = *${RS(l.sub)}*\n`;
  });

  m += `\n💰 *TOTAL: ${RS(orc.total)}*\n`;
  m += `📌 *Validade:* ${valStr}\n`;

  if (orc.obs) m += `\n📝 *Obs:* ${orc.obs}\n`;

  window.open(`https://wa.me/${numeroFinal}?text=${encodeURIComponent(m)}`, "_blank");
}

async function gerarPDF() {
  const d = recalc();
  if (!d.ls.length) {
    toast("⚠️ Adicione pelo menos 1 serviço", "#c0253d");
    return;
  }

  toast("⏳ Gerando PDF…", "#1a4a7a");

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.text("Proposta comercial", 20, 20);
    doc.text(`Cliente: ${$("cli-nome").value || "-"}`, 20, 30);
    doc.text(`Total: ${RS(d.total)}`, 20, 40);
    doc.save("proposta.pdf");

    toast("✅ PDF GERADO!", "#16a04b");
  } catch (e) {
    console.error(e);
    toast("❌ Erro ao gerar PDF", "#c0253d");
  }
}

function limpar() {
  $("cli-nome").value = "";
  $("cli-contato").value = "";
  $("obs").value = "";
  $("desc").value = "";
  $("cli-tipo").value = "1.00";

  const d = new Date();
  d.setDate(d.getDate() + 7);
  $("cli-validade").value = d.toISOString().split("T")[0];

  document.querySelector('input[name="freq"][value="1.00"]').checked = true;
  document.querySelector('input[name="urg"][value="1.00"]').checked = true;
  document.querySelector('input[name="cx"][value="1.00"]').checked = true;

  $("tbody").innerHTML = "";
  lid = 0;
  $("proposta-wrap").classList.remove("on");
  addRow("", 1, 200);

  toast("🗑️ Formulário limpo!", "#5a5a72");
}

$("inp-logo").addEventListener("change", function () {
  const f = this.files[0];
  if (!f) return;

  const r = new FileReader();
  r.onload = (e) => {
    const img = $("logo-preview");
    img.src = e.target.result;
    img.classList.add("on");
    $("btn-logo").textContent = "✏️ Trocar logo";
  };
  r.readAsDataURL(f);
});

window.addRow = addRow;
window.delRow = delRow;
window.recalc = recalc;
window.gerarProposta = gerarProposta;
window.enviarWpp = enviarWpp;
window.gerarPDF = gerarPDF;
window.limpar = limpar;

addRow("", 1, 200);
