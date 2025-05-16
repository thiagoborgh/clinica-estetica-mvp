const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rota para receber agendamentos
app.post('/agendamentos', (req, res) => {
    const { nome, telefone, servico, data, horario } = req.body;
    console.log('Agendamento recebido:', { nome, telefone, servico, data, horario });
    res.json({ mensagem: `Agendamento confirmado para ${nome}!` });
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});