document.addEventListener('DOMContentLoaded', async () => {
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

        try {
            const response = await fetch(`http://localhost:3000/agendamentos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, telefone, servico, data, horario })
            });
            const result = await response.json();
            document.getElementById('mensagem-remarcar').textContent = result.mensagem || result.erro;
            document.getElementById('remarcar-form').style.display = 'none';
            await carregarAgendamentos();
        } catch (error) {
            document.getElementById('mensagem-remarcar').textContent = 'Erro ao remarcar agendamento.';
        }
    });
});

async function carregarAgendamentos() {
    try {
        const response = await fetch('http://localhost:3000/agendamentos');
        const agendamentos = await response.json();
        const lista = document.getElementById('lista-agendamentos');
        lista.innerHTML = '';

        agendamentos.forEach(agendamento => {
            const li = document.createElement('li');
            li.textContent = `${agendamento.nome} - ${agendamento.servico} em ${agendamento.data} às ${agendamento.horario} (Telefone: ${agendamento.telefone})`;

            // Botão Remarcar
            const btnRemarcar = document.createElement('button');
            btnRemarcar.textContent = 'Remarcar';
            btnRemarcar.style.marginLeft = '10px';
            btnRemarcar.onclick = () => {
                document.getElementById('remarcar-id').value = agendamento.id;
                document.getElementById('remarcar-nome').value = agendamento.nome;
                document.getElementById('remarcar-telefone').value = agendamento.telefone;
                document.getElementById('remarcar-servico').value = agendamento.servico;
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
                        const response = await fetch(`http://localhost:3000/agendamentos/${agendamento.id}`, {
                            method: 'DELETE'
                        });
                        const result = await response.json();
                        alert(result.mensagem || result.erro);
                        await carregarAgendamentos();
                    } catch (error) {
                        alert('Erro ao cancelar agendamento.');
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