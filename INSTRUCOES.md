# Guia de Configuração — Dashboard BI Manager

## Visão Geral

O sistema é composto por três partes:

- **Frontend**: `index.html` hospedado em qualquer servidor estático (ex: GitHub Pages)
- **Backend**: Google Apps Script — recebe requisições POST e manipula a planilha
- **Banco de dados**: Google Sheets com duas abas — `Dashboards` e `Usuários`

---

## Passo 1 — Preparar a Planilha

### 1.1 Criar a planilha

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma planilha em branco
2. Renomeie a **primeira aba** para `Dashboards`
3. Crie uma **segunda aba** e renomeie para `Usuários`

### 1.2 Configurar a aba Dashboards

Na primeira linha, crie os cabeçalhos exatamente assim:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| ID | Nome do BI | Responsável | Status | Descrição | Link |

> As colunas E (Descrição) e F (Link) são opcionais, mas a linha de cabeçalho deve existir.

**Valores aceitos para Status:** `Desenvolvimento`, `Produção`, `Manutenção`

### 1.3 Configurar a aba Usuários

Na primeira linha, adicione o cabeçalho:

| A |
|---|
| Nome |

A partir da linha 2, adicione um nome por linha:

| Nome |
|------|
| Alberto Ferreira Neto |
| Kevin Rodrigues Ribeiro |
| Maxwendell da Silva Anunciacao |
| Paulo Henrique Santos Lima |
| Raul Victor de Souza Dias |

Esses nomes serão carregados automaticamente no campo **Responsável** do formulário.

### 1.4 Coletar os IDs necessários

**ID da planilha** — usado no `codigo.gs`:
```
https://docs.google.com/spreadsheets/d/[COPIE_ESTE_TRECHO]/edit
```

**GID da aba Usuários** — usado na URL CSV:
1. Clique na aba **Usuários** dentro da planilha
2. Observe a URL do navegador — ela terá `#gid=XXXXXXX` no final
3. Anote esse número

### 1.5 Publicar a planilha como CSV

1. Menu: **Arquivo → Compartilhar → Publicar na Web**
2. Selecione **Planilha inteira** e formato **Valores separados por vírgula (.csv)**
3. Clique em **Publicar** e copie a URL gerada

Essa URL aponta para a aba Dashboards por padrão (`SHEETS_CSV_URL`).

Para a aba Usuários, adicione `&gid=XXXXXXX` ao final da mesma URL (`SHEETS_USUARIOS_CSV_URL`).

---

## Passo 2 — Configurar o Google Apps Script

### 2.1 Abrir o editor

1. Na planilha, acesse **Extensões → Apps Script**
2. Uma nova aba abrirá com o editor
3. Delete todo o código padrão (Ctrl+A → Delete)
4. Cole o conteúdo completo de `codigo.gs`

### 2.2 Preencher o SPREADSHEET_ID

Na linha 7 do `codigo.gs`, substitua pelo ID copiado no Passo 1.4:

```javascript
const SPREADSHEET_ID = 'COLE_O_ID_DA_PLANILHA_AQUI';
```

### 2.3 Testar a conexão

1. No menu suspenso de funções (ao lado do botão Executar), selecione `testarConexao`
2. Clique em **Executar** e autorize quando solicitado
3. Abra os **Logs** (ícone de registros ou Ctrl+Enter)

Resultado esperado:
```
✅ Conexão bem-sucedida!
Linhas na planilha: 1
Cabeçalhos: ID, Nome do BI, Responsável, Status, Descrição, Link
```

### 2.4 Fazer o deploy como Web App

1. Clique em **Fazer deploy → Novo deploy**
2. **Tipo**: Aplicativo da Web
3. **Executar como**: Você (sua conta Google)
4. **Quem tem acesso**: Qualquer pessoa
5. Clique em **Deploy**
6. Copie a URL gerada:
   ```
   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
   ```

> Sempre que alterar o `codigo.gs`, crie um **novo deploy** — deployments antigos não recebem as mudanças.

---

## Passo 3 — Configurar o index.html

Abra `index.html` e localize o bloco `CONFIG` (início da seção `<script>`):

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'COLE_A_URL_DO_DEPLOY_AQUI',
    SHEETS_CSV_URL:  'COLE_A_URL_CSV_AQUI',
    SHEETS_USUARIOS_CSV_URL: 'COLE_A_URL_CSV_AQUI&gid=COLE_O_GID_DA_ABA_USUARIOS'
};
```

Preencha os três valores com as informações obtidas nos passos anteriores.

**Exemplo preenchido:**
```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
    SHEETS_CSV_URL:  'https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv',
    SHEETS_USUARIOS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv&gid=123456789'
};
```

---

## Passo 4 — Hospedar o Frontend

### GitHub Pages (recomendado)

1. Crie um repositório público no GitHub
2. Faça o upload de `index.html` (e opcionalmente os demais arquivos)
3. Vá em **Settings → Pages → Branch: main → Save**
4. Acesse em: `https://seu-usuario.github.io/nome-do-repositorio`

### Netlify Drop

Arraste o `index.html` em [app.netlify.com/drop](https://app.netlify.com/drop) — URL gerada na hora, sem conta necessária.

### Teste local

Abra o `index.html` diretamente no navegador. Funciona para desenvolvimento.

---

## Funcionalidades

### Visualização

- **4 contadores**: Total, Desenvolvimento, Produção, Manutenção
- **Cards** com nome, responsável, status, descrição e link do painel
- **Ordenação automática**: Manutenção → Desenvolvimento → Produção

### Filtros

- Busca por nome (tempo real)
- Filtro por status
- Filtro por responsável

### Formulário (Criar / Editar)

- **Nome do Dashboard**: texto livre (obrigatório)
- **Responsável**: lista suspensa carregada da aba Usuários (opcional — pode ficar em branco)
- **Status**: Desenvolvimento / Produção / Manutenção (obrigatório)
- **Descrição**: texto livre (opcional)
- **Link do Painel**: URL (opcional)

### Comportamento do CRUD

As alterações aparecem na tela **imediatamente** (atualização otimista local).
Um sync silencioso com a planilha ocorre em background após **15 segundos** para garantir consistência.

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| "Erro ao carregar dashboards" | URL CSV incorreta ou planilha não publicada | Verifique o Passo 1.5 |
| Campo Responsável vazio | GID da aba Usuários incorreto ou ausente | Verifique o Passo 1.4 e confirme o `SHEETS_USUARIOS_CSV_URL` |
| Alterações não chegam à planilha | `APPS_SCRIPT_URL` errada ou deploy desatualizado | Refaça o deploy (Passo 2.4) |
| "Planilha não encontrada" no Apps Script | `SPREADSHEET_ID` incorreto | Verifique o Passo 2.2 |
| GitHub Pages retorna 404 | Repositório privado ou aguardando propagação | Aguarde 5 min; verifique se é público |

### Debug via console do navegador (F12)

- `debugInfo()` — exibe os dashboards em memória e as URLs configuradas
- Logs detalhados de cada operação aparecem automaticamente no console
- A aba **Network** mostra as requisições ao CSV e ao Apps Script

---

## Links Úteis

- [Google Sheets](https://sheets.google.com)
- [Google Apps Script](https://script.google.com)
- [GitHub Pages](https://pages.github.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
