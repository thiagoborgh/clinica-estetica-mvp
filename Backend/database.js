const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./agendamentos.db');

// Criar tabelas
db.serialize(() => {
    // Tabela de profissionais
    db.run(`
        CREATE TABLE IF NOT EXISTS profissionais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
        )
    `);

    // Tabela de serviços por profissional
    db.run(`
        CREATE TABLE IF NOT EXISTS profissional_servicos (
            profissional_id INTEGER,
            servico TEXT NOT NULL,
            PRIMARY KEY (profissional_id, servico),
            FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        )
    `);

    // Tabela de grades de horário por profissional
    db.run(`
        CREATE TABLE IF NOT EXISTS profissional_grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profissional_id INTEGER,
            dia_semana TEXT NOT NULL, -- ex.: 'segunda', 'terca'
            horario_inicio TEXT NOT NULL, -- ex.: '08:00'
            horario_fim TEXT NOT NULL, -- ex.: '18:00'
            FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        )
    `);

    // Tabela de agendamentos
    db.run(`
        CREATE TABLE IF NOT EXISTS agendamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL,
            servico TEXT NOT NULL,
            data TEXT NOT NULL,
            horario TEXT NOT NULL,
            profissional_id INTEGER,
            FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        )
    `);

    // Inserir profissionais iniciais e suas configurações
    db.get(`SELECT COUNT(*) AS count FROM profissionais`, (err, row) => {
        if (row.count === 0) {
            // Profissional Ana
            db.run(`INSERT INTO profissionais (nome) VALUES (?)`, ['Ana'], function (err) {
                const anaId = this.lastID;
                db.run(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`, [anaId, 'massagem']);
                db.run(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`, [anaId, 'limpeza']);
                db.run(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`, [anaId, 'segunda', '08:00', '18:00']);
                db.run(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`, [anaId, 'terca', '08:00', '18:00']);
            });

            // Profissional Bruno
            db.run(`INSERT INTO profissionais (nome) VALUES (?)`, ['Bruno'], function (err) {
                const brunoId = this.lastID;
                db.run(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`, [brunoId, 'botox']);
                db.run(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`, [brunoId, 'depilacao']);
                db.run(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`, [brunoId, 'quarta', '09:00', '17:00']);
                db.run(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`, [brunoId, 'quinta', '09:00', '17:00']);
            });

            // Profissional Carla
            db.run(`INSERT INTO profissionais (nome) VALUES (?)`, ['Carla'], function (err) {
                const carlaId = this.lastID;
                db.run(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`, [carlaId, 'manicure']);
                db.run(`INSERT INTO profissional_servicos (profissional_id, servico) VALUES (?, ?)`, [carlaId, 'hidratacao']);
                db.run(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`, [carlaId, 'sexta', '08:00', '18:00']);
                db.run(`INSERT INTO profissional_grades (profissional_id, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`, [carlaId, 'sabado', '08:00', '14:00']);
            });
        }
    });
});

module.exports = db;