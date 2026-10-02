/* Construtora JR — app de gestão (dados salvos no próprio aparelho) */
'use strict';

// ---------- Dados ----------
const KEY = 'construtora-jr-v1';
// Versão do app — ao publicar mudanças, aumente aqui E no arquivo version.json
const APP_VERSION = '1.1.0';

const CATALOGO_PADRAO = [
  ['material', 'Tijolo 8 furos', 'milheiro', 900],
  ['material', 'Bloco de concreto 14x19x39', 'unid', 4.5],
  ['material', 'Cimento CP-II 50kg', 'saco', 38],
  ['material', 'Areia média', 'm³', 150],
  ['material', 'Areia fina', 'm³', 160],
  ['material', 'Brita 1', 'm³', 170],
  ['material', 'Cal hidratada 20kg', 'saco', 22],
  ['material', 'Argamassa AC-I 20kg', 'saco', 20],
  ['material', 'Ferro 3/8 (10mm)', 'barra', 55],
  ['material', 'Ferro 5/16 (8mm)', 'barra', 38],
  ['material', 'Arame recozido', 'kg', 18],
  ['material', 'Telha cerâmica', 'milheiro', 1400],
  ['material', 'Piso cerâmico', 'm²', 45],
  ['material', 'Tinta acrílica 18L', 'lata', 350],
  ['material', 'Tubo PVC 100mm', 'barra', 90],
  ['material', 'Tubo PVC 25mm', 'barra', 25],
  ['material', 'Fio 2,5mm', 'rolo 100m', 230],
  ['material', 'Madeira (tábua)', 'dúzia', 180],
  ['servico', 'Mão de obra pedreiro', 'diária', 200],
  ['servico', 'Mão de obra servente', 'diária', 120],
  ['servico', 'Alvenaria', 'm²', 45],
  ['servico', 'Reboco', 'm²', 35],
  ['servico', 'Assentamento de piso', 'm²', 40],
  ['servico', 'Pintura', 'm²', 20],
];

const CATEGORIAS_GASTO = ['Material', 'Ferramentas', 'Combustível', 'Alimentação', 'Aluguel', 'Transporte', 'Impostos', 'Outros'];
const CORES = ['#7c3aed', '#ec4899', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#f97316'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function estadoInicial() {
  return {
    config: { empresa: 'Construtora JR', telefone: '', cnpj: '', endereco: '', trabalhaSabado: true },
    clientes: [], obras: [], receitas: [], postos: [], vales: [],
    catalogo: CATALOGO_PADRAO.map(([tipo, nome, unidade, preco]) => ({ id: uid(), tipo, nome, unidade, preco })),
    orcamentos: [], funcionarios: [], faltas: [], despesas: [], empreitadas: [],
  };
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(KEY));
    if (salvo) {
      const base = estadoInicial();
      return { ...base, ...salvo, config: { ...base.config, ...(salvo.config || {}) } };
    }
  } catch (e) { /* ignora */ }
  return estadoInicial();
}

let db = carregar();
function salvar() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('Não foi possível salvar no aparelho'); }
}

// ---------- Utilidades ----------
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = v => brl.format(Number(v) || 0);
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const hoje = () => iso(new Date());
const addDias = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const br = s => s ? s.split('-').reverse().join('/') : '';
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_C = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const entre = (d, a, b) => d >= a && d <= b;
const ultimoDia = (y, m) => new Date(y, m + 1, 0).getDate(); // m: 0-11

function inicioSemana(s) { const d = parse(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d); }
function rangeSemana(s) { const a = inicioSemana(s); return [a, addDias(a, 6)]; }
function rangeMes(s) { const d = parse(s); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))]; }
function rangeQuinzena(s) {
  const d = parse(s), y = d.getFullYear(), m = d.getMonth();
  return d.getDate() <= 15 ? [iso(new Date(y, m, 1)), iso(new Date(y, m, 15))] : [iso(new Date(y, m, 16)), iso(new Date(y, m + 1, 0))];
}
function rangeAno(s) { const y = parse(s).getFullYear(); return [`${y}-01-01`, `${y}-12-31`]; }

const byId = (lista, id) => db[lista].find(x => x.id === id);
const nomeCliente = id => byId('clientes', id)?.nome || '—';
const soma = (arr, f = x => x.valor) => arr.reduce((t, x) => t + num(f(x)), 0);

function foneWa(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (d && d.length <= 11) d = '55' + d;
  return d;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2500);
}

// ---------- Modal genérico ----------
let modalSalvar = null;
function abrirModal(titulo, html, onSave, textoBotao = 'Salvar') {
  document.getElementById('modalTitle').textContent = titulo;
  const form = document.getElementById('modalForm');
  form.innerHTML = html + (onSave ? `<div class="form-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn" type="submit">${textoBotao}</button></div>` : '');
  modalSalvar = onSave;
  document.getElementById('modalBg').hidden = false;
  const first = form.querySelector('input,select,textarea');
  if (first && window.innerWidth > 700) first.focus();
}
function fecharModal() { document.getElementById('modalBg').hidden = true; modalSalvar = null; }
document.getElementById('modalForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!modalSalvar) return;
  const dados = Object.fromEntries(new FormData(e.target).entries());
  e.target.querySelectorAll('input[type=checkbox]').forEach(c => (dados[c.name] = c.checked));
  if (modalSalvar(dados) !== false) { fecharModal(); salvar(); render(); }
});
document.getElementById('modalBg').addEventListener('click', e => { if (e.target.id === 'modalBg') fecharModal(); });

const opt = (lista, sel, vazio) => (vazio ? `<option value="">${vazio}</option>` : '') +
  lista.map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.nome)}</option>`).join('');
const optTxt = (lista, sel) => lista.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');

function confirmarExcluir(lista, id, msg = 'Excluir este registro?') {
  if (!confirm(msg)) return;
  db[lista] = db[lista].filter(x => x.id !== id);
  salvar(); render();
}

// ---------- Navegação ----------
let aba = 'agenda';
try { aba = localStorage.getItem(KEY + ':aba') || 'agenda'; } catch (e) { /* ignora */ }
let charts = [];

function render() {
  charts.forEach(c => c.destroy()); charts = [];
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === aba));
  document.getElementById('empresaNome').textContent = db.config.empresa || 'Construtora JR';
  document.getElementById('hojeLabel').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const v = document.getElementById('view');
  v.innerHTML = (VIEWS[aba] || VIEWS.agenda)();
  if (POS[aba]) POS[aba]();
}

const actions = {
  goTab: d => { aba = d.tab; orcEdit = null; try { localStorage.setItem(KEY + ':aba', aba); } catch (e) { /* ignora */ } render(); window.scrollTo(0, 0); },
  closeModal: () => fecharModal(),
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el); }
});

// =====================================================
// 1) AGENDA DE OBRAS
// =====================================================
let cal = (() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth(), sel: hoje() }; })();
const STATUS_OBRA = ['Agendada', 'Em andamento', 'Concluída', 'Pausada'];
const corObra = o => CORES[db.obras.indexOf(o) % CORES.length];
const badgeStatus = s => `<span class="badge ${s === 'Concluída' ? 'ok' : s === 'Em andamento' ? '' : s === 'Pausada' ? 'warn' : 'gray'}">${esc(s)}</span>`;

function obrasNoDia(dia) { return db.obras.filter(o => o.inicio && entre(dia, o.inicio, o.fim || o.inicio)); }

function duracao(o) {
  if (!o.inicio) return '';
  const dias = Math.round((parse(o.fim || o.inicio) - parse(o.inicio)) / 864e5) + 1;
  return `${dias} dia${dias > 1 ? 's' : ''}`;
}

const VIEWS = {};
const POS = {};

VIEWS.agenda = () => {
  const primeiro = new Date(cal.y, cal.m, 1);
  const ini = new Date(primeiro); ini.setDate(1 - ((primeiro.getDay() + 6) % 7));
  let cells = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = new Date(ini); d.setDate(ini.getDate() + i);
    const s = iso(d), obs = obrasNoDia(s);
    cells += `<div class="day ${d.getMonth() !== cal.m ? 'out' : ''} ${s === hoje() ? 'today' : ''} ${s === cal.sel ? 'sel' : ''}" data-act="calSel" data-dia="${s}">
      <span class="n">${d.getDate()}</span>
      ${obs.slice(0, 3).map(o => `<div class="bar" style="background:${corObra(o)}" title="${esc(o.nome)}"></div>`).join('')}
      ${obs.length > 3 ? `<span class="more">+${obs.length - 3}</span>` : ''}
    </div>`;
  }
  const doDia = obrasNoDia(cal.sel);
  const ativas = db.obras.filter(o => o.status !== 'Concluída').sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));
  const concluidas = db.obras.filter(o => o.status === 'Concluída');

  return `
  <div class="card">
    <div class="cal-head">
      <button class="btn sec sm" data-act="calNav" data-d="-1">‹</button>
      <h3>${MESES[cal.m]} ${cal.y}</h3>
      <button class="btn sec sm" data-act="calNav" data-d="1">›</button>
    </div>
    <div class="cal">${cells}</div>
  </div>

  <div class="section-head"><h2>Obras em ${br(cal.sel)}</h2><button class="btn" data-act="novaObra">+ Nova obra</button></div>
  <div class="card">${doDia.length ? doDia.map(itemObra).join('') : '<div class="empty">Nenhuma obra neste dia</div>'}</div>

  <div class="section-head"><h2>Obras ativas (${ativas.length})</h2></div>
  <div class="card">${ativas.length ? ativas.map(itemObra).join('') : '<div class="empty">Cadastre a primeira obra</div>'}</div>

  ${concluidas.length ? `<div class="section-head"><h2>Concluídas (${concluidas.length})</h2></div><div class="card">${concluidas.map(itemObra).join('')}</div>` : ''}

  <div class="section-head"><h2>Clientes (${db.clientes.length})</h2><button class="btn sec" data-act="novoCliente">+ Cliente</button></div>
  <div class="card">${db.clientes.length ? db.clientes.map(c => `
    <div class="list-item">
      <div class="info"><div class="title">${esc(c.nome)}</div><div class="sub">${esc(c.telefone)} ${c.endereco ? '· ' + esc(c.endereco) : ''}</div></div>
      ${c.telefone ? `<a class="btn wa sm" href="https://wa.me/${foneWa(c.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
      <button class="btn ghost sm" data-act="editCliente" data-id="${c.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum cliente cadastrado</div>'}</div>`;
};

function itemObra(o) {
  return `<div class="list-item">
    <span class="dot" style="background:${corObra(o)}"></span>
    <div class="info">
      <div class="title">${esc(o.nome)}</div>
      <div class="sub">${esc(nomeCliente(o.clienteId))} · ${br(o.inicio)} a ${br(o.fim || o.inicio)} (${duracao(o)})</div>
      ${o.endereco ? `<div class="sub">📍 ${esc(o.endereco)}</div>` : ''}
    </div>
    <div style="text-align:right">${badgeStatus(o.status)}<div class="amount" style="margin-top:4px">${o.valor ? money(o.valor) : ''}</div></div>
    <button class="btn ghost sm" data-act="editObra" data-id="${o.id}">Editar</button>
  </div>`;
}

actions.calNav = d => { cal.m += Number(d.d); if (cal.m < 0) { cal.m = 11; cal.y--; } if (cal.m > 11) { cal.m = 0; cal.y++; } render(); };
actions.calSel = d => { cal.sel = d.dia; render(); };

function formCliente(c = {}) {
  return `<label>Nome *</label><input name="nome" required value="${esc(c.nome)}">
    <label>Telefone / WhatsApp</label><input name="telefone" inputmode="tel" value="${esc(c.telefone)}" placeholder="(00) 00000-0000">
    <label>Endereço</label><input name="endereco" value="${esc(c.endereco)}">
    <label>Observações</label><textarea name="obs">${esc(c.obs)}</textarea>`;
}
actions.novoCliente = () => abrirModal('Novo cliente', formCliente(), d => { db.clientes.push({ id: uid(), ...d }); toast('Cliente cadastrado'); });
actions.editCliente = ({ id }) => {
  const c = byId('clientes', id);
  abrirModal('Editar cliente', formCliente(c) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delCliente" data-id="${id}">Excluir cliente</button></div>`, d => Object.assign(c, d));
};
actions.delCliente = ({ id }) => {
  if (db.obras.some(o => o.clienteId === id)) return alert('Este cliente tem obras cadastradas. Exclua as obras primeiro.');
  fecharModal(); confirmarExcluir('clientes', id, 'Excluir este cliente?');
};

function formObra(o = {}) {
  if (!db.clientes.length) return '<div class="empty">Cadastre um cliente antes de criar a obra.</div><div class="form-actions"><button type="button" class="btn" data-act="novoCliente">+ Cadastrar cliente</button></div>';
  return `<label>Nome da obra *</label><input name="nome" required value="${esc(o.nome)}" placeholder="Ex.: Casa da Maria — ampliação">
    <label>Cliente *</label><select name="clienteId" required>${opt(db.clientes, o.clienteId, 'Selecione…')}</select>
    <label>Endereço da obra</label><input name="endereco" value="${esc(o.endereco)}">
    <div class="grid grid-2">
      <div><label>Início *</label><input type="date" name="inicio" required value="${o.inicio || cal.sel}"></div>
      <div><label>Término previsto *</label><input type="date" name="fim" required value="${o.fim || o.inicio || cal.sel}"></div>
    </div>
    <div class="grid grid-2">
      <div><label>Status</label><select name="status">${optTxt(STATUS_OBRA, o.status || 'Agendada')}</select></div>
      <div><label>Valor do contrato (R$)</label><input name="valor" inputmode="decimal" value="${o.valor ?? ''}"></div>
    </div>
    <label>Observações</label><textarea name="obs">${esc(o.obs)}</textarea>`;
}
function validarObra(d) {
  if (d.fim < d.inicio) { alert('O término não pode ser antes do início.'); return false; }
  d.valor = num(d.valor);
  return true;
}
actions.novaObra = () => abrirModal('Nova obra', formObra(), db.clientes.length ? d => {
  if (!validarObra(d)) return false;
  db.obras.push({ id: uid(), ...d }); toast('Obra agendada');
} : null);
actions.editObra = ({ id }) => {
  const o = byId('obras', id);
  abrirModal('Editar obra', formObra(o) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delObra" data-id="${id}">Excluir obra</button></div>`, d => {
    if (!validarObra(d)) return false; Object.assign(o, d);
  });
};
actions.delObra = ({ id }) => { fecharModal(); confirmarExcluir('obras', id, 'Excluir esta obra?'); };

// =====================================================
// 2) FATURAMENTO
// =====================================================
let fatAno = new Date().getFullYear();

VIEWS.faturamento = () => {
  const h = hoje();
  const [s1, s2] = rangeSemana(h), [m1, m2] = rangeMes(h), [a1, a2] = rangeAno(h);
  const fat = (a, b) => soma(db.receitas.filter(r => entre(r.data, a, b)));
  const lista = [...db.receitas].sort((a, b) => b.data.localeCompare(a.data));
  const anoLista = lista.filter(r => r.data.startsWith(String(fatAno)));
  return `
  <div class="grid grid-3">
    <div class="stat"><div class="label">Esta semana</div><div class="value">${money(fat(s1, s2))}</div></div>
    <div class="stat"><div class="label">${MESES[new Date().getMonth()]}</div><div class="value">${money(fat(m1, m2))}</div></div>
    <div class="stat hl"><div class="label">Ano ${new Date().getFullYear()}</div><div class="value">${money(fat(a1, a2))}</div></div>
  </div>

  <div class="section-head"><h2>Por semana (últimas 12)</h2></div>
  <div class="card"><div class="chart-box"><canvas id="chSemana"></canvas></div></div>

  <div class="section-head">
    <h2>Por mês</h2>
    <div class="row"><button class="btn sec sm" data-act="fatAno" data-d="-1">‹</button><b>${fatAno}</b><button class="btn sec sm" data-act="fatAno" data-d="1">›</button></div>
  </div>
  <div class="card"><div class="chart-box"><canvas id="chMes"></canvas></div></div>

  <div class="section-head"><h2>Por ano</h2></div>
  <div class="card"><div class="chart-box"><canvas id="chAno"></canvas></div></div>

  <div class="section-head"><h2>Recebimentos de ${fatAno}</h2><button class="btn" data-act="novaReceita">+ Lançar recebimento</button></div>
  <div class="card">${anoLista.length ? anoLista.map(r => `
    <div class="list-item">
      <div class="info"><div class="title">${esc(r.descricao || 'Recebimento')}</div>
        <div class="sub">${br(r.data)}${r.obraId ? ' · ' + esc(byId('obras', r.obraId)?.nome || '') : ''}${r.forma ? ' · ' + esc(r.forma) : ''}</div></div>
      <div class="amount" style="color:var(--ok)">${money(r.valor)}</div>
      <button class="btn ghost sm" data-act="editReceita" data-id="${r.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum recebimento lançado neste ano</div>'}</div>`;
};

function chartBar(id, labels, datasets, opts = {}) {
  const el = document.getElementById(id);
  if (!el || !window.Chart) return;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const cor = dark ? '#a49cbc' : '#6b6480', grade = dark ? '#2f2943' : '#eee9f7';
  charts.push(new Chart(el, {
    type: opts.type || 'bar',
    data: { labels, datasets: datasets.map((d, i) => ({ borderRadius: 6, maxBarThickness: 38, backgroundColor: d.cor || CORES[i], borderColor: d.cor || CORES[i], tension: .3, ...d })) },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1, labels: { color: cor } }, tooltip: { callbacks: { label: c => `${c.dataset.label || ''} ${money(c.parsed.y)}` } } },
      scales: {
        x: { ticks: { color: cor }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: cor, callback: v => v >= 1000 ? 'R$ ' + (v / 1000) + 'k' : 'R$ ' + v }, grid: { color: grade } },
      },
    },
  }));
}

POS.faturamento = () => {
  // semanas
  const labels = [], vals = [];
  let ini = addDias(inicioSemana(hoje()), -77);
  for (let i = 0; i < 12; i++) {
    const fim = addDias(ini, 6);
    labels.push(br(ini).slice(0, 5));
    vals.push(soma(db.receitas.filter(r => entre(r.data, ini, fim))));
    ini = addDias(ini, 7);
  }
  chartBar('chSemana', labels, [{ label: 'Faturamento', data: vals }]);
  // meses (com gastos para comparação)
  const fatM = MESES_C.map((_, m) => soma(db.receitas.filter(r => r.data.startsWith(`${fatAno}-${pad(m + 1)}`))));
  const gasM = MESES_C.map((_, m) => gastosPeriodo(`${fatAno}-${pad(m + 1)}-01`, iso(new Date(fatAno, m + 1, 0))).total);
  chartBar('chMes', MESES_C, [{ label: 'Faturamento', data: fatM, cor: '#7c3aed' }, { label: 'Gastos', data: gasM, cor: '#ec4899' }]);
  // anos
  const anos = [...new Set(db.receitas.map(r => r.data.slice(0, 4)))].sort();
  if (!anos.length) anos.push(String(new Date().getFullYear()));
  chartBar('chAno', anos, [{ label: 'Faturamento', data: anos.map(a => soma(db.receitas.filter(r => r.data.startsWith(a)))) }]);
};

actions.fatAno = d => { fatAno += Number(d.d); render(); };

function formReceita(r = {}) {
  return `<label>Descrição</label><input name="descricao" value="${esc(r.descricao)}" placeholder="Ex.: 2ª parcela da obra">
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${r.data || hoje()}"></div>
      <div><label>Valor (R$) *</label><input name="valor" required inputmode="decimal" value="${r.valor ?? ''}"></div>
    </div>
    <label>Obra (opcional)</label><select name="obraId">${opt(db.obras, r.obraId, 'Sem obra vinculada')}</select>
    <label>Forma de pagamento</label><select name="forma">${optTxt(['PIX', 'Dinheiro', 'Transferência', 'Cartão', 'Boleto', 'Cheque'], r.forma || 'PIX')}</select>`;
}
actions.novaReceita = () => abrirModal('Lançar recebimento', formReceita(), d => { d.valor = num(d.valor); db.receitas.push({ id: uid(), ...d }); toast('Recebimento lançado'); });
actions.editReceita = ({ id }) => {
  const r = byId('receitas', id);
  abrirModal('Editar recebimento', formReceita(r) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delReg" data-lista="receitas" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); Object.assign(r, d); });
};
actions.delReg = ({ lista, id }) => { fecharModal(); confirmarExcluir(lista, id); };

// =====================================================
// 3) VALE COMBUSTÍVEL
// =====================================================
let valeRef = { tipo: 'mes', data: hoje() };

VIEWS.combustivel = () => {
  const [a, b] = rangePor(valeRef.tipo, valeRef.data);
  const vales = db.vales.filter(v => entre(v.data, a, b)).sort((x, y) => y.data.localeCompare(x.data));
  const porFunc = db.funcionarios.map(f => ({ f, t: soma(vales.filter(v => v.funcionarioId === f.id)) })).filter(x => x.t);
  const porPosto = db.postos.map(p => ({ p, t: soma(vales.filter(v => v.postoId === p.id)) })).filter(x => x.t);
  return `
  ${filtroPeriodo(valeRef, 'valeRef')}
  <div class="grid grid-2" style="margin-top:12px">
    <div class="stat hl"><div class="label">Total liberado (${br(a)} a ${br(b)})</div><div class="value">${money(soma(vales))}</div></div>
    <div class="stat"><div class="label">Vales emitidos</div><div class="value">${vales.length}</div></div>
  </div>

  <div class="section-head"><h2>Vales</h2>
    <div class="row">${vales.length ? '<button class="btn sec" data-act="pdfVales">📄 PDF</button>' : ''}<button class="btn" data-act="novoVale">+ Novo vale</button></div></div>
  <div class="card">${vales.length ? vales.map(v => `
    <div class="list-item">
      <span>⛽</span>
      <div class="info"><div class="title">${esc(byId('funcionarios', v.funcionarioId)?.nome || '—')}</div>
        <div class="sub">${br(v.data)} · ${esc(byId('postos', v.postoId)?.nome || '—')}${v.placa ? ' · ' + esc(v.placa) : ''}${v.obs ? ' · ' + esc(v.obs) : ''}</div></div>
      <div class="amount">${money(v.valor)}</div>
      <button class="btn ghost sm" data-act="pdfVale" data-id="${v.id}" title="Emitir vale">🧾</button>
      <button class="btn ghost sm" data-act="editVale" data-id="${v.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum vale no período</div>'}</div>

  ${porFunc.length ? `<div class="grid grid-2">
    <div class="card"><b>Por colaborador</b>${porFunc.map(x => `<div class="list-item"><div class="info">${esc(x.f.nome)}</div><div class="amount">${money(x.t)}</div></div>`).join('')}</div>
    <div class="card"><b>Por posto</b>${porPosto.map(x => `<div class="list-item"><div class="info">${esc(x.p.nome)}</div><div class="amount">${money(x.t)}</div></div>`).join('')}</div>
  </div>` : ''}

  <div class="section-head"><h2>Postos de combustível</h2><button class="btn sec" data-act="novoPosto">+ Posto</button></div>
  <div class="card">${db.postos.length ? db.postos.map(p => `
    <div class="list-item"><div class="info"><div class="title">${esc(p.nome)}</div><div class="sub">${esc(p.endereco)} ${p.telefone ? '· ' + esc(p.telefone) : ''}</div></div>
    <button class="btn ghost sm" data-act="editPosto" data-id="${p.id}">Editar</button></div>`).join('') : '<div class="empty">Cadastre os postos conveniados</div>'}</div>
  <p class="muted" style="font-size:13px">Os colaboradores são cadastrados na aba <b>Pagamentos</b>.</p>`;
};

function rangePor(tipo, data) {
  return tipo === 'semana' ? rangeSemana(data) : tipo === 'quinzena' ? rangeQuinzena(data) : tipo === 'ano' ? rangeAno(data) : rangeMes(data);
}
function filtroPeriodo(ref, nome, tipos = ['semana', 'quinzena', 'mes']) {
  const rot = { semana: 'Semana', quinzena: 'Quinzena', mes: 'Mês', ano: 'Ano' };
  return `<div class="card"><div class="inline-filters">
    <div><label>Período</label><div class="seg">${tipos.map(t => `<button type="button" class="${ref.tipo === t ? 'active' : ''}" data-act="setPeriodo" data-ref="${nome}" data-tipo="${t}">${rot[t]}</button>`).join('')}</div></div>
    <div><label>Data de referência</label><input type="date" value="${ref.data}" data-change="setPeriodoData" data-ref="${nome}"></div>
  </div></div>`;
}
const REFS = { valeRef: () => valeRef, gastoRef: () => gastoRef };
actions.setPeriodo = d => { REFS[d.ref]().tipo = d.tipo; render(); };
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.change === 'setPeriodoData' && el.value) { REFS[el.dataset.ref]().data = el.value; render(); }
  if (el.dataset.change && changeActions[el.dataset.change]) changeActions[el.dataset.change](el);
});
const changeActions = {};

function formVale(v = {}) {
  if (!db.funcionarios.length || !db.postos.length) {
    return `<div class="empty">Para emitir vales, cadastre ao menos ${!db.funcionarios.length ? 'um colaborador (aba Pagamentos)' : ''}${!db.funcionarios.length && !db.postos.length ? ' e ' : ''}${!db.postos.length ? 'um posto' : ''}.</div>`;
  }
  return `<label>Colaborador *</label><select name="funcionarioId" required>${opt(db.funcionarios.filter(f => f.ativo !== false || f.id === v.funcionarioId), v.funcionarioId, 'Selecione…')}</select>
    <label>Posto *</label><select name="postoId" required>${opt(db.postos, v.postoId, 'Selecione…')}</select>
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${v.data || hoje()}"></div>
      <div><label>Valor liberado (R$) *</label><input name="valor" required inputmode="decimal" value="${v.valor ?? ''}"></div>
    </div>
    <label>Veículo / placa</label><input name="placa" value="${esc(v.placa)}">
    <label>Observação</label><input name="obs" value="${esc(v.obs)}" placeholder="Ex.: ida à obra do Centro">`;
}
const okVale = () => db.funcionarios.length && db.postos.length;
actions.novoVale = () => abrirModal('Novo vale combustível', formVale(), okVale() ? d => { d.valor = num(d.valor); db.vales.push({ id: uid(), ...d }); toast('Vale liberado'); } : null);
actions.editVale = ({ id }) => {
  const v = byId('vales', id);
  abrirModal('Editar vale', formVale(v) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delReg" data-lista="vales" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); Object.assign(v, d); });
};
function formPosto(p = {}) {
  return `<label>Nome do posto *</label><input name="nome" required value="${esc(p.nome)}">
    <label>Endereço</label><input name="endereco" value="${esc(p.endereco)}">
    <label>Telefone</label><input name="telefone" inputmode="tel" value="${esc(p.telefone)}">`;
}
actions.novoPosto = () => abrirModal('Novo posto', formPosto(), d => { db.postos.push({ id: uid(), ...d }); });
actions.editPosto = ({ id }) => {
  const p = byId('postos', id);
  abrirModal('Editar posto', formPosto(p) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delPosto" data-id="${id}">Excluir posto</button></div>`, d => Object.assign(p, d));
};
actions.delPosto = ({ id }) => {
  if (db.vales.some(v => v.postoId === id)) return alert('Existem vales neste posto. Exclua os vales primeiro.');
  fecharModal(); confirmarExcluir('postos', id);
};

// =====================================================
// 4) ORÇAMENTOS
// =====================================================
let orcEdit = null; // rascunho em edição
let orcBusca = '';

VIEWS.orcamentos = () => {
  if (orcEdit) return viewEditorOrc();
  const lista = [...db.orcamentos].sort((a, b) => b.numero - a.numero);
  return `
  <div class="section-head mt0"><h2>Orçamentos (${lista.length})</h2>
    <div class="row"><button class="btn sec" data-act="verCatalogo">📦 Itens cadastrados</button><button class="btn" data-act="novoOrc">+ Novo orçamento</button></div></div>
  <div class="card">${lista.length ? lista.map(o => `
    <div class="list-item">
      <div class="info"><div class="title">Nº ${o.numero} · ${esc(nomeCliente(o.clienteId))}</div>
        <div class="sub">${br(o.data)}${o.obraId ? ' · ' + esc(byId('obras', o.obraId)?.nome || '') : ''} · ${o.itens.length} itens</div></div>
      <div style="text-align:right"><span class="badge ${o.status === 'Aprovado' ? 'ok' : o.status === 'Recusado' ? 'gray' : 'warn'}">${esc(o.status || 'Pendente')}</span>
        <div class="amount" style="margin-top:4px">${money(totalOrc(o))}</div></div>
      <button class="btn wa sm" data-act="enviarOrc" data-id="${o.id}">📄 PDF</button>
      <button class="btn ghost sm" data-act="editOrc" data-id="${o.id}">Abrir</button>
    </div>`).join('') : '<div class="empty">Nenhum orçamento criado</div>'}</div>`;
};

const subtotalOrc = o => o.itens.reduce((t, i) => t + num(i.qtd) * num(i.preco), 0);
const totalOrc = o => Math.max(0, subtotalOrc(o) - num(o.desconto));

function novoRascunho(base) {
  const r = base ? JSON.parse(JSON.stringify(base)) : {
    id: null, numero: null, clienteId: '', obraId: '', data: hoje(), validade: addDias(hoje(), 15),
    itens: [], desconto: 0, obs: '', status: 'Pendente',
  };
  // monta linhas: catálogo inteiro (qtd 0) + itens já usados
  const linhas = db.catalogo.map(c => {
    const usado = r.itens.find(i => i.catalogoId === c.id);
    return { catalogoId: c.id, tipo: c.tipo, nome: c.nome, unidade: c.unidade, preco: usado ? usado.preco : c.preco, qtd: usado ? usado.qtd : '' };
  });
  r.itens.filter(i => !i.catalogoId || !db.catalogo.some(c => c.id === i.catalogoId)).forEach(i => linhas.push({ ...i, catalogoId: null, avulso: true }));
  r.linhas = linhas;
  return r;
}

function viewEditorOrc() {
  const o = orcEdit;
  const obrasCli = db.obras.filter(x => !o.clienteId || x.clienteId === o.clienteId);
  const linha = (l, idx) => {
    const tot = num(l.qtd) * num(l.preco);
    const vis = !orcBusca || l.nome.toLowerCase().includes(orcBusca.toLowerCase()) || num(l.qtd) > 0;
    return `<div class="orc-item ${num(l.qtd) > 0 ? 'has' : ''}" data-linha="${idx}" ${vis ? '' : 'hidden'}>
      <div class="nm">${l.avulso ? `<input data-f="nome" value="${esc(l.nome)}" placeholder="Descrição do item/serviço"><input data-f="unidade" value="${esc(l.unidade)}" placeholder="unidade" style="margin-top:4px">` : `${esc(l.nome)}<small>${esc(l.unidade)}</small>`}</div>
      <input data-f="qtd" inputmode="decimal" value="${l.qtd}" placeholder="Qtd">
      <input data-f="preco" inputmode="decimal" value="${l.preco}" placeholder="R$">
      <div class="tot" data-tot>${tot ? money(tot) : '—'}${l.avulso ? ` <button type="button" class="btn danger sm" data-act="rmLinha" data-i="${idx}">✕</button>` : ''}</div>
    </div>`;
  };
  const head = '<div class="orc-item head"><div>Item</div><div>Qtd</div><div>Valor unit.</div><div class="tot">Total</div></div>';
  const mats = o.linhas.map((l, i) => [l, i]).filter(([l]) => !l.avulso && l.tipo === 'material');
  const servs = o.linhas.map((l, i) => [l, i]).filter(([l]) => !l.avulso && l.tipo !== 'material');
  const avs = o.linhas.map((l, i) => [l, i]).filter(([l]) => l.avulso);
  return `
  <div class="row"><button class="btn ghost" data-act="sairOrc">‹ Voltar</button><div class="spacer"></div>
    ${o.id ? `<button class="btn danger" data-act="delOrc">Excluir</button>` : ''}</div>
  <div class="section-head"><h2>${o.id ? 'Orçamento Nº ' + o.numero : 'Novo orçamento'}</h2></div>
  <div class="card">
    <div class="grid grid-2">
      <div><label class="muted" style="font-size:13px">Cliente *</label>
        <div class="row" style="flex-wrap:nowrap"><select data-o="clienteId">${opt(db.clientes, o.clienteId, 'Selecione…')}</select><button class="btn sec sm" data-act="novoCliente" title="Novo cliente">+</button></div></div>
      <div><label class="muted" style="font-size:13px">Obra (opcional)</label><select data-o="obraId">${opt(obrasCli, o.obraId, 'Sem obra vinculada')}</select></div>
      <div><label class="muted" style="font-size:13px">Data</label><input type="date" data-o="data" value="${o.data}"></div>
      <div><label class="muted" style="font-size:13px">Validade</label><input type="date" data-o="validade" value="${o.validade}"></div>
      <div><label class="muted" style="font-size:13px">Status</label><select data-o="status">${optTxt(['Pendente', 'Aprovado', 'Recusado'], o.status)}</select></div>
      <div><label class="muted" style="font-size:13px">Desconto (R$)</label><input data-o="desconto" inputmode="decimal" value="${o.desconto || ''}"></div>
    </div>
  </div>

  <div class="card">
    <input id="orcBusca" placeholder="🔎 Buscar item…" value="${esc(orcBusca)}">
    <p class="muted" style="font-size:13px;margin:8px 0 0">Preencha só as quantidades. O valor unitário já vem do cadastro e pode ser ajustado neste orçamento.</p>
    <h4 style="margin:14px 0 4px">🧱 Materiais</h4>${head}${mats.map(([l, i]) => linha(l, i)).join('')}
    <h4 style="margin:18px 0 4px">🛠️ Serviços</h4>${head}${servs.map(([l, i]) => linha(l, i)).join('')}
    <h4 style="margin:18px 0 4px">➕ Itens / serviços avulsos</h4>${avs.length ? head + avs.map(([l, i]) => linha(l, i)).join('') : '<p class="muted" style="font-size:13px">Nenhum item avulso.</p>'}
    <button class="btn sec" style="margin-top:10px" data-act="addAvulso">+ Adicionar item ou serviço não cadastrado</button>
    <label class="muted" style="font-size:13px;display:block;margin-top:14px">Observações / condições de pagamento</label>
    <textarea data-o="obs" placeholder="Ex.: 50% na entrada e 50% na entrega">${esc(o.obs)}</textarea>
  </div>

  <div class="total-bar">
    <div><div class="muted" style="font-size:12px">Total do orçamento</div><div class="big" id="orcTotal">${money(totalRasc())}</div></div>
    <div class="spacer"></div>
    <button class="btn" data-act="salvarOrc">💾 Salvar</button>
    <button class="btn wa" data-act="salvarEnviarOrc">📲 Salvar e enviar PDF</button>
  </div>`;
}

function totalRasc() {
  const sub = orcEdit.linhas.reduce((t, l) => t + num(l.qtd) * num(l.preco), 0);
  return Math.max(0, sub - num(orcEdit.desconto));
}

document.addEventListener('input', e => {
  const el = e.target;
  if (!orcEdit || aba !== 'orcamentos') return;
  if (el.id === 'orcBusca') {
    orcBusca = el.value;
    const q = orcBusca.toLowerCase();
    document.querySelectorAll('.orc-item[data-linha]').forEach(row => {
      const l = orcEdit.linhas[row.dataset.linha];
      row.hidden = !(!q || l.nome.toLowerCase().includes(q) || num(l.qtd) > 0);
    });
    return;
  }
  if (el.dataset.o) {
    orcEdit[el.dataset.o] = el.value;
    if (el.dataset.o === 'desconto') document.getElementById('orcTotal').textContent = money(totalRasc());
    return;
  }
  const row = el.closest('[data-linha]');
  if (row && el.dataset.f) {
    const l = orcEdit.linhas[row.dataset.linha];
    l[el.dataset.f] = el.value;
    const tot = num(l.qtd) * num(l.preco);
    row.querySelector('[data-tot]').firstChild.textContent = tot ? money(tot) : '—';
    row.classList.toggle('has', num(l.qtd) > 0);
    document.getElementById('orcTotal').textContent = money(totalRasc());
  }
});
changeActions.noop = () => {};
document.addEventListener('change', e => {
  if (orcEdit && e.target.dataset.o === 'clienteId') { orcEdit.obraId = ''; render(); }
});

actions.novoOrc = () => { orcBusca = ''; orcEdit = novoRascunho(); render(); window.scrollTo(0, 0); };
actions.editOrc = ({ id }) => { orcBusca = ''; orcEdit = novoRascunho(byId('orcamentos', id)); render(); window.scrollTo(0, 0); };
actions.sairOrc = () => { if (confirm('Sair sem salvar as alterações?')) { orcEdit = null; render(); } };
actions.addAvulso = () => { orcEdit.linhas.push({ avulso: true, nome: '', unidade: 'unid', qtd: 1, preco: '' }); render(); };
actions.rmLinha = ({ i }) => { orcEdit.linhas.splice(Number(i), 1); render(); };
actions.delOrc = () => {
  if (!confirm('Excluir este orçamento?')) return;
  db.orcamentos = db.orcamentos.filter(x => x.id !== orcEdit.id); orcEdit = null; salvar(); render();
};

function gravarOrc() {
  const o = orcEdit;
  if (!o.clienteId) { alert('Selecione o cliente.'); return null; }
  const itens = o.linhas.filter(l => num(l.qtd) > 0 && (l.nome || '').trim())
    .map(l => ({ catalogoId: l.catalogoId || null, tipo: l.tipo || 'avulso', nome: l.nome.trim(), unidade: l.unidade, qtd: num(l.qtd), preco: num(l.preco) }));
  if (!itens.length) { alert('Informe a quantidade de pelo menos um item.'); return null; }
  const reg = { id: o.id || uid(), numero: o.numero || (Math.max(0, ...db.orcamentos.map(x => x.numero)) + 1), clienteId: o.clienteId, obraId: o.obraId,
    data: o.data, validade: o.validade, status: o.status, desconto: num(o.desconto), obs: o.obs, itens };
  const idx = db.orcamentos.findIndex(x => x.id === reg.id);
  if (idx >= 0) db.orcamentos[idx] = reg; else db.orcamentos.push(reg);
  salvar(); orcEdit = null; render(); toast('Orçamento salvo');
  return reg;
}
actions.salvarOrc = () => gravarOrc();
actions.salvarEnviarOrc = () => { const r = gravarOrc(); if (r) enviarPdfOrc(r); };
actions.enviarOrc = ({ id }) => enviarPdfOrc(byId('orcamentos', id));

// Catálogo de itens
actions.verCatalogo = () => {
  const lin = c => `<div class="list-item"><div class="info"><div class="title">${esc(c.nome)}</div><div class="sub">${c.tipo === 'material' ? 'Material' : 'Serviço'} · ${esc(c.unidade)}</div></div>
    <div class="amount">${money(c.preco)}</div><button type="button" class="btn ghost sm" data-act="editItemCat" data-id="${c.id}">Editar</button></div>`;
  abrirModal('Itens cadastrados', `<button type="button" class="btn" data-act="novoItemCat">+ Cadastrar item</button>
    <h4>🧱 Materiais</h4>${db.catalogo.filter(c => c.tipo === 'material').map(lin).join('') || '<div class="empty">—</div>'}
    <h4>🛠️ Serviços</h4>${db.catalogo.filter(c => c.tipo !== 'material').map(lin).join('') || '<div class="empty">—</div>'}`, null);
};
function formItemCat(c = {}) {
  return `<label>Nome *</label><input name="nome" required value="${esc(c.nome)}" placeholder="Ex.: Cimento CP-II 50kg">
    <div class="grid grid-2">
      <div><label>Tipo</label><select name="tipo"><option value="material" ${c.tipo !== 'servico' ? 'selected' : ''}>Material</option><option value="servico" ${c.tipo === 'servico' ? 'selected' : ''}>Serviço</option></select></div>
      <div><label>Unidade</label><input name="unidade" value="${esc(c.unidade || 'unid')}"></div>
    </div>
    <label>Valor unitário (R$) *</label><input name="preco" required inputmode="decimal" value="${c.preco ?? ''}">`;
}
actions.novoItemCat = () => abrirModal('Cadastrar item', formItemCat(), d => { d.preco = num(d.preco); db.catalogo.push({ id: uid(), ...d }); salvar(); setTimeout(actions.verCatalogo); });
actions.editItemCat = ({ id }) => {
  const c = db.catalogo.find(x => x.id === id);
  abrirModal('Editar item', formItemCat(c) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delItemCat" data-id="${id}">Excluir item</button></div>`,
    d => { d.preco = num(d.preco); Object.assign(c, d); salvar(); setTimeout(actions.verCatalogo); });
};
actions.delItemCat = ({ id }) => {
  if (!confirm('Excluir este item do cadastro? (Orçamentos antigos não são alterados)')) return;
  db.catalogo = db.catalogo.filter(x => x.id !== id); salvar(); actions.verCatalogo();
};

// ---------- PDF ----------
function novoPdf(titulo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const c = db.config;
  doc.setFillColor(124, 58, 237); doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(c.empresa || 'Construtora JR', 14, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text([c.cnpj ? 'CNPJ: ' + c.cnpj : '', c.telefone ? 'Tel/WhatsApp: ' + c.telefone : '', c.endereco || ''].filter(Boolean).join('   ·   '), 14, 22);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(titulo, 196, 14, { align: 'right' });
  doc.setTextColor(30); doc.setFont('helvetica', 'normal');
  return doc;
}
function rodapePdf(doc) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · Página ${i} de ${n}`, 105, 290, { align: 'center' });
  }
}
const corTabela = { headStyles: { fillColor: [124, 58, 237] }, styles: { fontSize: 9 }, alternateRowStyles: { fillColor: [246, 244, 251] } };

async function compartilharPdf(doc, arquivo, telefone, texto) {
  const blob = doc.output('blob');
  const file = new File([blob], arquivo, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: arquivo, text: texto }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  doc.save(arquivo);
  if (telefone !== undefined) {
    const fone = foneWa(telefone);
    setTimeout(() => window.open(`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`, '_blank'), 600);
    toast('PDF baixado — anexe o arquivo na conversa do WhatsApp');
  }
}

function enviarPdfOrc(o) {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF. Tente novamente conectado.');
  const cli = byId('clientes', o.clienteId) || {};
  const obra = byId('obras', o.obraId);
  const doc = novoPdf(`ORÇAMENTO Nº ${o.numero}`);
  doc.setFontSize(10);
  let y = 40;
  doc.setFont('helvetica', 'bold'); doc.text('Cliente:', 14, y); doc.setFont('helvetica', 'normal'); doc.text(cli.nome || '—', 32, y);
  doc.text(`Data: ${br(o.data)}     Validade: ${br(o.validade)}`, 196, y, { align: 'right' });
  y += 6;
  if (cli.telefone) { doc.text(`Telefone: ${cli.telefone}`, 14, y); y += 6; }
  if (obra || cli.endereco) { doc.text(`Obra: ${obra ? obra.nome : ''}${(obra?.endereco || cli.endereco) ? ' — ' + (obra?.endereco || cli.endereco) : ''}`, 14, y); y += 6; }

  const grupo = (titulo, itens) => itens.length ? [[{ content: titulo, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [237, 233, 254] } }],
    ...itens.map(i => [i.nome, i.unidade, String(i.qtd).replace('.', ','), money(i.preco), money(i.qtd * i.preco)])] : [];
  const body = [
    ...grupo('Materiais', o.itens.filter(i => i.tipo === 'material')),
    ...grupo('Serviços', o.itens.filter(i => i.tipo === 'servico')),
    ...grupo('Outros itens / serviços', o.itens.filter(i => i.tipo !== 'material' && i.tipo !== 'servico')),
  ];
  const foot = [['', '', '', 'Subtotal', money(subtotalOrc(o))]];
  if (num(o.desconto)) foot.push(['', '', '', 'Desconto', '- ' + money(o.desconto)]);
  foot.push(['', '', '', 'TOTAL', money(totalOrc(o))]);
  doc.autoTable({
    startY: y + 2, head: [['Descrição', 'Unid.', 'Qtd', 'Valor unit.', 'Total']], body, foot, ...corTabela,
    footStyles: { fillColor: [255, 255, 255], textColor: 30, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
  });
  let fy = doc.lastAutoTable.finalY + 10;
  if (o.obs) {
    doc.setFont('helvetica', 'bold'); doc.text('Observações:', 14, fy); doc.setFont('helvetica', 'normal');
    const linhas = doc.splitTextToSize(o.obs, 182); doc.text(linhas, 14, fy + 5); fy += 8 + linhas.length * 4.5;
  }
  doc.setFontSize(9); doc.setTextColor(110);
  doc.text(`Orçamento válido até ${br(o.validade)}.`, 14, Math.min(fy + 4, 270));
  rodapePdf(doc);
  const arq = `Orcamento_${o.numero}_${(cli.nome || 'cliente').replace(/[^\wÀ-ú]+/g, '_')}.pdf`;
  compartilharPdf(doc, arq, cli.telefone || '', `Olá ${cli.nome || ''}! Segue o orçamento Nº ${o.numero} da ${db.config.empresa}, no valor de ${money(totalOrc(o))}.`);
}

// =====================================================
// 5) FUNCIONÁRIOS E PAGAMENTO
// =====================================================
const agora = new Date();
let pag = { tipo: agora.getDate() <= 15 ? 'q1' : 'q2', mes: `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`, descontarVales: false };

function periodoPag() {
  const [y, m] = pag.mes.split('-').map(Number);
  const ult = ultimoDia(y, m - 1);
  const a = pag.tipo === 'q2' ? 16 : 1, b = pag.tipo === 'q1' ? 15 : ult;
  return [`${pag.mes}-${pad(a)}`, `${pag.mes}-${pad(b)}`];
}
function diasUteis(a, b) {
  let n = 0;
  for (let d = a; d <= b; d = addDias(d, 1)) {
    const w = parse(d).getDay();
    if (w === 0) continue;
    if (w === 6 && !db.config.trabalhaSabado) continue;
    n++;
  }
  return n;
}
function folha(a, b, descontarVales = false, ateHoje = false) {
  if (ateHoje && b > hoje()) b = hoje();
  const uteis = diasUteis(a, b);
  return db.funcionarios.filter(f => f.ativo !== false).map(f => {
    // considera só o período em que o funcionário estava admitido
    const adm = f.admissao || f.criadoEm || '';
    const ini = adm > a ? adm : a;
    const dias = ini > b ? 0 : diasUteis(ini, b);
    const fs = db.faltas.filter(x => x.funcionarioId === f.id && entre(x.data, ini, b));
    const faltas = fs.reduce((t, x) => t + (x.tipo === 'meia' ? 0.5 : 1), 0);
    const trab = Math.max(0, dias - faltas);
    const bruto = trab * num(f.diaria);
    const vales = soma(db.vales.filter(v => v.funcionarioId === f.id && entre(v.data, a, b)));
    const desc = descontarVales ? vales : 0;
    return { f, uteis, dias, faltas, trab, bruto, vales, desc, liquido: bruto - desc, listaFaltas: fs };
  });
}

VIEWS.funcionarios = () => {
  const [a, b] = periodoPag();
  const linhas = folha(a, b, pag.descontarVales);
  const total = linhas.reduce((t, l) => t + l.liquido, 0);
  const faltasPeriodo = db.faltas.filter(x => entre(x.data, a, b)).sort((x, y) => y.data.localeCompare(x.data));
  return `
  <div class="card">
    <div class="inline-filters">
      <div><label>Tipo de pagamento</label><div class="seg">
        <button type="button" class="${pag.tipo === 'q1' ? 'active' : ''}" data-act="pagTipo" data-t="q1">1ª quinzena</button>
        <button type="button" class="${pag.tipo === 'q2' ? 'active' : ''}" data-act="pagTipo" data-t="q2">2ª quinzena</button>
        <button type="button" class="${pag.tipo === 'mes' ? 'active' : ''}" data-act="pagTipo" data-t="mes">Mensal</button>
      </div></div>
      <div><label>Mês</label><input type="month" value="${pag.mes}" data-change="pagMes"></div>
    </div>
    <label class="check"><input type="checkbox" ${pag.descontarVales ? 'checked' : ''} data-change="pagVales"> Descontar vales combustível do pagamento</label>
    <label class="check"><input type="checkbox" ${db.config.trabalhaSabado ? 'checked' : ''} data-change="pagSabado"> Sábado conta como dia de trabalho</label>
  </div>

  <div class="grid grid-2">
    <div class="stat hl"><div class="label">Total a pagar · ${br(a)} a ${br(b)}</div><div class="value">${money(total)}</div></div>
    <div class="stat"><div class="label">Dias úteis no período</div><div class="value">${diasUteis(a, b)}</div></div>
  </div>

  <div class="section-head"><h2>Relatório de pagamento</h2>
    <div class="row"><button class="btn sec" data-act="lancarFalta">+ Lançar falta</button>${linhas.length ? '<button class="btn wa" data-act="pdfFolha">📄 Relatório PDF</button>' : ''}</div></div>
  <div class="card table-wrap">${linhas.length ? `<table>
    <thead><tr><th>Funcionário</th><th class="num">Diária</th><th class="num">Dias</th><th class="num">Faltas</th><th class="num">Trab.</th>${pag.descontarVales ? '<th class="num">Vales</th>' : ''}<th class="num">A pagar</th></tr></thead>
    <tbody>${linhas.map(l => `<tr><td><b>${esc(l.f.nome)}</b><br><small class="muted">${esc(l.f.funcao || '')}</small></td>
      <td class="num">${money(l.f.diaria)}</td><td class="num">${l.dias}</td><td class="num">${String(l.faltas).replace('.', ',')}</td><td class="num">${String(l.trab).replace('.', ',')}</td>
      ${pag.descontarVales ? `<td class="num">-${money(l.desc)}</td>` : ''}<td class="num"><b>${money(l.liquido)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="${pag.descontarVales ? 6 : 5}">Total</td><td class="num">${money(total)}</td></tr></tfoot>
  </table>` : '<div class="empty">Cadastre os funcionários para gerar o relatório</div>'}</div>

  <div class="section-head"><h2>Faltas no período (${faltasPeriodo.length})</h2></div>
  <div class="card">${faltasPeriodo.length ? faltasPeriodo.map(x => `
    <div class="list-item"><div class="info"><div class="title">${esc(byId('funcionarios', x.funcionarioId)?.nome || '—')}</div>
      <div class="sub">${br(x.data)} · ${x.tipo === 'meia' ? 'Meio dia' : 'Dia inteiro'}${x.obs ? ' · ' + esc(x.obs) : ''}</div></div>
      <button class="btn danger sm" data-act="delFalta" data-id="${x.id}">Remover</button></div>`).join('') : '<div class="empty">Nenhuma falta lançada</div>'}</div>

  <div class="section-head"><h2>Funcionários (${db.funcionarios.length})</h2><button class="btn" data-act="novoFunc">+ Funcionário</button></div>
  <div class="card">${db.funcionarios.length ? db.funcionarios.map(f => `
    <div class="list-item" ${f.ativo === false ? 'style="opacity:.55"' : ''}>
      <div class="info"><div class="title">${esc(f.nome)} ${f.ativo === false ? '<span class="badge gray">Inativo</span>' : ''}</div>
        <div class="sub">${esc(f.funcao || '')} · Diária ${money(f.diaria)}${f.pix ? ' · PIX: ' + esc(f.pix) : ''}</div></div>
      <button class="btn sec sm" data-act="lancarFalta" data-id="${f.id}">Falta</button>
      <button class="btn ghost sm" data-act="editFunc" data-id="${f.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum funcionário cadastrado</div>'}</div>`;
};

actions.pagTipo = d => { pag.tipo = d.t; render(); };
changeActions.pagMes = el => { if (el.value) { pag.mes = el.value; render(); } };
changeActions.pagVales = el => { pag.descontarVales = el.checked; render(); };
changeActions.pagSabado = el => { db.config.trabalhaSabado = el.checked; salvar(); render(); };

function formFunc(f = {}) {
  return `<label>Nome *</label><input name="nome" required value="${esc(f.nome)}">
    <div class="grid grid-2">
      <div><label>Função</label><input name="funcao" value="${esc(f.funcao)}" placeholder="Pedreiro, servente…" list="funcoes"></div>
      <div><label>Valor da diária (R$) *</label><input name="diaria" required inputmode="decimal" value="${f.diaria ?? ''}"></div>
    </div>
    <datalist id="funcoes"><option>Pedreiro</option><option>Servente</option><option>Mestre de obras</option><option>Eletricista</option><option>Encanador</option><option>Pintor</option><option>Carpinteiro</option><option>Armador</option></datalist>
    <div class="grid grid-2">
      <div><label>Telefone</label><input name="telefone" inputmode="tel" value="${esc(f.telefone)}"></div>
      <div><label>Data de admissão</label><input type="date" name="admissao" value="${f.admissao || (f.id ? '' : hoje())}"></div>
    </div>
    <label>Chave PIX</label><input name="pix" value="${esc(f.pix)}">
    <label class="check"><input type="checkbox" name="ativo" ${f.ativo !== false ? 'checked' : ''}> Funcionário ativo</label>`;
}
actions.novoFunc = () => abrirModal('Novo funcionário', formFunc(), d => { d.diaria = num(d.diaria); db.funcionarios.push({ id: uid(), criadoEm: hoje(), ...d }); toast('Funcionário cadastrado'); });
actions.editFunc = ({ id }) => {
  const f = byId('funcionarios', id);
  abrirModal('Editar funcionário', formFunc(f) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delFunc" data-id="${id}">Excluir funcionário</button></div>`, d => { d.diaria = num(d.diaria); Object.assign(f, d); });
};
actions.delFunc = ({ id }) => {
  if (db.vales.some(v => v.funcionarioId === id) || db.faltas.some(v => v.funcionarioId === id))
    return alert('Este funcionário tem vales ou faltas lançados. Marque-o como inativo em vez de excluir.');
  fecharModal(); confirmarExcluir('funcionarios', id);
};
actions.lancarFalta = d => {
  if (!db.funcionarios.length) return alert('Cadastre os funcionários primeiro.');
  abrirModal('Lançar falta', `<label>Funcionário *</label><select name="funcionarioId" required>${opt(db.funcionarios.filter(f => f.ativo !== false), d.id, 'Selecione…')}</select>
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${hoje()}"></div>
      <div><label>Tipo</label><select name="tipo"><option value="dia">Dia inteiro</option><option value="meia">Meio dia</option></select></div>
    </div>
    <label>Motivo</label><input name="obs">`, f => {
    if (db.faltas.some(x => x.funcionarioId === f.funcionarioId && x.data === f.data)) { alert('Já existe falta lançada neste dia para este funcionário.'); return false; }
    db.faltas.push({ id: uid(), ...f }); toast('Falta lançada');
  });
};
actions.delFalta = ({ id }) => confirmarExcluir('faltas', id, 'Remover esta falta?');

actions.pdfFolha = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = periodoPag();
  const linhas = folha(a, b, pag.descontarVales);
  const [y, m] = pag.mes.split('-').map(Number);
  const nomeTipo = pag.tipo === 'mes' ? 'MENSAL' : pag.tipo === 'q1' ? '1ª QUINZENA' : '2ª QUINZENA';
  const doc = novoPdf(`PAGAMENTO ${nomeTipo}`);
  doc.setFontSize(10);
  doc.text(`Período: ${br(a)} a ${br(b)} (${MESES[m - 1]}/${y})  ·  Dias úteis: ${diasUteis(a, b)}${db.config.trabalhaSabado ? ' (seg a sáb)' : ' (seg a sex)'}`, 14, 40);
  const head = ['Funcionário', 'Função', 'Diária', 'Dias', 'Faltas', 'Trabalhados', ...(pag.descontarVales ? ['Vales'] : []), 'A pagar', 'PIX'];
  const body = linhas.map(l => [l.f.nome, l.f.funcao || '', money(l.f.diaria), l.dias, String(l.faltas).replace('.', ','), String(l.trab).replace('.', ','),
    ...(pag.descontarVales ? ['-' + money(l.desc)] : []), money(l.liquido), l.f.pix || '']);
  const total = linhas.reduce((t, l) => t + l.liquido, 0);
  const cols = head.length;
  doc.autoTable({
    startY: 45, head: [head], body, ...corTabela,
    foot: [[{ content: 'TOTAL', colSpan: cols - 2 }, money(total), '']],
    footStyles: { fillColor: [237, 233, 254], textColor: 30, fontStyle: 'bold' },
  });
  // detalhamento das faltas
  const det = linhas.flatMap(l => l.listaFaltas.map(x => [l.f.nome, br(x.data), x.tipo === 'meia' ? 'Meio dia' : 'Dia inteiro', x.obs || '']));
  if (det.length) {
    doc.setFontSize(11); doc.text('Faltas no período', 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 13, head: [['Funcionário', 'Data', 'Tipo', 'Motivo']], body: det, ...corTabela });
  }
  rodapePdf(doc);
  compartilharPdf(doc, `Pagamento_${nomeTipo.replace(/\W+/g, '_')}_${pag.mes}.pdf`, undefined, `Relatório de pagamento ${nomeTipo.toLowerCase()} — ${br(a)} a ${br(b)}: ${money(total)}`);
};

// =====================================================
// 6) GASTOS
// =====================================================
let gastoRef = { tipo: 'mes', data: hoje() };

function gastosPeriodo(a, b) {
  const desp = db.despesas.filter(d => entre(d.data, a, b));
  const vales = soma(db.vales.filter(v => entre(v.data, a, b)));
  const folhaT = folha(a, b, false, true).reduce((t, l) => t + l.bruto, 0);
  const porCat = {};
  desp.forEach(d => (porCat[d.categoria] = (porCat[d.categoria] || 0) + num(d.valor)));
  const despT = soma(desp);
  return { desp, vales, folha: folhaT, despT, porCat, total: despT + vales + folhaT };
}

VIEWS.gastos = () => {
  const [a, b] = rangePor(gastoRef.tipo, gastoRef.data);
  const g = gastosPeriodo(a, b);
  const fat = soma(db.receitas.filter(r => entre(r.data, a, b)));
  const saldo = fat - g.total;
  // resumo rápido dos 3 períodos atuais
  const rapido = ['semana', 'quinzena', 'mes'].map(t => { const [x, y] = rangePor(t, hoje()); return { t, v: gastosPeriodo(x, y).total }; });
  const rot = { semana: 'Esta semana', quinzena: 'Esta quinzena', mes: 'Este mês' };
  return `
  <div class="grid grid-3">${rapido.map(r => `<div class="stat"><div class="label">${rot[r.t]}</div><div class="value">${money(r.v)}</div></div>`).join('')}</div>
  <div style="margin-top:12px">${filtroPeriodo(gastoRef, 'gastoRef')}</div>

  <div class="section-head"><h2>${br(a)} a ${br(b)}</h2></div>
  <div class="grid grid-3">
    <div class="stat"><div class="label">Faturamento</div><div class="value" style="color:var(--ok)">${money(fat)}</div></div>
    <div class="stat"><div class="label">Gastos totais</div><div class="value" style="color:var(--danger)">${money(g.total)}</div></div>
    <div class="stat hl"><div class="label">Saldo</div><div class="value">${money(saldo)}</div></div>
  </div>

  <div class="grid grid-2" style="margin-top:12px">
    <div class="card">
      <b>Composição dos gastos</b>
      <div class="list-item"><div class="info">👷 Mão de obra (diárias − faltas)</div><div class="amount">${money(g.folha)}</div></div>
      <div class="list-item"><div class="info">⛽ Vales combustível</div><div class="amount">${money(g.vales)}</div></div>
      ${Object.entries(g.porCat).map(([c, v]) => `<div class="list-item"><div class="info">🧾 ${esc(c)}</div><div class="amount">${money(v)}</div></div>`).join('')}
      <div class="list-item"><div class="info"><b>Total</b></div><div class="amount">${money(g.total)}</div></div>
    </div>
    <div class="card"><div class="chart-box"><canvas id="chGastos"></canvas></div></div>
  </div>

  <div class="section-head"><h2>Despesas lançadas</h2>
    <div class="row"><button class="btn sec" data-act="pdfGastos">📄 PDF</button><button class="btn" data-act="novaDespesa">+ Lançar despesa</button></div></div>
  <div class="card">${g.desp.length ? g.desp.sort((x, y) => y.data.localeCompare(x.data)).map(d => `
    <div class="list-item"><div class="info"><div class="title">${esc(d.descricao || d.categoria)}</div>
      <div class="sub">${br(d.data)} · ${esc(d.categoria)}${d.obraId ? ' · ' + esc(byId('obras', d.obraId)?.nome || '') : ''}</div></div>
      <div class="amount" style="color:var(--danger)">${money(d.valor)}</div>
      <button class="btn ghost sm" data-act="editDespesa" data-id="${d.id}">Editar</button></div>`).join('') : '<div class="empty">Nenhuma despesa no período</div>'}</div>
  <p class="muted" style="font-size:13px">A mão de obra é calculada automaticamente pelas diárias dos funcionários ativos (da admissão até hoje), descontando as faltas. Os vales vêm da aba Combustível.</p>`;
};

POS.gastos = () => {
  const [a, b] = rangePor(gastoRef.tipo, gastoRef.data);
  const g = gastosPeriodo(a, b);
  const labels = ['Mão de obra', 'Combustível (vales)', ...Object.keys(g.porCat)];
  const data = [g.folha, g.vales, ...Object.values(g.porCat)];
  const el = document.getElementById('chGastos');
  if (!el || !window.Chart) return;
  if (!data.some(Boolean)) { el.parentElement.innerHTML = '<div class="empty">Sem gastos no período</div>'; return; }
  charts.push(new Chart(el, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: CORES, borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { legend: { position: 'bottom', labels: { color: matchMedia('(prefers-color-scheme: dark)').matches ? '#a49cbc' : '#6b6480', boxWidth: 12 } },
        tooltip: { callbacks: { label: c => `${c.label}: ${money(c.parsed)}` } } } },
  }));
};

function formDespesa(d = {}) {
  return `<label>Descrição</label><input name="descricao" value="${esc(d.descricao)}" placeholder="Ex.: 20 sacos de cimento">
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${d.data || hoje()}"></div>
      <div><label>Valor (R$) *</label><input name="valor" required inputmode="decimal" value="${d.valor ?? ''}"></div>
    </div>
    <label>Categoria</label><select name="categoria">${optTxt(CATEGORIAS_GASTO, d.categoria || 'Material')}</select>
    <label>Obra (opcional)</label><select name="obraId">${opt(db.obras, d.obraId, 'Geral / sem obra')}</select>`;
}
actions.novaDespesa = () => abrirModal('Lançar despesa', formDespesa(), d => { d.valor = num(d.valor); db.despesas.push({ id: uid(), ...d }); toast('Despesa lançada'); });
actions.editDespesa = ({ id }) => {
  const x = byId('despesas', id);
  abrirModal('Editar despesa', formDespesa(x) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delReg" data-lista="despesas" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); Object.assign(x, d); });
};
actions.pdfGastos = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = rangePor(gastoRef.tipo, gastoRef.data);
  const g = gastosPeriodo(a, b);
  const fat = soma(db.receitas.filter(r => entre(r.data, a, b)));
  const doc = novoPdf('RELATÓRIO DE GASTOS');
  doc.setFontSize(10); doc.text(`Período: ${br(a)} a ${br(b)}`, 14, 40);
  doc.autoTable({ startY: 45, head: [['Resumo', 'Valor']], ...corTabela, columnStyles: { 1: { halign: 'right' } },
    body: [['Mão de obra (diárias − faltas)', money(g.folha)], ['Vales combustível', money(g.vales)], ...Object.entries(g.porCat).map(([c, v]) => [c, money(v)]),
      [{ content: 'Total de gastos', styles: { fontStyle: 'bold' } }, { content: money(g.total), styles: { fontStyle: 'bold' } }],
      ['Faturamento no período', money(fat)], [{ content: 'Saldo', styles: { fontStyle: 'bold' } }, { content: money(fat - g.total), styles: { fontStyle: 'bold' } }]] });
  if (g.desp.length) {
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 8, head: [['Data', 'Descrição', 'Categoria', 'Obra', 'Valor']], ...corTabela, columnStyles: { 4: { halign: 'right' } },
      body: g.desp.map(d => [br(d.data), d.descricao || '', d.categoria, byId('obras', d.obraId)?.nome || '', money(d.valor)]) });
  }
  rodapePdf(doc);
  compartilharPdf(doc, `Gastos_${a}_a_${b}.pdf`, undefined, `Relatório de gastos ${br(a)} a ${br(b)}`);
};

actions.pdfVales = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = rangePor(valeRef.tipo, valeRef.data);
  const vales = db.vales.filter(v => entre(v.data, a, b)).sort((x, y) => x.data.localeCompare(y.data));
  const doc = novoPdf('VALES COMBUSTÍVEL');
  doc.setFontSize(10); doc.text(`Período: ${br(a)} a ${br(b)}`, 14, 40);
  doc.autoTable({ startY: 45, head: [['Data', 'Colaborador', 'Posto', 'Veículo', 'Valor']], ...corTabela, columnStyles: { 4: { halign: 'right' } },
    body: vales.map(v => [br(v.data), byId('funcionarios', v.funcionarioId)?.nome || '', byId('postos', v.postoId)?.nome || '', v.placa || '', money(v.valor)]),
    foot: [[{ content: 'TOTAL', colSpan: 4 }, money(soma(vales))]], footStyles: { fillColor: [237, 233, 254], textColor: 30 } });
  rodapePdf(doc);
  compartilharPdf(doc, `Vales_${a}_a_${b}.pdf`, undefined, `Vales combustível ${br(a)} a ${br(b)}`);
};
actions.pdfVale = ({ id }) => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const v = byId('vales', id), f = byId('funcionarios', v.funcionarioId) || {}, p = byId('postos', v.postoId) || {};
  const doc = novoPdf('VALE COMBUSTÍVEL');
  doc.setFontSize(12);
  const linhas = [['Colaborador', f.nome || ''], ['Posto', p.nome || ''], ['Data', br(v.data)], ['Veículo / placa', v.placa || '—'], ['Valor liberado', money(v.valor)], ['Observação', v.obs || '—']];
  doc.autoTable({ startY: 42, body: linhas, theme: 'grid', styles: { fontSize: 12, cellPadding: 4 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [237, 233, 254] } } });
  const y = doc.lastAutoTable.finalY + 30;
  doc.line(20, y, 95, y); doc.line(115, y, 190, y);
  doc.setFontSize(9); doc.text('Responsável — ' + (db.config.empresa || ''), 57, y + 5, { align: 'center' }); doc.text('Colaborador', 152, y + 5, { align: 'center' });
  compartilharPdf(doc, `Vale_${(f.nome || '').replace(/\W+/g, '_')}_${v.data}.pdf`, p.telefone || f.telefone || '', `Vale combustível liberado para ${f.nome}: ${money(v.valor)} no ${p.nome} (${br(v.data)}).`);
};

// =====================================================
// 7) EMPREITADA (obras pequenas)
// =====================================================
const STATUS_EMP = ['Aberta', 'Em andamento', 'Concluída'];

VIEWS.empreitadas = () => {
  const lista = [...db.empreitadas].sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
  const recebido = e => soma(db.receitas.filter(r => r.empreitadaId === e.id));
  const abertas = lista.filter(e => e.status !== 'Concluída');
  const aReceber = lista.reduce((t, e) => t + Math.max(0, num(e.valor) - recebido(e)), 0);
  const item = e => {
    const rec = recebido(e);
    return `<div class="list-item">
      <span>🔨</span>
      <div class="info"><div class="title">${esc(e.servico)}</div>
        <div class="sub">${esc(e.cliente)}${e.endereco ? ' · ' + esc(e.endereco) : ''}</div>
        <div class="sub">${br(e.inicio)}${e.prazo ? ' · prazo ' + esc(e.prazo) + ' dia(s)' : ''}${e.responsavelId ? ' · ' + esc(byId('funcionarios', e.responsavelId)?.nome || '') : ''}</div></div>
      <div style="text-align:right">${badgeStatus(e.status === 'Aberta' ? 'Agendada' : e.status).replace('Agendada', 'Aberta')}
        <div class="amount" style="margin-top:4px">${money(e.valor)}</div>
        <div class="sub">recebido ${money(rec)}</div></div>
      <div class="row" style="flex-direction:column">
        ${rec < num(e.valor) ? `<button class="btn sec sm" data-act="receberEmp" data-id="${e.id}">Receber</button>` : ''}
        <button class="btn ghost sm" data-act="editEmp" data-id="${e.id}">Editar</button></div>
    </div>`;
  };
  return `
  <div class="grid grid-3">
    <div class="stat"><div class="label">Em aberto</div><div class="value">${abertas.length}</div></div>
    <div class="stat"><div class="label">Valor total contratado</div><div class="value">${money(soma(lista))}</div></div>
    <div class="stat hl"><div class="label">A receber</div><div class="value">${money(aReceber)}</div></div>
  </div>
  <div class="section-head"><h2>Empreitadas (obras pequenas)</h2><button class="btn" data-act="novaEmp">+ Nova empreitada</button></div>
  <div class="card">${lista.length ? lista.map(item).join('') : '<div class="empty">Nenhuma empreitada cadastrada. Use para serviços rápidos: reparos, muros, calçadas, pinturas…</div>'}</div>
  <p class="muted" style="font-size:13px">Ao clicar em <b>Receber</b>, o valor entra automaticamente no Faturamento.</p>`;
};

function formEmp(e = {}) {
  return `<label>Serviço *</label><input name="servico" required value="${esc(e.servico)}" placeholder="Ex.: Construção de muro 10m">
    <label>Cliente *</label><input name="cliente" required value="${esc(e.cliente)}" list="listaClientes">
    <datalist id="listaClientes">${db.clientes.map(c => `<option>${esc(c.nome)}</option>`).join('')}</datalist>
    <div class="grid grid-2">
      <div><label>Telefone</label><input name="telefone" inputmode="tel" value="${esc(e.telefone)}"></div>
      <div><label>Endereço</label><input name="endereco" value="${esc(e.endereco)}"></div>
    </div>
    <div class="grid grid-2">
      <div><label>Valor combinado (R$) *</label><input name="valor" required inputmode="decimal" value="${e.valor ?? ''}"></div>
      <div><label>Status</label><select name="status">${optTxt(STATUS_EMP, e.status || 'Aberta')}</select></div>
    </div>
    <div class="grid grid-2">
      <div><label>Início</label><input type="date" name="inicio" value="${e.inicio || hoje()}"></div>
      <div><label>Prazo (dias)</label><input name="prazo" inputmode="numeric" value="${esc(e.prazo)}"></div>
    </div>
    <label>Responsável</label><select name="responsavelId">${opt(db.funcionarios, e.responsavelId, 'Nenhum')}</select>
    <label>Observações</label><textarea name="obs">${esc(e.obs)}</textarea>`;
}
actions.novaEmp = () => abrirModal('Nova empreitada', formEmp(), d => { d.valor = num(d.valor); db.empreitadas.push({ id: uid(), ...d }); toast('Empreitada cadastrada'); });
actions.editEmp = ({ id }) => {
  const e = byId('empreitadas', id);
  abrirModal('Editar empreitada', formEmp(e) + `<div class="row" style="margin-top:12px">
    ${e.telefone ? `<a class="btn wa sm" href="https://wa.me/${foneWa(e.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
    <button type="button" class="btn danger sm" data-act="delReg" data-lista="empreitadas" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); Object.assign(e, d); });
};
actions.receberEmp = ({ id }) => {
  const e = byId('empreitadas', id);
  const rec = soma(db.receitas.filter(r => r.empreitadaId === id));
  abrirModal('Registrar recebimento', `<p class="muted">${esc(e.servico)} — ${esc(e.cliente)}<br>Combinado ${money(e.valor)} · já recebido ${money(rec)}</p>
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${hoje()}"></div>
      <div><label>Valor (R$) *</label><input name="valor" required inputmode="decimal" value="${Math.max(0, num(e.valor) - rec)}"></div>
    </div>
    <label>Forma de pagamento</label><select name="forma">${optTxt(['PIX', 'Dinheiro', 'Transferência', 'Cartão'], 'PIX')}</select>`, d => {
    db.receitas.push({ id: uid(), data: d.data, valor: num(d.valor), forma: d.forma, descricao: `Empreitada: ${e.servico} (${e.cliente})`, empreitadaId: id });
    if (rec + num(d.valor) >= num(e.valor)) e.status = 'Concluída';
    toast('Recebimento lançado no faturamento');
  }, 'Registrar');
};

// =====================================================
// CONFIGURAÇÕES / BACKUP
// =====================================================
VIEWS.config = () => `
  <div class="section-head mt0"><h2>Dados da empresa</h2></div>
  <div class="card"><form id="cfgForm">
    <label>Nome da empresa</label><input name="empresa" value="${esc(db.config.empresa)}">
    <div class="grid grid-2">
      <div><label>CNPJ / CPF</label><input name="cnpj" value="${esc(db.config.cnpj)}"></div>
      <div><label>Telefone / WhatsApp</label><input name="telefone" value="${esc(db.config.telefone)}"></div>
    </div>
    <label>Endereço</label><input name="endereco" value="${esc(db.config.endereco)}">
    <p class="muted" style="font-size:13px">Esses dados aparecem no cabeçalho dos PDFs.</p>
    <div class="form-actions"><button class="btn" type="submit">Salvar</button></div>
  </form></div>

  <div class="section-head"><h2>Backup dos dados</h2></div>
  <div class="card">
    <p class="muted mt0" style="font-size:13px">Os dados ficam salvos neste aparelho. Faça backup com frequência e use o arquivo para passar os dados para outro celular ou computador.</p>
    <div class="row">
      <button class="btn" data-act="exportar">⬇️ Baixar backup</button>
      <label class="btn sec" style="margin:0">⬆️ Restaurar backup<input type="file" accept="application/json,.json" id="importFile" hidden></label>
    </div>
  </div>
  <div class="section-head"><h2>Acesso pelo celular</h2></div>
  <div class="card">
    <div class="link-box"><input readonly value="${esc(location.href.split('#')[0].split('?')[0])}" id="linkApp"><button class="btn sec" data-act="copiarLink">Copiar</button></div>
    <p class="muted" style="font-size:13px;margin-bottom:0">Abra este link no celular e use <b>⋮ → Adicionar à tela inicial</b> (Android) ou <b>Compartilhar → Adicionar à Tela de Início</b> (iPhone) para instalar como app.</p>
  </div>

  <div class="section-head"><h2>Versão do app</h2></div>
  <div class="card">
    <div class="list-item"><div class="info"><div class="title">Versão instalada</div><div class="sub" id="cfgVerInfo">Verificando atualizações…</div></div><b>v${APP_VERSION}</b></div>
    <div class="row" style="margin-top:8px">
      <button class="btn sec" data-act="verificarAtualizacao">🔄 Verificar atualização</button>
      <button class="btn" data-act="atualizarApp">⬆️ Atualizar para nova versão</button>
    </div>
  </div>

  <div class="row"><button class="btn danger" data-act="zerar">Apagar todos os dados</button></div>`;

POS.config = () => {
  verificarVersao();
  document.getElementById('cfgForm').addEventListener('submit', e => {
    e.preventDefault();
    Object.assign(db.config, Object.fromEntries(new FormData(e.target).entries()));
    salvar(); render(); toast('Dados salvos');
  });
  document.getElementById('importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const dados = JSON.parse(await f.text());
      if (!dados || !Array.isArray(dados.obras)) throw new Error('arquivo inválido');
      if (!confirm('Substituir todos os dados atuais pelos do backup?')) return;
      const base = estadoInicial();
      db = { ...base, ...dados, config: { ...base.config, ...(dados.config || {}) } };
      salvar(); render(); toast('Backup restaurado');
    } catch (err) { alert('Arquivo de backup inválido.'); }
  });
};
actions.exportar = () => {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `backup-construtora-jr-${hoje()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
actions.zerar = () => {
  if (!confirm('Apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
  if (prompt('Digite APAGAR para confirmar') !== 'APAGAR') return;
  db = estadoInicial(); salvar(); render(); toast('Dados apagados');
};

// =====================================================
// VERSÃO E ATUALIZAÇÃO
// =====================================================
let versaoRemota = null;

function cmpVersao(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
  return 0;
}

async function verificarVersao(avisar = false) {
  const info = document.getElementById('cfgVerInfo');
  if (location.protocol === 'file:') { if (info) info.textContent = 'Abra pelo link do site para receber atualizações.'; return; }
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    versaoRemota = await r.json();
    const nova = cmpVersao(versaoRemota.version, APP_VERSION) > 0;
    document.getElementById('updateBar').hidden = !nova;
    document.getElementById('novaVer').textContent = 'v' + versaoRemota.version;
    if (info) info.textContent = nova ? `Nova versão v${versaoRemota.version} disponível${versaoRemota.notas ? ' — ' + versaoRemota.notas : ''}` : 'Você está usando a versão mais recente.';
    if (avisar) toast(nova ? 'Nova versão disponível!' : 'O app já está atualizado');
  } catch (e) {
    if (info) info.textContent = 'Sem conexão para verificar atualizações.';
    if (avisar) toast('Sem internet para verificar');
  }
}

actions.verificarAtualizacao = () => verificarVersao(true);
actions.atualizarApp = async () => {
  toast('Atualizando…');
  try {
    if ('caches' in window) { for (const k of await caches.keys()) await caches.delete(k); }
    if (navigator.serviceWorker) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
  } catch (e) { /* segue para recarregar */ }
  location.replace(location.pathname + '?v=' + Date.now() + location.hash);
};
actions.copiarLink = async () => {
  const v = document.getElementById('linkApp').value;
  try { await navigator.clipboard.writeText(v); toast('Link copiado'); }
  catch (e) { document.getElementById('linkApp').select(); toast('Selecione e copie o link'); }
};

document.getElementById('verLabel').textContent = 'v' + APP_VERSION;
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// remove o ?v= da barra de endereço depois de atualizar
if (location.search.includes('v=')) history.replaceState(null, '', location.pathname + location.hash);

render();
verificarVersao();
setInterval(verificarVersao, 30 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) verificarVersao(); });
