document.addEventListener('DOMContentLoaded', async () => {
    // Carregar profissionais
    try {
        const response = await fetch('http://localhost:3000/profissionais');
        const profissionais = await response.json();
        const selectProfissional = document.getElementById('profissional');
        profissionais.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = prof.nome;
            selectProfissional.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
    }

    // Atualizar horários quando data ou profissional mudar
    const dataInput = document.getElementById('data');
    const profissionalSelect = document.getElementById('profissional');
    const horarioSelect = document.getElementById('horario');

    async function atualizarHorarios() {
        const data = dataInput.value;
        const profissional_id = profissionalSelect.value;
        horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';

        if (data && profissional_id) {
            try {
                const response = await fetch(
                    `http://localhost:3000/horarios-disponiveis?data=${data}&profissional_id=${profissional_id}`
                );
                const horarios = await response.json();
                horarios.forEach(horario => {
                    const option = document.createElement('option');
                    option.value = horario;
                    option.textContent = horario;
                    horarioSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Erro ao carregar horários:', error);
            }
        }
    }

    dataInput.addEventListener('change', atualizarHorarios);
    profissionalSelect.addEventListener('change', atualizarHorarios);
});

document.getElementById('agendamento-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const servico = document.getElementById('servico').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const profissional_id = document.getElementById('profissional').value;

    try {
        const response = await fetch('http://localhost:3000/agendamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, telefone, servico, data, horario, profissional_id })
        });
        const result = await response.json();
        document.getElementById('mensagem').textContent = result.mensagem || result.erro;
    } catch (error) {
        document.getElementById('mensagem').textContent = 'Erro ao enviar agendamento.';
        console.error(error);
    }
});