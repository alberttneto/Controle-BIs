# Dashboard BI Manager

Sistema web para centralizar e gerenciar dashboards BI da equipe. Permite criar, editar e excluir registros com interface em dark mode, atualização imediata na tela e persistência via Google Sheets.

---

## Funcionalidades

- Cadastro, edição e exclusão de dashboards (CRUD completo)
- Campo **Responsável** com lista suspensa carregada diretamente da planilha
- **Filtros em tempo real**: por nome, status e responsável
- **Contadores** por status: Desenvolvimento / Produção / Manutenção
- Link direto para cada painel BI no card
- **Atualização otimista** — a tela reflete as mudanças imediatamente, sem aguardar a sincronização com o Google Sheets
- Design dark mode com glassmorphism

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + Vanilla JS (SPA) |
| Estilo | Tailwind CSS + Lucide Icons (via CDN) |
| Backend | Google Apps Script |
| Banco de dados | Google Sheets |

Zero dependências npm. Setup em minutos.

---

## Estrutura do Projeto

```
├── index.html       # Aplicação completa (frontend SPA)
├── codigo.gs        # Backend (colar no Google Apps Script)
├── INSTRUCOES.md    # Guia de configuração passo a passo
└── ARQUITETURA.md   # Documentação técnica detalhada
```

---

## Configuração Rápida

**1. Planilha Google Sheets** — crie duas abas:

- `Dashboards` com colunas: `ID | Nome do BI | Responsável | Status | Descrição | Link`
- `Usuários` com coluna: `Nome` (um nome por linha a partir da linha 2)

**2. Google Apps Script** — cole o `codigo.gs`, preencha o `SPREADSHEET_ID` e faça o deploy como Web App (acesso: qualquer pessoa).

**3. index.html** — preencha o bloco `CONFIG`:

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec',
    SHEETS_CSV_URL:  'https://docs.google.com/.../pub?output=csv',
    SHEETS_USUARIOS_CSV_URL: 'https://docs.google.com/.../pub?output=csv&gid=[GID_DA_ABA_USUARIOS]'
};
```

**4. Hospedagem** — suba o `index.html` no GitHub Pages ou qualquer servidor estático.

Veja o [guia completo](INSTRUCOES.md) para instruções detalhadas.

---

## Limitações

- Sem autenticação — qualquer pessoa com a URL pode visualizar e modificar os dados
- Adequado para equipes pequenas em ambiente interno
- Google Sheets não é recomendado para volumes acima de ~10.000 registros
