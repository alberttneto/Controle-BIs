// ============================================================================
// DASHBOARD BI MANAGER - GOOGLE APPS SCRIPT
// Código para manipular a planilha do Google Sheets
// ============================================================================

// ID da planilha (será preenchido no passo 3)
const SPREADSHEET_ID = '1tby_dHzj3WBSE3AHS7OkXxXvTWe-fH9MpQgZUfeOY3I';
const SHEET_NAME = 'Dashboards'; // Nome da aba onde os dados estão

/**
 * Função doGet - Retorna um HTML para acessar via navegador (opcional)
 * Pode ser usada para testes da conexão
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <h1>Dashboard BI Manager API</h1>
    <p>✅ Google Apps Script está funcionando!</p>
    <p>Use o formulário do frontend para criar, atualizar ou deletar dashboards.</p>
    <hr>
    <h3>Métodos disponíveis:</h3>
    <ul>
      <li><strong>CREATE</strong> - Criar novo dashboard</li>
      <li><strong>UPDATE</strong> - Atualizar dashboard existente</li>
      <li><strong>DELETE</strong> - Deletar dashboard</li>
    </ul>
  `);
}

/**
 * Função doPost - Recebe dados POST do frontend
 * Processa as ações de CREATE, UPDATE e DELETE
 */
function doPost(e) {
  try {
    // Extrai os parâmetros da requisição
    const action = e.parameter.action;
    const id = e.parameter.id;
    const nome = e.parameter.nome;
    const responsavel = e.parameter.responsavel;
    const status = e.parameter.status;

    let response = {};

    // Executa a ação apropriada
    if (action === 'CREATE') {
      response = createDashboard(nome, responsavel, status);
    } else if (action === 'UPDATE') {
      response = updateDashboard(id, nome, responsavel, status);
    } else if (action === 'DELETE') {
      response = deleteDashboard(id);
    } else {
      response = { success: false, message: 'Ação inválida' };
    }

    // Retorna a resposta em JSON
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Erro: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Função para criar um novo dashboard
 * @param {string} nome - Nome do dashboard
 * @param {string} responsavel - Responsável
 * @param {string} status - Status
 * @returns {object} Resposta com sucesso/erro
 */
function createDashboard(nome, responsavel, status) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Gera um novo ID (número baseado na última linha + 1)
    const lastRow = sheet.getLastRow();
    const newId = lastRow; // Ou use UUID se preferir

    // Adiciona uma nova linha com os dados
    sheet.appendRow([newId, nome, responsavel, status]);

    return {
      success: true,
      message: 'Dashboard criado com sucesso',
      id: newId
    };

  } catch (error) {
    Logger.log('Erro ao criar dashboard: ' + error.toString());
    return {
      success: false,
      message: 'Erro ao criar dashboard: ' + error.toString()
    };
  }
}

/**
 * Função para atualizar um dashboard existente
 * @param {string} id - ID do dashboard
 * @param {string} nome - Nome do dashboard
 * @param {string} responsavel - Responsável
 * @param {string} status - Status
 * @returns {object} Resposta com sucesso/erro
 */
function updateDashboard(id, nome, responsavel, status) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Encontra a linha com o ID correspondente
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) { // Começa em 1 para pular o cabeçalho
      if (data[i][0].toString() === id.toString()) {
        rowIndex = i + 1; // +1 porque as linhas começam em 1 no Sheets
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        message: 'Dashboard não encontrado'
      };
    }

    // Atualiza os dados na linha encontrada
    sheet.getRange(rowIndex, 2).setValue(nome);       // Coluna B: Nome
    sheet.getRange(rowIndex, 3).setValue(responsavel); // Coluna C: Responsável
    sheet.getRange(rowIndex, 4).setValue(status);     // Coluna D: Status

    return {
      success: true,
      message: 'Dashboard atualizado com sucesso',
      id: id
    };

  } catch (error) {
    Logger.log('Erro ao atualizar dashboard: ' + error.toString());
    return {
      success: false,
      message: 'Erro ao atualizar dashboard: ' + error.toString()
    };
  }
}

/**
 * Função para deletar um dashboard
 * @param {string} id - ID do dashboard
 * @returns {object} Resposta com sucesso/erro
 */
function deleteDashboard(id) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Encontra a linha com o ID correspondente
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) { // Começa em 1 para pular o cabeçalho
      if (data[i][0].toString() === id.toString()) {
        rowIndex = i + 1; // +1 porque as linhas começam em 1 no Sheets
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        message: 'Dashboard não encontrado'
      };
    }

    // Deleta a linha
    sheet.deleteRow(rowIndex);

    return {
      success: true,
      message: 'Dashboard deletado com sucesso',
      id: id
    };

  } catch (error) {
    Logger.log('Erro ao deletar dashboard: ' + error.toString());
    return {
      success: false,
      message: 'Erro ao deletar dashboard: ' + error.toString()
    };
  }
}

/**
 * Função auxiliar para testar a conexão
 * Execute isso no editor do Apps Script (Ctrl+Enter)
 */
function testarConexao() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('✅ Conexão bem-sucedida!');
    Logger.log('Linhas na planilha: ' + data.length);
    Logger.log('Cabeçalhos: ' + data[0].join(', '));
    
  } catch (error) {
    Logger.log('❌ Erro na conexão: ' + error.toString());
  }
}

/**
 * Função para listar todos os dashboards (útil para debug)
 */
function listarDashboards() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('=== DASHBOARDS ===');
    for (let i = 0; i < data.length; i++) {
      Logger.log(data[i].join(' | '));
    }
    
  } catch (error) {
    Logger.log('Erro ao listar: ' + error.toString());
  }
}
