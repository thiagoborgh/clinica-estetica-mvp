document.addEventListener('DOMContentLoaded', async () => {
    const profissionalSelect = document.getElementById('remarcar-profissional');
    const servicoSelect = document.getElementById('remarcar-servico');
    const dataInput = document.getElementById('remarcar-data');
    const horarioSelect = document.getElementById('remarcar-horario');
    const filtroProfissional = document.getElementById('filtro-profissional');

    // Carregar profissionais
    try {
        const response = await fetch('http://localhost:3000/profissionais');
        const profissionais = await response.json();
        profissionais.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = prof.nome;
            profissionalSelect.appendChild(option);
            filtroProfissional.appendChild(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
    }

    // Atualizar serviços quando profissional mudar (remarcação)
    profissionalSelect.addEventListener('change', async () => {
        const profissional_id = profissionalSelect.value;
        servicoSelect.innerHTML = '<option value="">Selecione um serviço</option>';
        horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';

        if (profissional_id) {
            try {
                const response = await fetch(`http://localhost:3000/profissional-servicos/${profissional_id}`);
                const servicos = await response.json();
                servicos.forEach(servico => {
                    const option = document.createElement('option');
                    option.value = servico;
                    option.textContent = servico;
                    servicoSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Erro ao carregar serviços:', error);
            }
        }
    });

    // Atualizar horários quando data ou profissional mudar (remarcação)
    async function atualizarHorariosRemarcar() {
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

    dataInput.addEventListener('change', atualizarHorariosRemarcar);
    profissionalSelect.addEventListener('change', atualizarHorariosRemarcar);

    // Filtrar agendamentos
    filtroProfissional.addEventListener('change', async () => {
        await carregarAgendamentos();
    });

    await carregarAgendamentos();

    // Configurar formulário de remarcação
    document.getElementById('remarcar-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('remarcar-id').value;
        const nome = document.getElementById('remarcar-nome').value;
        const telefone = document.getElementById('remarcar-telefone').value;
        const servico = document.getElementById('remarcar-servico').value;
        const data = document.getElementById('remarcar-data').value;
        const horario = document.getElementById('remarcar-horario').value;
        const profissional_id = document.getElementById('remarcar-profissional').value;

        try {
            const response = await fetch(`http://localhost:3000/agendamentos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, telefone, servico, data, horario, profissional_id })
            });
            const result = await response.json();
            document.getElementById('mensagem-remarcar').textContent = result.mensagem || result.erro;
            document.getElementById('remarcar-form').style.display = 'none';
            await carregarAgendamentos();
        } catch (error) {
            document.getElementById('mensagem-remarcar').textContent = 'Erro ao remarcar agendamento.';
            console.error('Erro ao remarcar:', error);
        }
    });
});

async function carregarAgendamentos() {
    try {
        const profissional_id = document.getElementById('filtro-profissional').value;
        const url = profissional_id
            ? `http://localhost:3000/agendamentos?profissional_id=${profissional_id}`
            : 'http://localhost:3000/agendamentos';
        const response = await fetch(url);
        const agendamentos = await response.json();
        const lista = document.getElementById('lista-agendamentos');
        lista.innerHTML = '';

        agendamentos.forEach(agendamento => {
            const li = document.createElement('li');
            li.textContent = `${agendamento.nome} - ${agendamento.servico} com ${agendamento.profissional_nome} em ${agendamento.data} às ${agendamento.horario} (Telefone: ${agendamento.telefone})`;

            // Botão Remarcar
            const btnRemarcar = document.createElement('button');
            btnRemarcar.textContent = 'Remarcar';
            btnRemarcar.style.marginLeft = '10px';
            btnRemarcar.onclick = () => {
                document.getElementById('remarcar-id').value = agendamento.id;
                document.getElementById('remarcar-nome').value = agendamento.nome;
                document.getElementById('remarcar-telefone').value = agendamento.telefone;
                document.getElementById('remarcar-servico').value = agendamento.servico;
                document.getElementById('remarcar-profissional').value = agendamento.profissional_id;
                document.getElementById('remarcar-data').value = agendamento.data;
                document.getElementById('remarcar-horario').value = agendamento.horario;
                document.getElementById('remarcar-form').style.display = 'block';
            };
            li.appendChild(btnRemarcar);

            // Botão Cancelar
            const btnCancelar = document.createElement('button');
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.style.marginLeft = '10px';
            btnCancelar.onclick = async () => {
                if (confirm('Deseja cancelar este agendamento?')) {
                    try {
                        console.log('Cancelando agendamento ID:', agendamento.id); // Log para depuração
                        const response = await fetch(`http://localhost:3000/agendamentos/${agendamento.id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        console.log('Status da resposta:', response.status); // Log do status
                        if (!response.ok) {
                            throw new Error(`Erro HTTP: ${response.status}`);
                        }
                        const result = await response.json();
                        console.log('Resposta do servidor:', result); // Log da resposta
                        alert(result.mensagem || result.erro || 'Agendamento cancelado com sucesso!');
                        await carregarAgendamentos();
                    } catch (error) {
                        console.error('Erro ao cancelar agendamento:', error); // Log detalhado
                        alert(`Erro ao cancelar agendamento: ${error.message}`);
                    }
                }
            };
            li.appendChild(btnCancelar);

            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
}