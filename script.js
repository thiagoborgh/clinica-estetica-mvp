document.getElementById('agendamento-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o formulário de recarregar a página

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const servico = document.getElementById('servico').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;

    try {
        const response = await fetch('http://localhost:3000/agendamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, telefone, servico, data, horario })
        });
        const result = await response.json();
        document.getElementById('mensagem').textContent = result.mensagem;
    } catch (error) {
        document.getElementById('mensagem').textContent = 'Erro ao enviar agendamento.';
        console.error(error);
    }
});