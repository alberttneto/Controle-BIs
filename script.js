/* ============================================================
   PORTFÓLIO DE DASHBOARDS — TJGO
   Consome dados publicados de uma planilha Google Sheets (CSV)
   e renderiza Seções por Categoria + Cards + Modal de detalhes.
   ============================================================ */

/* ---------- 1. CONFIGURAÇÃO ----------
   >>> URLs da sua planilha (já preenchidas). <<<
   - SHEETS_CSV_URL: link de publicação da aba "Dashboards" como CSV
     (Arquivo > Compartilhar > Publicar na web). É a fonte principal dos cards.
   - SHEETS_USUARIOS_CSV_URL: aba auxiliar "Usuários" (lista de responsáveis),
     disponível caso seja necessária futuramente (ex.: autocomplete de filtros).
   - APPS_SCRIPT_URL: endpoint de um Google Apps Script Web App, alternativa
     caso a planilha seja privada (lê via API em vez de CSV público).
------------------------------------------------------------- */
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxw_B_D1-RzH24c66v0WBDZx8YbiLA55zhdTilv9votGsV97r2iP7RVT0HuDUGwcYZ4/exec',
  SHEETS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjvlzgCEKvoa8-ihDxVCGPEazUR7U90z3fz_yWEd1tk2Mvx2EUIc5W1Zz8h2DqV7tvbQvKVdkt2rnP/pub?output=csv',
  SHEETS_USUARIOS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjvlzgCEKvoa8-ihDxVCGPEazUR7U90z3fz_yWEd1tk2Mvx2EUIc5W1Zz8h2DqV7tvbQvKVdkt2rnP/pub?output=csv&gid=24023174',

  // Fonte de dados a ser usada na inicialização: 'csv' (recomendado, rápido e
  // sem necessidade de deploy) ou 'appsscript' (caso a planilha seja privada
  // e você tenha publicado um Web App que devolve JSON).
  DATA_SOURCE: 'csv',
};

/* ---------- 2. MAPEAMENTO DE COLUNAS ----------
   Reflete EXATAMENTE os cabeçalhos da aba "Dashboards" da planilha
   (Arquivo 2.xlsx). Ajuste aqui se algum nome de coluna mudar.
------------------------------------------------------------- */
const COLUMN_MAP = {
  id: 'ID',
  arquivo: 'Arquivo',
  nome: 'Nome do BI',
  categoria: 'Categoria',
  demandante: 'Demandante',
  descricao: 'Descrição',
  proad: 'PROAD',
  versao: 'Versão',
  status: 'Status',
  responsavel: 'Responsável',
  atualizadoEm: 'Última Alteração',
  descricaoAlteracao: 'Descrição Alteração',
  linkInterno: 'Link Privado',
  linkPublico: 'Link Público',
  aplicativo: 'Aplicativo',
  incorporadoWeb: 'Incorporado Web',
  programaAtualizacao: 'Programa de Atualização',
  imagem: 'Imagem',
};

/* ---------- 3. ESTADO GLOBAL ---------- */
const state = {
  todosOsBIs: [],
  statusAtivo: 'todos',
  termoBusca: '',
};

/* ---------- 4. REFERÊNCIAS DO DOM ---------- */
const dom = {
  categoriesContainer: document.getElementById('categoriesContainer'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  stateContainer: document.getElementById('stateContainer'),
  stateMessage: document.getElementById('stateMessage'),
  lastUpdate: document.getElementById('lastUpdate'),

  modalOverlay: document.getElementById('modalOverlay'),
  modalClose: document.getElementById('modalClose'),
  modalImage: document.getElementById('modalImage'),
  modalStatus: document.getElementById('modalStatus'),
  modalTitle: document.getElementById('modalTitle'),
  modalMeta: document.getElementById('modalMeta'),
  modalDescription: document.getElementById('modalDescription'),
  modalDetails: document.getElementById('modalDetails'),
  modalActions: document.getElementById('modalActions'),
};

/* ============================================================
   5. PARSER DE CSV
   Converte o texto CSV retornado pelo Google Sheets em um array
   de objetos { coluna: valor }, respeitando valores entre aspas
   que contenham vírgulas ou quebras de linha.
   ============================================================ */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\r') {
        // ignora; tratado junto com \n
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }
  // Última linha (caso o arquivo não termine com \n)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((cell) => cell && cell.trim() !== ''))
    .map((r) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = (r[idx] || '').trim();
      });
      return obj;
    });
}

/* ============================================================
   6. BUSCA DOS DADOS
   ============================================================ */
async function carregarDados() {
  mostrarEstado('loading', 'Carregando dashboards...');

  try {
    let registrosBrutos;

    if (CONFIG.DATA_SOURCE === 'appsscript') {
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL);
      if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
      registrosBrutos = await resp.json();
    } else {
      const resp = await fetch(CONFIG.SHEETS_CSV_URL, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
      const csvText = await resp.text();
      registrosBrutos = parseCSV(csvText);
    }

    state.todosOsBIs = registrosBrutos
      .map(normalizarRegistro)
      .filter((bi) => bi.nome); // descarta linhas vazias/sem nome

    if (state.todosOsBIs.length === 0) {
      mostrarEstado('vazio', 'Nenhum dashboard encontrado na planilha.');
      return;
    }

    esconderEstado();
    construirFiltrosDeStatus();
    renderizarSecoes();
    atualizarHorario();
  } catch (erro) {
    console.error('Falha ao carregar dados do Google Sheets:', erro);
    mostrarEstado(
      'erro',
      'Não foi possível carregar os dados da planilha. Verifique a URL configurada em CONFIG.SHEETS_CSV_URL e se a planilha está publicada na web.'
    );
  }
}

/** Converte uma linha bruta da planilha em um objeto com chaves padronizadas. */
function normalizarRegistro(linha) {
  return {
    id: linha[COLUMN_MAP.id] || '',
    arquivo: linha[COLUMN_MAP.arquivo] || '',
    nome: linha[COLUMN_MAP.nome] || '',
    categoria: linha[COLUMN_MAP.categoria] || 'Sem categoria',
    demandante: linha[COLUMN_MAP.demandante] || '',
    descricao: linha[COLUMN_MAP.descricao] || '',
    proad: linha[COLUMN_MAP.proad] || '',
    versao: linha[COLUMN_MAP.versao] || '',
    status: linha[COLUMN_MAP.status] || 'Não informado',
    responsavel: linha[COLUMN_MAP.responsavel] || '',
    atualizadoEm: linha[COLUMN_MAP.atualizadoEm] || '',
    descricaoAlteracao: linha[COLUMN_MAP.descricaoAlteracao] || '',
    linkInterno: linha[COLUMN_MAP.linkInterno] || '',
    linkPublico: linha[COLUMN_MAP.linkPublico] || '',
    aplicativo: linha[COLUMN_MAP.aplicativo] || '',
    incorporadoWeb: linha[COLUMN_MAP.incorporadoWeb] || '',
    programaAtualizacao: linha[COLUMN_MAP.programaAtualizacao] || '',
    imagem: linha[COLUMN_MAP.imagem] || '',
  };
}

/* ============================================================
   7. ESTADOS DE TELA (loading / erro / vazio)
   ============================================================ */
function mostrarEstado(tipo, mensagem) {
  dom.categoriesContainer.hidden = true;
  dom.stateContainer.hidden = false;
  dom.stateMessage.textContent = mensagem;
  dom.stateContainer.dataset.tipo = tipo;
}

function esconderEstado() {
  dom.stateContainer.hidden = true;
  dom.categoriesContainer.hidden = false;
}

function atualizarHorario() {
  const agora = new Date();
  dom.lastUpdate.textContent = agora.toLocaleString('pt-BR');
}

/* ============================================================
   8. FILTROS DE STATUS (gerados dinamicamente a partir dos dados)
   ============================================================ */
function construirFiltrosDeStatus() {
  const statusUnicos = [...new Set(state.todosOsBIs.map((bi) => bi.status))].sort();

  dom.statusFilter.innerHTML = '';

  const botaoTodos = criarBotaoStatus('todos', 'Todos');
  botaoTodos.classList.add('active');
  dom.statusFilter.appendChild(botaoTodos);

  statusUnicos.forEach((status) => {
    dom.statusFilter.appendChild(criarBotaoStatus(status, status));
  });
}

function criarBotaoStatus(valor, label) {
  const btn = document.createElement('button');
  btn.className = 'status-btn';
  btn.dataset.status = valor;
  btn.textContent = label;
  btn.addEventListener('click', () => {
    state.statusAtivo = valor;
    document
      .querySelectorAll('.status-btn')
      .forEach((b) => b.classList.toggle('active', b.dataset.status === valor));
    renderizarSecoes();
  });
  return btn;
}

/* ============================================================
   9. RENDERIZAÇÃO DAS SEÇÕES (agrupadas por Categoria) E CARDS
   ============================================================ */
function obterBIsFiltrados() {
  const termo = state.termoBusca.trim().toLowerCase();

  return state.todosOsBIs.filter((bi) => {
    const passaStatus = state.statusAtivo === 'todos' || bi.status === state.statusAtivo;
    const passaBusca = !termo || bi.nome.toLowerCase().includes(termo);
    return passaStatus && passaBusca;
  });
}

// Ordem canônica das seções de status (seções sem itens são ignoradas)
const ORDEM_STATUS = [
  'Produção',
  'Homologação',
  'Desenvolvimento',
  'Teste',
  'Manutenção',
  'Descontinuado',
];

/** Agrupa a lista de BIs por Status. */
function agruparPorStatus(lista) {
  const grupos = new Map();
  lista.forEach((bi) => {
    if (!grupos.has(bi.status)) grupos.set(bi.status, []);
    grupos.get(bi.status).push(bi);
  });
  return grupos;
}

function renderizarSecoes() {
  const lista = obterBIsFiltrados();
  dom.categoriesContainer.innerHTML = '';

  if (lista.length === 0) {
    dom.categoriesContainer.innerHTML = `<p style="text-align:center; color: var(--color-text-muted); padding: 48px 0;">
      Nenhum dashboard encontrado com os filtros atuais.
    </p>`;
    return;
  }

  const grupos = agruparPorStatus(lista);

  // Renderiza na ordem canônica; status fora da lista vêm no final
  const statusPresentes = [...grupos.keys()];
  const statusOrdenados = [
    ...ORDEM_STATUS.filter((s) => grupos.has(s)),
    ...statusPresentes.filter((s) => !ORDEM_STATUS.includes(s)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
  ];

  statusOrdenados.forEach((status) => {
    dom.categoriesContainer.appendChild(criarSecaoStatus(status, grupos.get(status)));
  });
}

function criarSecaoStatus(status, bis) {
  const section = document.createElement('section');
  section.className = 'category-section';

  const titulo = document.createElement('h2');
  titulo.className = `category-title category-title--${classeStatus(status).replace('badge--', '')}`;
  titulo.textContent = status;
  section.appendChild(titulo);

  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  bis.forEach((bi) => grid.appendChild(criarCard(bi)));
  section.appendChild(grid);

  return section;
}

function criarCard(bi) {
  const card = document.createElement('article');
  card.className = 'bi-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Ver detalhes de ${bi.nome}`);

  const capaHtml = bi.imagem
    // ? `<img src="${escapeHtml(bi.imagem)}" alt="Capa do painel ${escapeHtml(bi.nome)}" loading="lazy">`
    ? `<img src="${bi.imagem}" alt="Capa do painel ${escapeHtml(bi.nome)}" loading="lazy">`
    : `<div class="no-image">📊</div>`;

  const checkTitulo = bi.status === 'Produção' ? ' ✅' : '';
  const subtitulo = [bi.demandante, bi.descricao].filter(Boolean)[0] || '';

  // Card não tem botões de link — clicar abre o modal
  card.innerHTML = `
    <div class="card-cover">
      ${capaHtml}
      <span class="badge ${classeStatus(bi.status)}">${escapeHtml(bi.status)}</span>
    </div>
    <div class="card-content">
      <h3 class="card-title">${escapeHtml(bi.nome)}${checkTitulo}</h3>
      <p class="card-subtitle">${escapeHtml(subtitulo)}</p>
    </div>
  `;

  const abrir = () => abrirModal(bi);
  card.addEventListener('click', abrir);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });

  return card;
}

/** Normaliza o texto do status para usar como classe CSS. */
function classeStatus(status) {
  const mapa = {
    'Produção': 'producao',
    'Desenvolvimento': 'desenvolvimento',
    'Homologação': 'homologacao',
    'Descontinuado': 'descontinuado',
    'Manutenção': 'manutencao',
    'Teste': 'teste',
  };
  return `badge--${mapa[status] || 'default'}`;
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

/* ============================================================
   10. MODAL DE DETALHES
   ============================================================ */
function abrirModal(bi) {
  dom.modalImage.src = bi.imagem || '';
  dom.modalImage.alt = `Capa do painel ${bi.nome}`;
  dom.modalImage.style.display = bi.imagem ? 'block' : 'none';

  dom.modalStatus.textContent = bi.status;
  dom.modalStatus.className = `badge ${classeStatus(bi.status)}`;

  dom.modalTitle.textContent = bi.nome;
  dom.modalMeta.textContent = [bi.categoria, bi.demandante].filter(Boolean).join(' · ');
  dom.modalDescription.textContent = bi.descricao || 'Sem descrição cadastrada.';

  dom.modalDetails.innerHTML = '';
  // adicionarDetalhe('PROAD', bi.proad);
  adicionarDetalhe('Versão', bi.versao);
  adicionarDetalhe('Aplicativo', bi.aplicativo);
  adicionarDetalhe('Programa de atualização', bi.programaAtualizacao);
  adicionarBlocoAtualizacao(bi.atualizadoEm, bi.responsavel, bi.descricaoAlteracao);

  // Botões em pilha, cada um com seu próprio ícone de cópia ao lado
  dom.modalActions.innerHTML = '';
  dom.modalActions.appendChild(criarLinhaAcao('✅ Público', bi.linkPublico));
  dom.modalActions.appendChild(criarLinhaAcao('🔒 Interno', bi.linkInterno));

  dom.modalOverlay.hidden = false;
  requestAnimationFrame(() => dom.modalOverlay.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
}

/**
 * Cria uma linha de ação composta por:
 *   [ botão link (texto) ] [ botão copiar ]
 * O botão de link abre a URL em nova aba; o de copiar copia só aquela URL.
 */
function criarLinhaAcao(label, url) {
  const row = document.createElement('div');
  row.className = 'action-row';

  const cls = label.includes('Público') ? 'btn-publico' : 'btn-interno';

  // Botão principal de link
  const btnLink = document.createElement('a');
  btnLink.className = `btn ${cls}`;
  btnLink.textContent = label;
  if (url) {
    btnLink.href = url;
    btnLink.target = '_blank';
    btnLink.rel = 'noopener noreferrer';
  } else {
    btnLink.setAttribute('aria-disabled', 'true');
    btnLink.classList.add('btn-disabled');
    btnLink.addEventListener('click', (e) => e.preventDefault());
  }

  // Botão de cópia individual
  const btnCopy = document.createElement('button');
  btnCopy.className = 'btn btn-copy';
  btnCopy.type = 'button';
  btnCopy.title = `Copiar Link ${label}`;
  btnCopy.innerHTML = '📋';
  if (!url) {
    btnCopy.disabled = true;
    btnCopy.classList.add('btn-disabled');
  }
  btnCopy.addEventListener('click', () => copiarUrl(url, btnCopy));

  row.appendChild(btnLink);
  row.appendChild(btnCopy);
  return row;
}

function adicionarDetalhe(rotulo, valor) {
  if (!valor) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<dt>${escapeHtml(rotulo)}</dt><dd>${escapeHtml(valor)}</dd>`;
  dom.modalDetails.appendChild(wrapper);
}

function adicionarBlocoAtualizacao(data, responsavel, descricao) {
  if (!data && !responsavel && !descricao) return;
  const bloco = document.createElement('div');
  bloco.className = 'detalhe-atualizacao';
  bloco.innerHTML = `
    <div class="detalhe-atualizacao__topo">
      <div class="detalhe-atualizacao__campo">
        <dt>Última Alteração</dt>
        <dd>${escapeHtml(data || '—')}</dd>
      </div>
      <div class="detalhe-atualizacao__campo">
        <dt>Responsável</dt>
        <dd>${escapeHtml(responsavel || '—')}</dd>
      </div>
    </div>
    ${descricao ? `<div class="detalhe-atualizacao__descricao">
      <dt>Descrição da Alteração</dt>
      <dd>${escapeHtml(descricao)}</dd>
    </div>` : ''}
  `;
  dom.modalDetails.appendChild(bloco);
}

function fecharModal() {
  dom.modalOverlay.classList.remove('is-open');
  document.body.style.overflow = '';
  // Espera a transição terminar antes de ocultar de fato
  setTimeout(() => {
    dom.modalOverlay.hidden = true;
  }, 250);
}

/** Copia uma URL específica para a área de transferência e mostra feedback no botão. */
async function copiarUrl(url, botao) {
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Fallback para navegadores sem Clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  const textoOriginal = botao.innerHTML;
  botao.innerHTML = '✅';
  botao.classList.add('is-copied');
  setTimeout(() => {
    botao.innerHTML = textoOriginal;
    botao.classList.remove('is-copied');
  }, 2000);
}

/* ============================================================
   11. EVENTOS GLOBAIS
   ============================================================ */
dom.searchInput.addEventListener('input', (e) => {
  state.termoBusca = e.target.value;
  renderizarSecoes();
});

dom.modalClose.addEventListener('click', fecharModal);

dom.modalOverlay.addEventListener('click', (e) => {
  if (e.target === dom.modalOverlay) fecharModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !dom.modalOverlay.hidden) fecharModal();
});

/* ============================================================
   12. INICIALIZAÇÃO
   ============================================================ */
carregarDados();
