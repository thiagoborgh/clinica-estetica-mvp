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

    // Tabela de agendamentos com referência ao profissional
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

    // Inserir profissionais iniciais (exemplo)
    db.get(`SELECT COUNT(*) AS count FROM profissionais`, (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO profissionais (nome) VALUES (?)`, ['Ana']);
            db.run(`INSERT INTO profissionais (nome) VALUES (?)`, ['Bruno']);
            db.run(`INSERT INTO profissionais (nome) VALUES (?)`, ['Carla']);
        }
    });
});

module.exports = db;