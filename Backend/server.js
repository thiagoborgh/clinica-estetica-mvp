const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Função para verificar conflitos de horário
function verificarConflito(data, horario, id = null, callback) {
    const query = id
        ? `SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND id != ?`
        : `SELECT * FROM agendamentos WHERE data = ? AND horario = ?`;
    const params = id ? [data, horario, id] : [data, horario];

    db.get(query, params, (err, row) => {
        if (err) {
            callback(err);
        } else {
            callback(null, !!row);
        }
    });
}

// Rota para criar agendamento
app.post('/agendamentos', (req, res) => {
    const { nome, telefone, servico, data, horario } = req.body;

    if (!nome || !telefone || !servico || !data || !horario) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    // Validar data futura
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
        return res.status(400).json({ erro: 'A data deve ser futura' });
    }

    // Validar horário comercial (ex.: 08:00 às 18:00)
    const hora = parseInt(horario.split(':')[0]);
    if (hora < 8 || hora >= 18) {
        return res.status(400).json({ erro: 'Horário fora do expediente (08:00 às 18:00)' });
    }

    verificarConflito(data, horario, null, (err, conflito) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao verificar conflito' });
        }
        if (conflito) {
            return res.status(400).json({ erro: 'Horário já ocupado' });
        }

        db.run(
            `INSERT INTO agendamentos (nome, telefone, servico, data, horario) VALUES (?, ?, ?, ?, ?)`,
            [nome, telefone, servico, data, horario],
            function (err) {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao salvar agendamento' });
                }
                res.json({ mensagem: `Agendamento confirmado para ${nome}!`, id: this.lastID });
            }
        );
    });
});

// Rota para listar agendamentos
app.get('/agendamentos', (req, res) => {
    db.all(`SELECT * FROM agendamentos`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
        }
        res.json(rows);
    });
});

// Rota para atualizar agendamento
app.put('/agendamentos/:id', (req, res) => {
    const { nome, telefone, servico, data, horario } = req.body;
    const { id } = req.params;

    if (!nome || !telefone || !servico || !data || !horario) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    // Validar data futura
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
        return res.status(400).json({ erro: 'A data deve ser futura' });
    }

    // Validar horário comercial
    const hora = parseInt(horario.split(':')[0]);
    if (hora < 8 || hora >= 18) {
        return res.status(400).json({ erro: 'Horário fora do expediente (08:00 às 18:00)' });
    }

    verificarConflito(data, horario, id, (err, conflito) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao verificar conflito' });
        }
        if (conflito) {
            return res.status(400).json({ erro: 'Horário já ocupado' });
        }

        db.run(
            `UPDATE agendamentos SET nome = ?, telefone = ?, servico = ?, data = ?, horario = ? WHERE id = ?`,
            [nome, telefone, servico, data, horario, id],
            function (err) {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao atualizar agendamento' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ erro: 'Agendamento não encontrado' });
                }
                res.json({ mensagem: `Agendamento atualizado com sucesso!` });
            }
        );
    });
});

// Rota para excluir agendamento
app.delete('/agendamentos/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM agendamentos WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao excluir agendamento' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ erro: 'Agendamento não encontrado' });
        }
        res.json({ mensagem: 'Agendamento excluído com sucesso!' });
    });
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});