# BI Dashboard Control

Uma SPA moderna para controle de dashboards Business Intelligence com design Dark Mode e efeito glassmorphism.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Design Dark Mode** moderno com fundo `#0f172a`
- **Glassmorphism** cards com efeito blur e transparência
- **Acentos em azul neon** (`#3b82f6`) com efeitos de glow
- **Consumo de dados** via Google Sheets CSV
- **Processamento CSV** com PapaParse
- **Ordenação automática**: itens "Em desenvolvimento" primeiro
- **Cards dinâmicos** com título, responsável e badge de status
- **Modal de criação** para novos BIs
- **Animações hover** e transições suaves
- **Design responsivo** para mobile/tablet/desktop
- **Estatísticas em tempo real** de dashboards

### 📊 Estrutura dos Dados
A planilha Google Sheets deve conter as colunas:
- `titulo` - Nome do dashboard
- `responsavel` - Nome do responsável
- `link` - URL do dashboard
- `status` - "Em desenvolvimento" ou "Concluído"

## 🎨 Design System

### Cores
- **Background**: `#0f172a` (Dark Mode)
- **Primary**: `#3b82f6` (Neon Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Yellow)

### Efeitos
- **Glassmorphism**: `backdrop-filter: blur(10px)`
- **Neon Glow**: `box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)`
- **Hover Animation**: `translateY(-4px)` com shadow enhancement

## 🛠️ Tecnologias

- **HTML5** com elementos semânticos
- **Tailwind CSS** via CDN
- **PapaParse** para processamento CSV
- **JavaScript ES6+** vanilla
- **Google Sheets API** (public CSV)

## 📁 Estrutura do Projeto

```
bi-dashboard/
├── index.html          # SPA principal
├── README.md          # Documentação
└── docs/             # Assets futuros
```

## 🚀 Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Vá em Settings > Pages
4. Selecione branch `main` e pasta `/root`
5. O site estará disponível em `https://username.github.io/repo-name`

## 🔧 Configuração

### Planilha Google Sheets
1. Crie uma planilha com as colunas: `titulo, responsavel, link, status`
2. Vá em `File > Share > Publish to web`
3. Selecione `Sheet1` e formato `CSV`
4. Copie a URL e atualize a variável `urlPlanilha` no código

### Personalização
- Altere cores no `<style>` section
- Modifique o grid layout nas classes Tailwind
- Ajuste animações nos keyframes CSS

## 📱 Responsividade

- **Mobile**: 1 coluna (320px+)
- **Tablet**: 2 colunas (768px+)
- **Desktop**: 3 colunas (1024px+)

## ⚡ Performance

- **Lazy loading** dos cards
- **Animações otimizadas** com CSS transforms
- **CDN** para bibliotecas externas
- **Minimal dependencies** (apenas Tailwind + PapaParse)

## 🔄 Fluxo de Dados

1. **Carregamento**: Fetch da planilha Google Sheets
2. **Processamento**: PapaParse converte CSV → JSON
3. **Ordenação**: "Em desenvolvimento" primeiro
4. **Renderização**: Cards dinâmicos com fade-in
5. **Atualização**: Estatísticas em tempo real

## 🎯 Limitações Atuais

- **Persistência**: Novos BIs apenas em memória
- **API**: Para salvar permanentemente, usar Google Sheets API
- **Autenticação**: Planilha deve ser pública

## 🚀 Próximos Passos

- [ ] Integração com Google Sheets API
- [ ] Sistema de autenticação
- [ ] Edição/deleção de BIs
- [ ] Filtros avançados
- [ ] Exportação de relatórios
- [ ] Dark/Light mode toggle

## 📄 Licença

MIT License - Free para uso comercial e pessoal
