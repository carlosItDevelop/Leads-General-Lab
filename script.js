// Global Variables
let currentTheme = 'dark';
let calendar;
let charts = {};
let leads = [];
let tasks = [];
let logs = [];
let draggedCard = null;

// API Base URL
const API_BASE = '/api';

// Sample Data
const sampleLeads = [
    {
        id: 1,
        name: 'João Silva',
        company: 'Tech Corp',
        email: 'joao.silva@techcorp.com',
        phone: '(11) 99999-1234',
        position: 'CTO',
        status: 'novo',
        source: 'website',
        responsible: 'Maria Santos',
        lastContact: '2024-01-15',
        score: 85,
        temperature: 'quente',
        value: 50000,
        notes: 'Interessado em soluções de automação'
    },
    {
        id: 2,
        name: 'Ana Costa',
        company: 'Inovação Ltda',
        email: 'ana.costa@inovacao.com',
        phone: '(11) 88888-5678',
        position: 'Gerente de TI',
        status: 'contato',
        source: 'referral',
        responsible: 'Carlos Oliveira',
        lastContact: '2024-01-14',
        score: 72,
        temperature: 'morno',
        value: 35000,
        notes: 'Precisa de aprovação da diretoria'
    },
    {
        id: 3,
        name: 'Pedro Santos',
        company: 'Startup XYZ',
        email: 'pedro@startupxyz.com',
        phone: '(11) 77777-9012',
        position: 'CEO',
        status: 'qualificado',
        source: 'event',
        responsible: 'Maria Santos',
        lastContact: '2024-01-13',
        score: 95,
        temperature: 'quente',
        value: 75000,
        notes: 'Reunião agendada para próxima semana'
    }
];

const sampleTasks = [
    {
        id: 1,
        title: 'Follow-up com João Silva',
        description: 'Verificar interesse em proposta comercial',
        dueDate: '2024-01-20',
        priority: 'high',
        status: 'pending',
        leadId: 1,
        assignee: 'Maria Santos'
    },
    {
        id: 2,
        title: 'Preparar demonstração',
        description: 'Criar apresentação personalizada para Tech Corp',
        dueDate: '2024-01-18',
        priority: 'medium',
        status: 'pending',
        leadId: 1,
        assignee: 'Carlos Oliveira'
    },
    {
        id: 3,
        title: 'Enviar proposta comercial',
        description: 'Finalizar e enviar proposta para Startup XYZ',
        dueDate: '2024-01-16',
        priority: 'high',
        status: 'completed',
        leadId: 3,
        assignee: 'Maria Santos'
    }
];

const sampleLogs = [
    {
        id: 1,
        type: 'lead',
        title: 'Novo lead criado',
        description: 'João Silva foi adicionado como novo lead',
        timestamp: '2024-01-15T10:30:00Z',
        userId: 'Maria Santos',
        leadId: 1
    },
    {
        id: 2,
        type: 'email',
        title: 'Email enviado',
        description: 'Template de boas-vindas enviado para Ana Costa',
        timestamp: '2024-01-14T14:20:00Z',
        userId: 'Carlos Oliveira',
        leadId: 2
    },
    {
        id: 3,
        type: 'call',
        title: 'Ligação realizada',
        description: 'Conversa de 15 minutos com Pedro Santos',
        timestamp: '2024-01-13T16:45:00Z',
        userId: 'Maria Santos',
        leadId: 3
    }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeCharts();
    // Carregar dados primeiro, depois inicializar calendário
    loadSampleData().then(() => {
        initializeCalendar();
    });
});

function initializeApp() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Show dashboard by default
    showTab('dashboard');

    // Initialize service worker for notifications
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.getAttribute('data-tab');
            showTab(tab);
            updateActiveNav(e.currentTarget);
        });
    });

    // Task filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterTasks(e.target.getAttribute('data-filter'));
        });
    });

    // Search functionality for leads
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterLeads, 300));
    }

    // Filter functionality for leads
    const filterSelects = document.querySelectorAll('.filters .filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', filterLeads);
    });

    // Logs filters
    const logsFilterBtn = document.querySelector('.logs-filters .btn');
    if (logsFilterBtn) {
        logsFilterBtn.addEventListener('click', applyLogsFilters);
    }

    // Auto-apply filters when date inputs change
    const dateInputs = document.querySelectorAll('.logs-filters .date-input');
    dateInputs.forEach(input => {
        input.addEventListener('change', applyLogsFilters);
    });

    // Auto-apply filters when type select changes
    const typeSelect = document.querySelector('.logs-filters .filter-select');
    if (typeSelect) {
        typeSelect.addEventListener('change', applyLogsFilters);
    }

    // Kanban drag and drop
    setupKanbanDragDrop();
}

async function loadSampleData() {
    try {
        console.log('Carregando dados do servidor...');
        
        // Carregar dados do banco
        leads = await fetchFromAPI('/leads');
        tasks = await fetchFromAPI('/tasks');
        logs = await fetchFromAPI('/logs');

        console.log('Dados carregados:', { leads: leads.length, tasks: tasks.length, logs: logs.length });

        await loadAllLeadNotes();
        renderLeadsTable();
        renderKanbanBoard();
        renderTasksList();
        renderLogsTimeline();
        renderRecentHistory();
        
        return Promise.resolve();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados do servidor', 'error');

        // Fallback para dados de exemplo se o servidor não estiver disponível
        leads = sampleLeads;
        tasks = sampleTasks;
        logs = sampleLogs;

        await loadAllLeadNotes();
        renderLeadsTable();
        renderKanbanBoard();
        renderTasksList();
        renderLogsTimeline();
        renderRecentHistory();
        
        return Promise.resolve();
    }
}

// Função para fazer requisições à API
async function fetchFromAPI(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('Erro na API:', error.message || error);
        showNotification('Erro na comunicação com o servidor', 'error');
        throw error;
    }
}

// Theme Management
function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Refresh content based on tab
    switch(tabName) {
        case 'calendar':
            if (calendar) calendar.render();
            break;
        case 'reports':
            updateCharts();
            break;
    }
}

function updateActiveNav(activeItem) {
    document.querySelectorAll('.nav-tab').forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

// Leads Management
function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    tbody.innerHTML = leads.map(lead => `
        <tr style="cursor: pointer;" onclick="openLeadDetails(${lead.id})">
            <td>${lead.name}</td>
            <td>${lead.company}</td>
            <td>${lead.email}</td>
            <td>${lead.phone}</td>
            <td><span class="status-badge status-${lead.status}">${getStatusLabel(lead.status)}</span></td>
            <td>${lead.responsible}</td>
            <td>${formatDate(lead.last_contact || lead.lastContact)}</td>
            <td>${lead.score}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editLead(${lead.id}); event.stopPropagation();" title="Editar lead">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteLead(${lead.id}); event.stopPropagation();" title="Excluir lead">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderKanbanBoard() {
    const statuses = ['novo', 'contato', 'qualificado', 'proposta', 'negociacao', 'ganho'];

    statuses.forEach(status => {
        const container = document.getElementById(`${status}-cards`);
        if (!container) return;

        const statusLeads = leads.filter(lead => lead.status === status);

        container.innerHTML = statusLeads.map(lead => `
            <div class="kanban-card" draggable="true" data-lead-id="${lead.id}">
                <div class="card-header">
                    <h4>${lead.name}</h4>
                    <button class="btn-icon" onclick="openLeadDetails(${lead.id})" title="Ver/Editar lead">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <p><i class="fas fa-building"></i> ${lead.company}</p>
                <p><i class="fas fa-dollar-sign"></i> R$ ${formatCurrency(lead.value)}</p>
                <p><i class="fas fa-thermometer-${lead.temperature === 'quente' ? 'full' : lead.temperature === 'morno' ? 'half' : 'empty'}"></i> ${lead.temperature}</p>
                <p><i class="fas fa-user"></i> ${lead.responsible}</p>
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" onclick="scheduleActivity(${lead.id})" title="Agendar atividade">
                        <i class="fas fa-calendar-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="addNote(${lead.id})" title="Adicionar nota">
                        <i class="fas fa-sticky-note"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Update column count
        const columnHeader = container.closest('.kanban-column').querySelector('.lead-count');
        if (columnHeader) {
            columnHeader.textContent = statusLeads.length;
        }
    });
}

function setupKanbanDragDrop() {
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            draggedCard = e.target;
            e.target.style.opacity = '0.5';
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            e.target.style.opacity = '1';
            draggedCard = null;
        }
    });

    document.querySelectorAll('.column-cards').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        });

        column.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');

            if (draggedCard) {
                const leadId = parseInt(draggedCard.getAttribute('data-lead-id'));
                const newStatus = e.currentTarget.id.replace('-cards', '');
                updateLeadStatus(leadId, newStatus);
            }
        });
    });
}

async function updateLeadStatus(leadId, newStatus) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead não encontrado', 'error');
        return;
    }

    const oldStatus = lead.status;

    try {
        // Update lead status in database
        const updatedLead = await fetchFromAPI(`/leads/${leadId}`, {
            method: 'PUT',
            body: JSON.stringify({
                ...lead,
                status: newStatus
            })
        });

        // Update local array
        lead.status = newStatus;

        // Log the status change
        addLog({
            type: 'lead',
            title: 'Status atualizado',
            description: `Lead ${lead.name} movido de ${getStatusLabel(oldStatus)} para ${getStatusLabel(newStatus)}`,
            user_id: 'Usuário Atual',
            lead_id: leadId
        });

        renderKanbanBoard();
        renderLeadsTable();
        showNotification('Status do lead atualizado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao atualizar status do lead:', error);
        showNotification('Erro ao atualizar status do lead', 'error');

        // Revert the visual change if API call failed
        lead.status = oldStatus;
        renderKanbanBoard();
        renderLeadsTable();
    }
}

// Tasks Management
function renderTasksList() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item" data-status="${task.status}">
            <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                   onchange="toggleTaskStatus(${task.id})">
            <div class="task-content">
                <div class="task-title" style="cursor: pointer; color: var(--primary-color);" onclick="openTaskDetails(${task.id})">${task.title}</div>
                <div class="task-description">${task.description}</div>
            </div>
            <div class="task-date">
                <i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}
            </div>
        </div>
    `).join('');
}

function openTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        showNotification('Tarefa não encontrada', 'error');
        return;
    }

    // Buscar informações do lead relacionado, se existir
    const lead = task.leadId ? leads.find(l => l.id === task.leadId) : null;

    // Definir cores baseadas no status e prioridade
    const statusColors = {
        completed: '#10b981',
        pending: '#f59e0b'
    };

    const priorityColors = {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#10b981'
    };

    const statusLabels = {
        completed: 'Concluída',
        pending: 'Pendente'
    };

    const priorityLabels = {
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa'
    };

    const statusColor = statusColors[task.status] || '#6b7280';
    const priorityColor = priorityColors[task.priority] || '#6b7280';
    const statusLabel = statusLabels[task.status] || task.status;
    const priorityLabel = priorityLabels[task.priority] || task.priority;

    // Verificar se a tarefa está atrasada
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isOverdue = task.status === 'pending' && dueDate < today;

    // Calcular dias restantes ou em atraso
    const timeDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const timeStatus = isOverdue ? 
        `${Math.abs(timeDiff)} dia${Math.abs(timeDiff) !== 1 ? 's' : ''} em atraso` :
        timeDiff === 0 ? 'Vence hoje' :
        timeDiff === 1 ? 'Vence amanhã' :
        `${timeDiff} dia${timeDiff !== 1 ? 's' : ''} restante${timeDiff !== 1 ? 's' : ''}`;

    Swal.fire({
        title: 'Detalhes da Tarefa',
        html: `
            <div style="text-align: left; padding: 20px;">
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 20px; background-color: ${statusColor}; color: white; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-${task.status === 'completed' ? 'check' : 'clock'}"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; color: var(--text-primary); font-size: 18px;">${task.title}</h3>
                        <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${statusLabel}
                        </span>
                    </div>
                </div>

                ${task.description ? `
                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Descrição:</strong><br>
                    <p style="margin: 8px 0; color: var(--text-secondary); background-color: var(--bg-secondary); padding: 12px; border-radius: 6px; border-left: 3px solid ${statusColor};">
                        ${task.description}
                    </p>
                </div>
                ` : ''}

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Data de Vencimento:</strong><br>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <span style="color: var(--text-secondary); font-family: monospace;">
                            ${formatDate(task.dueDate)}
                        </span>
                        <span style="color: ${isOverdue ? '#ef4444' : timeDiff <= 1 ? '#f59e0b' : '#10b981'}; font-size: 12px; font-weight: 600; background-color: ${isOverdue ? '#ef444420' : timeDiff <= 1 ? '#f59e0b20' : '#10b98120'}; padding: 2px 6px; border-radius: 8px;">
                            ${timeStatus}
                        </span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Prioridade:</strong><br>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <div style="width: 12px; height: 12px; background-color: ${priorityColor}; border-radius: 50%;"></div>
                        <span style="color: ${priorityColor}; font-weight: 600;">
                            ${priorityLabel}
                        </span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Responsável:</strong><br>
                    <span style="color: var(--text-secondary);">
                        ${task.assignee}
                    </span>
                </div>

                ${lead ? `
                <div style="margin-bottom: 15px; padding: 12px; background-color: var(--bg-secondary); border-radius: 6px;">
                    <strong style="color: var(--text-primary);">Lead Relacionado:</strong><br>
                    <div style="margin-top: 8px;">
                        <span style="color: var(--primary-color); font-weight: 600; cursor: pointer;" onclick="openLeadDetails(${lead.id}); Swal.close();">
                            ${lead.name}
                        </span>
                        <br>
                        <span style="color: var(--text-secondary); font-size: 14px;">
                            ${lead.company} • ${lead.email}
                        </span>
                        <br>
                        <span class="status-badge status-${lead.status}" style="font-size: 11px; margin-top: 4px; display: inline-block;">
                            ${getStatusLabel(lead.status)}
                        </span>
                    </div>
                </div>
                ` : ''}

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">ID da Tarefa:</strong><br>
                    <span style="color: var(--text-muted); font-family: monospace; font-size: 12px;">
                        #${task.id}
                    </span>
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: task.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Concluída',
        cancelButtonText: 'Fechar',
        confirmButtonColor: statusColor,
        cancelButtonColor: '#6b7280',
        width: '600px',
        background: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
        color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b',
        customClass: {
            popup: 'task-details-modal'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            toggleTaskStatus(taskId);
        }
    });
}

function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item');

    taskItems.forEach(item => {
        const status = item.getAttribute('data-status');
        let show = false;

        switch(filter) {
            case 'all':
                show = true;
                break;
            case 'pending':
                show = status === 'pending';
                break;
            case 'completed':
                show = status === 'completed';
                break;
            case 'overdue':
                // Implementation for overdue logic
                show = status === 'pending'; // Simplified
                break;
        }

        item.style.display = show ? 'flex' : 'none';
    });
}

async function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        try {
            await fetchFromAPI(`/tasks/${taskId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            addLog({
                type: 'task',
                title: 'Tarefa atualizada',
                description: `Tarefa "${task.title}" marcada como ${newStatus === 'completed' ? 'concluída' : 'pendente'}`,
                user_id: 'Usuário Atual',
                lead_id: task.lead_id
            });

            // Recarregar dados
            await loadSampleData();
            showNotification('Status da tarefa atualizado!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            showNotification('Erro ao atualizar tarefa', 'error');
        }
    }
}

// Calendar Management
async function initializeCalendar() {
    const calendarEl = document.getElementById('calendar-widget');
    if (!calendarEl) return;

    // Configurar drag and drop para eventos pré-definidos
    setupCalendarDragDrop();

    // Carregar atividades do banco com retry se necessário
    let activities = [];
    try {
        activities = await fetchFromAPI('/activities');
        console.log('Atividades carregadas:', activities.length);
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        activities = [];
        showNotification('Erro ao carregar atividades da agenda', 'warning');
    }

    // Converter atividades para eventos do calendário
    const calendarEvents = activities.map(activity => ({
        id: activity.id.toString(),
        title: activity.title,
        start: activity.scheduled_date,
        backgroundColor: getEventColor(activity.type),
        borderColor: getEventColor(activity.type),
        extendedProps: {
            leadId: activity.lead_id,
            type: activity.type,
            description: activity.description
        }
    }));

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
        },
        dayMaxEvents: 3,
        eventDisplay: 'block',
        displayEventTime: true,
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '19:00:00',
        height: 'auto',
        aspectRatio: 1.8,
        eventColor: '#3b82f6',
        eventBorderColor: '#3b82f6',
        eventTextColor: '#ffffff',
        events: calendarEvents,
        eventClick: function(info) {
            const event = info.event;
            const props = event.extendedProps;

            Swal.fire({
                title: event.title,
                html: `
                    <div style="text-align: left;">
                        <p><strong>Início:</strong> ${event.start.toLocaleString('pt-BR')}</p>
                        ${event.end ? `<p><strong>Término:</strong> ${event.end.toLocaleString('pt-BR')}</p>` : ''}
                        <p><strong>Tipo:</strong> ${props.type || 'Atividade'}</p>
                        ${props.description ? `<p><strong>Descrição:</strong> ${props.description}</p>` : ''}
                        ${props.leadId ? `<p><strong>Lead ID:</strong> ${props.leadId}</p>` : ''}
                    </div>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Editar',
                cancelButtonText: 'Fechar',
                confirmButtonColor: '#3b82f6',
                cancelButtonColor: '#6b7280',
                background: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
                color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b'
            }).then((result) => {
                if (result.isConfirmed) {
                    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
                }
            });
        },
        dateClick: function(info) {
            // Set default date/time for new event
            const clickedDate = new Date(info.date);
            clickedDate.setHours(9, 0, 0, 0);

            document.getElementById('activityDateTime').value = clickedDate.toISOString().slice(0, 16);
            document.getElementById('activityModal').style.display = 'block';
        },
        drop: function(info) {
            // Função chamada quando um evento é dropado no calendário
            const eventType = info.draggedEl.getAttribute('data-event-type');
            if (eventType) {
                createEventFromTemplate(eventType, info.date);
            }
        },
        eventReceive: function(info) {
            // Função chamada quando um evento externo é adicionado
            console.log('Evento recebido:', info.event);
        },
        eventDidMount: function(info) {
            // Add tooltip
            info.el.setAttribute('title', info.event.title + '\n' + (info.event.extendedProps.description || ''));
        }
    });
}

function setupCalendarDragDrop() {
    const eventTemplates = document.querySelectorAll('.event-template');

    eventTemplates.forEach(template => {
        template.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.getAttribute('data-event-type'));
            this.style.opacity = '0.5';
        });

        template.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });
    });

    // Configurar o calendário para aceitar drops
    const calendarEl = document.getElementById('calendar-widget');
    if (calendarEl) {
        // Permitir que o calendário aceite drops
        calendarEl.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        calendarEl.addEventListener('drop', function(e) {
            e.preventDefault();
            const eventType = e.dataTransfer.getData('text/plain');

            // Tentar determinar a data baseada na posição do drop
            const rect = calendarEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Para uma implementação mais simples, usar a data atual
            const dropDate = new Date();
            dropDate.setHours(9, 0, 0, 0);

            if (eventType) {
                createEventFromTemplate(eventType, dropDate);
            }
        });
    }
}

async function createEventFromTemplate(eventType, date) {
    const eventTemplates = {
        'novo': {
            title: 'Novo Lead - Contato Inicial',
            type: 'call',
            color: '#6366f1',
            description: 'Primeiro contato com novo lead'
        },
        'contato': {
            title: 'Primeiro Contato',
            type: 'call',
            color: '#f59e0b',
            description: 'Ligação ou email para primeiro contato'
        },
        'qualificado': {
            title: 'Reunião de Qualificação',
            type: 'meeting',
            color: '#10b981',
            description: 'Reunião para qualificar o lead'
        },
        'proposta': {
            title: 'Apresentar Proposta',
            type: 'meeting',
            color: '#8b5cf6',
            description: 'Apresentação ou envio da proposta comercial'
        },
        'negociacao': {
            title: 'Reunião de Negociação',
            type: 'meeting',
            color: '#ef4444',
            description: 'Discussão de termos e condições'
        }
    };

    const template = eventTemplates[eventType];
    if (!template || !calendar) return;

    const startDate = new Date(date);
    
    const activityData = {
        lead_id: null,
        type: template.type,
        title: template.title,
        description: template.description,
        scheduled_date: startDate.toISOString()
    };

    try {
        // Salvar no banco
        const newActivity = await fetchFromAPI('/activities', {
            method: 'POST',
            body: JSON.stringify(activityData)
        });

        // Adicionar ao calendário
        calendar.addEvent({
            id: newActivity.id.toString(),
            title: newActivity.title,
            start: newActivity.scheduled_date,
            backgroundColor: template.color,
            borderColor: template.color,
            extendedProps: {
                leadId: newActivity.lead_id,
                type: newActivity.type,
                description: newActivity.description,
                createdFrom: 'template'
            }
        });

        // Log da atividade
        await addLog({
            type: 'meeting',
            title: 'Atividade agendada via template',
            description: `${template.title} agendada para ${formatDateTime(startDate)}`,
            user_id: 'Usuário Atual',
            lead_id: null
        });

        showNotification(`${template.title} agendada com sucesso!`, 'success');

    } catch (error) {
        console.error('Erro ao salvar atividade via template:', error);
        showNotification('Erro ao salvar atividade', 'error');
    }
}

// Charts Management
function initializeCharts() {
    initializeFunnelChart();
    initializeSourceChart();
    initializeSalesChart();
    initializeConversionChart();
    initializeActivityChart();
    initializePipelineTimeChart();
}

function initializeFunnelChart() {
    const element = document.getElementById('funnelChart');
    if (!element) return;

    const options = {
        series: [{
            name: 'Quantidade de Leads',
            data: [150, 120, 80, 45, 25, 15]
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4
            }
        },
        dataLabels: {
            enabled: false
        },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'],
        xaxis: {
            categories: ['Novos', 'Contato', 'Qualificados', 'Proposta', 'Negociação', 'Ganhos'],
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        grid: {
            borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0'
        },
        theme: {
            mode: currentTheme
        },
        legend: {
            show: false
        }
    };

    charts.funnel = new ApexCharts(element, options);
    charts.funnel.render();
}

function initializeSourceChart() {
    const element = document.getElementById('sourceChart');
    if (!element) return;

    const options = {
        series: [35, 25, 20, 15, 5],
        chart: {
            type: 'donut',
            height: 350,
            background: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        labels: ['Website', 'Indicação', 'Redes Sociais', 'Eventos', 'Cold Call'],
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        dataLabels: {
            enabled: true,
            style: {
                colors: [currentTheme === 'dark' ? '#f1f5f9' : '#1e293b']
            }
        },
        legend: {
            position: 'bottom',
            labels: {
                colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%'
                }
            }
        },
        theme: {
            mode: currentTheme
        }
    };

    charts.source = new ApexCharts(element, options);
    charts.source.render();
}

function initializeSalesChart() {
    const element = document.getElementById('salesChart');
    if (!element) return;

    const options = {
        series: [{
            name: 'Vendas Realizadas',
            data: [12, 19, 15, 25, 22, 30]
        }],
        chart: {
            type: 'line',
            height: 350,
            background: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        colors: ['#10b981'],
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        grid: {
            borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0'
        },
        theme: {
            mode: currentTheme
        }
    };

    charts.sales = new ApexCharts(element, options);
    charts.sales.render();
}

function initializeConversionChart() {
    const element = document.getElementById('conversionChart');
    if (!element) return;

    const options = {
        series: [{
            name: 'Taxa de Conversão (%)',
            data: [85, 78, 92, 68]
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        colors: ['#3b82f6'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: ['Maria Santos', 'Carlos Oliveira', 'Ana Silva', 'Pedro Costa'],
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        yaxis: {
            max: 100,
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                },
                formatter: function(value) {
                    return value + '%';
                }
            }
        },
        grid: {
            borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0'
        },
        theme: {
            mode: currentTheme
        },
        legend: {
            show: false
        }
    };

    charts.conversion = new ApexCharts(element, options);
    charts.conversion.render();
}

function initializeActivityChart() {
    const element = document.getElementById('activityChart');
    if (!element) return;

    const options = {
        series: [{
            name: 'Ligações',
            data: [45, 52, 38, 67, 59, 73]
        }, {
            name: 'Reuniões',
            data: [28, 35, 42, 31, 45, 38]
        }, {
            name: 'Emails',
            data: [85, 93, 78, 102, 89, 95]
        }],
        chart: {
            type: 'line',
            height: 350,
            background: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }
            }
        },
        grid: {
            borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0'
        },
        theme: {
            mode: currentTheme
        },
        legend: {
            labels: {
                colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
            }
        }
    };

    charts.activity = new ApexCharts(element, options);
    charts.activity.render();
}

function initializePipelineTimeChart() {
    const element = document.getElementById('pipelineTimeChart');
    if (!element) return;

    const options = {
        series: [{
            name: 'Tempo Médio (dias)',
            data: [3, 7, 5, 12, 8]
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4,
                distributed: true
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: ['Novo → Contato', 'Contato → Qualificado', 'Qualificado → Proposta', 'Proposta → Negociação', 'Negociação → Ganho'],
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                },
                rotate: -45
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                },
                formatter: function(value) {
                    return value + ' dias';
                }
            }
        },
        grid: {
            borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0'
        },
        theme: {
            mode: currentTheme
        },
        legend: {
            show: false
        }
    };

    charts.pipelineTime = new ApexCharts(element, options);
    charts.pipelineTime.render();
}

function updateCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && chart.updateOptions) {
            // Para ApexCharts, atualizamos as opções de tema
            chart.updateOptions({
                theme: {
                    mode: currentTheme
                },
                xaxis: {
                    labels: {
                        style: {
                            colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                        }
                    }
                },
                grid: {
                    borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0'
                },
                legend: {
                    labels: {
                        colors: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                    }
                },
                dataLabels: {
                    style: {
                        colors: [currentTheme === 'dark' ? '#f1f5f9' : '#1e293b']
                    }
                }
            });
        }
    });
}

// Logs Management
let currentLogsPage = 1;
const logsPerPage = 5;
let logsFilters = {
    startDate: '',
    endDate: '',
    type: ''
};

function renderLogsTimeline() {
    const logsTimeline = document.getElementById('logsTimeline');
    if (!logsTimeline) return;

    // Apply filters
    let filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];

        // Filter by start date
        if (logsFilters.startDate && logDate < logsFilters.startDate) {
            return false;
        }

        // Filter by end date
        if (logsFilters.endDate && logDate > logsFilters.endDate) {
            return false;
        }

        // Filter by type
        if (logsFilters.type && log.type !== logsFilters.type) {
            return false;
        }

        return true;
    });

    const sortedLogs = filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
    const startIndex = (currentLogsPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

    logsTimeline.innerHTML = `
        <div class="logs-content">
            ${paginatedLogs.map(log => `
                <div class="log-item" style="cursor: pointer;" onclick="openLogDetails(${log.id})">
                    <div class="log-icon">
                        <i class="fas fa-${getLogIcon(log.type)}"></i>
                    </div>
                    <div class="log-content">
                        <div class="log-title">${log.title}</div>
                        <div class="log-description">${log.description}</div>
                        <div class="log-time">${formatDateTime(log.timestamp)} - ${log.user_id || log.userId}</div>
                    </div>
                    <div class="log-actions">
                        <i class="fas fa-chevron-right" style="color: var(--text-muted); font-size: 12px;"></i>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="logs-pagination">
            <button class="btn btn-sm btn-secondary" ${currentLogsPage === 1 ? 'disabled' : ''} onclick="changeLogsPage(${currentLogsPage - 1})">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <span class="pagination-info">Página ${currentLogsPage} de ${totalPages}</span>
            <button class="btn btn-sm btn-secondary" ${currentLogsPage === totalPages ? 'disabled' : ''} onclick="changeLogsPage(${currentLogsPage + 1})">
                Próxima <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function changeLogsPage(page) {
    // Apply current filters to get filtered logs count
    let filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];

        if (logsFilters.startDate && logDate < logsFilters.startDate) return false;
        if (logsFilters.endDate && logDate > logsFilters.endDate) return false;
        if (logsFilters.type && log.type !== logsFilters.type) return false;

        return true;
    });

    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    if (page < 1 || page > totalPages) return;

    currentLogsPage = page;
    renderLogsTimeline();
}

function applyLogsFilters() {
    const startDateInput = document.querySelector('.logs-filters .date-input:nth-child(1)');
    const endDateInput = document.querySelector('.logs-filters .date-input:nth-child(2)');
    const typeSelect = document.querySelector('.logs-filters .filter-select');

    logsFilters.startDate = startDateInput ? startDateInput.value : '';
    logsFilters.endDate = endDateInput ? endDateInput.value : '';
    logsFilters.type = typeSelect ? typeSelect.value : '';

    // Reset to first page when applying filters
    currentLogsPage = 1;
    renderLogsTimeline();

    showNotification('Filtros aplicados com sucesso!', 'success');
}

async function addLog(logEntry) {
    try {
        // Ensure the log entry has the correct field names for the database
        const dbLogEntry = {
            type: logEntry.type,
            title: logEntry.title,
            description: logEntry.description,
            user_id: logEntry.user_id || logEntry.userId,
            lead_id: logEntry.lead_id || logEntry.leadId
        };

        await fetchFromAPI('/logs', {
            method: 'POST',
            body: JSON.stringify(dbLogEntry)
        });

        // Recarregar logs
        logs = await fetchFromAPI('/logs');
        renderLogsTimeline();
    } catch (error) {
        console.error('Erro ao adicionar log:', error);
        showNotification('Erro ao salvar log', 'error');
    }
}

// Modal Management
function openLeadModal() {
    // Reset form for new lead
    const form = document.getElementById('leadForm');
    form.reset();
    document.getElementById('leadId').value = '';
    document.getElementById('leadModalTitle').textContent = 'Novo Lead';

    document.getElementById('leadModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openLeadDetails(leadId) {
    // Implementation for lead details modal/page
    showNotification(`Abrindo detalhes do lead ID: ${leadId}`, 'info');
}

function openEventModal() {
    // Reset form for new activity
    const form = document.getElementById('activityForm');
    form.reset();
    document.getElementById('activityLeadId').value = '';

    // Set default date to current time
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15); // Round to next 15 minutes
    document.getElementById('activityDateTime').value = now.toISOString().slice(0, 16);

    // Populate leads dropdown - sempre recarregar para ter dados atualizados
    const leadSelect = document.getElementById('activityLeadId');
    leadSelect.innerHTML = '<option value="">Selecione um lead (opcional)</option>';
    
    // Verificar se existem leads carregados
    if (leads && leads.length > 0) {
        leads.forEach(lead => {
            const option = document.createElement('option');
            option.value = lead.id;
            option.textContent = `${lead.name} - ${lead.company}`;
            leadSelect.appendChild(option);
        });
    } else {
        // Se não há leads, carregar do servidor
        fetchFromAPI('/leads').then(serverLeads => {
            if (serverLeads && serverLeads.length > 0) {
                leads = serverLeads; // Atualizar array global
                serverLeads.forEach(lead => {
                    const option = document.createElement('option');
                    option.value = lead.id;
                    option.textContent = `${lead.name} - ${lead.company}`;
                    leadSelect.appendChild(option);
                });
            }
        }).catch(error => {
            console.error('Erro ao carregar leads:', error);
        });
    }

    document.getElementById('activityModal').style.display = 'block';
}

function openTaskModal() {
    // Reset form for new task
    const form = document.getElementById('taskForm');
    form.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Nova Tarefa';

    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];

    // Populate leads dropdown
    const leadSelect = document.getElementById('taskLeadId');
    leadSelect.innerHTML = '<option value="">Selecione um lead</option>';
    leads.forEach(lead => {
        const option = document.createElement('option');
        option.value = lead.id;
        option.textContent = `${lead.name} - ${lead.company}`;
        leadSelect.appendChild(option);
    });

    // Set default assignee
    document.getElementById('taskAssignee').value = 'Maria';

    document.getElementById('taskModal').style.display = 'block';
}

async function submitLead() {
    const form = document.getElementById('leadForm');
    const formData = new FormData(form);
    const leadId = formData.get('id');

    const leadData = {
        name: formData.get('name'),
        company: formData.get('company'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        position: formData.get('position'),
        source: formData.get('source'),
        status: formData.get('status') || 'novo',
        responsible: 'Usuário Atual',
        score: 50,
        temperature: 'morno',
        value: parseFloat(formData.get('value')) || 0,
        notes: formData.get('notes'),
        lastContact: new Date().toISOString().split('T')[0]
    };

    try {
        if (leadId) {
            // Edit existing lead
            const updatedLead = await fetchFromAPI(`/leads/${leadId}`, {
                method: 'PUT',
                body: JSON.stringify({...leadData, id: parseInt(leadId)})
            });

            // Update local array
            const leadIndex = leads.findIndex(l => l.id === parseInt(leadId));
            if (leadIndex !== -1) {
                leads[leadIndex] = {...leads[leadIndex], ...leadData, id: parseInt(leadId)};
            }

            await addLog({
                type: 'lead',
                title: 'Lead atualizado',
                description: `Lead ${leadData.name} foi editado`,
                user_id: 'Usuário Atual',
                lead_id: parseInt(leadId)
            });

            showNotification('Lead atualizado com sucesso!', 'success');
        } else {
            // Create new lead
            const newLead = await fetchFromAPI('/leads', {
                method: 'POST',
                body: JSON.stringify(leadData)
            });

            // Add to local array
            leads.push(newLead);

            await addLog({
                type: 'lead',
                title: 'Novo lead criado',
                description: `Lead ${leadData.name} foi adicionado ao sistema`,
                user_id: 'Usuário Atual',
                lead_id: newLead.id
            });

            showNotification('Lead criado com sucesso!', 'success');
        }

        // Re-render components
        renderLeadsTable();
        renderKanbanBoard();

        closeModal('leadModal');
        form.reset();
        document.getElementById('leadModalTitle').textContent = 'Novo Lead';

    } catch (error) {
        console.error('Erro ao salvar lead:', error);
        showNotification('Erro ao salvar lead', 'error');
    }
}

// Utility Functions
function getStatusLabel(status) {
    const labels = {
        novo: 'Novo',
        contato: 'Primeiro Contato',
        qualificado: 'Qualificado',
        proposta: 'Proposta',
        negociacao: 'Negociação',
        ganho: 'Ganho',
        perdido: 'Perdido'
    };
    return labels[status] || status;
}

function getLogIcon(type) {
    const icons = {
        lead: 'user-plus',
        email: 'envelope',
        call: 'phone',
        task: 'tasks',
        meeting: 'calendar',
        note: 'sticky-note'
    };
    return icons[type] || 'info-circle';
}

function formatDate(dateString) {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return 'Não informado';
    }

    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Data inválida';
        }

        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        console.error('Erro ao formatar data:', error, 'Data recebida:', dateString);
        return 'Data inválida';
    }
}

function formatDateTime(dateString) {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return 'Não informado';
    }

    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Data inválida';
        }

        return date.toLocaleString('pt-BR');
    } catch (error) {
        console.error('Erro ao formatar data/hora:', error, 'Data recebida:', dateString);
        return 'Data inválida';
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Function to normalize text (remove accents and convert to lowercase)
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function filterLeads() {
    const searchInput = document.querySelector('.search-input');
    const statusFilter = document.querySelector('.filters .filter-select:nth-child(2)');
    const responsibleFilter = document.querySelector('.filters .filter-select:nth-child(3)');

    const searchTerm = searchInput ? normalizeText(searchInput.value) : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    const selectedResponsible = responsibleFilter ? normalizeText(responsibleFilter.value) : '';

    let filteredLeads = leads.filter(lead => {
        // Search filter
        const matchesSearch = !searchTerm || 
            normalizeText(lead.name).includes(searchTerm) ||
            normalizeText(lead.company).includes(searchTerm) ||
            normalizeText(lead.email).includes(searchTerm);

        // Status filter
        const matchesStatus = !selectedStatus || lead.status === selectedStatus;

        // Responsible filter
        const matchesResponsible = !selectedResponsible || 
            normalizeText(lead.responsible).includes(selectedResponsible);

        return matchesSearch && matchesStatus && matchesResponsible;
    });

    renderFilteredLeadsTable(filteredLeads);
}

function renderFilteredLeadsTable(filteredLeads) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    tbody.innerHTML = filteredLeads.map(lead => `
        <tr style="cursor: pointer;" onclick="openLeadDetails(${lead.id})">
            <td>${lead.name}</td>
            <td>${lead.company}</td>
            <td>${lead.email}</td>
            <td>${lead.phone}</td>
            <td><span class="status-badge status-${lead.status}">${getStatusLabel(lead.status)}</span></td>
            <td>${lead.responsible}</td>
            <td>${formatDate(lead.last_contact || lead.lastContact)}</td>
            <td>${lead.score}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editLead(${lead.id}); event.stopPropagation();" title="Editar lead">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteLead(${lead.id}); event.stopPropagation();" title="Excluir lead">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 16px;">&times;</button>
        </div>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Service Worker for Notifications
if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Request notification permission
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notification permission granted');
        }
    });
}

// Simulated real-time updates
setInterval(() => {
    // Simulate receiving new notifications
    const notifications = [
        'Novo lead recebido via website',
        'Follow-up agendado foi completado',
        'Lead quente precisa de atenção',
        'Nova tarefa foi atribuída a você'
    ];

    if (Math.random() < 0.1) { // 10% chance every interval
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        showNotification(randomNotification, 'info');
    }
}, 30000); // Check every 30 seconds

async function submitActivity() {
    const form = document.getElementById('activityForm');
    const formData = new FormData(form);
    const leadIdValue = formData.get('leadId');
    const leadId = leadIdValue && leadIdValue !== '' ? parseInt(leadIdValue) : null;
    const lead = leadId ? leads.find(l => l.id === leadId) : null;

    const activityData = {
        lead_id: leadId,
        type: formData.get('type'),
        title: formData.get('title'),
        description: formData.get('description'),
        scheduled_date: formData.get('datetime')
    };

    try {
        // Salvar no banco
        const newActivity = await fetchFromAPI('/activities', {
            method: 'POST',
            body: JSON.stringify(activityData)
        });

        // Adicionar ao calendário
        if (calendar) {
            calendar.addEvent({
                id: newActivity.id.toString(),
                title: newActivity.title,
                start: newActivity.scheduled_date,
                backgroundColor: getEventColor(newActivity.type),
                borderColor: getEventColor(newActivity.type),
                extendedProps: {
                    leadId: newActivity.lead_id,
                    type: newActivity.type,
                    description: newActivity.description
                }
            });
        }

        // Log da atividade
        await addLog({
            type: 'meeting',
            title: 'Atividade agendada',
            description: `${activityData.title}${lead ? ` para ${lead.name}` : ''} agendada`,
            user_id: 'Usuário Atual',
            lead_id: leadId
        });

        closeModal('activityModal');
        form.reset();
        showNotification('Atividade agendada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar atividade:', error);
        showNotification('Erro ao salvar atividade', 'error');
    }
}

async function submitNote() {
    const form = document.getElementById('noteForm');
    const formData = new FormData(form);
    const leadId = parseInt(formData.get('leadId'));
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
        showNotification('Lead não encontrado', 'error');
        return;
    }

    const note = formData.get('note');

    try {
        // Save note to database
        await fetchFromAPI('/notes', {
            method: 'POST',
            body: JSON.stringify({
                lead_id: leadId,
                content: note,
                color: 'blue',
                user_id: 'Usuário Atual'
            })
        });

        // Update local lead notes
        if (lead.notes) {
            lead.notes += '\n\n--- Nota ' + new Date().toLocaleString('pt-BR') + ' ---\n' + note;
        } else {
            lead.notes = note;
        }

        await addLog({
            type: 'note',
            title: 'Nota adicionada',
            description: `Nova nota adicionada para ${lead.name}`,
            user_id: 'Usuário Atual',
            lead_id: leadId
        });

        closeModal('noteModal');
        form.reset();
        renderLeadsTable();
        renderKanbanBoard();
        showNotification('Nota adicionada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar nota:', error);
        showNotification('Erro ao salvar nota', 'error');
    }
}

function openLeadDetails(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead não encontrado', 'error');
        return;
    }

    // Reset form first
    const form = document.getElementById('leadForm');
    form.reset();

    // Populate modal with lead data
    document.getElementById('leadId').value = lead.id || '';
    document.getElementById('leadName').value = lead.name || '';
    document.getElementById('leadCompany').value = lead.company || '';
    document.getElementById('leadEmail').value = lead.email || '';
    document.getElementById('leadPhone').value = lead.phone || '';
    document.getElementById('leadPosition').value = lead.position || '';
    document.getElementById('leadSource').value = lead.source || 'website';
    document.getElementById('leadStatus').value = lead.status || 'novo';
    document.getElementById('leadValue').value = lead.value || 0;
    document.getElementById('leadNotes').value = lead.notes || '';

    // Change modal title
    document.getElementById('leadModalTitle').textContent = `Editar Lead - ${lead.name}`;

    // Open modal
    document.getElementById('leadModal').style.display = 'block';
}

function editLead(leadId) {
    openLeadDetails(leadId);
}

async function deleteLead(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const result = await Swal.fire({
        title: 'Confirmar Exclusão',
        text: `Tem certeza que deseja excluir o lead "${lead.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar',
        background: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
        color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b'
    });

    if (result.isConfirmed) {
        try {
            // Try to delete from server
            await fetchFromAPI(`/leads/${leadId}`, {
                method: 'DELETE'
            });

            // Remove lead from local array
            leads = leads.filter(l => l.id !== leadId);

            // Add log entry
            await addLog({
                type: 'lead',
                title: 'Lead excluído',
                description: `Lead ${lead.name} foi removido do sistema`,
                user_id: 'Usuário Atual',
                lead_id: leadId
            });

            // Re-render components
            renderLeadsTable();
            renderKanbanBoard();

            Swal.fire({
                title: 'Excluído!',
                text: 'O lead foi excluído com sucesso.',
                icon: 'success',
                confirmButtonColor: '#10b981',
                background: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
                color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b'
            });
        } catch (error) {
            console.error('Erro ao excluir lead:', error);
            showNotification('Erro ao excluir lead', 'error');
        }
    }
}

function scheduleActivity(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead não encontrado', 'error');
        return;
    }

    // Reset form and set lead ID
    const form = document.getElementById('activityForm');
    form.reset();
    
    // Set default date to current time
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    document.getElementById('activityDateTime').value = now.toISOString().slice(0, 16);

    // Populate leads dropdown
    const leadSelect = document.getElementById('activityLeadId');
    leadSelect.innerHTML = '<option value="">Selecione um lead (opcional)</option>';
    leads.forEach(leadOption => {
        const option = document.createElement('option');
        option.value = leadOption.id;
        option.textContent = `${leadOption.name} - ${leadOption.company}`;
        option.selected = leadOption.id === leadId;
        leadSelect.appendChild(option);
    });

    // Set lead ID in activity modal
    document.getElementById('activityLeadId').value = leadId;

    // Open activity modal
    document.getElementById('activityModal').style.display = 'block';

    showNotification(`Agendando atividade para ${lead.name}`, 'info');
}

function addNote(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Set lead ID in note modal
    document.getElementById('noteLeadId').value = leadId;

    // Open note modal
    document.getElementById('noteModal').style.display = 'block';

    showNotification(`Adicionando nota para ${lead.name}`, 'info');
}

// Função submitEvent removida - agora tudo usa submitActivity

function getEventColor(type) {
    const colors = {
        meeting: '#3b82f6',
        call: '#10b981',
        email: '#f59e0b',
        demo: '#8b5cf6',
        'follow-up': '#06b6d4',
        task: '#ef4444'
    };
    return colors[type] || '#3b82f6';
}

async function submitTask() {
    const form = document.getElementById('taskForm');
    const formData = new FormData(form);
    const taskId = formData.get('id');

    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        dueDate: formData.get('dueDate'),
        priority: formData.get('priority'),
        status: 'pending',
        leadId: parseInt(formData.get('leadId')) || null,
        assignee: formData.get('assignee')
    };

    try {
        if (taskId) {
            // Edit existing task
            const updatedTask = await fetchFromAPI(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({...taskData, id: parseInt(taskId)})
            });

            // Update local array
            const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
            if (taskIndex !== -1) {
                tasks[taskIndex] = {...tasks[taskIndex], ...taskData, id: parseInt(taskId)};
            }

            await addLog({
                type: 'task',
                title: 'Tarefa atualizada',
                description: `Tarefa "${taskData.title}" foi editada`,
                user_id: 'Usuário Atual',
                lead_id: taskData.leadId
            });

            showNotification('Tarefa atualizada com sucesso!', 'success');
        } else {
            // Create new task
            const newTask = await fetchFromAPI('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });

            // Add to local array
            tasks.push(newTask);

            await addLog({
                type: 'task',
                title: 'Nova tarefa criada',
                description: `Tarefa "${taskData.title}" foi adicionada ao sistema`,
                user_id: 'Usuário Atual',
                lead_id: taskData.leadId
            });

            showNotification('Tarefa criada com sucesso!', 'success');
        }

        // Re-render tasks list
        renderTasksList();

        closeModal('taskModal');
        form.reset();
        document.getElementById('taskModalTitle').textContent = 'Nova Tarefa';

    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        showNotification('Erro ao salvar tarefa', 'error');
    }
}

// Export functions for global access
window.toggleTheme = toggleTheme;
window.openLeadModal = openLeadModal;
window.closeModal = closeModal;
window.submitLead = submitLead;
window.submitActivity = submitActivity;
window.submitNote = submitNote;
window.submitTask = submitTask;
window.openLeadDetails = openLeadDetails;
window.openEventModal = openEventModal;
window.openTaskModal = openTaskModal;
window.toggleTaskStatus = toggleTaskStatus;
window.editLead = editLead;
window.deleteLead = deleteLead;
window.scheduleActivity = scheduleActivity;
window.addNote = addNote;
window.changeLogsPage = changeLogsPage;
window.openTaskDetails = openTaskDetails;
window.applyLogsFilters = applyLogsFilters;
window.openNewCardModal = openNewCardModal;
window.submitNewCard = submitNewCard;
window.openLogDetails = openLogDetails;

// Lead Notes Management
async function loadAllLeadNotes() {
    try {
        // Fetch lead notes from the API
        const notes = await fetchFromAPI('/notes');

        // Iterate through each lead and assign its notes
        leads.forEach(lead => {
            lead.notes = notes.filter(note => note.lead_id === lead.id).map(note => note.content).join('\n\n---\n\n') || '';
        });
    } catch (error) {
        console.error('Erro ao carregar notas dos leads:', error);
        showNotification('Erro ao carregar notas dos leads', 'error');
    }
}

// New Card Functionality
function openNewCardModal(status) {
    // Set the default status for the new card
    document.getElementById('newCardStatus').value = status;

    // Open the modal
    document.getElementById('newCardModal').style.display = 'block';
}

async function submitNewCard() {
    const form = document.getElementById('newCardForm');
    const formData = new FormData(form);

    const newLeadData = {
        name: formData.get('name'),
        company: formData.get('company'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        position: formData.get('position'),
        status: formData.get('status'),
        source: formData.get('source'),
        responsible: 'Usuário Atual',
        score: 50,
        temperature: formData.get('temperature') || 'morno',
        value: parseFloat(formData.get('value')) || 0,
        notes: formData.get('notes'),
        lastContact: new Date().toISOString().split('T')[0]
    };

    try {
        // Create new lead
        const newLead = await fetchFromAPI('/leads', {
            method: 'POST',
            body: JSON.stringify(newLeadData)
        });

        // Add to local array
        leads.push(newLead);

        await addLog({
            type: 'lead',
            title: 'Novo lead criado',
            description: `Lead ${newLeadData.name} foi adicionado ao sistema via Kanban`,
            user_id: 'Usuário Atual',
            lead_id: newLead.id
        });

        showNotification('Lead criado com sucesso!', 'success');

        // Re-render components
        renderLeadsTable();
        renderKanbanBoard();

        closeModal('newCardModal');
        form.reset();

    } catch (error) {
        console.error('Erro ao salvar lead:', error);
        showNotification('Erro ao salvar lead', 'error');
    }
}

//Recent History
function renderRecentHistory() {
    const recentHistoryList = document.getElementById('recentHistoryList');
    if (!recentHistoryList) return;

    // Combine logs and calendar events (if calendar exists), sort by timestamp
    let combinedHistory = [...logs];
    
    if (calendar && calendar.getEvents) {
        const calendarEvents = calendar.getEvents().map(event => ({
            type: 'calendar',
            title: event.title,
            description: event.extendedProps?.description || '',
            timestamp: event.startStr,
            userId: 'Sistema'
        }));
        combinedHistory = [...logs, ...calendarEvents];
    }

    combinedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take the 5 most recent items
    const recentItems = combinedHistory.slice(0, 5);

    recentHistoryList.innerHTML = recentItems.map(item => `
        <div class="history-item">
            <i class="fas fa-${getHistoryIcon(item.type)}"></i>
            <div class="history-content">
                <div class="history-title">${item.title}</div>
                <div class="history-description">${item.description}</div>
                <div class="history-time">${formatDateTime(item.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function openLogDetails(logId) {
    const log = logs.find(l => l.id === logId);
    if (!log) {
        showNotification('Log não encontrado', 'error');
        return;
    }

    // Buscar informações do lead relacionado, se existir
    const lead = log.lead_id ? leads.find(l => l.id === log.lead_id) : null;

    // Definir cores baseadas no tipo de log
    const typeColors = {
        lead: '#3b82f6',
        email: '#f59e0b',
        call: '#10b981',
        task: '#8b5cf6',
        meeting: '#ef4444',
        note: '#06b6d4'
    };

    const typeLabels = {
        lead: 'Lead',
        email: 'Email',
        call: 'Ligação',
        task: 'Tarefa',
        meeting: 'Reunião',
        note: 'Nota'
    };

    const typeColor = typeColors[log.type] || '#6b7280';
    const typeLabel = typeLabels[log.type] || log.type;

    Swal.fire({
        title: 'Detalhes do Log',
        html: `
            <div style="text-align: left; padding: 20px;">
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 20px; background-color: ${typeColor}; color: white; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-${getLogIcon(log.type)}"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; color: var(--text-primary); font-size: 18px;">${log.title}</h3>
                        <span style="background-color: ${typeColor}20; color: ${typeColor}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${typeLabel}
                        </span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Descrição:</strong><br>
                    <p style="margin: 8px 0; color: var(--text-secondary); background-color: var(--bg-secondary); padding: 12px; border-radius: 6px; border-left: 3px solid ${typeColor};">
                        ${log.description}
                    </p>
                </div>

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Data e Hora:</strong><br>
                    <span style="color: var(--text-secondary); font-family: monospace;">
                        ${formatDateTime(log.timestamp)}
                    </span>
                </div>

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">Usuário:</strong><br>
                    <span style="color: var(--text-secondary);">
                        ${log.user_id || log.userId || 'Não informado'}
                    </span>
                </div>

                ${lead ? `
                <div style="margin-bottom: 15px; padding: 12px; background-color: var(--bg-secondary); border-radius: 6px;">
                    <strong style="color: var(--text-primary);">Lead Relacionado:</strong><br>
                    <div style="margin-top: 8px;">
                        <span style="color: var(--primary-color); font-weight: 600; cursor: pointer;" onclick="openLeadDetails(${lead.id}); Swal.close();">
                            ${lead.name}
                        </span>
                        <br>
                        <span style="color: var(--text-secondary); font-size: 14px;">
                            ${lead.company} • ${lead.email}
                        </span>
                        <br>
                        <span class="status-badge status-${lead.status}" style="font-size: 11px; margin-top: 4px; display: inline-block;">
                            ${getStatusLabel(lead.status)}
                        </span>
                    </div>
                </div>
                ` : ''}

                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-primary);">ID do Log:</strong><br>
                    <span style="color: var(--text-muted); font-family: monospace; font-size: 12px;">
                        #${log.id}
                    </span>
                </div>
            </div>
        `,
        icon: 'info',
        showConfirmButton: true,
        confirmButtonText: 'Fechar',
        confirmButtonColor: typeColor,
        width: '600px',
        background: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
        color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b',
        customClass: {
            popup: 'log-details-modal'
        }
    });
}

function getHistoryIcon(type) {
    const icons = {
        lead: 'user-plus',
        email: 'envelope',
        call: 'phone',
        task: 'tasks',
        meeting: 'calendar-alt',
        note: 'sticky-note',
        calendar: 'calendar-alt'
    };
    return icons[type] || 'info-circle';
}