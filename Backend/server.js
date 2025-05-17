const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Função para verificar conflitos de horário
function verificarConflito(data, horario, profissional_id, id = null, callback) {
    const query = id
        ? `SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND profissional_id = ? AND id != ?`
        : `SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND profissional_id = ?`;
    const params = id ? [data, horario, profissional_id, id] : [data, horario, profissional_id];

    db.get(query, params, (err, row) => {
        if (err) {
            callback(err);
        } else {
            callback(null, !!row);
        }
    });
}

// Função para obter horários disponíveis com base na grade
function getHorariosDisponiveis(data, profissional_id, callback) {
    // Converter data para dia da semana
    const date = new Date(data);
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaSemana = diasSemana[date.getDay()];

    // Buscar grade do profissional
    db.get(
        `SELECT horario_inicio, horario_fim FROM profissional_grades WHERE profissional_id = ? AND dia_semana = ?`,
        [profissional_id, diaSemana],
        (err, grade) => {
            if (err || !grade) {
                callback(err || new Error('Profissional não disponível neste dia'));
                return;
            }

            // Gerar horários de hora em hora
            const horarios = [];
            let [inicioH, inicioM] = grade.horario_inicio.split(':').map(Number);
            const [fimH, fimM] = grade.horario_fim.split(':').map(Number);

            while (inicioH < fimH || (inicioH === fimH && inicioM < fimM)) {
                horarios.push(`${inicioH.toString().padStart(2, '0')}:00`);
                inicioH++;
            }

            // Buscar horários ocupados
            db.all(
                `SELECT horario FROM agendamentos WHERE data = ? AND profissional_id = ?`,
                [data, profissional_id],
                (err, rows) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    const horariosOcupados = rows.map(row => row.horario);
                    const horariosDisponiveis = horarios.filter(horario => !horariosOcupados.includes(horario));
                    callback(null, horariosDisponiveis);
                }
            );
        }
    );
}

// Rota para cadastrar profissional
app.post('/profissionais', (req, res) => {
    const { nome, servicos, grade } = req.body;

    if (!nome || !servicos || servicos.length === 0 || !grade || grade.length === 0) {
        return res.status(400).json({ erro: 'Nome, serviços e grade são obrigatórios' });
    }

    db.run(`INSERT INTO profissionais (nome) VALUES (?)`, [nome], function (err) {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao cadastrar profissional' });
        }
        const profissional_id = this.lastID;

        // Inserir serviços
        const stmtServicos = db.prepare(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`);
        servicos.forEach(servico => stmtServicos.run([profissional_id, servico]));
        stmtServicos.finalize();

        // Inserir grade
        const stmtGrade = db.prepare(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`);
        grade.forEach(({ dia_semana, horario_inicio, horario_fim }) => {
            stmtGrade.run([profissional_id, dia_semana, horario_inicio, horario_fim]);
        });
        stmtGrade.finalize();

        res.json({ mensagem: `Profissional ${nome} cadastrado com sucesso!`, id: profissional_id });
    });
});

// Rota para listar profissionais
app.get('/profissionais', (req, res) => {
    db.all(
        `SELECT p.id, p.nome, 
                GROUP_CONCAT(ps.servico) AS servicos,
                (SELECT GROUP_CONCAT(dia_semana || ':' || horario_inicio || '-' || horario_fim) 
                 FROM profissional_grades pg 
                 WHERE pg.profissional_id = p.id) AS grade
         FROM profissionais p
         LEFT JOIN profissional_servicos ps ON p.id = ps.profissional_id
         GROUP BY p.id`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao buscar profissionais' });
            }
            const profissionais = rows.map(row => ({
                id: row.id,
                nome: row.nome,
                servicos: row.servicos ? row.servicos.split(',') : [],
                grade: row.grade ? row.grade.split(',').map(g => {
                    const [dia_semana, horarios] = g.split(':');
                    const [horario_inicio, horario_fim] = horarios.split('-');
                    return { dia_semana, horario_inicio, horario_fim };
                }) : []
            }));
            res.json(profissionais);
        }
    );
});

// Rota para obter serviços por profissional
app.get('/profissional-servicos/:id', (req, res) => {
    const { id } = req.params;
    db.all(
        `SELECT servico FROM profissional_servicos WHERE profissional_id = ?`,
        [id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao buscar serviços' });
            }
            res.json(rows.map(row => row.servico));
        }
    );
});

// Rota para obter horários disponíveis
app.get('/horarios-disponiveis', (req, res) => {
    const { data, profissional_id } = req.query;

    if (!data || !profissional_id) {
        return res.status(400).json({ erro: 'Data e profissional são obrigatórios' });
    }

    getHorariosDisponiveis(data, profissional_id, (err, horarios) => {
        if (err) {
            return res.status(400).json({ erro: err.message });
        }
        res.json(horarios);
    });
});

// Rota para criar agendamento
app.post('/agendamentos', (req, res) => {
    const { nome, telefone, servico, data, horario, profissional_id } = req.body;

    if (!nome || !telefone || !servico || !data || !horario || !profissional_id) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    // Validar data futura
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
        return res.status(400).json({ erro: 'A data deve ser futura' });
    }

    // Validar se o serviço é oferecido pelo profissional
    db.get(
        `SELECT * FROM profissional_servicos WHERE profissional_id = ? AND servico = ?`,
        [profissional_id, servico],
        (err, row) => {
            if (err || !row) {
                return res.status(400).json({ erro: 'Serviço não oferecido por este profissional' });
            }

            verificarConflito(data, horario, profissional_id, null, (err, conflito) => {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao verificar conflito' });
                }
                if (conflito) {
                    return res.status(400).json({ erro: 'Horário já ocupado' });
                }

                db.run(
                    `INSERT INTO agendamentos (nome, telefone, servico, data, horario, profissional_id) VALUES (?, ?, ?, ?, ?, ?)`,
                    [nome, telefone, servico, data, horario, profissional_id],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ erro: 'Erro ao salvar agendamento' });
                        }
                        res.json({ mensagem: `Agendamento confirmado para ${nome}!`, id: this.lastID });
                    }
                );
            });
        }
    );
});

// Rota para listar agendamentos
app.get('/agendamentos', (req, res) => {
    const { profissional_id } = req.query;
    const query = profissional_id
        ? `SELECT a.*, p.nome AS profissional_nome 
           FROM agendamentos a 
           JOIN profissionais p ON a.profissional_id = p.id 
           WHERE a.profissional_id = ?`
        : `SELECT a.*, p.nome AS profissional_nome 
           FROM agendamentos a 
           JOIN profissionais p ON a.profissional_id = p.id`;
    const params = profissional_id ? [profissional_id] : [];

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
        }
        res.json(rows);
    });
});

// Rota para atualizar agendamento
app.put('/agendamentos/:id', (req, res) => {
    const { nome, telefone, servico, data, horario, profissional_id } = req.body;
    const { id } = req.params;

    if (!nome || !telefone || !servico || !data || !horario || !profissional_id) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    // Validar data futura
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
        return res.status(400).json({ erro: 'A data deve ser futura' });
    }

    // Validar se o serviço é oferecido pelo profissional
    db.get(
        `SELECT * FROM profissional_servicos WHERE profissional_id = ? AND servico = ?`,
        [profissional_id, servico],
        (err, row) => {
            if (err || !row) {
                return res.status(400).json({ erro: 'Serviço não oferecido por este profissional' });
            }

            verificarConflito(data, horario, profissional_id, id, (err, conflito) => {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao verificar conflito' });
                }
                if (conflito) {
                    return res.status(400).json({ erro: 'Horário já ocupado' });
                }

                db.run(
                    `UPDATE agendamentos SET nome = ?, telefone = ?, servico = ?, data = ?, horario = ?, profissional_id = ? WHERE id = ?`,
                    [nome, telefone, servico, data, horario, profissional_id, id],
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
        }
    );
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