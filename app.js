/* Construtora JR — app de gestão (dados no banco Supabase, com login) */
'use strict';

// ---------- Dados ----------
const KEY = 'construtora-jr-v1';
// Versão do app — ao publicar mudanças, aumente aqui, no version.json e nos ?v= do index.html
const APP_VERSION = '1.9.1';

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
const CORES = ['#3b82f6', '#38bdf8', '#94a3b8', '#22c55e', '#f59e0b', '#a78bfa', '#f472b6', '#14b8a6', '#f87171'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function estadoInicial() {
  return {
    config: { empresa: 'JR Construções', telefone: '', cnpj: '', endereco: '', trabalhaSabado: true, cidades: ['Lavras da Mangabeira'] },
    clientes: [], obras: [], receitas: [], postos: [], vales: [],
    catalogo: CATALOGO_PADRAO.map(([tipo, nome, unidade, preco]) => ({ id: uid(), tipo, nome, unidade, preco })),
    orcamentos: [], funcionarios: [], faltas: [], despesas: [], empreitadas: [],
  };
}

// Listas que pertencem a uma cidade (as faltas seguem a cidade do funcionário; o catálogo é comum a todas)
const LISTAS_CIDADE = ['clientes', 'obras', 'receitas', 'postos', 'vales', 'orcamentos', 'funcionarios', 'despesas', 'empreitadas'];

// completa dados antigos ou de backup: cidades na config e cidade em cada registro
function migrar(dados) {
  const base = estadoInicial();
  const cfg = { ...base.config, ...(dados.config || {}) };
  if (cfg.empresa === 'Construtora JR') cfg.empresa = 'JR Construções'; // nome antigo padrão
  cfg.cidades = [...new Set((Array.isArray(cfg.cidades) ? cfg.cidades : []).map(c => String(c).trim()).filter(Boolean))];
  if (!cfg.cidades.length) cfg.cidades = [...base.config.cidades];
  const d = { ...base, ...dados, config: cfg };
  LISTAS_CIDADE.forEach(l => d[l].forEach(x => {
    if (!x.cidade || !cfg.cidades.includes(x.cidade)) {
      if (x.cidade) cfg.cidades.push(x.cidade); else x.cidade = cfg.cidades[0];
    }
  }));
  return d;
}

// Dados antigos (guardados só neste aparelho) — usados uma vez para subir ao banco
function dadosLocaisAntigos() {
  try {
    const salvo = JSON.parse(localStorage.getItem(KEY));
    if (salvo && Array.isArray(salvo.obras)) return salvo;
  } catch (e) { /* ignora */ }
  return null;
}

// ---------- Banco (Supabase) ----------
const SB = window.JR_SUPABASE || {};
const sb = SB.url && SB.anonKey && window.supabase ? window.supabase.createClient(SB.url, SB.anonKey) : null;
let usuario = null;          // { id, email, papel: 'admin' | 'leitor' }
let versaoBanco = 0;         // versão da linha que este aparelho conhece
let db = estadoInicial();
const ehAdmin = () => usuario?.papel === 'admin';

let enviando = false, pendente = false, tempoEnvio = null;
// Guarda no banco. Chamado após cada alteração; junta várias em um envio só.
function salvar() {
  if (!ehAdmin()) { recarregarDoBanco(true); return; }
  clearTimeout(tempoEnvio);
  tempoEnvio = setTimeout(enviar, 400);
}
async function enviar() {
  if (enviando) { pendente = true; return; }
  enviando = true; pendente = false;
  try {
    const { data, error } = await sb.from('jr_dados')
      .update({ dados: db, versao: versaoBanco + 1, atualizado_em: new Date().toISOString(), atualizado_por: usuario.id })
      .eq('id', 1).eq('versao', versaoBanco).select('versao');
    if (error) throw error;
    if (!data.length) { // outra pessoa salvou antes
      await recarregarDoBanco(false);
      alert('Outra pessoa alterou os dados ao mesmo tempo. O app carregou a versão mais recente — confira e refaça sua última alteração, se faltar.');
    } else versaoBanco = data[0].versao;
  } catch (e) { toast('Não foi possível salvar. Verifique a internet.'); pendente = false; }
  enviando = false;
  if (pendente) enviar();
}
async function recarregarDoBanco(avisarLeitor) {
  const { data, error } = await sb.from('jr_dados').select('dados,versao').eq('id', 1).maybeSingle();
  if (error || !data) return false;
  db = migrar(data.dados); versaoBanco = data.versao;
  if (cidadeAtual && !db.config.cidades.includes(cidadeAtual)) cidadeAtual = db.config.cidades[0];
  render();
  if (avisarLeitor) toast('Seu acesso é somente leitura');
  return true;
}
// Lê o banco no início; se estiver vazio, o administrador sobe os dados que já estavam no aparelho
async function carregarBanco() {
  const { data, error } = await sb.from('jr_dados').select('dados,versao').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (data) { db = migrar(data.dados); versaoBanco = data.versao; return; }
  if (!ehAdmin()) { db = estadoInicial(); versaoBanco = 0; return; }
  const antigo = dadosLocaisAntigos();
  db = antigo ? migrar(antigo) : estadoInicial();
  const { error: e2 } = await sb.from('jr_dados').insert({ id: 1, dados: db, versao: 1, atualizado_por: usuario.id });
  if (e2) throw e2;
  versaoBanco = 1;
  if (antigo) setTimeout(() => toast('Seus dados deste aparelho foram lançados no banco ✔'), 1500);
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

// ---------- Cidades ----------
// cidadeAtual vazia = todas as cidades somadas
let cidadeAtual = '';
try { cidadeAtual = localStorage.getItem(KEY + ':cidade') ?? db.config.cidades[0]; } catch (e) { cidadeAtual = db.config.cidades[0]; }
if (cidadeAtual && !db.config.cidades.includes(cidadeAtual)) cidadeAtual = db.config.cidades[0];

const daCid = x => !cidadeAtual || x.cidade === cidadeAtual;
// registros da cidade escolhida (ou de todas)
function C(lista) {
  if (lista === 'faltas') { const ids = new Set(C('funcionarios').map(f => f.id)); return db.faltas.filter(x => ids.has(x.funcionarioId)); }
  return db[lista].filter(daCid);
}
// cidade para um registro novo
const cidadeNova = () => cidadeAtual || db.config.cidades[0];
// mostra a cidade do registro quando estão todas somadas
const tagCid = x => !cidadeAtual && x?.cidade ? ` · 📍 ${esc(x.cidade)}` : '';
// executa uma conta como se a cidade escolhida fosse outra (usado no resumo de todas as cidades)
function comCidade(cid, fn) { const ant = cidadeAtual; cidadeAtual = cid; try { return fn(); } finally { cidadeAtual = ant; } }
function campoCidade(reg = {}) {
  const atual = reg.cidade || cidadeNova();
  if (db.config.cidades.length === 1 && atual === db.config.cidades[0]) return `<input type="hidden" name="cidade" value="${esc(atual)}">`;
  return `<label>Cidade *</label><select name="cidade" required>${optTxt(db.config.cidades, atual)}</select>`;
}
const nomeCidade = () => cidadeAtual || 'Todas as cidades';

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
// clicar fora não fecha o painel (evita perder o que foi digitado): fecha só no ✕ ou em Cancelar

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
  document.getElementById('empresaNome').textContent = db.config.empresa || 'JR Construções';
  document.getElementById('hojeLabel').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  document.getElementById('cidadeSel').innerHTML = db.config.cidades.map(c => `<option value="${esc(c)}" ${c === cidadeAtual ? 'selected' : ''}>${esc(c)}</option>`).join('') +
    `<option value="" ${!cidadeAtual ? 'selected' : ''}>🌎 Todas as cidades</option><option value="__gerenciar">➕ Adicionar / editar cidades…</option>`;
  const v = document.getElementById('view');
  v.innerHTML = (VIEWS[aba] || VIEWS.agenda)();
  if (POS[aba]) POS[aba]();
}

const actions = {
  goTab: d => { aba = d.tab; orcEdit = null; try { localStorage.setItem(KEY + ':aba', aba); } catch (e) { /* ignora */ } render(); window.scrollTo(0, 0); },
  closeModal: () => fecharModal(),
};
// Ações que o leitor pode usar (consultar, filtrar, gerar PDF). O resto é só do administrador.
const ACOES_LEITOR = new Set(['goTab', 'closeModal', 'abrirCidade', 'filtroObra', 'fatAno', 'setPeriodo', 'pagTipo', 'equipeStatus',
  'verObra', 'verFunc', 'verCatalogo', 'pdfCidades', 'pdfFolha', 'pdfGastos', 'pdfVale', 'pdfVales', 'enviarOrc', 'copiarLink',
  'instalarApp', 'fecharInstalar', 'verificarAtualizacao', 'atualizarApp', 'sair']);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (usuario && !ehAdmin() && !ACOES_LEITOR.has(el.dataset.act)) { e.preventDefault(); toast('Seu acesso é somente leitura'); return; }
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el); }
});

// =====================================================
// 1) OBRAS
// =====================================================
const STATUS_OBRA = ['Agendada', 'Em andamento', 'Pausada', 'Concluída'];
const badgeStatus = s => `<span class="badge ${s === 'Concluída' ? 'ok' : s === 'Em andamento' ? '' : s === 'Pausada' ? 'warn' : 'gray'}">${esc(s)}</span>`;
let filtroObras = { status: 'ativas' };

function duracao(o) {
  if (!o.inicio) return '';
  const dias = Math.round((parse(o.fim || o.inicio) - parse(o.inicio)) / 864e5) + 1;
  return `${dias} dia${dias > 1 ? 's' : ''}`;
}
// andamento pelo prazo: % de dias já decorridos
function progressoObra(o) {
  if (o.status === 'Concluída') return 100;
  if (!o.inicio || hoje() < o.inicio) return 0;
  const tot = (parse(o.fim || o.inicio) - parse(o.inicio)) / 864e5 + 1;
  const dec = (parse(hoje()) - parse(o.inicio)) / 864e5 + 1;
  return Math.max(0, Math.min(100, Math.round(dec / tot * 100)));
}
function situacaoPrazo(o) {
  if (o.status === 'Concluída') return '';
  const h = hoje();
  if (o.inicio > h) { const d = Math.round((parse(o.inicio) - parse(h)) / 864e5); return `começa em ${d} dia${d > 1 ? 's' : ''}`; }
  if (o.fim < h) { const d = Math.round((parse(h) - parse(o.fim)) / 864e5); return `<span style="color:var(--danger)">atrasada ${d} dia${d > 1 ? 's' : ''}</span>`; }
  const d = Math.round((parse(o.fim) - parse(h)) / 864e5);
  return d === 0 ? 'termina hoje' : `faltam ${d} dia${d > 1 ? 's' : ''}`;
}
const recebidoObra = o => soma(db.receitas.filter(r => r.obraId === o.id));
const gastoObra = o => soma(db.despesas.filter(d => d.obraId === o.id));

const VIEWS = {};
const POS = {};

VIEWS.agenda = () => {
  const f = filtroObras.status;
  const obras = C('obras'), clientes = C('clientes');
  const lista = obras
    .filter(o => f === 'todas' || (f === 'ativas' ? o.status !== 'Concluída' : o.status === f))
    .sort((a, b) => (a.status === 'Concluída') - (b.status === 'Concluída') || (a.inicio || '').localeCompare(b.inicio || ''));
  const ativas = obras.filter(o => o.status !== 'Concluída');
  const contratado = soma(ativas);
  const aReceber = ativas.reduce((t, o) => t + Math.max(0, num(o.valor) - recebidoObra(o)), 0);
  const cont = s => obras.filter(o => o.status === s).length;
  const filtros = [['ativas', 'Ativas', ativas.length], ['Em andamento', 'Em andamento', cont('Em andamento')], ['Agendada', 'Agendadas', cont('Agendada')], ['Pausada', 'Pausadas', cont('Pausada')], ['Concluída', 'Concluídas', cont('Concluída')], ['todas', 'Todas', obras.length]];
  return `
  <div class="grid grid-3">
    <div class="stat"><div class="label">Obras em andamento</div><div class="value">${cont('Em andamento')} <small class="muted" style="font-size:13px;font-weight:500">· ${cont('Agendada')} agendada(s)</small></div></div>
    <div class="stat"><div class="label">Contratos ativos</div><div class="value">${money(contratado)}</div></div>
    <div class="stat hl"><div class="label">A receber das obras</div><div class="value">${money(aReceber)}</div></div>
  </div>

  <div class="section-head"><h2>Obras</h2><button class="btn" data-act="novaObra">+ Nova obra</button></div>
  <div class="card">
    <div class="inline-filters" style="margin-bottom:6px">
      <div><input id="buscaObra" placeholder="🔎 Buscar obra, cliente ou endereço…"></div>
    </div>
    <div class="chips">${filtros.map(([k, r, n]) => `<button type="button" class="chip ${f === k ? 'active' : ''}" data-act="filtroObra" data-s="${k}">${r} <b>${n}</b></button>`).join('')}</div>
    ${lista.length ? lista.map(itemObra).join('') : `<div class="empty">${obras.length ? 'Nenhuma obra neste filtro' : 'Nenhuma obra cadastrada. Toque em “+ Nova obra”.'}</div>`}
  </div>

  <div class="section-head"><h2>Clientes (${clientes.length})</h2><button class="btn sec" data-act="novoCliente">+ Cliente</button></div>
  <div class="card">${clientes.length ? clientes.map(c => `
    <div class="list-item">
      <div class="info"><div class="title">${esc(c.nome)}</div><div class="sub">${esc(c.telefone)} ${c.endereco ? '· ' + esc(c.endereco) : ''} · ${db.obras.filter(o => o.clienteId === c.id).length} obra(s)${tagCid(c)}</div></div>
      ${c.telefone ? `<a class="btn wa sm" href="https://wa.me/${foneWa(c.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
      <button class="btn ghost sm" data-act="editCliente" data-id="${c.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum cliente cadastrado</div>'}</div>`;
};

POS.agenda = () => {
  const b = document.getElementById('buscaObra');
  b.addEventListener('input', () => {
    const q = b.value.toLowerCase().trim();
    document.querySelectorAll('[data-busca-obra]').forEach(el => (el.hidden = q && !el.dataset.buscaObra.includes(q)));
  });
};

function itemObra(o) {
  const pr = progressoObra(o), rec = recebidoObra(o);
  const busca = [o.nome, nomeCliente(o.clienteId), o.endereco, o.cidade].join(' ').toLowerCase();
  return `<div class="obra-item" data-busca-obra="${esc(busca)}">
    <div class="obra-top" data-act="verObra" data-id="${o.id}">
      <div class="info">
        <div class="title">${esc(o.nome)}</div>
        <div class="sub">👤 ${esc(nomeCliente(o.clienteId))}${o.endereco ? ' · 🏠 ' + esc(o.endereco) : ''}${tagCid(o)}</div>
        <div class="sub">📅 ${br(o.inicio)} a ${br(o.fim || o.inicio)} · ${duracao(o)}${situacaoPrazo(o) ? ' · ' + situacaoPrazo(o) : ''}</div>
      </div>
      <div class="obra-valor">${badgeStatus(o.status)}${o.valor ? `<div><div class="amount">${money(o.valor)}</div><div class="sub">recebido ${money(rec)}</div></div>` : ''}</div>
    </div>
    <div class="progress"><span style="width:${pr}%"></span></div>
    <div class="row obra-btns">
      <span class="sub muted obra-pct">${pr}% do prazo</span>
      <select class="mini-select" data-change="statusObra" data-id="${o.id}">${optTxt(STATUS_OBRA, o.status)}</select>
      <button class="btn ghost sm" data-act="verObra" data-id="${o.id}">Detalhes</button>
      <button class="btn ghost sm" data-act="editObra" data-id="${o.id}">Editar</button>
    </div>
  </div>`;
}

actions.filtroObra = d => { filtroObras.status = d.s; render(); };

actions.verObra = ({ id }) => {
  const o = byId('obras', id); if (!o) return;
  const cli = byId('clientes', o.clienteId) || {};
  const recs = db.receitas.filter(r => r.obraId === id).sort((a, b) => b.data.localeCompare(a.data));
  const desp = db.despesas.filter(d => d.obraId === id).sort((a, b) => b.data.localeCompare(a.data));
  const orcs = db.orcamentos.filter(x => x.obraId === id);
  const rec = soma(recs), gas = soma(desp);
  abrirModal(o.nome, `
    <div class="row" style="margin:6px 0">${badgeStatus(o.status)} <span class="muted">${duracao(o)} · ${br(o.inicio)} a ${br(o.fim)}</span></div>
    <div class="progress" style="margin:8px 0 4px"><span style="width:${progressoObra(o)}%"></span></div>
    <div class="sub muted">${progressoObra(o)}% do prazo ${situacaoPrazo(o) ? '· ' + situacaoPrazo(o) : ''}</div>
    <div class="list-item"><div class="info sub">Cliente</div><div>${esc(cli.nome || '—')}</div></div>
    <div class="list-item"><div class="info sub">Cidade</div><div>📍 ${esc(o.cidade || '—')}</div></div>
    ${o.endereco ? `<div class="list-item"><div class="info sub">Endereço</div><div>${esc(o.endereco)}</div></div>` : ''}
    ${o.obs ? `<div class="list-item"><div class="info sub">Observações</div><div>${esc(o.obs)}</div></div>` : ''}
    <div class="grid grid-2" style="margin-top:10px">
      <div class="stat"><div class="label">Contrato</div><div class="value">${money(o.valor)}</div><div class="sub muted">recebido ${money(rec)} · falta ${money(Math.max(0, num(o.valor) - rec))}</div></div>
      <div class="stat"><div class="label">Gastos lançados na obra</div><div class="value">${money(gas)}</div><div class="sub muted">resultado ${money(rec - gas)}</div></div>
    </div>
    <h4 style="margin:16px 0 4px">Recebimentos (${recs.length})</h4>
    ${recs.length ? recs.map(r => `<div class="list-item"><div class="info"><div class="title">${esc(r.descricao || 'Recebimento')}</div><div class="sub">${br(r.data)}${r.forma ? ' · ' + esc(r.forma) : ''}</div></div><div class="amount" style="color:var(--ok)">${money(r.valor)}</div></div>`).join('') : '<div class="sub muted">Nenhum recebimento.</div>'}
    <h4 style="margin:16px 0 4px">Gastos (${desp.length})</h4>
    ${desp.length ? desp.map(d => `<div class="list-item"><div class="info"><div class="title">${esc(d.descricao || d.categoria)}</div><div class="sub">${br(d.data)} · ${esc(d.categoria)}</div></div><div class="amount" style="color:var(--danger)">${money(d.valor)}</div></div>`).join('') : '<div class="sub muted">Nenhum gasto lançado.</div>'}
    ${orcs.length ? `<h4 style="margin:16px 0 4px">Orçamentos</h4>${orcs.map(x => `<div class="list-item"><div class="info"><div class="title">Nº ${x.numero}</div><div class="sub">${br(x.data)} · ${esc(x.status || 'Pendente')}</div></div><div class="amount">${money(totalOrc(x))}</div></div>`).join('')}` : ''}
    <div class="row" style="margin-top:14px">
      <button type="button" class="btn" data-act="novaReceita" data-obra="${id}">+ Recebimento</button>
      <button type="button" class="btn sec" data-act="novaDespesa" data-obra="${id}">+ Gasto</button>
      <button type="button" class="btn ghost" data-act="editObra" data-id="${id}">Editar obra</button>
      ${cli.telefone ? `<a class="btn wa" href="https://wa.me/${foneWa(cli.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
    </div>`, null);
};

function formCliente(c = {}) {
  return `<label>Nome *</label><input name="nome" required value="${esc(c.nome)}">
    <label>Telefone / WhatsApp</label><input name="telefone" inputmode="tel" value="${esc(c.telefone)}" placeholder="(00) 00000-0000">
    <label>Endereço</label><input name="endereco" value="${esc(c.endereco)}">
    ${campoCidade(c)}
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

// clientes da cidade escolhida (mais o já vinculado, ao editar)
const clientesOpc = sel => db.clientes.filter(c => daCid(c) || c.id === sel);
function formObra(o = {}) {
  if (!clientesOpc(o.clienteId).length) return '<div class="empty">Cadastre um cliente antes de criar a obra.</div><div class="form-actions"><button type="button" class="btn" data-act="novoCliente">+ Cadastrar cliente</button></div>';
  return `<label>Nome da obra *</label><input name="nome" required value="${esc(o.nome)}" placeholder="Ex.: Casa da Maria — ampliação">
    <label>Cliente *</label><select name="clienteId" required>${opt(clientesOpc(o.clienteId), o.clienteId, 'Selecione…')}</select>
    <label>Endereço da obra</label><input name="endereco" value="${esc(o.endereco)}">
    ${campoCidade(o)}
    <div class="grid grid-2">
      <div><label>Início *</label><input type="date" name="inicio" required value="${o.inicio || hoje()}"></div>
      <div><label>Término previsto *</label><input type="date" name="fim" required value="${o.fim || o.inicio || hoje()}"></div>
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
actions.novaObra = () => abrirModal('Nova obra', formObra(), clientesOpc().length ? d => {
  if (!validarObra(d)) return false;
  db.obras.push({ id: uid(), ...d }); toast('Obra cadastrada');
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
  const fat = (a, b) => soma(C('receitas').filter(r => entre(r.data, a, b)));
  const lista = C('receitas').sort((a, b) => b.data.localeCompare(a.data));
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
        <div class="sub">${br(r.data)}${r.obraId ? ' · ' + esc(byId('obras', r.obraId)?.nome || '') : ''}${r.forma ? ' · ' + esc(r.forma) : ''}${tagCid(r)}</div></div>
      <div class="amount" style="color:var(--ok)">${money(r.valor)}</div>
      <button class="btn ghost sm" data-act="editReceita" data-id="${r.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum recebimento lançado neste ano</div>'}</div>`;
};

function chartBar(id, labels, datasets, opts = {}) {
  const el = document.getElementById(id);
  if (!el || !window.Chart) return;
  const cor = '#93a4bd', grade = '#1c3a63';
  charts.push(new Chart(el, {
    type: opts.type || 'bar',
    data: { labels, datasets: datasets.map((d, i) => ({ borderRadius: 6, maxBarThickness: 38, backgroundColor: d.cor || CORES[i], borderColor: d.cor || CORES[i], tension: .3, ...d })) },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1, labels: { color: cor } }, tooltip: { callbacks: { label: c => `${c.dataset.label || ''} ${money(c.parsed.y)}` } } },
      scales: {
        x: { ticks: { color: cor }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: cor, precision: 0, callback: v => v >= 1000 ? 'R$ ' + (v / 1000) + 'k' : 'R$ ' + v }, grid: { color: grade } },
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
    vals.push(soma(C('receitas').filter(r => entre(r.data, ini, fim))));
    ini = addDias(ini, 7);
  }
  chartBar('chSemana', labels, [{ label: 'Faturamento', data: vals }]);
  // meses (com gastos para comparação)
  const fatM = MESES_C.map((_, m) => soma(C('receitas').filter(r => r.data.startsWith(`${fatAno}-${pad(m + 1)}`))));
  const gasM = MESES_C.map((_, m) => gastosPeriodo(`${fatAno}-${pad(m + 1)}-01`, iso(new Date(fatAno, m + 1, 0))).total);
  chartBar('chMes', MESES_C, [{ label: 'Faturamento', data: fatM, cor: '#3b82f6' }, { label: 'Gastos', data: gasM, cor: '#94a3b8' }]);
  // anos
  const anos = [...new Set(C('receitas').map(r => r.data.slice(0, 4)))].sort();
  if (!anos.length) anos.push(String(new Date().getFullYear()));
  chartBar('chAno', anos, [{ label: 'Faturamento', data: anos.map(a => soma(C('receitas').filter(r => r.data.startsWith(a)))) }]);
};

actions.fatAno = d => { fatAno += Number(d.d); render(); };

function formReceita(r = {}) {
  return `<label>Descrição</label><input name="descricao" value="${esc(r.descricao)}" placeholder="Ex.: 2ª parcela da obra">
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${r.data || hoje()}"></div>
      <div><label>Valor (R$) *</label><input name="valor" required inputmode="decimal" value="${r.valor ?? ''}"></div>
    </div>
    <label>Obra (opcional)</label><select name="obraId">${opt(db.obras.filter(o => daCid(o) || o.id === r.obraId), r.obraId, 'Sem obra vinculada')}</select>
    ${campoCidade(r)}
    <label>Forma de pagamento</label><select name="forma">${optTxt(['PIX', 'Dinheiro', 'Transferência', 'Cartão', 'Boleto', 'Cheque'], r.forma || 'PIX')}</select>`;
}
// recebimento ou despesa de uma obra fica na cidade da obra
const cidadeDaObra = d => { const o = byId('obras', d.obraId); if (o) d.cidade = o.cidade; };
actions.novaReceita = (d = {}) => abrirModal('Lançar recebimento', formReceita({ obraId: d.obra, cidade: byId('obras', d.obra)?.cidade }), d => { d.valor = num(d.valor); cidadeDaObra(d); db.receitas.push({ id: uid(), ...d }); toast('Recebimento lançado'); });
actions.editReceita = ({ id }) => {
  const r = byId('receitas', id);
  abrirModal('Editar recebimento', formReceita(r) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delReg" data-lista="receitas" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); cidadeDaObra(d); Object.assign(r, d); });
};
actions.delReg = ({ lista, id }) => { fecharModal(); confirmarExcluir(lista, id); };

// =====================================================
// 3) VALE COMBUSTÍVEL
// =====================================================
let valeRef = { tipo: 'mes', data: hoje() };

VIEWS.combustivel = () => {
  const [a, b] = rangePor(valeRef.tipo, valeRef.data);
  const vales = C('vales').filter(v => entre(v.data, a, b)).sort((x, y) => y.data.localeCompare(x.data));
  const postos = C('postos');
  const porFunc = C('funcionarios').map(f => ({ f, t: soma(vales.filter(v => v.funcionarioId === f.id)) })).filter(x => x.t);
  const porPosto = db.postos.map(p => ({ p, t: soma(vales.filter(v => v.postoId === p.id)) })).filter(x => x.t);
  return `
  ${filtroPeriodo(valeRef, 'valeRef')}
  <div class="grid grid-2" style="margin-top:12px">
    <div class="stat hl"><div class="label">Total adiantado em vales (${br(a)} a ${br(b)})</div><div class="value">${money(soma(vales))}</div></div>
    <div class="stat"><div class="label">Vales emitidos</div><div class="value">${vales.length}</div></div>
  </div>

  <div class="section-head"><h2>Vales</h2>
    <div class="row">${vales.length ? '<button class="btn sec" data-act="pdfVales">📄 PDF</button>' : ''}<button class="btn" data-act="novoVale">+ Novo vale</button></div></div>
  <div class="card">${vales.length ? vales.map(v => `
    <div class="list-item">
      <span>⛽</span>
      <div class="info"><div class="title">${esc(byId('funcionarios', v.funcionarioId)?.nome || '—')}</div>
        <div class="sub">${br(v.data)} · ${esc(byId('postos', v.postoId)?.nome || '—')}${v.obs ? ' · ' + esc(v.obs) : ''}${tagCid(v)}</div></div>
      <div class="amount">${money(v.valor)}</div>
      <button class="btn ghost sm" data-act="pdfVale" data-id="${v.id}" title="Emitir vale">🧾</button>
      <button class="btn ghost sm" data-act="editVale" data-id="${v.id}">Editar</button>
    </div>`).join('') : '<div class="empty">Nenhum vale no período</div>'}</div>

  ${porFunc.length ? `<div class="grid grid-2">
    <div class="card"><b>Por colaborador</b>${porFunc.map(x => `<div class="list-item"><div class="info">${esc(x.f.nome)}</div><div class="amount">${money(x.t)}</div></div>`).join('')}</div>
    <div class="card"><b>Por posto</b>${porPosto.map(x => `<div class="list-item"><div class="info">${esc(x.p.nome)}</div><div class="amount">${money(x.t)}</div></div>`).join('')}</div>
  </div>` : ''}

  <div class="section-head"><h2>Postos de combustível</h2><button class="btn sec" data-act="novoPosto">+ Posto</button></div>
  <div class="card">${postos.length ? postos.map(p => `
    <div class="list-item"><div class="info"><div class="title">${esc(p.nome)}</div><div class="sub">${esc(p.endereco)} ${p.telefone ? '· ' + esc(p.telefone) : ''}${tagCid(p)}</div></div>
    <button class="btn ghost sm" data-act="editPosto" data-id="${p.id}">Editar</button></div>`).join('') : '<div class="empty">Cadastre os postos conveniados</div>'}</div>
  <p class="muted" style="font-size:13px">Os vales são <b>adiantamento de salário</b>: são descontados automaticamente no relatório da aba Pagamentos. Os colaboradores são cadastrados na aba <b>Funcionários</b>.</p>`;
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
changeActions.trocarCidade = el => {
  if (el.value === '__gerenciar') { render(); actions.gerenciarCidades(); return; }
  escolherCidade(el.value);
};
function escolherCidade(c) {
  cidadeAtual = c; orcEdit = null;
  try { localStorage.setItem(KEY + ':cidade', c); } catch (e) { /* ignora */ }
  render(); ajustarTopo();
  toast(c ? `📍 ${c}` : '🌎 Todas as cidades somadas');
}
changeActions.statusObra = el => { const o = byId('obras', el.dataset.id); o.status = el.value; salvar(); render(); toast(`Status da obra: ${el.value}`); };

function formVale(v = {}) {
  const fs = C('funcionarios'), ps = C('postos');
  if (!fs.length || !ps.length) {
    return `<div class="empty">Para emitir vales${cidadeAtual ? ' em ' + esc(cidadeAtual) : ''}, cadastre ao menos ${!fs.length ? 'um colaborador (aba Funcionários)' : ''}${!fs.length && !ps.length ? ' e ' : ''}${!ps.length ? 'um posto' : ''}.</div>`;
  }
  return `<label>Colaborador *</label><select name="funcionarioId" required>${opt(db.funcionarios.filter(f => (daCid(f) && f.ativo !== false) || f.id === v.funcionarioId), v.funcionarioId, 'Selecione…')}</select>
    <label>Posto *</label><select name="postoId" required>${opt(db.postos.filter(p => daCid(p) || p.id === v.postoId), v.postoId, 'Selecione…')}</select>
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${v.data || hoje()}"></div>
      <div><label>Valor do vale / adiantamento (R$) *</label><input name="valor" required inputmode="decimal" value="${v.valor ?? ''}"></div>
    </div>
    <label>Observação</label><input name="obs" value="${esc(v.obs)}" placeholder="Ex.: ida à obra do Centro">`;
}
const okVale = () => C('funcionarios').length && C('postos').length;
// o vale fica na cidade do funcionário (é descontado no pagamento dele)
const cidadeDoFunc = d => { d.cidade = byId('funcionarios', d.funcionarioId)?.cidade || cidadeNova(); };
actions.novoVale = () => abrirModal('Novo vale combustível', formVale(), okVale() ? d => { d.valor = num(d.valor); cidadeDoFunc(d); db.vales.push({ id: uid(), ...d }); toast('Vale liberado'); } : null);
actions.editVale = ({ id }) => {
  const v = byId('vales', id);
  abrirModal('Editar vale', formVale(v) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delReg" data-lista="vales" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); cidadeDoFunc(d); Object.assign(v, d); });
};
function formPosto(p = {}) {
  return `<label>Nome do posto *</label><input name="nome" required value="${esc(p.nome)}">
    <label>Endereço</label><input name="endereco" value="${esc(p.endereco)}">
    <label>Telefone</label><input name="telefone" inputmode="tel" value="${esc(p.telefone)}">
    ${campoCidade(p)}`;
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
  const lista = C('orcamentos').sort((a, b) => b.numero - a.numero);
  return `
  <div class="section-head mt0"><h2>Orçamentos (${lista.length})</h2>
    <div class="row"><button class="btn sec" data-act="verCatalogo">📦 Itens cadastrados</button><button class="btn" data-act="novoOrc">+ Novo orçamento</button></div></div>
  <div class="card">${lista.length ? lista.map(o => `
    <div class="list-item">
      <div class="info"><div class="title">Nº ${o.numero} · ${esc(nomeCliente(o.clienteId))}</div>
        <div class="sub">${br(o.data)}${o.obraId ? ' · ' + esc(byId('obras', o.obraId)?.nome || '') : ''} · ${o.itens.length} itens${tagCid(o)}</div></div>
      <div style="text-align:right"><span class="badge ${o.status === 'Aprovado' ? 'ok' : o.status === 'Recusado' ? 'gray' : 'warn'}">${esc(o.status || 'Pendente')}</span>
        ${o.validacao ? `<span class="badge ${o.validacao.tipo === 'propria' ? '' : 'ok'}">✔ ${o.validacao.tipo === 'propria' ? 'Própria · nos gastos' : 'Cliente'}</span>` : ''}
        <div class="amount" style="margin-top:4px">${money(totalOrc(o))}</div></div>
      <button class="btn ${o.validacao ? 'ghost' : 'sec'} sm" data-act="validarOrc" data-id="${o.id}">${o.validacao ? 'Validado' : '✔ Validar'}</button>
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
  const obrasCli = db.obras.filter(x => o.clienteId ? x.clienteId === o.clienteId : daCid(x));
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
        <div class="row" style="flex-wrap:nowrap"><select data-o="clienteId">${opt(clientesOpc(o.clienteId), o.clienteId, 'Selecione…')}</select><button class="btn sec sm" data-act="novoCliente" title="Novo cliente">+</button></div></div>
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
    <button class="btn wa" data-act="salvarEnviarOrc">${ehCelular() ? "📲 Salvar e enviar PDF" : "⬇️ Salvar e baixar PDF"}</button>
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
  removerGastoOrc(orcEdit);
  db.orcamentos = db.orcamentos.filter(x => x.id !== orcEdit.id); orcEdit = null; salvar(); render();
};

// ---------- Validar orçamento ----------
// Própria: a própria construtora paga o material/serviço → o valor entra em Gastos como despesa.
// Cliente: o cliente paga → só fica aprovado, não entra nos gastos.
const despesaDoOrc = o => o?.validacao?.despesaId && db.despesas.find(d => d.id === o.validacao.despesaId);
function removerGastoOrc(o) {
  const d = despesaDoOrc(o);
  if (d) db.despesas = db.despesas.filter(x => x.id !== d.id);
}
// mantém a despesa igual ao orçamento (valor, obra, cidade) quando ele é editado
function sincronizarGastoOrc(o) {
  const d = despesaDoOrc(o);
  if (o.validacao?.tipo !== 'propria' || !d) return;
  Object.assign(d, { valor: totalOrc(o), obraId: o.obraId || '', cidade: o.cidade, descricao: `Orçamento Nº ${o.numero} (própria)` });
}
actions.validarOrc = ({ id }) => {
  const o = byId('orcamentos', id); if (!o) return;
  const v = o.validacao || {};
  const d = despesaDoOrc(o) || {};
  abrirModal(`Validar orçamento Nº ${o.numero}`, `
    <p class="muted" style="margin-top:0">${esc(nomeCliente(o.clienteId))}${o.obraId ? ' · ' + esc(byId('obras', o.obraId)?.nome || '') : ''} · <b>${money(totalOrc(o))}</b></p>
    <label>Quem paga este orçamento? *</label>
    <div class="val-opcoes">
      <label class="val-op"><input type="radio" name="tipo" value="propria" required ${v.tipo === 'propria' ? 'checked' : ''}>
        <span><b>🏗️ Própria</b><small>A construtora paga. O valor entra em <b>Gastos</b>.</small></span></label>
      <label class="val-op"><input type="radio" name="tipo" value="cliente" required ${v.tipo === 'cliente' ? 'checked' : ''}>
        <span><b>👤 Cliente</b><small>O cliente paga. Fica só como aprovado.</small></span></label>
    </div>
    <div class="val-propria grid grid-2">
      <div><label>Data do gasto</label><input type="date" name="data" value="${d.data || v.data || hoje()}"></div>
      <div><label>Categoria do gasto</label><select name="categoria">${optTxt(CATEGORIAS_GASTO, d.categoria || 'Material')}</select></div>
    </div>
    ${o.validacao ? `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="desfazerValidacao" data-id="${id}">Desfazer validação</button></div>` : ''}`, f => {
    removerGastoOrc(o);
    o.status = 'Aprovado';
    o.validacao = { tipo: f.tipo, data: f.data || hoje() };
    if (f.tipo === 'propria') {
      const desp = { id: uid(), data: f.data || hoje(), valor: totalOrc(o), categoria: f.categoria || 'Material',
        descricao: `Orçamento Nº ${o.numero} (própria)`, obraId: o.obraId || '', cidade: o.cidade || cidadeNova(), orcamentoId: o.id };
      db.despesas.push(desp);
      o.validacao.despesaId = desp.id;
      toast(`Validado como própria · ${money(desp.valor)} lançado em Gastos`);
    } else toast('Orçamento validado · pago pelo cliente');
  }, 'Validar');
};
actions.desfazerValidacao = ({ id }) => {
  const o = byId('orcamentos', id);
  if (!o || !confirm('Desfazer a validação? Se for própria, o gasto lançado também sai de Gastos.')) return;
  removerGastoOrc(o);
  delete o.validacao; o.status = 'Pendente';
  fecharModal(); salvar(); render(); toast('Validação desfeita');
};

function gravarOrc() {
  const o = orcEdit;
  if (!o.clienteId) { alert('Selecione o cliente.'); return null; }
  const itens = o.linhas.filter(l => num(l.qtd) > 0 && (l.nome || '').trim())
    .map(l => ({ catalogoId: l.catalogoId || null, tipo: l.tipo || 'avulso', nome: l.nome.trim(), unidade: l.unidade, qtd: num(l.qtd), preco: num(l.preco) }));
  if (!itens.length) { alert('Informe a quantidade de pelo menos um item.'); return null; }
  // o orçamento fica na cidade do cliente
  const cidade = byId('clientes', o.clienteId)?.cidade || o.cidade || cidadeNova();
  const reg = { id: o.id || uid(), numero: o.numero || (Math.max(0, ...db.orcamentos.map(x => x.numero)) + 1), clienteId: o.clienteId, obraId: o.obraId, cidade,
    data: o.data, validade: o.validade, status: o.status, desconto: num(o.desconto), obs: o.obs, itens };
  if (o.validacao) { reg.validacao = o.validacao; sincronizarGastoOrc(reg); }
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
let logoPdf = null; // logo em base64 para o cabeçalho dos PDFs
fetch('img/logo-pdf.jpg').then(r => r.blob()).then(b => new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); }))
  .then(d => (logoPdf = d)).catch(() => {});

function novoPdf(titulo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const c = db.config;
  doc.setFillColor(6, 26, 46); doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(37, 99, 235); doc.rect(0, 32, 210, 1.2, 'F');
  let x = 14;
  if (logoPdf) { doc.addImage(logoPdf, 'JPEG', 10, 3, 40, 25.7); x = 55; }
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(c.empresa || 'JR Construções', x, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(203, 213, 225);
  const info = [c.cnpj ? 'CNPJ: ' + c.cnpj : '', c.telefone ? 'Tel/WhatsApp: ' + c.telefone : ''].filter(Boolean).join('   ·   ');
  if (info) doc.text(info, x, 19);
  if (c.endereco) doc.text(c.endereco, x, 24);
  doc.setTextColor(255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text(titulo, 196, 13, { align: 'right' });
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
const corTabela = { headStyles: { fillColor: [11, 39, 68] }, styles: { fontSize: 9 }, alternateRowStyles: { fillColor: [240, 245, 252] } };

// Celular/tablet: abre o compartilhamento (WhatsApp etc.). Computador: baixa o PDF direto.
const ehCelular = () => (navigator.userAgentData && navigator.userAgentData.mobile) ||
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)); // iPad

async function compartilharPdf(doc, arquivo, telefone, texto) {
  if (ehCelular()) {
    const file = new File([doc.output('blob')], arquivo, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: arquivo, text: texto }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
  }
  doc.save(arquivo);
  toast('PDF baixado: ' + arquivo);
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

  const grupo = (titulo, itens) => itens.length ? [[{ content: titulo, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [226, 236, 250] } }],
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
let pag = { tipo: agora.getDate() <= 15 ? 'q1' : 'q2', mes: `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}` };

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
const pesoFalta = x => x.desconta === false ? 0 : (x.tipo === 'meia' ? 0.5 : 1);

function folha(a, b, ateHoje = false) {
  if (ateHoje && b > hoje()) b = hoje();
  const uteis = diasUteis(a, b);
  return C('funcionarios').filter(f => f.ativo !== false).map(f => {
    // considera só o período em que o funcionário estava admitido
    const adm = f.admissao || f.criadoEm || '';
    const ini = adm > a ? adm : a;
    const dias = ini > b ? 0 : diasUteis(ini, b);
    const fs = db.faltas.filter(x => x.funcionarioId === f.id && entre(x.data, ini, b));
    const faltas = fs.reduce((t, x) => t + pesoFalta(x), 0);
    const trab = Math.max(0, dias - faltas);
    const bruto = trab * num(f.diaria);
    const vales = soma(db.vales.filter(v => v.funcionarioId === f.id && entre(v.data, a, b)));
    const desc = vales; // vale = adiantamento de salário, sempre descontado
    return { f, uteis, dias, faltas, trab, bruto, vales, desc, liquido: bruto - desc, listaFaltas: fs };
  });
}

// texto "contado até hoje" quando o período ainda não terminou
const ateHojeTxt = b => b > hoje() ? ` · até hoje (${br(hoje()).slice(0, 5)})` : '';

VIEWS.funcionarios = () => {
  const [a, b] = periodoPag();
  const linhas = folha(a, b, true);
  const total = linhas.reduce((t, l) => t + l.liquido, 0);
  const previsto = b > hoje() && a <= hoje() ? folha(a, b).reduce((t, l) => t + l.liquido, 0) : null;
  const faltasPeriodo = C('faltas').filter(x => entre(x.data, a, b)).sort((x, y) => y.data.localeCompare(x.data));
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
    <p class="muted" style="font-size:13px;margin:10px 0 0">⛽ Os vales são adiantamento de salário e já saem descontados do valor a pagar.</p>
    <label class="check"><input type="checkbox" ${db.config.trabalhaSabado ? 'checked' : ''} data-change="pagSabado"> Sábado conta como dia de trabalho</label>
  </div>

  <div class="grid grid-2">
    <div class="stat hl"><div class="label">Total a pagar · ${br(a)} a ${br(b)}${ateHojeTxt(b)}</div><div class="value">${money(total)}</div>
      ${previsto !== null ? `<div class="sub" style="opacity:.85">Previsto até ${br(b).slice(0, 5)}: ${money(previsto)}</div>` : ''}</div>
    <div class="stat"><div class="label">Dias úteis no período</div><div class="value">${diasUteis(a, b)}</div>
      ${b > hoje() && a <= hoje() ? `<div class="sub muted">${diasUteis(a, hoje())} até hoje</div>` : ''}</div>
  </div>
  <p class="muted" style="font-size:13px;margin:8px 2px 0">💡 O salário conta a partir da <b>data de admissão</b> de cada funcionário e só até <b>hoje</b>. Dias que ainda não chegaram não entram.</p>

  <div class="section-head"><h2>Relatório de pagamento</h2>
    <div class="row"><button class="btn sec" data-act="lancarFalta">+ Lançar falta</button>${linhas.length ? '<button class="btn wa" data-act="pdfFolha">📄 Relatório PDF</button>' : ''}</div></div>
  <div class="card table-wrap">${linhas.length ? `<table>
    <thead><tr><th>Funcionário</th><th class="num">Diária</th><th class="num">Dias</th><th class="num">Faltas</th><th class="num">Trab.</th><th class="num">Bruto</th><th class="num">Vales</th><th class="num">A pagar</th></tr></thead>
    <tbody>${linhas.map(l => `<tr><td><b>${esc(l.f.nome)}</b><br><small class="muted">${esc(l.f.funcao || '')}${tagCid(l.f)}</small></td>
      <td class="num">${money(l.f.diaria)}</td><td class="num">${l.dias}</td><td class="num">${String(l.faltas).replace('.', ',')}</td><td class="num">${String(l.trab).replace('.', ',')}</td>
      <td class="num">${money(l.bruto)}</td><td class="num">${l.desc ? '-' + money(l.desc) : '—'}</td><td class="num"><b ${l.liquido < 0 ? 'style="color:var(--danger)"' : ''}>${money(l.liquido)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="5">Total</td><td class="num">${money(linhas.reduce((t, l) => t + l.bruto, 0))}</td><td class="num">-${money(linhas.reduce((t, l) => t + l.desc, 0))}</td><td class="num">${money(total)}</td></tr></tfoot>
  </table>` : '<div class="empty">Cadastre os funcionários para gerar o relatório</div>'}</div>

  <div class="card row">
    <div class="info" style="flex:1 1 220px">👷 Cadastro, edição e faltas dos funcionários ficam na aba <b>Funcionários</b>.${faltasPeriodo.length ? ` <span class="muted">(${faltasPeriodo.length} falta(s) neste período)</span>` : ''}</div>
    <button class="btn sec" data-act="goTab" data-tab="equipe">Abrir Funcionários</button>
  </div>`;
};

actions.pagTipo = d => { pag.tipo = d.t; render(); };
changeActions.pagMes = el => { if (el.value) { pag.mes = el.value; render(); } };
changeActions.pagSabado = el => { db.config.trabalhaSabado = el.checked; salvar(); render(); };

// =====================================================
// 5b) FUNCIONÁRIOS (aba exclusiva)
// =====================================================
const MOTIVOS_FALTA = ['Falta', 'Atestado médico', 'Folga', 'Chuva / obra parada', 'Outro'];
let equipe = { status: 'ativos', mes: `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`, func: '' };

const nFaltas = n => String(n).replace('.', ',');
const descFalta = x => `${x.tipo === 'meia' ? 'Meio dia' : 'Dia inteiro'} · ${esc(x.motivo || 'Falta')}${x.desconta === false ? ' · <b>não desconta</b>' : ''}${x.obs ? ' · ' + esc(x.obs) : ''}`;

function resumoFunc(f, mes) {
  const [a, b] = [`${mes}-01`, `${mes}-${pad(ultimoDia(+mes.slice(0, 4), +mes.slice(5) - 1))}`];
  const l = folha(a, b, true).find(x => x.f.id === f.id);
  const faltas = db.faltas.filter(x => x.funcionarioId === f.id && entre(x.data, a, b));
  const vales = db.vales.filter(v => v.funcionarioId === f.id && entre(v.data, a, b));
  return { a, b, l, faltas, vales };
}

VIEWS.equipe = () => {
  const funcs = C('funcionarios');
  const lista = funcs
    .filter(f => equipe.status === 'todos' || (equipe.status === 'ativos' ? f.ativo !== false : f.ativo === false))
    .sort((x, y) => x.nome.localeCompare(y.nome));
  const ativos = funcs.filter(f => f.ativo !== false);
  const [ma, mb] = [`${equipe.mes}-01`, `${equipe.mes}-${pad(ultimoDia(+equipe.mes.slice(0, 4), +equipe.mes.slice(5) - 1))}`];
  const faltasMes = C('faltas').filter(x => entre(x.data, ma, mb) && (!equipe.func || x.funcionarioId === equipe.func))
    .sort((x, y) => y.data.localeCompare(x.data));
  const totalFaltasMes = faltasMes.reduce((t, x) => t + pesoFalta(x), 0);
  const [mm, ma2] = [+equipe.mes.slice(5), equipe.mes.slice(0, 4)];
  return `
  <div class="grid grid-3">
    <div class="stat"><div class="label">Funcionários ativos</div><div class="value">${ativos.length}</div></div>
    <div class="stat"><div class="label">Custo por dia (diárias)</div><div class="value">${money(soma(ativos, f => f.diaria))}</div></div>
    <div class="stat hl"><div class="label">Faltas em ${MESES[mm - 1]}</div><div class="value">${nFaltas(totalFaltasMes)} dia(s)</div></div>
  </div>

  <div class="section-head"><h2>Funcionários</h2>
    <div class="row"><button class="btn sec" data-act="lancarFalta">+ Lançar falta</button><button class="btn" data-act="novoFunc">+ Novo funcionário</button></div></div>
  <div class="card">
    <div class="inline-filters" style="margin-bottom:6px">
      <div><input id="buscaFunc" placeholder="🔎 Buscar por nome ou função…"></div>
      <div style="flex:0 0 auto"><div class="seg">
        ${[['ativos', 'Ativos'], ['inativos', 'Inativos'], ['todos', 'Todos']].map(([k, r]) => `<button type="button" class="${equipe.status === k ? 'active' : ''}" data-act="equipeStatus" data-s="${k}">${r}</button>`).join('')}
      </div></div>
    </div>
    ${lista.length ? lista.map(f => {
      const r = resumoFunc(f, equipe.mes);
      const nf = r.faltas.reduce((t, x) => t + pesoFalta(x), 0);
      return `<div class="list-item func-item" data-busca="${esc((f.nome + ' ' + (f.funcao || '')).toLowerCase())}" ${f.ativo === false ? 'style="opacity:.6"' : ''}>
        <div class="avatar">${esc(f.nome.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase())}</div>
        <div class="info" data-act="verFunc" data-id="${f.id}" style="cursor:pointer">
          <div class="title">${esc(f.nome)} ${f.ativo === false ? '<span class="badge gray">Inativo</span>' : ''}</div>
          <div class="sub">${esc(f.funcao || 'Sem função')} · Diária ${money(f.diaria)}${tagCid(f)}</div>
          <div class="sub">${nf ? `<span class="badge warn">${nFaltas(nf)} falta(s) em ${MESES_C[mm - 1]}</span>` : `<span class="badge ok">Sem faltas em ${MESES_C[mm - 1]}</span>`}</div>
        </div>
        <div class="row func-btns" style="justify-content:flex-end">
          ${f.ativo !== false ? `<button class="btn sec sm" data-act="lancarFalta" data-id="${f.id}">Falta</button>` : ''}
          <button class="btn ghost sm" data-act="verFunc" data-id="${f.id}">Ficha</button>
          <button class="btn ghost sm" data-act="editFunc" data-id="${f.id}">Editar</button>
        </div>
      </div>`;
    }).join('') : `<div class="empty">${funcs.length ? 'Nenhum funcionário neste filtro' : 'Nenhum funcionário cadastrado. Toque em “+ Novo funcionário”.'}</div>`}
  </div>

  <div class="section-head"><h2>Faltas de ${MESES[mm - 1]}/${ma2}</h2></div>
  <div class="card">
    <div class="inline-filters" style="margin-bottom:6px">
      <div><label>Mês</label><input type="month" value="${equipe.mes}" data-change="equipeMes"></div>
      <div><label>Funcionário</label><select data-change="equipeFunc">${opt(funcs, equipe.func, 'Todos')}</select></div>
    </div>
    ${faltasMes.length ? faltasMes.map(x => `
      <div class="list-item"><div class="info"><div class="title">${esc(byId('funcionarios', x.funcionarioId)?.nome || '—')}</div>
        <div class="sub">${br(x.data)} (${['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][parse(x.data).getDay()]}) · ${descFalta(x)}</div></div>
        <button class="btn ghost sm" data-act="editFalta" data-id="${x.id}">Editar</button>
        <button class="btn danger sm" data-act="delFalta" data-id="${x.id}">Remover</button></div>`).join('') : '<div class="empty">Nenhuma falta neste mês</div>'}
  </div>`;
};

POS.equipe = () => {
  const busca = document.getElementById('buscaFunc');
  busca.addEventListener('input', () => {
    const q = busca.value.toLowerCase().trim();
    document.querySelectorAll('[data-busca]').forEach(el => (el.hidden = q && !el.dataset.busca.includes(q)));
  });
};
actions.equipeStatus = d => { equipe.status = d.s; render(); };
changeActions.equipeMes = el => { if (el.value) { equipe.mes = el.value; render(); } };
changeActions.equipeFunc = el => { equipe.func = el.value; render(); };

function formFunc(f = {}) {
  return `<label>Nome completo *</label><input name="nome" required value="${esc(f.nome)}">
    <div class="grid grid-2">
      <div><label>Função</label><input name="funcao" value="${esc(f.funcao)}" placeholder="Pedreiro, servente…" list="funcoes"></div>
      <div><label>Valor da diária (R$) *</label><input name="diaria" required inputmode="decimal" value="${f.diaria ?? ''}"></div>
    </div>
    <datalist id="funcoes"><option>Pedreiro</option><option>Servente</option><option>Mestre de obras</option><option>Eletricista</option><option>Encanador</option><option>Pintor</option><option>Carpinteiro</option><option>Armador</option></datalist>
    <div class="grid grid-2">
      <div><label>Telefone / WhatsApp</label><input name="telefone" inputmode="tel" value="${esc(f.telefone)}"></div>
      <div><label>CPF</label><input name="cpf" inputmode="numeric" value="${esc(f.cpf)}"></div>
    </div>
    <div class="grid grid-2">
      <div><label>Data de admissão</label><input type="date" name="admissao" value="${f.admissao || (f.id ? '' : hoje())}"></div>
      <div><label>Chave PIX</label><input name="pix" value="${esc(f.pix)}"></div>
    </div>
    <label>Endereço</label><input name="endereco" value="${esc(f.endereco)}">
    ${campoCidade(f)}
    <label>Observações</label><textarea name="obs">${esc(f.obs)}</textarea>
    <label class="check"><input type="checkbox" name="ativo" ${f.ativo !== false ? 'checked' : ''}> Funcionário ativo (desmarque quando sair da empresa)</label>`;
}
actions.novoFunc = () => abrirModal('Novo funcionário', formFunc(), d => { d.diaria = num(d.diaria); db.funcionarios.push({ id: uid(), criadoEm: hoje(), ...d }); toast('Funcionário cadastrado'); });
actions.editFunc = ({ id }) => {
  const f = byId('funcionarios', id);
  abrirModal('Editar funcionário', formFunc(f) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delFunc" data-id="${id}">Excluir funcionário</button></div>`, d => { d.diaria = num(d.diaria); Object.assign(f, d); toast('Dados atualizados'); });
};
actions.delFunc = ({ id }) => {
  if (db.vales.some(v => v.funcionarioId === id) || db.faltas.some(v => v.funcionarioId === id))
    return alert('Este funcionário tem vales ou faltas lançados. Desmarque "Funcionário ativo" em vez de excluir, assim o histórico é mantido.');
  fecharModal(); confirmarExcluir('funcionarios', id);
};

actions.verFunc = ({ id }) => {
  const f = byId('funcionarios', id);
  const mesAtual = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`;
  const r = resumoFunc(f, mesAtual);
  const [qa, qb] = rangeQuinzena(hoje());
  const lq = folha(qa, qb, true).find(x => x.f.id === id);
  const prevQ = folha(qa, qb).find(x => x.f.id === id), prevM = folha(r.a, r.b).find(x => x.f.id === id);
  const adm = f.admissao || f.criadoEm || '';
  const desde = (a, b) => adm > a && adm <= b ? `desde ${br(adm).slice(0, 5)} (admissão)` : '';
  const prevTxt = (p, l, b) => b > hoje() && p && l && p.liquido !== l.liquido ? `<div class="sub muted">previsto até ${br(b).slice(0, 5)}: ${money(p.liquido)}</div>` : '';
  const todas = db.faltas.filter(x => x.funcionarioId === id).sort((x, y) => y.data.localeCompare(x.data));
  const linha = (rot, val) => val ? `<div class="list-item"><div class="info sub">${rot}</div><div>${val}</div></div>` : '';
  abrirModal(f.nome, `
    <div class="row" style="margin:6px 0 4px">
      <span class="badge ${f.ativo === false ? 'gray' : 'ok'}">${f.ativo === false ? 'Inativo' : 'Ativo'}</span>
      <span class="muted">${esc(f.funcao || '')}</span>
    </div>
    ${linha('Diária', money(f.diaria))}
    ${linha('Telefone', esc(f.telefone))}
    ${linha('CPF', esc(f.cpf))}
    ${linha('PIX', esc(f.pix))}
    ${linha('Cidade', '📍 ' + esc(f.cidade || '—'))}
    ${linha('Admissão', br(f.admissao))}
    ${linha('Endereço', esc(f.endereco))}
    ${linha('Observações', esc(f.obs))}
    <div class="grid grid-2" style="margin-top:12px">
      <div class="stat"><div class="label">Quinzena atual (${br(qa).slice(0, 5)}–${br(qb).slice(0, 5)})${ateHojeTxt(qb)}</div><div class="value">${money(lq ? lq.liquido : 0)}</div>
        <div class="sub muted">${lq ? nFaltas(lq.trab) : 0} dia(s) · ${lq ? nFaltas(lq.faltas) : 0} falta(s)${lq && lq.desc ? ` · vales -${money(lq.desc)}` : ''}${desde(qa, qb) ? ' · ' + desde(qa, qb) : ''}</div>${prevTxt(prevQ, lq, qb)}</div>
      <div class="stat"><div class="label">${MESES[agora.getMonth()]}${ateHojeTxt(r.b)}</div><div class="value">${money(r.l ? r.l.liquido : 0)}</div>
        <div class="sub muted">${r.l ? nFaltas(r.l.trab) : 0} dia(s) · ${r.l ? nFaltas(r.l.faltas) : 0} falta(s) · vales -${money(soma(r.vales))}${desde(r.a, r.b) ? ' · ' + desde(r.a, r.b) : ''}</div>${prevTxt(prevM, r.l, r.b)}</div>
    </div>
    <h4 style="margin:16px 0 4px">Faltas (${todas.length})</h4>
    ${todas.length ? todas.slice(0, 30).map(x => `<div class="list-item"><div class="info"><div class="title">${br(x.data)}</div><div class="sub">${descFalta(x)}</div></div>
      <button type="button" class="btn danger sm" data-act="delFalta" data-id="${x.id}">Remover</button></div>`).join('') : '<div class="empty">Nenhuma falta registrada</div>'}
    <div class="row" style="margin-top:14px">
      ${f.ativo !== false ? `<button type="button" class="btn" data-act="lancarFalta" data-id="${id}">+ Lançar falta</button>` : ''}
      <button type="button" class="btn sec" data-act="editFunc" data-id="${id}">Editar dados</button>
      ${f.telefone ? `<a class="btn wa" href="https://wa.me/${foneWa(f.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
    </div>`, null);
};

function formFalta(x = {}, idFunc) {
  return `<label>Funcionário *</label><select name="funcionarioId" required>${opt(db.funcionarios.filter(f => (daCid(f) && f.ativo !== false) || f.id === x.funcionarioId || f.id === idFunc), x.funcionarioId || idFunc, 'Selecione…')}</select>
    <div class="grid grid-2">
      <div><label>Data *</label><input type="date" name="data" required value="${x.data || hoje()}"></div>
      ${x.id ? '' : '<div><label>Até (vários dias, opcional)</label><input type="date" name="ate"></div>'}
    </div>
    <div class="grid grid-2">
      <div><label>Tipo</label><select name="tipo"><option value="dia" ${x.tipo !== 'meia' ? 'selected' : ''}>Dia inteiro</option><option value="meia" ${x.tipo === 'meia' ? 'selected' : ''}>Meio dia</option></select></div>
      <div><label>Motivo</label><select name="motivo">${optTxt(MOTIVOS_FALTA, x.motivo || 'Falta')}</select></div>
    </div>
    <label>Observação</label><input name="obs" value="${esc(x.obs)}">
    <label class="check"><input type="checkbox" name="desconta" ${x.desconta !== false ? 'checked' : ''}> Descontar do pagamento</label>
    <p class="muted" style="font-size:12.5px;margin:6px 0 0">Desmarque para atestado ou folga paga: fica registrado, mas não reduz o pagamento.</p>`;
}
actions.lancarFalta = d => {
  if (!C('funcionarios').some(f => f.ativo !== false)) return alert('Cadastre os funcionários primeiro.');
  abrirModal('Lançar falta', formFalta({}, d.id), f => {
    const ate = f.ate && f.ate > f.data ? f.ate : f.data;
    delete f.ate;
    let n = 0, rep = 0;
    for (let dia = f.data; dia <= ate; dia = addDias(dia, 1)) {
      const w = parse(dia).getDay();
      if (dia !== f.data && (w === 0 || (w === 6 && !db.config.trabalhaSabado))) continue; // pula dias sem trabalho no intervalo
      if (db.faltas.some(x => x.funcionarioId === f.funcionarioId && x.data === dia)) { rep++; continue; }
      db.faltas.push({ id: uid(), ...f, data: dia }); n++;
    }
    if (!n) { alert('Já existe falta lançada nesta data para este funcionário.'); return false; }
    toast(`${n} falta(s) lançada(s)${rep ? ` · ${rep} já existia(m)` : ''}`);
  }, 'Lançar');
};
actions.editFalta = ({ id }) => {
  const x = byId('faltas', id);
  abrirModal('Editar falta', formFalta(x), f => {
    if (db.faltas.some(o => o.id !== id && o.funcionarioId === f.funcionarioId && o.data === f.data)) { alert('Já existe falta neste dia para este funcionário.'); return false; }
    Object.assign(x, f);
  });
};
actions.delFalta = ({ id }) => { fecharModal(); confirmarExcluir('faltas', id, 'Remover esta falta?'); };

actions.pdfFolha = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = periodoPag();
  const linhas = folha(a, b, true);
  const [y, m] = pag.mes.split('-').map(Number);
  const nomeTipo = pag.tipo === 'mes' ? 'MENSAL' : pag.tipo === 'q1' ? '1ª QUINZENA' : '2ª QUINZENA';
  const doc = novoPdf(`PAGAMENTO ${nomeTipo}`);
  doc.setFontSize(10);
  doc.text(`Cidade: ${nomeCidade()}  ·  Período: ${br(a)} a ${br(b)}${b > hoje() ? ' (contado até ' + br(hoje()) + ')' : ''} (${MESES[m - 1]}/${y})  ·  Dias úteis: ${diasUteis(a, b)}${db.config.trabalhaSabado ? ' (seg a sáb)' : ' (seg a sex)'}`, 14, 40);
  const head = [cidadeAtual ? 'Funcionário' : 'Funcionário (cidade)', 'Função', 'Diária', 'Dias', 'Faltas', 'Trab.', 'Bruto', 'Vales (adiant.)', 'A pagar', 'PIX'];
  const body = linhas.map(l => [l.f.nome + (cidadeAtual ? '' : ` (${l.f.cidade})`), l.f.funcao || '', money(l.f.diaria), l.dias, String(l.faltas).replace('.', ','), String(l.trab).replace('.', ','),
    money(l.bruto), l.desc ? '-' + money(l.desc) : '—', money(l.liquido), l.f.pix || '']);
  const total = linhas.reduce((t, l) => t + l.liquido, 0);
  const cols = head.length;
  doc.autoTable({
    startY: 45, head: [head], body, ...corTabela,
    foot: [[{ content: 'TOTAL', colSpan: cols - 2 }, money(total), '']],
    footStyles: { fillColor: [226, 236, 250], textColor: 30, fontStyle: 'bold' },
  });
  // detalhamento das faltas
  const det = linhas.flatMap(l => l.listaFaltas.map(x => [l.f.nome, br(x.data), x.tipo === 'meia' ? 'Meio dia' : 'Dia inteiro', (x.motivo || 'Falta') + (x.desconta === false ? ' (não desconta)' : '') + (x.obs ? ' — ' + x.obs : '')]));
  if (det.length) {
    doc.setFontSize(11); doc.text('Faltas no período', 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 13, head: [['Funcionário', 'Data', 'Tipo', 'Motivo']], body: det, ...corTabela });
  }
  rodapePdf(doc);
  compartilharPdf(doc, `Pagamento_${nomeTipo.replace(/\W+/g, '_')}_${pag.mes}${arqCidade()}.pdf`, undefined, `Relatório de pagamento ${nomeTipo.toLowerCase()} — ${br(a)} a ${br(b)}: ${money(total)}`);
};

// =====================================================
// 6) GASTOS
// =====================================================
let gastoRef = { tipo: 'mes', data: hoje() };

function gastosPeriodo(a, b) {
  const desp = C('despesas').filter(d => entre(d.data, a, b));
  const vales = soma(C('vales').filter(v => entre(v.data, a, b)));
  // vale é adiantamento: já faz parte da mão de obra. Conta o maior entre o ganho e o adiantado.
  const fl = folha(a, b, true);
  const valesFora = soma(C('vales').filter(v => entre(v.data, a, b) && !fl.some(l => l.f.id === v.funcionarioId)));
  const folhaT = fl.reduce((t, l) => t + Math.max(l.bruto, l.vales), 0) + valesFora;
  const porCat = {};
  desp.forEach(d => (porCat[d.categoria] = (porCat[d.categoria] || 0) + num(d.valor)));
  const despT = soma(desp);
  return { desp, vales, folha: folhaT, despT, porCat, total: despT + folhaT };
}

VIEWS.gastos = () => {
  const [a, b] = rangePor(gastoRef.tipo, gastoRef.data);
  const g = gastosPeriodo(a, b);
  const fat = soma(C('receitas').filter(r => entre(r.data, a, b)));
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
      ${g.vales ? `<div class="list-item"><div class="info sub">&nbsp;&nbsp;↳ já adiantado em vales (incluído acima)</div><div class="sub">${money(g.vales)}</div></div>` : ''}
      ${Object.entries(g.porCat).map(([c, v]) => `<div class="list-item"><div class="info">🧾 ${esc(c)}</div><div class="amount">${money(v)}</div></div>`).join('')}
      <div class="list-item"><div class="info"><b>Total</b></div><div class="amount">${money(g.total)}</div></div>
    </div>
    <div class="card"><div class="chart-box"><canvas id="chGastos"></canvas></div></div>
  </div>

  <div class="section-head"><h2>Despesas lançadas</h2>
    <div class="row"><button class="btn sec" data-act="pdfGastos">📄 PDF</button><button class="btn" data-act="novaDespesa">+ Lançar despesa</button></div></div>
  <div class="card">${g.desp.length ? g.desp.sort((x, y) => y.data.localeCompare(x.data)).map(d => `
    <div class="list-item"><div class="info"><div class="title">${esc(d.descricao || d.categoria)}</div>
      <div class="sub">${br(d.data)} · ${esc(d.categoria)}${d.obraId ? ' · ' + esc(byId('obras', d.obraId)?.nome || '') : ''}${tagCid(d)}</div></div>
      <div class="amount" style="color:var(--danger)">${money(d.valor)}</div>
      <button class="btn ghost sm" data-act="editDespesa" data-id="${d.id}">Editar</button></div>`).join('') : '<div class="empty">Nenhuma despesa no período</div>'}</div>
  <p class="muted" style="font-size:13px">A mão de obra é calculada automaticamente pelas diárias dos funcionários ativos (da admissão até hoje), descontando as faltas. Os vales de combustível são adiantamento de salário, por isso já estão dentro da mão de obra.</p>`;
};

POS.gastos = () => {
  const [a, b] = rangePor(gastoRef.tipo, gastoRef.data);
  const g = gastosPeriodo(a, b);
  const labels = ['Mão de obra', ...Object.keys(g.porCat)];
  const data = [g.folha, ...Object.values(g.porCat)];
  const el = document.getElementById('chGastos');
  if (!el || !window.Chart) return;
  if (!data.some(Boolean)) { el.parentElement.innerHTML = '<div class="empty">Sem gastos no período</div>'; return; }
  charts.push(new Chart(el, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: CORES, borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { legend: { position: 'bottom', labels: { color: '#93a4bd', boxWidth: 12 } },
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
    <label>Obra (opcional)</label><select name="obraId">${opt(db.obras.filter(o => daCid(o) || o.id === d.obraId), d.obraId, 'Geral / sem obra')}</select>
    ${campoCidade(d)}`;
}
actions.novaDespesa = (d = {}) => abrirModal('Lançar despesa', formDespesa({ obraId: d.obra, cidade: byId('obras', d.obra)?.cidade }), d => { d.valor = num(d.valor); cidadeDaObra(d); db.despesas.push({ id: uid(), ...d }); toast('Despesa lançada'); });
actions.editDespesa = ({ id }) => {
  const x = byId('despesas', id);
  abrirModal('Editar despesa', formDespesa(x) + `<div class="row" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="delReg" data-lista="despesas" data-id="${id}">Excluir</button></div>`, d => { d.valor = num(d.valor); cidadeDaObra(d); Object.assign(x, d); });
};
actions.pdfGastos = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = rangePor(gastoRef.tipo, gastoRef.data);
  const g = gastosPeriodo(a, b);
  const fat = soma(C('receitas').filter(r => entre(r.data, a, b)));
  const doc = novoPdf('RELATÓRIO DE GASTOS');
  doc.setFontSize(10); doc.text(`Cidade: ${nomeCidade()}  ·  Período: ${br(a)} a ${br(b)}`, 14, 40);
  doc.autoTable({ startY: 45, head: [['Resumo', 'Valor']], ...corTabela, columnStyles: { 1: { halign: 'right' } },
    body: [['Mão de obra (diárias − faltas)', money(g.folha)], ['   (já adiantado em vales)', money(g.vales)], ...Object.entries(g.porCat).map(([c, v]) => [c, money(v)]),
      [{ content: 'Total de gastos', styles: { fontStyle: 'bold' } }, { content: money(g.total), styles: { fontStyle: 'bold' } }],
      ['Faturamento no período', money(fat)], [{ content: 'Saldo', styles: { fontStyle: 'bold' } }, { content: money(fat - g.total), styles: { fontStyle: 'bold' } }]] });
  if (g.desp.length) {
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 8, head: [['Data', 'Descrição', 'Categoria', 'Obra', 'Valor']], ...corTabela, columnStyles: { 4: { halign: 'right' } },
      body: g.desp.map(d => [br(d.data), d.descricao || '', d.categoria, byId('obras', d.obraId)?.nome || '', money(d.valor)]) });
  }
  rodapePdf(doc);
  compartilharPdf(doc, `Gastos_${a}_a_${b}${arqCidade()}.pdf`, undefined, `Relatório de gastos ${br(a)} a ${br(b)}`);
};

actions.pdfVales = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = rangePor(valeRef.tipo, valeRef.data);
  const vales = C('vales').filter(v => entre(v.data, a, b)).sort((x, y) => x.data.localeCompare(y.data));
  const doc = novoPdf('VALES COMBUSTÍVEL');
  doc.setFontSize(10); doc.text(`Cidade: ${nomeCidade()}  ·  Período: ${br(a)} a ${br(b)}`, 14, 40);
  doc.autoTable({ startY: 45, head: [['Data', 'Colaborador', 'Posto', 'Valor']], ...corTabela, columnStyles: { 3: { halign: 'right' } },
    body: vales.map(v => [br(v.data), byId('funcionarios', v.funcionarioId)?.nome || '', byId('postos', v.postoId)?.nome || '', money(v.valor)]),
    foot: [[{ content: 'TOTAL', colSpan: 3 }, money(soma(vales))]], footStyles: { fillColor: [226, 236, 250], textColor: 30 } });
  rodapePdf(doc);
  compartilharPdf(doc, `Vales_${a}_a_${b}${arqCidade()}.pdf`, undefined, `Vales combustível ${br(a)} a ${br(b)}`);
};
actions.pdfVale = ({ id }) => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const v = byId('vales', id), f = byId('funcionarios', v.funcionarioId) || {}, p = byId('postos', v.postoId) || {};
  const doc = novoPdf('VALE COMBUSTÍVEL');
  doc.setFontSize(12);
  const linhas = [['Colaborador', f.nome || ''], ['Posto', p.nome || ''], ['Data', br(v.data)], ['Valor do vale', money(v.valor)], ['Tipo', 'Adiantamento de salário — será descontado no pagamento'], ['Observação', v.obs || '—']];
  doc.autoTable({ startY: 42, body: linhas, theme: 'grid', styles: { fontSize: 12, cellPadding: 4 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [226, 236, 250] } } });
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
  const lista = C('empreitadas').sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
  const recebido = e => soma(db.receitas.filter(r => r.empreitadaId === e.id));
  const abertas = lista.filter(e => e.status !== 'Concluída');
  const aReceber = lista.reduce((t, e) => t + Math.max(0, num(e.valor) - recebido(e)), 0);
  const item = e => {
    const rec = recebido(e);
    return `<div class="list-item">
      <span>🔨</span>
      <div class="info"><div class="title">${esc(e.servico)}</div>
        <div class="sub">${esc(e.cliente)}${e.endereco ? ' · ' + esc(e.endereco) : ''}${tagCid(e)}</div>
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
    <datalist id="listaClientes">${C('clientes').map(c => `<option>${esc(c.nome)}</option>`).join('')}</datalist>
    <div class="grid grid-2">
      <div><label>Telefone</label><input name="telefone" inputmode="tel" value="${esc(e.telefone)}"></div>
      <div><label>Endereço</label><input name="endereco" value="${esc(e.endereco)}"></div>
    </div>
    ${campoCidade(e)}
    <div class="grid grid-2">
      <div><label>Valor combinado (R$) *</label><input name="valor" required inputmode="decimal" value="${e.valor ?? ''}"></div>
      <div><label>Status</label><select name="status">${optTxt(STATUS_EMP, e.status || 'Aberta')}</select></div>
    </div>
    <div class="grid grid-2">
      <div><label>Início</label><input type="date" name="inicio" value="${e.inicio || hoje()}"></div>
      <div><label>Prazo (dias)</label><input name="prazo" inputmode="numeric" value="${esc(e.prazo)}"></div>
    </div>
    <label>Responsável</label><select name="responsavelId">${opt(db.funcionarios.filter(f => daCid(f) || f.id === e.responsavelId), e.responsavelId, 'Nenhum')}</select>
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
    db.receitas.push({ id: uid(), data: d.data, valor: num(d.valor), forma: d.forma, descricao: `Empreitada: ${e.servico} (${e.cliente})`, empreitadaId: id, cidade: e.cidade });
    if (rec + num(d.valor) >= num(e.valor)) e.status = 'Concluída';
    toast('Recebimento lançado no faturamento');
  }, 'Registrar');
};

// =====================================================
// 8) TODAS AS CIDADES (resumo somando as cidades)
// =====================================================
let cidRef = { tipo: 'mes', data: hoje() };
REFS.cidRef = () => cidRef;
const arqCidade = () => cidadeAtual ? '_' + cidadeAtual.replace(/[^\wÀ-ú]+/g, '_') : '';

// números de uma cidade no período (cid vazio = todas)
function resumoCidade(cid, a, b) {
  return comCidade(cid, () => {
    const fat = soma(C('receitas').filter(r => entre(r.data, a, b)));
    const g = gastosPeriodo(a, b);
    const obrasAtivas = C('obras').filter(o => o.status !== 'Concluída');
    const empAbertas = C('empreitadas').filter(e => e.status !== 'Concluída');
    const recEmp = e => soma(db.receitas.filter(r => r.empreitadaId === e.id));
    const aReceber = obrasAtivas.reduce((t, o) => t + Math.max(0, num(o.valor) - recebidoObra(o)), 0) +
      C('empreitadas').reduce((t, e) => t + Math.max(0, num(e.valor) - recEmp(e)), 0);
    return {
      cid, fat, gastos: g.total, maoObra: g.folha, despesas: g.despT, vales: g.vales, saldo: fat - g.total, aReceber,
      obras: obrasAtivas.length, andamento: obrasAtivas.filter(o => o.status === 'Em andamento').length,
      emp: empAbertas.length, func: C('funcionarios').filter(f => f.ativo !== false).length,
      orcPend: C('orcamentos').filter(o => (o.status || 'Pendente') === 'Pendente').length,
    };
  });
}

VIEWS.cidades = () => {
  const [a, b] = rangePor(cidRef.tipo, cidRef.data);
  const linhas = db.config.cidades.map(c => resumoCidade(c, a, b));
  const t = resumoCidade('', a, b);
  const cor = v => `style="color:var(${v < 0 ? '--danger' : '--ok'})"`;
  return `
  <div class="card row cid-aviso">
    <div class="info" style="flex:1 1 240px">🌎 <b>Todas as cidades somadas.</b> <span class="muted">Para ver só uma cidade, escolha no 📍 do topo ou toque em <b>Abrir</b>.</span></div>
    <button class="btn sec" data-act="gerenciarCidades">➕ Cidades</button>
  </div>
  ${filtroPeriodo(cidRef, 'cidRef', ['semana', 'quinzena', 'mes', 'ano'])}

  <div class="section-head"><h2>Total geral · ${br(a)} a ${br(b)}</h2>${linhas.length ? '<button class="btn wa" data-act="pdfCidades">📄 PDF</button>' : ''}</div>
  <div class="grid grid-3">
    <div class="stat"><div class="label">Faturamento</div><div class="value" style="color:var(--ok)">${money(t.fat)}</div></div>
    <div class="stat"><div class="label">Gastos</div><div class="value" style="color:var(--danger)">${money(t.gastos)}</div></div>
    <div class="stat hl"><div class="label">Saldo</div><div class="value">${money(t.saldo)}</div></div>
  </div>
  <div class="grid grid-3" style="margin-top:12px">
    <div class="stat"><div class="label">Obras ativas</div><div class="value">${t.obras} <small class="muted" style="font-size:13px;font-weight:500">· ${t.emp} empreitada(s)</small></div></div>
    <div class="stat"><div class="label">Funcionários ativos</div><div class="value">${t.func}</div></div>
    <div class="stat"><div class="label">A receber (obras + empreitadas)</div><div class="value">${money(t.aReceber)}</div></div>
  </div>

  <div class="section-head"><h2>Por cidade</h2></div>
  <div class="cid-cards">${linhas.map(l => `
    <div class="card cid-card">
      <div class="cid-head"><b>📍 ${esc(l.cid)}</b><button class="btn sm" data-act="abrirCidade" data-c="${esc(l.cid)}">Abrir ›</button></div>
      <div class="cid-nums">
        <div><span>Faturamento</span><b style="color:var(--ok)">${money(l.fat)}</b></div>
        <div><span>Gastos</span><b style="color:var(--danger)">${money(l.gastos)}</b></div>
        <div><span>Saldo</span><b ${cor(l.saldo)}>${money(l.saldo)}</b></div>
        <div><span>A receber</span><b>${money(l.aReceber)}</b></div>
      </div>
      <div class="sub muted">🏗️ ${l.obras} obra(s) ativa(s) · 🔨 ${l.emp} empreitada(s) · 👷 ${l.func} funcionário(s) · 🧾 ${l.orcPend} orçamento(s) pendente(s)</div>
      ${t.fat ? `<div class="progress" title="Participação no faturamento"><span style="width:${Math.round(l.fat / t.fat * 100)}%"></span></div><div class="sub muted">${Math.round(l.fat / t.fat * 100)}% do faturamento total</div>` : ''}
    </div>`).join('')}</div>

  <div class="section-head"><h2>Comparativo entre cidades</h2></div>
  <div class="card"><div class="chart-box"><canvas id="chCidades"></canvas></div></div>

  <div class="card table-wrap"><table>
    <thead><tr><th>Cidade</th><th class="num">Faturamento</th><th class="num">Mão de obra</th><th class="num">Despesas</th><th class="num">Gastos</th><th class="num">Saldo</th><th class="num">A receber</th></tr></thead>
    <tbody>${linhas.map(l => `<tr><td><b>${esc(l.cid)}</b></td><td class="num">${money(l.fat)}</td><td class="num">${money(l.maoObra)}</td><td class="num">${money(l.despesas)}</td><td class="num">${money(l.gastos)}</td><td class="num"><b ${cor(l.saldo)}>${money(l.saldo)}</b></td><td class="num">${money(l.aReceber)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td><td class="num">${money(t.fat)}</td><td class="num">${money(t.maoObra)}</td><td class="num">${money(t.despesas)}</td><td class="num">${money(t.gastos)}</td><td class="num">${money(t.saldo)}</td><td class="num">${money(t.aReceber)}</td></tr></tfoot>
  </table></div>`;
};

POS.cidades = () => {
  const [a, b] = rangePor(cidRef.tipo, cidRef.data);
  const linhas = db.config.cidades.map(c => resumoCidade(c, a, b));
  chartBar('chCidades', linhas.map(l => l.cid), [
    { label: 'Faturamento', data: linhas.map(l => l.fat), cor: '#3b82f6' },
    { label: 'Gastos', data: linhas.map(l => l.gastos), cor: '#94a3b8' },
    { label: 'Saldo', data: linhas.map(l => l.saldo), cor: '#22c55e' },
  ]);
};

actions.abrirCidade = ({ c }) => { escolherCidade(c); actions.goTab({ tab: 'agenda' }); };

actions.pdfCidades = () => {
  if (!window.jspdf) return alert('Sem internet para carregar o gerador de PDF.');
  const [a, b] = rangePor(cidRef.tipo, cidRef.data);
  const linhas = db.config.cidades.map(c => resumoCidade(c, a, b));
  const t = resumoCidade('', a, b);
  const doc = novoPdf('RESUMO POR CIDADE');
  doc.setFontSize(10); doc.text(`Todas as cidades  ·  Período: ${br(a)} a ${br(b)}`, 14, 40);
  const lin = l => [l.cid, money(l.fat), money(l.maoObra), money(l.despesas), money(l.gastos), money(l.saldo), money(l.aReceber), `${l.obras} / ${l.emp}`, l.func];
  doc.autoTable({
    startY: 45, ...corTabela, head: [['Cidade', 'Faturamento', 'Mão de obra', 'Despesas', 'Gastos', 'Saldo', 'A receber', 'Obras/Empr.', 'Func.']],
    body: linhas.map(lin), foot: [lin({ ...t, cid: 'TOTAL' })],
    footStyles: { fillColor: [226, 236, 250], textColor: 30, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'center' }, 8: { halign: 'center' } },
  });
  rodapePdf(doc);
  compartilharPdf(doc, `Resumo_cidades_${a}_a_${b}.pdf`, undefined, `Resumo de todas as cidades ${br(a)} a ${br(b)}: faturamento ${money(t.fat)}, gastos ${money(t.gastos)}, saldo ${money(t.saldo)}`);
};

// ---------- Cadastro de cidades ----------
const usoCidade = c => LISTAS_CIDADE.reduce((t, l) => t + db[l].filter(x => x.cidade === c).length, 0);
actions.gerenciarCidades = () => {
  abrirModal('Cidades', `
    <p class="muted" style="font-size:13px;margin-top:0">Cada obra, cliente, funcionário, vale, recebimento, despesa, orçamento e empreitada pertence a uma cidade.</p>
    ${db.config.cidades.map(c => `<div class="list-item"><div class="info"><div class="title">📍 ${esc(c)}</div><div class="sub">${usoCidade(c)} registro(s)</div></div>
      <button type="button" class="btn ghost sm" data-act="renomearCidade" data-c="${esc(c)}">Renomear</button>
      ${db.config.cidades.length > 1 ? `<button type="button" class="btn danger sm" data-act="excluirCidade" data-c="${esc(c)}">Excluir</button>` : ''}</div>`).join('')}
    <label>Nova cidade</label>
    <div class="row" style="flex-wrap:nowrap"><input name="nova" placeholder="Ex.: Iguatu" style="flex:1 1 auto;min-width:0"><button class="btn" type="submit" style="flex:0 0 auto">Adicionar</button></div>`, d => {
    const nome = (d.nova || '').trim();
    if (!nome) { alert('Digite o nome da cidade.'); return false; }
    if (db.config.cidades.some(c => c.toLowerCase() === nome.toLowerCase())) { alert('Essa cidade já está cadastrada.'); return false; }
    db.config.cidades.push(nome);
    salvar(); setTimeout(() => { escolherCidade(nome); actions.gerenciarCidades(); });
  }, 'Adicionar');
  // o próprio campo tem o botão Adicionar: tira os botões padrão do rodapé
  document.querySelector('#modalForm > .form-actions')?.remove();
};
actions.renomearCidade = ({ c }) => {
  const nome = (prompt('Novo nome da cidade:', c) || '').trim();
  if (!nome || nome === c) return;
  if (db.config.cidades.some(x => x !== c && x.toLowerCase() === nome.toLowerCase())) return alert('Já existe uma cidade com esse nome.');
  db.config.cidades = db.config.cidades.map(x => x === c ? nome : x);
  LISTAS_CIDADE.forEach(l => db[l].forEach(x => { if (x.cidade === c) x.cidade = nome; }));
  if (cidadeAtual === c) { cidadeAtual = nome; try { localStorage.setItem(KEY + ':cidade', nome); } catch (e) { /* ignora */ } }
  salvar(); render(); actions.gerenciarCidades(); toast('Cidade renomeada');
};
actions.excluirCidade = ({ c }) => {
  if (usoCidade(c)) return alert(`${c} tem registros cadastrados. Mude esses registros para outra cidade (no Editar de cada um) ou use Renomear.`);
  if (!confirm(`Excluir a cidade ${c}?`)) return;
  db.config.cidades = db.config.cidades.filter(x => x !== c);
  if (cidadeAtual === c) cidadeAtual = db.config.cidades[0];
  salvar(); render(); actions.gerenciarCidades();
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

  <div class="section-head"><h2>Cidades (${db.config.cidades.length})</h2><button class="btn sec" data-act="gerenciarCidades">➕ Adicionar / editar</button></div>
  <div class="card">${db.config.cidades.map(c => `<div class="list-item"><div class="info"><div class="title">📍 ${esc(c)}</div><div class="sub">${usoCidade(c)} registro(s)</div></div>
    <button class="btn ghost sm" data-act="abrirCidade" data-c="${esc(c)}">Abrir</button></div>`).join('')}</div>

  <div class="section-head"><h2>Minha conta</h2></div>
  <div class="card">
    <div class="list-item"><div class="info"><div class="title">${esc(usuario?.email || '')}</div><div class="sub">${ehAdmin() ? 'Administrador — pode lançar e alterar' : 'Leitor — só consulta'}</div></div>
    <button class="btn sec sm" data-act="sair">Sair</button></div>
    <p class="muted" style="font-size:13px;margin-bottom:0">Os dados ficam guardados no banco e aparecem iguais em qualquer aparelho em que você entrar com seu e-mail e senha.</p>
  </div>
  <div class="section-head"><h2>Acesso pelo celular</h2></div>
  <div class="card">
    <div class="link-box"><input readonly value="${esc(location.href.split('#')[0].split('?')[0])}" id="linkApp"><button class="btn sec" data-act="copiarLink">Copiar</button></div>
    ${modoApp() ? '<p style="margin-bottom:0">✅ Você está usando como <b>aplicativo</b>, sem a barra do navegador.</p>'
      : `<p class="muted" style="font-size:13px">Instale na tela inicial para abrir como aplicativo, em tela cheia e sem a barra do navegador.</p>
         <button class="btn" data-act="instalarApp">📲 Instalar como aplicativo</button>`}
  </div>

  <div class="section-head"><h2>Versão do app</h2></div>
  <div class="card">
    <div class="list-item"><div class="info"><div class="title">Versão instalada</div><div class="sub" id="cfgVerInfo">Verificando atualizações…</div></div><b>v${APP_VERSION}</b></div>
    <div class="row" style="margin-top:8px">
      <button class="btn sec" data-act="verificarAtualizacao">🔄 Verificar atualização</button>
      <button class="btn" data-act="atualizarApp">⬆️ Atualizar para nova versão</button>
    </div>
  </div>

  ${ehAdmin() ? '<div class="row"><button class="btn danger" data-act="zerar">Apagar todos os dados</button></div>' : ''}`;

POS.config = () => {
  verificarVersao();
  document.getElementById('cfgForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!ehAdmin()) return toast('Seu acesso é somente leitura');
    Object.assign(db.config, Object.fromEntries(new FormData(e.target).entries()));
    salvar(); render(); toast('Dados salvos');
  });
};
actions.sair = async () => { if (sb) await sb.auth.signOut(); location.reload(); };
actions.zerar = () => {
  if (!confirm('Apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
  if (prompt('Digite APAGAR para confirmar') !== 'APAGAR') return;
  db = estadoInicial(); cidadeAtual = db.config.cidades[0]; salvar(); render(); toast('Dados apagados');
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
  try { sessionStorage.setItem(KEY + ':alvo', versaoRemota ? versaoRemota.version : ''); } catch (e) { /* ignora */ }
  await limparCacheApp();
  location.replace(location.pathname + '?v=' + Date.now() + location.hash);
};
// Remove a cópia offline e o service worker para forçar o download dos arquivos novos
async function limparCacheApp() {
  try {
    if ('caches' in window) { for (const k of await caches.keys()) await caches.delete(k); }
    if (navigator.serviceWorker) { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); }
  } catch (e) { /* segue para recarregar */ }
}
// Depois de recarregar: confirma se pegou a versão nova; se não, tenta mais uma vez
(async () => {
  let alvo = null, tentou = false;
  try { alvo = sessionStorage.getItem(KEY + ':alvo'); tentou = sessionStorage.getItem(KEY + ':tentou') === '1'; } catch (e) { return; }
  if (alvo === null) return;
  if (alvo && cmpVersao(APP_VERSION, alvo) < 0 && !tentou) {
    try { sessionStorage.setItem(KEY + ':tentou', '1'); } catch (e) { /* ignora */ }
    await limparCacheApp();
    location.replace(location.pathname + '?v=' + Date.now() + '&r=2' + location.hash);
    return;
  }
  try { sessionStorage.removeItem(KEY + ':alvo'); sessionStorage.removeItem(KEY + ':tentou'); } catch (e) { /* ignora */ }
  toast(cmpVersao(APP_VERSION, alvo || '0') >= 0 ? `App atualizado para v${APP_VERSION} ✔` : 'Não foi possível atualizar agora. Feche e abra o app de novo.');
})();
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
if (/[?&]v=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);

// =====================================================
// INSTALAR COMO APLICATIVO (tela cheia, sem barra do navegador)
// =====================================================
const modoApp = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true;
const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const navInterno = () => /FBAN|FBAV|Instagram|Line\/|WhatsApp/i.test(navigator.userAgent); // navegadores dentro de outros apps
let pedidoInstalar = null;

function mostrarInstalar() {
  if (modoApp()) return;
  document.getElementById('btnInstalar').hidden = false;
  let fechado = 0;
  try { fechado = Number(localStorage.getItem(KEY + ':instalarFechado') || 0); } catch (e) { /* ignora */ }
  if (Date.now() - fechado < 3 * 864e5) return; // dispensado há menos de 3 dias
  if (ehIOS()) document.getElementById('installMsg').innerHTML = 'Toque em <b>Compartilhar ⬆️</b> e depois em <b>Adicionar à Tela de Início</b>.';
  document.getElementById('installBar').hidden = false;
  ajustarTopo();
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; mostrarInstalar(); });
window.addEventListener('appinstalled', () => {
  pedidoInstalar = null;
  document.getElementById('installBar').hidden = true; document.getElementById('btnInstalar').hidden = true;
  toast('App instalado! Abra pelo ícone JR Construções na tela inicial.');
});
// celulares: mostra a dica mesmo se o navegador não avisar (iPhone nunca avisa)
if ((ehIOS() || /Android/i.test(navigator.userAgent)) && !modoApp()) setTimeout(mostrarInstalar, 2500);

actions.fecharInstalar = () => {
  document.getElementById('installBar').hidden = true;
  try { localStorage.setItem(KEY + ':instalarFechado', String(Date.now())); } catch (e) { /* ignora */ }
  ajustarTopo();
};
actions.instalarApp = async () => {
  if (pedidoInstalar) {
    pedidoInstalar.prompt();
    const r = await pedidoInstalar.userChoice.catch(() => ({}));
    if (r.outcome === 'accepted') toast('Instalando…');
    pedidoInstalar = null;
    return;
  }
  const link = location.href.split('#')[0].split('?')[0];
  let passos;
  if (navInterno()) {
    passos = `<p>Você abriu o link dentro de outro aplicativo (WhatsApp, Instagram…), que não permite instalar.</p>
      <ol class="passos"><li>Toque nos <span class="kbd">⋮</span> ou <span class="kbd">…</span> no canto da tela.</li>
      <li>Escolha <b>Abrir no navegador</b> (Chrome ou Safari).</li><li>Lá, toque em <b>Instalar app</b>.</li></ol>`;
  } else if (ehIOS()) {
    passos = `<ol class="passos"><li>Abra o link no <b>Safari</b>.</li>
      <li>Toque no botão <b>Compartilhar</b> <span class="kbd">⬆️</span> (embaixo da tela).</li>
      <li>Role e toque em <b>Adicionar à Tela de Início</b>.</li>
      <li>Toque em <b>Adicionar</b>. O ícone da JR Construções aparece na tela inicial.</li></ol>`;
  } else if (/Android/i.test(navigator.userAgent)) {
    passos = `<ol class="passos"><li>Abra o link no <b>Chrome</b>.</li>
      <li>Toque nos <span class="kbd">⋮</span> (canto de cima).</li>
      <li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>
      <li>Confirme. O ícone da JR Construções aparece na tela inicial.</li></ol>`;
  } else {
    passos = `<ol class="passos"><li>Use o <b>Google Chrome</b> ou o <b>Microsoft Edge</b>.</li>
      <li>Clique no ícone de instalar <span class="kbd">⊕</span> no fim da barra de endereço, ou no menu <span class="kbd">⋮</span> → <b>Instalar JR Construções</b>.</li>
      <li>O app abre em janela própria e ganha atalho na área de trabalho.</li></ol>`;
  }
  abrirModal('Instalar como aplicativo', `
    <div class="row" style="margin:6px 0 10px"><img src="img/icon-192.png" alt="" style="width:56px;height:56px;border-radius:14px"><div><b>JR Construções</b><div class="sub muted">Abre em tela cheia, sem a barra do navegador</div></div></div>
    ${passos}
    <p class="muted" style="font-size:12.5px">Depois de instalado, abra sempre pelo ícone da tela inicial. Seus dados continuam os mesmos.</p>
    <div class="link-box" style="margin-top:8px"><input readonly value="${esc(link)}" id="linkApp"><button type="button" class="btn sec" data-act="copiarLink">Copiar link</button></div>`, null);
};

const ajustarTopo = () => document.documentElement.style.setProperty('--topbar-h', document.querySelector('.topbar').offsetHeight + 'px');
window.addEventListener('resize', ajustarTopo);
ajustarTopo();
setTimeout(() => { const sp = document.getElementById('splash'); if (sp) { sp.classList.add('out'); setTimeout(() => sp.remove(), 600); } }, 1100);
verificarVersao();
setInterval(verificarVersao, 30 * 60 * 1000);

// =====================================================
// LOGIN E INÍCIO
// =====================================================
const telaLogin = document.getElementById('login');
function mostrarLogin(msg) {
  document.body.classList.add('sem-login');
  telaLogin.hidden = false;
  document.getElementById('loginErro').textContent = msg || '';
}
function esconderLogin() { telaLogin.hidden = true; document.body.classList.remove('sem-login'); }

async function entrar(sessao) {
  const { data: perfil, error } = await sb.from('jr_perfis').select('papel,email').eq('user_id', sessao.user.id).maybeSingle();
  if (error || !perfil) { await sb.auth.signOut(); return mostrarLogin('Este e-mail não tem acesso ao app. Peça ao administrador.'); }
  usuario = { id: sessao.user.id, email: perfil.email || sessao.user.email, papel: perfil.papel };
  try { await carregarBanco(); }
  catch (e) { return mostrarLogin('Não foi possível ler os dados. Verifique a internet e tente de novo.'); }
  document.body.classList.toggle('leitor', !ehAdmin());
  if (cidadeAtual && !db.config.cidades.includes(cidadeAtual)) cidadeAtual = db.config.cidades[0];
  esconderLogin();
  render();
  setInterval(() => { if (!document.hidden && !enviando && !tempoEnvio) recarregarDoBanco(false); }, 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !enviando) recarregarDoBanco(false); });
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(e.target), btn = e.target.querySelector('button');
  btn.disabled = true; document.getElementById('loginErro').textContent = '';
  const { data, error } = await sb.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('senha')) });
  btn.disabled = false;
  if (error) return (document.getElementById('loginErro').textContent = 'E-mail ou senha incorretos.');
  e.target.reset();
  entrar(data.session);
});

(async function iniciar() {
  if (!sb) return mostrarLogin('O app ainda não foi ligado ao banco de dados (faltam os dados do Supabase em supabase-config.js).');
  const { data } = await sb.auth.getSession();
  if (data.session) entrar(data.session); else mostrarLogin();
})();
