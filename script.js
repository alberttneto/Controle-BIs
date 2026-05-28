// ============================================================================
// DASHBOARD BI MANAGER — script.js
// ============================================================================

// Configuration
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxw_B_D1-RzH24c66v0WBDZx8YbiLA55zhdTilv9votGsV97r2iP7RVT0HuDUGwcYZ4/exec',
    SHEETS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjvlzgCEKvoa8-ihDxVCGPEazUR7U90z3fz_yWEd1tk2Mvx2EUIc5W1Zz8h2DqV7tvbQvKVdkt2rnP/pub?output=csv',
    SHEETS_USUARIOS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjvlzgCEKvoa8-ihDxVCGPEazUR7U90z3fz_yWEd1tk2Mvx2EUIc5W1Zz8h2DqV7tvbQvKVdkt2rnP/pub?output=csv&gid=24023174'
};

let allDashboards = [];
let isEditing = false;
let dashboardsFiltrados = [];
let responsaveisUnicos = [];

// ===== USUÁRIOS =====
let usuarios = [];

async function loadUsuarios() {
    try {
        const timestamp = new Date().getTime();
        const url = CONFIG.SHEETS_USUARIOS_CSV_URL + `&t=${timestamp}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csv = await response.text();
        const lines = csv.trim().split('\n');
        // Pula cabeçalho (linha 0), lê primeira coluna de cada linha
        usuarios = lines.slice(1)
            .map(line => line.split(',')[0].trim().replace(/^"|"$/g, ''))
            .filter(nome => nome.length > 0);
        console.log('Usuários carregados:', usuarios);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function populateResponsavelSelect(selectedValue = '') {
    const select = document.getElementById('formResponsavel');
    select.innerHTML = '<option value="">Sem responsável</option>';
    [...usuarios].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        if (u === selectedValue) opt.selected = true;
        select.appendChild(opt);
    });
}
// ===== FIM USUÁRIOS =====

// ===== DEBUG HELPER =====
console.log('%c🎨 Dashboard BI Manager Iniciado', 'color: #3b82f6; font-size: 16px; font-weight: bold');
console.log('%c📍 URLs Configuradas:', 'color: #06b6d4; font-weight: bold');
console.log('CSV:', CONFIG.SHEETS_CSV_URL);
console.log('Apps Script:', CONFIG.APPS_SCRIPT_URL);
console.log('%c💡 DICA: Abra a aba Console (F12) para ver logs de debug', 'color: #f59e0b; font-weight: bold');
console.log('');

window.debugInfo = function () {
    console.clear();
    console.log('%c===== INFORMAÇÕES DE DEBUG =====', 'color: #3b82f6; font-size: 14px; font-weight: bold');
    console.log('Dashboards carregados:', allDashboards.length);
    console.log('Lista completa:', allDashboards);
    console.log('CONFIG.SHEETS_CSV_URL:', CONFIG.SHEETS_CSV_URL);
    console.log('CONFIG.APPS_SCRIPT_URL:', CONFIG.APPS_SCRIPT_URL);
    console.log('%c===== FIM =====', 'color: #3b82f6; font-size: 14px; font-weight: bold');
};

console.log('%c✅ Função debugInfo() disponível. Digite debugInfo() no console.', 'color: #10b981; font-weight: bold');
// ===== FIM DEBUG HELPER =====

// Inicializa Lucide Icons com retry
function initLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        setTimeout(initLucide, 100);
    }
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initLucide();
        loadUsuarios();
        loadDashboards();
    }, 500);
});

// ===== CARREGAMENTO DE DADOS =====

// silent=true: recarrega sem resetar filtros nem exibir loading (sync em background)
async function loadDashboards(silent = false) {
    if (!silent) showLoading('Carregando dashboards...');
    try {
        console.log('%c=== CARREGANDO DASHBOARDS ===', 'color: blue; font-weight: bold');

        const timestamp = new Date().getTime();
        const csvUrlWithTimestamp = CONFIG.SHEETS_CSV_URL + `&t=${timestamp}`;
        console.log('URL CSV (com cache-busting):', csvUrlWithTimestamp);

        const response = await fetch(csvUrlWithTimestamp);
        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csv = await response.text();
        console.log('CSV recebido. Tamanho:', csv.length, 'caracteres');

        allDashboards = parseCSV(csv);
        console.log('Dashboards parseados. Total:', allDashboards.length);

        if (silent) {
            atualizarResponsaveisUnicos();
            aplicarFiltros();
            updateStats();
        } else {
            renderDashboards();
            updateStats();
            hideLoading();
        }

        console.log('%c=== CARREGAMENTO CONCLUÍDO COM SUCESSO ===', 'color: green; font-weight: bold');

    } catch (error) {
        console.error('%c=== ERRO AO CARREGAR ===', 'color: red; font-weight: bold');
        console.error('Mensagem de erro:', error.message);
        if (!silent) {
            showToast('Erro ao carregar dashboards: ' + error.message, 'error');
            hideLoading();
        }
    }
}

/**
 * Faz o parse de uma linha CSV respeitando campos entre aspas duplas.
 * Ex: 1,"Dashboard, KPIs",V1.0.0 → ['1', 'Dashboard, KPIs', 'V1.0.0']
 */
function parseCSVLine(line) {
    const result = [];
    let current  = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            // aspas duplas dentro de campo entre aspas → literal "
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(csv) {
    console.log('%c=== PARSEANDO CSV ===', 'color: orange; font-weight: bold');
    const lines = csv.trim().split('\n');
    console.log('Total de linhas no arquivo:', lines.length);

    if (lines.length < 2) {
        console.warn('⚠️ CSV não tem pelo menos 2 linhas (cabeçalho + 1 dado)');
        return [];
    }

    const headers = parseCSVLine(lines[0]);
    console.log('Cabeçalhos encontrados:', headers);

    const expectedHeaders = ['ID', 'Nome do BI', 'Versão', 'Responsável', 'Status', 'Última Atualização', 'Descrição'];
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        console.warn('⚠️ AVISO: Cabeçalhos ausentes na planilha:', missingHeaders);
        console.warn('Esperado:', expectedHeaders);
        console.warn('Encontrado:', headers);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length === 0 || (values.length === 1 && values[0] === '')) {
            console.log(`Linha ${i + 1}: ignorada (vazia)`);
            continue;
        }

        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });

        if (obj.ID) {
            data.push(obj);
            console.log(`Linha ${i + 1}: ✅ Parseada -`, obj);
        } else {
            console.warn(`Linha ${i + 1}: ❌ Ignorada (sem ID)`, obj);
        }
    }

    console.log('%c=== PARSE CONCLUÍDO ===', 'color: orange; font-weight: bold');
    console.log('Total de dashboards válidos:', data.length);
    return data;
}

// ===== RENDERIZAÇÃO =====

function renderDashboards() {
    const container = document.getElementById('cardsContainer');

    if (allDashboards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">Nenhum dashboard cadastrado. Clique em "Novo Dashboard" para começar!</p>
            </div>
        `;
        return;
    }

    atualizarResponsaveisUnicos();

    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroResponsavel').value = '';

    dashboardsFiltrados = [...allDashboards];
    renderDashboardsFiltrados();
}

function aplicarFiltros() {
    const nome       = document.getElementById('filtroNome').value.toLowerCase();
    const status     = document.getElementById('filtroStatus').value;
    const responsavel = document.getElementById('filtroResponsavel').value;

    dashboardsFiltrados = allDashboards.filter(dash => {
        const nomeMatch       = dash['Nome do BI'].toLowerCase().includes(nome);
        const statusMatch     = !status     || dash['Status']      === status;
        const responsavelMatch = !responsavel || dash['Responsável'] === responsavel;
        return nomeMatch && statusMatch && responsavelMatch;
    });

    renderDashboardsFiltrados();
}

function renderDashboardsFiltrados() {
    const container = document.getElementById('cardsContainer');

    if (dashboardsFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="margin-top: 2rem;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">Nenhum dashboard encontrado com esses filtros.</p>
            </div>
        `;
        return;
    }

    const statusOrder = {
        'Manutenção':    0,
        'Desenvolvimento': 1,
        'Homologação':   2,
        'Produção':      3,
        'Descontinuado': 4,
    };

    const sorted = [...dashboardsFiltrados].sort((a, b) =>
        (statusOrder[a['Status']] ?? 3) - (statusOrder[b['Status']] ?? 3)
    );

    // Cabeçalho das colunas
    const header = `
        <div class="bi-row-header">
            <span class="row-status">Status</span>
            <span class="row-nome">Nome do BI</span>
            <span class="row-responsavel">Responsável</span>
            <span class="row-versao">Versão</span>
            <span class="row-data">Atualização</span>
            <span style="width:28px;"></span>
            <span style="width:70px;"></span>
        </div>`;

    const rows = sorted.map((dash, index) => {
        const statusClass = getStatusClass(dash['Status']);
        const versaoAtual = dash['Versão'] || 'V0.0.0';
        const descricao   = dash['Descrição'] || '';

        const descIcon = descricao
            ? `<div class="row-desc-wrap">
                   <span class="row-desc-icon">
                       <i data-lucide="info" style="width:15px;height:15px;"></i>
                   </span>
                   <div class="row-tooltip">${descricao}</div>
               </div>`
            : `<div style="width:28px;"></div>`;

        const ultimaAtualizacao = dash['Última Atualização']
            ? `<i data-lucide="clock" style="width:12px;height:12px;flex-shrink:0;"></i>${dash['Última Atualização']}`
            : '—';

        return `
            <div class="bi-row" style="--index:${index};">
                <span class="row-status">
                    <span class="badge ${statusClass}">${dash['Status']}</span>
                </span>
                <span class="row-nome" title="${dash['Nome do BI']}">${dash['Nome do BI']}</span>
                <span class="row-responsavel" title="${dash['Responsável'] || ''}">${dash['Responsável'] || '—'}</span>
                <span class="row-versao">${versaoAtual}</span>
                <span class="row-data">${ultimaAtualizacao}</span>
                ${descIcon}
                <div class="row-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('${dash['ID']}')">
                        <i data-lucide="edit-2" style="width:13px;height:13px;"></i>
                        Editar
                    </button>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = header + rows;
    initLucide();
}

function atualizarResponsaveisUnicos() {
    responsaveisUnicos = [...new Set(allDashboards.map(d => d['Responsável']))].sort();

    const selectResponsavel = document.getElementById('filtroResponsavel');
    const valueSelecionado  = selectResponsavel.value;

    selectResponsavel.innerHTML = '<option value="">Todos os Responsáveis</option>';
    responsaveisUnicos.forEach(resp => {
        const option = document.createElement('option');
        option.value = resp;
        option.textContent = resp;
        selectResponsavel.appendChild(option);
    });

    if (valueSelecionado && responsaveisUnicos.includes(valueSelecionado)) {
        selectResponsavel.value = valueSelecionado;
    }
}

function forceRefreshDashboards() {
    console.log('%c🔄 Recarregamento manual iniciado pelo usuário', 'color: #10b981; font-weight: bold');
    loadDashboards();
}

// ===== STATUS =====

function getStatusClass(status) {
    if (status === 'Desenvolvimento') return 'badge-development';
    if (status === 'Produção')        return 'badge-production';
    if (status === 'Manutenção')      return 'badge-maintenance';
    if (status === 'Homologação')     return 'badge-homologacao';
    if (status === 'Descontinuado')   return 'badge-discontinued';
    return 'badge-discontinued';
}

function updateStats() {
    const total = allDashboards.length;
    const dev   = allDashboards.filter(d => d['Status'] === 'Desenvolvimento').length;
    const prod  = allDashboards.filter(d => d['Status'] === 'Produção').length;
    const maint = allDashboards.filter(d => d['Status'] === 'Manutenção').length;
    const homo  = allDashboards.filter(d => d['Status'] === 'Homologação').length;
    const disc  = allDashboards.filter(d => d['Status'] === 'Descontinuado').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('devCount').textContent   = dev;
    document.getElementById('prodCount').textContent  = prod;
    document.getElementById('maintCount').textContent = maint;
    document.getElementById('homoCount').textContent  = homo;
    document.getElementById('discCount').textContent  = disc;
}

// ===== MODAL =====

function openCreateModal() {
    isEditing = false;
    document.getElementById('modalTitle').textContent = 'Novo Dashboard';
    document.getElementById('submitText').textContent = 'Criar';
    document.getElementById('formId').value = '';
    document.getElementById('form').reset();
    populateResponsavelSelect();
    document.getElementById('versaoSection').style.display = 'none';
    document.getElementById('modal').classList.add('active');
}

function openEditModal(id) {
    const dashboard = allDashboards.find(d => d['ID'] === id);
    if (!dashboard) return;

    isEditing = true;
    document.getElementById('modalTitle').textContent = 'Editar Dashboard';
    document.getElementById('submitText').textContent = 'Atualizar';
    document.getElementById('formId').value = id;
    document.getElementById('formName').value = dashboard['Nome do BI'];
    populateResponsavelSelect(dashboard['Responsável']);
    document.getElementById('formStatus').value = dashboard['Status'];
    document.getElementById('formDescricao').value = dashboard['Descrição'] || '';

    const versaoAtual = dashboard['Versão'] || 'V1.0.0';
    document.getElementById('versaoAtualDisplay').textContent = versaoAtual;
    document.getElementById('versaoSection').style.display = 'block';
    selectVersionOption('manter');

    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function openHelp() {
    document.getElementById('modalAjuda').classList.add('active');
    initLucide();
}

function closeHelp() {
    document.getElementById('modalAjuda').classList.remove('active');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeHelp();
    }
});

// ===== CRUD =====

async function handleSubmit(event) {
    event.preventDefault();

    const id          = document.getElementById('formId').value;
    const nome        = document.getElementById('formName').value;
    const responsavel = document.getElementById('formResponsavel').value;
    const status      = document.getElementById('formStatus').value;
    const descricao   = document.getElementById('formDescricao').value;

    const action = isEditing ? 'UPDATE' : 'CREATE';

    const dashboardAtual = isEditing ? allDashboards.find(d => d['ID'] === id) : null;
    const tipoBump       = isEditing
        ? (document.querySelector('input[name="versionBump"]:checked')?.value || 'manter')
        : 'manter';
    const versaoBase     = dashboardAtual?.['Versão'] || 'V1.0.0';
    const versao         = (isEditing && tipoBump !== 'manter')
        ? calcularNovaVersao(versaoBase, tipoBump)
        : versaoBase;
    const ultimaAtualizacao = (isEditing && tipoBump !== 'manter')
        ? formatarDataHora(new Date())
        : (dashboardAtual?.['Última Atualização'] || '');

    showLoading(isEditing ? 'Atualizando...' : 'Criando...');

    try {
        const formData = new FormData();
        formData.append('action', action);
        if (isEditing) formData.append('id', id);
        formData.append('nome', nome);
        formData.append('versao', versao);
        formData.append('responsavel', responsavel);
        formData.append('status', status);
        formData.append('ultimaAtualizacao', ultimaAtualizacao);
        formData.append('descricao', descricao);

        // Fire-and-forget (no-cors — resposta opaca)
        fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });

        // Atualização local imediata
        if (isEditing) {
            const idx = allDashboards.findIndex(d => d['ID'] === id);
            if (idx !== -1) {
                allDashboards[idx]['Nome do BI']         = nome;
                allDashboards[idx]['Responsável']        = responsavel;
                allDashboards[idx]['Status']             = status;
                allDashboards[idx]['Descrição']          = descricao;
                allDashboards[idx]['Versão']             = versao;
                allDashboards[idx]['Última Atualização'] = ultimaAtualizacao;
            }
        } else {
            allDashboards.push({
                'ID': 'temp_' + Date.now(),
                'Nome do BI': nome,
                'Versão': 'V1.0.0',
                'Responsável': responsavel,
                'Status': status,
                'Última Atualização': '',
                'Descrição': descricao
            });
        }

        atualizarResponsaveisUnicos();
        aplicarFiltros();
        updateStats();
        closeModal();
        hideLoading();
        showToast(isEditing ? 'Dashboard atualizado com sucesso!' : 'Dashboard criado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast('Erro ao salvar dashboard. Verifique a URL do Apps Script.', 'error');
        hideLoading();
    }
}

// async function deleteDashboard(id) {
//     if (!confirm('Tem certeza que deseja deletar este dashboard?')) return;

//     showLoading('Deletando...');

//     try {
//         const formData = new FormData();
//         formData.append('action', 'DELETE');
//         formData.append('id', id);

//         fetch(CONFIG.APPS_SCRIPT_URL, {
//             method: 'POST',
//             body: formData,
//             mode: 'no-cors'
//         });

//         allDashboards = allDashboards.filter(d => d['ID'] !== id);
//         atualizarResponsaveisUnicos();
//         aplicarFiltros();
//         updateStats();
//         hideLoading();
//         showToast('Dashboard deletado com sucesso!', 'success');

//         console.log('%c⏳ Sync em background agendado para 15s...', 'color: #f59e0b; font-weight: bold');
//         setTimeout(() => {
//             console.log('%c🔄 Sync silencioso com Google Sheets após DELETE...', 'color: #06b6d4; font-weight: bold');
//             loadDashboards(true);
//         }, 15000);

//     } catch (error) {
//         console.error('Erro ao deletar:', error);
//         showToast('Erro ao deletar dashboard', 'error');
//         hideLoading();
//     }
// }

// ===== LOADING & TOAST =====

function showLoading(message = 'Processando...') {
    document.getElementById('loadingText').textContent = message;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" style="width: 18px; height: 18px;"></i>
        <p style="margin: 0;">${message}</p>
    `;
    document.body.appendChild(toast);
    initLucide();

    setTimeout(() => { toast.remove(); }, 4000);
}

// ===== GERENCIAMENTO DE VERSÃO =====

function formatarDataHora(date) {
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function calcularNovaVersao(versaoAtual, tipo) {
    const semV   = (versaoAtual || 'V0.0.0').replace(/^[Vv]/, '');
    const partes = semV.split('.').map(n => parseInt(n) || 0);
    while (partes.length < 3) partes.push(0);
    const [x, y, z] = partes;
    if (tipo === 'maior') return `V${x + 1}.0.0`;
    if (tipo === 'menor') return `V${x}.${y + 1}.0`;
    if (tipo === 'patch') return `V${x}.${y}.${z + 1}`;
    return versaoAtual;
}

function selectVersionOption(tipo) {
    document.querySelectorAll('.version-option').forEach(el => {
        el.className = 'version-option';
    });
    const label = document.querySelector(`.version-option[data-tipo="${tipo}"]`);
    if (label) {
        label.classList.add(`sel-${tipo}`);
        label.querySelector('input').checked = true;
    }
    updateVersionPreview(tipo);
}

function updateVersionPreview(tipo) {
    const versaoAtual = document.getElementById('versaoAtualDisplay')?.textContent || 'V1.0.0';
    const preview     = document.getElementById('versaoPreview');
    if (!preview) return;

    if (!tipo || tipo === 'manter') {
        preview.textContent = 'Versão não será alterada';
        preview.style.color = 'var(--text-secondary)';
    } else {
        const nova   = calcularNovaVersao(versaoAtual, tipo);
        const rotulo = { maior: 'Major', menor: 'Minor', patch: 'Patch' }[tipo];
        preview.textContent = `${rotulo}: ${versaoAtual} → ${nova}`;
        preview.style.color = 'var(--accent-cyan)';
    }
}
