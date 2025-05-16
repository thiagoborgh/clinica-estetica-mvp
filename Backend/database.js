const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./agendamentos.db');

// Criar tabela de agendamentos, se não existir
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS agendamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL,
            servico TEXT NOT NULL,
            data TEXT NOT NULL,
            horario TEXT NOT NULL
        )
    `);
});

module.exports = db;