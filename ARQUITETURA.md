# Arquitetura & Documentação Técnica

## Diagrama de Arquitetura

```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Navegador)                         │
│                                                                    │
│   index.html — SPA (Single Page Application)                      │
│   • Dark mode com glassmorphism                                    │
│   • Cards por status com filtros em tempo real                     │
│   • Modal de criação/edição com select de responsáveis             │
│   • Atualização otimista local + sync silencioso em background     │
└──────────┬─────────────────────────────────────────┬──────────────┘
           │                                         │
      (GET CSV — leitura)              (POST FormData — escrita)
           │                                         │
           ▼                                         ▼
┌──────────────────────────┐       ┌─────────────────────────────────┐
│  Google Sheets           │       │  Google Apps Script             │
│  (CSV Export público)    │◄───   │                                 │
│                          │       │  doPost(e) {                    │
│  Aba: Dashboards         │       │    action = CREATE              │
│  ID│Nome│Resp│Status│... │       │             UPDATE              │
│                          │       │             DELETE              │
│  Aba: Usuários           │       │  }                              │
│  Nome                    │       │  → appendRow()                  │
│                          │       │  → getRange().setValue()        │
└──────────────────────────┘       │  → deleteRow()                  │
                                   └─────────────────────────────────┘
```

---

## Fluxo de Inicialização (Page Load)

Ambas as cargas ocorrem em paralelo após o `DOMContentLoaded`:

```
DOMContentLoaded + 500ms
         │
         ├─── loadUsuarios() ──────────────────────────────────────┐
         │        ↓                                                 │
         │    fetch(SHEETS_USUARIOS_CSV_URL)                        │
         │        ↓                                                 │
         │    Parse CSV (1ª coluna, pular cabeçalho)                │
         │        ↓                                                 │
         │    usuarios[] = nomes                                    │
         │    (populateResponsavelSelect() usará esse array)        │
         │                                                          │
         └─── loadDashboards() ───────────────────────────────────┐ │
                  ↓                                               │ │
              fetch(SHEETS_CSV_URL)                               │ │
                  ↓                                               │ │
              parseCSV()                                          │ │
                  ↓                                               │ │
              allDashboards[] = objetos                           │ │
                  ↓                                               │ │
              renderDashboards() + updateStats()                  │ │
                                                                  ▼ ▼
                                                          Página pronta
```

---

## Fluxo CRUD — Atualização Otimista

O frontend **não espera o CSV do Google Sheets sincronizar** para refletir as mudanças na tela. A UI é atualizada localmente de imediato via manipulação direta do array `allDashboards`. Um sync silencioso em background ocorre 15 segundos depois para garantir consistência eventual.

### Criar Dashboard

```
"Novo Dashboard"
    ↓
openCreateModal() → populateResponsavelSelect()
    ↓
Usuário preenche o formulário → handleSubmit()
    ↓
fetch(APPS_SCRIPT_URL, POST, no-cors)        ← fire-and-forget
    ↓
allDashboards.push({ ID: "temp_*", ...dados }) ← atualização local imediata
    ↓
aplicarFiltros() + updateStats()
    ↓
Toast "Criado com sucesso!"
    ↓
setTimeout 15s → loadDashboards(silent=true)  ← sync em background
```

### Editar Dashboard

```
"Editar"
    ↓
openEditModal(id) → populateResponsavelSelect(valorAtual)
    ↓
Usuário altera os dados → handleSubmit()
    ↓
fetch(APPS_SCRIPT_URL, POST, no-cors)           ← fire-and-forget
    ↓
allDashboards[idx] = { ...novos dados }         ← atualização local imediata
    ↓
aplicarFiltros() + updateStats()
    ↓
Toast "Atualizado com sucesso!"
    ↓
setTimeout 15s → loadDashboards(silent=true)
```

### Deletar Dashboard

```
"Deletar" → confirm()
    ↓
fetch(APPS_SCRIPT_URL, POST, no-cors)           ← fire-and-forget
    ↓
allDashboards = allDashboards.filter(d => d.ID !== id) ← remoção local imediata
    ↓
aplicarFiltros() + updateStats()
    ↓
Toast "Deletado com sucesso!"
    ↓
setTimeout 15s → loadDashboards(silent=true)
```

### Comportamento de loadDashboards(silent)

| Parâmetro | Comportamento |
|-----------|--------------|
| `false` (padrão) | Exibe loading overlay, reseta filtros, re-renderiza tudo |
| `true` | Sem loading, preserva filtros ativos, chama `aplicarFiltros()` |

---

## Estrutura de Dados

### Aba "Dashboards" (Google Sheets)

| Coluna | Campo | Obrigatório |
|--------|-------|-------------|
| A | ID | Sim |
| B | Nome do BI | Sim |
| C | Responsável | Não (pode ser vazio) |
| D | Status | Sim — `Desenvolvimento`, `Produção` ou `Manutenção` |
| E | Descrição | Não |
| F | Link | Não |

### Aba "Usuários" (Google Sheets)

| Coluna | Detalhe |
|--------|---------|
| A | Cabeçalho na linha 1 (ex: `Nome`), um nome por linha a partir da linha 2 |

Essa aba é a fonte dos nomes exibidos no select de Responsável.

### Objeto JavaScript (`allDashboards`)

```javascript
{
  "ID": "3",
  "Nome do BI": "Dashboard Financeiro",
  "Responsável": "Alberto Ferreira Neto",
  "Status": "Produção",
  "Descrição": "KPIs financeiros mensais",
  "Link": "https://exemplo.com/dashboard"
}
```

### POST Request (FormData)

```
action:      "CREATE" | "UPDATE" | "DELETE"
id:          "3"                          (apenas UPDATE e DELETE)
nome:        "Dashboard Financeiro"
responsavel: "Alberto Ferreira Neto"      (pode ser string vazia)
status:      "Produção"
descricao:   "KPIs financeiros mensais"   (pode ser string vazia)
link:        "https://..."                (pode ser string vazia)
```

---

## Configuração

### index.html

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec',
    SHEETS_CSV_URL:  'https://docs.google.com/spreadsheets/d/e/[KEY]/pub?output=csv',
    // Adicione &gid=NUMERO ao final — o GID está na URL da aba Usuários (#gid=NUMERO)
    SHEETS_USUARIOS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/[KEY]/pub?output=csv&gid=[GID]'
};
```

### codigo.gs

```javascript
const SPREADSHEET_ID = '[ID_DA_PLANILHA]';
const SHEET_NAME = 'Dashboards';
```

---

## Design System

### Cores (CSS Variables)

| Variável | Valor | Uso |
|----------|-------|-----|
| `--bg-primary` | `#0f172a` | Fundo da página |
| `--bg-secondary` | `#1a1f3a` | Cards |
| `--bg-tertiary` | `#252e48` | Hover / inputs |
| `--accent-blue` | `#3b82f6` | Cor primária / botões |
| `--accent-cyan` | `#06b6d4` | Gradientes / neon |
| `--accent-purple` | `#8b5cf6` | Badge Desenvolvimento |
| `--success` | `#10b981` | Badge Produção |
| `--warning` | `#f59e0b` | Badge Manutenção |
| `--danger` | `#ef4444` | Botão deletar |

### Componentes

| Componente | Técnica |
|-----------|---------|
| Cards | Glassmorphism com `backdrop-filter: blur` |
| Buttons | Gradiente linear + shine effect no hover |
| Badges | Pills com cores semânticas por status |
| Modal | Backdrop blur + animação `slideUp` |
| Toast | Auto-dismiss em 4s, canto inferior direito |

### Ordenação dos Cards

`Manutenção (0) → Desenvolvimento (1) → Produção (2)`

---

## Dependências

| Lib | Origem | Uso |
|-----|--------|-----|
| Tailwind CSS | CDN (`cdn.tailwindcss.com`) | Utility classes |
| Lucide Icons | CDN (`unpkg.com/lucide`) | Ícones SVG |
| Google Apps Script | Nativo Google | Runtime do backend |
| Google Sheets API | Nativo Google | Persistência de dados |

Zero pacotes npm.

---

## Limitações Conhecidas

| Item | Detalhe |
|------|---------|
| Cache do CSV | O Google Sheets leva minutos para atualizar o CSV exportado — por isso a UI usa atualização otimista local |
| ID gerado | Baseado em `lastRow` no Apps Script — pode colidir em edições simultâneas |
| Sem autenticação | Qualquer pessoa com a URL pode ler e escrever dados |
| Resposta opaca | `mode: 'no-cors'` impede ler a resposta do Apps Script — erros de rede na escrita passam silenciosos |
| IDs temporários | Itens criados recebem `ID: "temp_*"` até o próximo sync silencioso corrigir com o ID real |
