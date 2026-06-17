# Portfólio de Dashboards — TJGO

Página web para catalogar e apresentar os dashboards produzidos pela **Coordenadoria de Transformação Digital** do Tribunal de Justiça do Estado de Goiás (TJGO).

## O que faz

- Consome os dados de uma planilha **Google Sheets** publicada como CSV
- Agrupa os dashboards por **categoria** e exibe cards com status, descrição e links
- Permite **busca por nome** e **filtro por status** (Produção, Homologação, etc.)
- Ao clicar em um card, abre um **modal de detalhes** com imagem, metadados e botões de acesso

## Estrutura

```
Portfolio_Dashboards/
├── images/          # Logos e imagens estáticas
│   ├── logo.png
│   └── logo2.png
├── index.html       # Estrutura da página
├── style.css        # Estilos
└── script.js        # Lógica: busca CSV, renderiza cards e modal
```

## Fonte de dados

Os dados são lidos diretamente de uma planilha Google Sheets publicada na web (sem autenticação). A URL e as colunas esperadas estão configuradas no topo de `script.js`, nas constantes `CONFIG` e `COLUMN_MAP`.

Para trocar a planilha, basta atualizar `SHEETS_CSV_URL` em `script.js` e ajustar `COLUMN_MAP` caso os cabeçalhos sejam diferentes.

## Como usar localmente

Abra `index.html` em qualquer servidor HTTP estático (ex.: Live Server no VS Code, `npx serve`, etc.). Não funciona via `file://` por restrições de CORS na busca do CSV.
