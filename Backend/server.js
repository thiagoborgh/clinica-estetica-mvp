const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Conectar ao banco de dados
const db = new sqlite3.Database('./agendamentos.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados agendamentos.db');
    // Criar tabela de profissionais
    db.run(`
      CREATE TABLE IF NOT EXISTS profissionais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        servicos TEXT NOT NULL,
        grade TEXT NOT NULL
      )
    `);
    // Criar tabela de agendamentos
    db.run(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        profissionalId INTEGER NOT NULL,
        servico TEXT NOT NULL,
        data TEXT NOT NULL,
        horario TEXT NOT NULL,
        FOREIGN KEY (profissionalId) REFERENCES profissionais(id)
      )
    `);
  }
});

// Rota para listar profissionais
app.get('/profissionais', (req, res) => {
  db.all('SELECT * FROM profissionais', [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao listar profissionais' });
      console.error(err.message);
      return;
    }
    res.json(rows);
  });
});

// Rota para cadastrar profissional
app.post('/profissionais', (req, res) => {
  const { nome, servicos, grade } = req.body;
  console.log('Dados recebidos no POST:', req.body);

  try {
    const servicosArray = typeof servicos === 'string' ? JSON.parse(servicos) : servicos;
    const gradeArray = typeof grade === 'string' ? JSON.parse(grade) : grade;

    if (!nome || !servicosArray || !Array.isArray(servicosArray) || !gradeArray || !Array.isArray(gradeArray)) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    const stmt = db.prepare('INSERT INTO profissionais (nome, servicos, grade) VALUES (?, ?, ?)');
    stmt.run(nome, JSON.stringify(servicosArray), JSON.stringify(gradeArray), function(err) {
      if (err) {
        res.status(500).json({ erro: 'Erro ao cadastrar profissional' });
        console.error(err.message);
        return;
      }
      res.json({ mensagem: `Profissional ${nome} cadastrado com sucesso!`, id: this.lastID });
    });
    stmt.finalize();
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao processar dados JSON' });
    console.error('Erro ao parsear JSON:', error.message);
  }
});

// Rota para atualizar profissional
app.put('/profissionais/:id', (req, res) => {
  const { id } = req.params;
  const { nome, servicos, grade } = req.body;
  console.log('Dados recebidos no PUT:', req.body);

  try {
    const servicosArray = typeof servicos === 'string' ? JSON.parse(servicos) : servicos;
    const gradeArray = typeof grade === 'string' ? JSON.parse(grade) : grade;

    if (!nome || !servicosArray || !Array.isArray(servicosArray) || !gradeArray || !Array.isArray(gradeArray)) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    const stmt = db.prepare('UPDATE profissionais SET nome = ?, servicos = ?, grade = ? WHERE id = ?');
    stmt.run(nome, JSON.stringify(servicosArray), JSON.stringify(gradeArray), id, (err) => {
      if (err) {
        res.status(500).json({ erro: 'Erro ao atualizar profissional' });
        console.error(err.message);
        return;
      }
      const mensagem = { mensagem: `Profissional ${nome} atualizado com sucesso!` };
      console.log('Resposta enviada ao front-end:', mensagem); // Adicione este log
      res.json(mensagem);
    });
    stmt.finalize();
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao processar dados JSON' });
    console.error('Erro ao parsear JSON:', error.message);
  }
});

// Rota para excluir profissional
app.delete('/profissionais/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM profissionais WHERE id = ?', id, (err) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao excluir profissional' });
      console.error(err.message);
      return;
    }
    res.json({ mensagem: 'Profissional excluído com sucesso!' });
  });
});

// Rota para cadastrar agendamento
app.post('/agendamentos', (req, res) => {
  const { cliente, profissionalId, servico, data, horario } = req.body;
  console.log('Dados recebidos no POST /agendamentos:', req.body);

  if (!cliente || !profissionalId || !servico || !data || !horario) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  const stmt = db.prepare('INSERT INTO agendamentos (cliente, profissionalId, servico, data, horario) VALUES (?, ?, ?, ?, ?)');
  stmt.run(cliente, profissionalId, servico, data, horario, function(err) {
    if (err) {
      res.status(500).json({ erro: 'Erro ao cadastrar agendamento' });
      console.error(err.message);
      return;
    }
    res.json({ mensagem: `Agendamento para ${cliente} cadastrado com sucesso!`, id: this.lastID });
  });
  stmt.finalize();
});

// Rota para listar agendamentos
app.get('/agendamentos', (req, res) => {
  db.all('SELECT * FROM agendamentos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao listar agendamentos' });
      console.error(err.message);
      return;
    }
    res.json(rows);
  });
});

// Rota para excluir agendamento
app.delete('/agendamentos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM agendamentos WHERE id = ?', id, (err) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao excluir agendamento' });
      console.error(err.message);
      return;
    }
    res.json({ mensagem: 'Agendamento excluído com sucesso!' });
  });
});

//Rota para buscar profissional por ID
app.get('/profissional-servicos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT servicos FROM profissionais WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao buscar serviços' });
      console.error(err.message);
      return;
    }
    if (!row) {
      res.status(404).json({ erro: 'Profissional não encontrado' });
      return;
    }
    try {
      const servicos = typeof row.servicos === 'string' ? JSON.parse(row.servicos) : row.servicos;
      res.json(servicos);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao parsear serviços' });
      console.error('Erro ao parsear JSON:', error.message);
    }
  });
});

//rota horario disponiveis
app.get('/horarios-disponiveis', (req, res) => {
  const { data, 'profissional-id': profissionalId } = req.query;
  if (!data || !profissionalId) {
    return res.status(400).json({ erro: 'Parâmetros inválidos' });
  }

  db.get('SELECT grade FROM profissionais WHERE id = ?', [profissionalId], (err, row) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao buscar grade' });
      console.error(err.message);
      return;
    }
    if (!row) {
      res.status(404).json({ erro: 'Profissional não encontrado' });
      return;
    }

    try {
      const grade = typeof row.grade === 'string' ? JSON.parse(row.grade) : row.grade;
      const diaSelecionado = new Date(data).toLocaleString('pt-BR', { weekday: 'long' }).toLowerCase();
      const gradeDia = grade.find(g => g.dia_semana === diaSelecionado);

      if (!gradeDia) {
        return res.json([]);
      }

      const inicio = parseInt(gradeDia.horario_inicio.split(':')[0]);
      const fim = parseInt(gradeDia.horario_fim.split(':')[0]);
      const horarios = [];
      for (let hora = inicio; hora < fim; hora++) {
        horarios.push(`${hora.toString().padStart(2, '0')}:00`);
      }
      res.json(horarios);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao parsear grade' });
      console.error('Erro ao parsear JSON:', error.message);
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});