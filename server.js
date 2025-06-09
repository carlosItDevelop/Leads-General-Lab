
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, resetDatabase, api } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize database on startup
initializeDatabase().catch(console.error);

// API Routes
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await api.getLeads();
        res.json(leads);
    } catch (error) {
        console.error('Erro ao buscar leads:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const newLead = await api.createLead(req.body);
        res.status(201).json(newLead);
    } catch (error) {
        console.error('Erro ao criar lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/leads/:id', async (req, res) => {
    try {
        const updatedLead = await api.updateLead(req.params.id, req.body);
        res.json(updatedLead);
    } catch (error) {
        console.error('Erro ao atualizar lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        await api.deleteLead(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await api.getTasks();
        res.json(tasks);
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = await api.createTask(req.body);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await api.updateTask(req.params.id, req.body);
        res.json(updatedTask);
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        
        // Verificar se é erro de validação de data
        if (error.code === '22007') {
            res.status(400).json({ error: 'Data de vencimento inválida. Por favor, insira uma data válida.' });
        } else if (error.message.includes('Tarefa não encontrada')) {
            res.status(404).json({ error: 'Tarefa não encontrada' });
        } else {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
});

app.put('/api/tasks/:id/status', async (req, res) => {
    try {
        const updatedTask = await api.updateTaskStatus(req.params.id, req.body.status);
        res.json(updatedTask);
    } catch (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/tasks/:id/progress', async (req, res) => {
    try {
        const updatedTask = await api.updateTaskProgress(req.params.id, req.body.progress);
        res.json(updatedTask);
    } catch (error) {
        console.error('Erro ao atualizar progresso da tarefa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/tasks/:id/order', async (req, res) => {
    try {
        const updatedTask = await api.updateTaskOrder(req.params.id, req.body.sortOrder);
        res.json(updatedTask);
    } catch (error) {
        console.error('Erro ao atualizar ordem da tarefa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await api.deleteTask(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        if (error.message.includes('possui')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
});

app.get('/api/tasks/filtered', async (req, res) => {
    try {
        const tasks = await api.getFilteredTasks(req.query);
        res.json(tasks);
    } catch (error) {
        console.error('Erro ao buscar tarefas filtradas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Task Comments
app.get('/api/tasks/:id/comments', async (req, res) => {
    try {
        const comments = await api.getTaskComments(req.params.id);
        res.json(comments);
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/tasks/:id/comments', async (req, res) => {
    try {
        const commentData = {
            task_id: req.params.id,
            comment: req.body.comment,
            user_id: req.body.user_id
        };
        const newComment = await api.createTaskComment(commentData);
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Task Attachments
app.get('/api/tasks/:id/attachments', async (req, res) => {
    try {
        const attachments = await api.getTaskAttachments(req.params.id);
        res.json(attachments);
    } catch (error) {
        console.error('Erro ao buscar anexos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/tasks/:id/attachments', async (req, res) => {
    try {
        const attachmentData = {
            task_id: req.params.id,
            filename: req.body.filename,
            file_url: req.body.file_url,
            file_size: req.body.file_size,
            mime_type: req.body.mime_type,
            uploaded_by: req.body.uploaded_by
        };
        const newAttachment = await api.createTaskAttachment(attachmentData);
        res.status(201).json(newAttachment);
    } catch (error) {
        console.error('Erro ao criar anexo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/tasks/:taskId/attachments/:id', async (req, res) => {
    try {
        await api.deleteTaskAttachment(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar anexo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await api.getLogs(req.query);
        res.json(logs);
    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const newLog = await api.createLog(req.body);
        res.status(201).json(newLog);
    } catch (error) {
        console.error('Erro ao criar log:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/activities', async (req, res) => {
    try {
        const activities = await api.getActivities();
        res.json(activities);
    } catch (error) {
        console.error('Erro ao buscar atividades:', error.message);
        res.status(500).json({ error: 'Erro ao buscar atividades: ' + error.message });
    }
});

app.post('/api/activities', async (req, res) => {
    try {
        const newActivity = await api.createActivity(req.body);
        res.status(201).json(newActivity);
    } catch (error) {
        console.error('Erro ao criar atividade:', error.message);
        res.status(500).json({ error: 'Erro ao criar atividade: ' + error.message });
    }
});

app.put('/api/activities/:id', async (req, res) => {
    try {
        const updatedActivity = await api.updateActivity(req.params.id, req.body);
        res.json(updatedActivity);
    } catch (error) {
        console.error('Erro ao atualizar atividade:', error.message);
        res.status(500).json({ error: 'Erro ao atualizar atividade: ' + error.message });
    }
});

app.delete('/api/activities/:id', async (req, res) => {
    try {
        await api.deleteActivity(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar atividade:', error.message);
        res.status(500).json({ error: 'Erro ao deletar atividade: ' + error.message });
    }
});

app.get('/api/leads/:id/notes', async (req, res) => {
    try {
        const notes = await api.getNotesByLeadId(req.params.id);
        res.json(notes);
    } catch (error) {
        console.error('Erro ao buscar notes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/notes', async (req, res) => {
    try {
        const newNote = await api.createNote(req.body);
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Erro ao criar note:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/notes', async (req, res) => {
    try {
        const notes = await api.getAllNotes();
        res.json(notes);
    } catch (error) {
        console.error('Erro ao buscar notes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Get all attachments for files management
app.get('/api/attachments', async (req, res) => {
    try {
        const attachments = await api.getAllAttachments();
        res.json(attachments);
    } catch (error) {
        console.error('Erro ao buscar anexos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/attachments/:id', async (req, res) => {
    try {
        await api.deleteTaskAttachment(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar anexo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        await api.deleteNote(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar note:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Reset database endpoint (careful - this deletes all data!)
app.post('/api/reset-database', async (req, res) => {
    try {
        await resetDatabase();
        res.json({ success: true, message: 'Banco de dados resetado com sucesso!' });
    } catch (error) {
        console.error('Erro ao resetar banco:', error);
        res.status(500).json({ error: 'Erro ao resetar banco de dados' });
    }
});

// Serve static files - must be last
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
