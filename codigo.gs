// ============================================================================
// DASHBOARD BI MANAGER - GOOGLE APPS SCRIPT
// Estrutura da aba Dashboards:
//   A: ID | B: Nome do BI | C: Versão | D: Responsável |
//   E: Status | F: Última Atualização | G: Descrição
// ============================================================================

const SPREADSHEET_ID = '1tby_dHzj3WBSE3AHS7OkXxXvTWe-fH9MpQgZUfeOY3I';
const SHEET_NAME = 'Dashboards';

/**
 * Função doGet - Página de teste da API
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <h1>Dashboard BI Manager API</h1>
    <p>✅ Google Apps Script está funcionando!</p>
    <hr>
    <h3>Estrutura da planilha:</h3>
    <table border="1" cellpadding="6">
      <tr><th>Coluna</th><th>Campo</th></tr>
      <tr><td>A</td><td>ID</td></tr>
      <tr><td>B</td><td>Nome do BI</td></tr>
      <tr><td>C</td><td>Versão</td></tr>
      <tr><td>D</td><td>Responsável</td></tr>
      <tr><td>E</td><td>Status</td></tr>
      <tr><td>F</td><td>Última Atualização</td></tr>
      <tr><td>G</td><td>Descrição</td></tr>
    </table>
    <h3>Ações disponíveis (POST):</h3>
    <ul>
      <li><strong>CREATE</strong> - Criar novo dashboard</li>
      <li><strong>UPDATE</strong> - Atualizar dashboard existente</li>
      <li><strong>DELETE</strong> - Deletar dashboard</li>
    </ul>
  `);
}

/**
 * Função doPost - Recebe dados POST do frontend
 * Parâmetros esperados:
 *   action        "CREATE" | "UPDATE" | "DELETE"
 *   id            ID do registro (UPDATE e DELETE)
 *   nome          Nome do BI
 *   versao        Versão do dashboard
 *   responsavel   Responsável
 *   status        "Desenvolvimento" | "Produção" | "Manutenção"
 *   ultimaAtualizacao  Data/texto da última atualização
 *   descricao     Descrição (opcional)
 */
function doPost(e) {
  try {
    const action          = e.parameter.action;
    const id              = e.parameter.id;
    const nome            = e.parameter.nome;
    const versao          = e.parameter.versao          || '';
    const responsavel     = e.parameter.responsavel     || '';
    const status          = e.parameter.status;
    const ultimaAtualizacao = e.parameter.ultimaAtualizacao || '';
    const descricao       = e.parameter.descricao       || '';

    let response = {};

    if (action === 'CREATE') {
      response = createDashboard(nome, versao, responsavel, status, ultimaAtualizacao, descricao);
    } else if (action === 'UPDATE') {
      response = updateDashboard(id, nome, versao, responsavel, status, ultimaAtualizacao, descricao);
    } else if (action === 'DELETE') {
      response = deleteDashboard(id);
    } else {
      response = { success: false, message: 'Ação inválida: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Erro em doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Erro interno: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Cria um novo dashboard na planilha
 * @param {string} nome
 * @param {string} versao
 * @param {string} responsavel
 * @param {string} status
 * @param {string} ultimaAtualizacao
 * @param {string} descricao
 */
function createDashboard(nome, versao, responsavel, status, ultimaAtualizacao, descricao) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    const lastRow = sheet.getLastRow();
    const newId   = lastRow; // ID = número da última linha (pula cabeçalho)

    // Ordem das colunas: A B C D E F G
    sheet.appendRow([newId, nome, versao, responsavel, status, ultimaAtualizacao, descricao]);

    return {
      success: true,
      message: 'Dashboard criado com sucesso',
      id: newId
    };

  } catch (error) {
    Logger.log('Erro ao criar dashboard: ' + error.toString());
    return { success: false, message: 'Erro ao criar: ' + error.toString() };
  }
}

/**
 * Atualiza um dashboard existente pelo ID
 * @param {string} id
 * @param {string} nome
 * @param {string} versao
 * @param {string} responsavel
 * @param {string} status
 * @param {string} ultimaAtualizacao
 * @param {string} descricao
 */
function updateDashboard(id, nome, versao, responsavel, status, ultimaAtualizacao, descricao) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id.toString()) {
        rowIndex = i + 1; // +1 porque linhas no Sheets começam em 1
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'Dashboard não encontrado (ID: ' + id + ')' };
    }

    // Atualiza cada coluna individualmente
    sheet.getRange(rowIndex, 2).setValue(nome);               // B: Nome do BI
    sheet.getRange(rowIndex, 3).setValue(versao);             // C: Versão
    sheet.getRange(rowIndex, 4).setValue(responsavel);        // D: Responsável
    sheet.getRange(rowIndex, 5).setValue(status);             // E: Status
    sheet.getRange(rowIndex, 6).setValue(ultimaAtualizacao);  // F: Última Atualização
    sheet.getRange(rowIndex, 7).setValue(descricao);          // G: Descrição

    return {
      success: true,
      message: 'Dashboard atualizado com sucesso',
      id: id
    };

  } catch (error) {
    Logger.log('Erro ao atualizar dashboard: ' + error.toString());
    return { success: false, message: 'Erro ao atualizar: ' + error.toString() };
  }
}

/**
 * Deleta um dashboard pelo ID
 * @param {string} id
 */
function deleteDashboard(id) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id.toString()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'Dashboard não encontrado (ID: ' + id + ')' };
    }

    sheet.deleteRow(rowIndex);

    return {
      success: true,
      message: 'Dashboard deletado com sucesso',
      id: id
    };

  } catch (error) {
    Logger.log('Erro ao deletar dashboard: ' + error.toString());
    return { success: false, message: 'Erro ao deletar: ' + error.toString() };
  }
}

// ============================================================================
// FUNÇÕES DE DEBUG (executar direto no editor do Apps Script)
// ============================================================================

/**
 * Testa a conexão com a planilha e exibe os cabeçalhos nos Logs
 */
function testarConexao() {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    Logger.log('✅ Conexão bem-sucedida!');
    Logger.log('Linhas na planilha: ' + data.length);
    Logger.log('Cabeçalhos: ' + data[0].join(', '));

    const esperado = 'ID, Nome do BI, Versão, Responsável, Status, Última Atualização, Descrição';
    Logger.log('Esperado: ' + esperado);

    if (data[0].join(', ') === esperado) {
      Logger.log('✅ Estrutura de colunas correta!');
    } else {
      Logger.log('⚠️ Atenção: cabeçalhos não coincidem com o esperado.');
    }

  } catch (error) {
    Logger.log('❌ Erro na conexão: ' + error.toString());
  }
}

/**
 * Lista todos os dashboards nos Logs (debug)
 */
function listarDashboards() {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    Logger.log('=== DASHBOARDS ===');
    for (let i = 0; i < data.length; i++) {
      Logger.log(data[i].join(' | '));
    }

  } catch (error) {
    Logger.log('Erro ao listar: ' + error.toString());
  }
}
