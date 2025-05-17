document.addEventListener('DOMContentLoaded', async () => {
    // Carregar profissionais cadastrados
    await carregarProfissionais();

    // Configurar formulário
    document.getElementById('profissional-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const servicos = Array.from(document.querySelectorAll('input[name="servicos"]:checked')).map(input => input.value);
        const grade = [];
        document.querySelectorAll('input[name="dias"]:checked').forEach(dia => {
            const diaValue = dia.value;
            const inicio = document.querySelector(`input[name="${diaValue}-inicio"]`).value;
            const fim = document.querySelector(`input[name="${diaValue}-fim"]`).value;
            if (inicio && fim) {
                grade.push({ dia_semana: diaValue, horario_inicio: inicio, horario_fim: fim });
            }
        });

        if (!nome || servicos.length === 0 || grade.length === 0) {
            document.getElementById('mensagem').textContent = 'Preencha nome, pelo menos um serviço e uma grade de horário.';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/profissionais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, servicos, grade })
            });
            const result = await response.json();
            document.getElementById('mensagem').textContent = result.mensagem || result.erro;
            document.getElementById('profissional-form').reset();
            await carregarProfissionais();
        } catch (error) {
            document.getElementById('mensagem').textContent = 'Erro ao cadastrar profissional.';
            console.error(error);
        }
    });
});

async function carregarProfissionais() {
    try {
        const response = await fetch('http://localhost:3000/profissionais');
        const profissionais = await response.json();
        const lista = document.getElementById('lista-profissionais');
        lista.innerHTML = '';

        profissionais.forEach(prof => {
            const li = document.createElement('li');
            li.textContent = `${prof.nome} - Serviços: ${prof.servicos.join(', ')}`;
            const gradeText = prof.grade.map(g => `${g.dia_semana}: ${g.horario_inicio}-${g.horario_fim}`).join('; ');
            li.textContent += ` - Grade: ${gradeText}`;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
    }
}