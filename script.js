document.getElementById('agendamento-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o formulário de recarregar a página

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const servico = document.getElementById('servico').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;

    const mensagem = `Agendamento confirmado! ${nome}, seu ${servico} está marcado para ${data} às ${horario}. Contato: ${telefone}.`;
    document.getElementById('mensagem').textContent = mensagem;
});