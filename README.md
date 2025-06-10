
# General Lab Solutions - CRM System

Um sistema completo de Customer Relationship Management (CRM) desenvolvido com tecnologias web modernas, focado em gestão de leads, pipeline de vendas e produtividade da equipe comercial.

## 🚀 Características Principais

### 📊 Dashboard Inteligente
- **KPIs em tempo real**: Total de leads, conversões, receita e taxa de conversão
- **Gráficos interativos**: Funil de vendas, origem dos leads, vendas por período
- **Ações importantes**: Sistema de notificações para tarefas críticas e follow-ups

### 👥 Gestão Completa de Leads
- **Lista detalhada** com filtros avançados por status, responsável e período
- **Pipeline Kanban** com drag & drop para movimentação entre estágios
- **Perfil completo** do lead com histórico de interações e notas
- **Sistema de scoring** e classificação por temperatura (frio/morno/quente)

### ✅ Gerenciamento de Tarefas
- **Interface moderna** com filtros, ordenação e paginação
- **Progresso visual** com barras de progresso personalizáveis
- **Anexos e comentários** para colaboração da equipe
- **Prioridades** e prazos com alertas de vencimento
- **Drag & drop** para reordenação de tarefas

### 📅 Calendário de Atividades
- **Calendário interativo** com visualizações mensal, semanal e diária
- **Templates de eventos** pré-definidos para cada estágio do pipeline
- **Agendamento rápido** por drag & drop de templates
- **Integração com leads** para contexto completo das atividades

### 📈 Relatórios Customizáveis
- **6 tipos de relatórios**: Performance de vendas, tempo no pipeline, análise por vendedor, funil de conversão, origem de leads e resumo de atividades
- **Filtros avançados** por período, vendedor e critérios específicos
- **Visualizações interativas** com gráficos ApexCharts
- **Exportação** para PDF, Excel e impressão
- **Relatórios clássicos** para análises rápidas

### 📁 Gestão de Arquivos
- **Upload e organização** de documentos, imagens e anexos
- **Vinculação a tarefas** para contexto organizado
- **Filtros por tipo** e ferramenta de busca
- **Preview e download** de arquivos

### 📋 Sistema de Logs
- **Auditoria completa** de todas as ações no sistema
- **Timeline cronológica** com filtros por tipo e período
- **Rastreabilidade** de mudanças em leads, tarefas e atividades
- **Histórico detalhado** para compliance e análise

## 🛠️ Stack Tecnológica

### Frontend
- **HTML5, CSS3, JavaScript** puro para máxima performance
- **ApexCharts** para gráficos interativos e responsivos
- **FullCalendar** para interface de calendário completa
- **SweetAlert2** para modais e confirmações elegantes
- **Font Awesome** para iconografia consistente

### Backend
- **Node.js** com Express.js para API REST robusta
- **PostgreSQL** como banco de dados principal
- **CORS** habilitado para integração frontend/backend

### Características Técnicas
- **Dark Mode** como padrão com interface moderna
- **Responsive Design** para uso em desktop e mobile
- **API RESTful** bem estruturada com tratamento de erros
- **Validação de dados** tanto no frontend quanto backend
- **Sistema de notificações** em tempo real

## 🚀 Como Executar no Replit

### Configuração Inicial
1. O projeto já está configurado para rodar automaticamente
2. Clique no botão **Run** para iniciar o servidor
3. O sistema estará disponível na URL fornecida pelo Replit

### Estrutura do Projeto
```
├── index.html          # Interface principal do CRM
├── script.js           # Lógica frontend e interações
├── style.css           # Estilos e tema dark mode
├── server.js           # Servidor Express.js e API
├── database.js         # Configuração e operações do banco
├── package.json        # Dependências do projeto
└── .replit            # Configuração do ambiente Replit
```

### Workflows Disponíveis
- **Start Server**: Inicia apenas o backend (porta 5000)
- **Full Stack Dev**: Executa backend + frontend em paralelo

## 📊 Funcionalidades por Módulo

### Dashboard
- Métricas em tempo real com tendências
- 6 gráficos interativos diferentes
- Lista de ações importantes contextuais
- Interface responsiva e intuitiva

### Leads
- CRUD completo com validação
- Sistema Kanban com 6 estágios
- Filtros e busca avançada
- Notas e histórico de interações

### Tarefas
- Criação com múltiplos campos
- Sistema de progresso visual
- Comentários e anexos
- Filtros e ordenação avançados

### Calendário
- Visualizações múltiplas
- Templates de eventos
- Integração total com leads
- Drag & drop intuitivo

### Relatórios
- 6 tipos diferentes de análises
- Múltiplos formatos de exportação
- Gráficos interativos
- Filtros personalizáveis

## 🔧 Configuração do Banco

O sistema utiliza PostgreSQL e cria automaticamente:
- **8 tabelas principais**: leads, tasks, activities, logs, notes, attachments, comments e task_attachments
- **Dados de exemplo** para demonstração
- **Relacionamentos** bem definidos entre entidades

## 🎨 Interface e UX

- **Tema escuro moderno** com paleta azul e cinza
- **Animações suaves** para melhor experiência
- **Ícones consistentes** em toda a aplicação
- **Feedback visual** para todas as ações
- **Modais responsivos** para formulários

## 📱 Recursos Técnicos

- **SPA (Single Page Application)** com navegação por abas
- **Persistência de dados** em PostgreSQL
- **Validação** de formulários e dados
- **Tratamento de erros** robusto
- **Sistema de logs** para auditoria

---

**Desenvolvido para otimizar a gestão comercial e aumentar a produtividade da equipe de vendas.**
