import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Agendamento() {
  const [profissionais, setProfissionais] = useState([]);
  const [formData, setFormData] = useState({
    cliente: '',
    profissionalId: '',
    servico: '',
    data: '',
    horario: '',
  });
  const [mensagem, setMensagem] = useState('');
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const navigate = useNavigate();

  // Carregar profissionais
  useEffect(() => {
    axios
      .get('http://localhost:3000/profissionais')
      .then(response => {
        console.log('Dados recebidos de /profissionais:', response.data);
        const profissionaisFormatados = response.data.map(prof => ({
          ...prof,
          servicos: typeof prof.servicos === 'string' ? JSON.parse(prof.servicos) : prof.servicos,
          grade: typeof prof.grade === 'string' ? JSON.parse(prof.grade) : prof.grade,
        }));
        console.log('Profissionais formatados:', profissionaisFormatados);
        setProfissionais(profissionaisFormatados);
      })
      .catch(error => {
        console.error('Erro ao carregar profissionais:', error);
        console.log('Detalhes do erro:', error.response);
        setMensagem('Erro ao carregar profissionais.');
      });
  }, []);

  // Atualizar datas disponíveis quando o profissional mudar
  useEffect(() => {
    if (formData.profissionalId) {
      const profissional = profissionais.find(p => p.id === parseInt(formData.profissionalId));
      if (profissional && profissional.grade) {
        const datas = getDatasDisponiveis(profissional.grade);
        setDatasDisponiveis(datas);
        // Resetar data se não estiver mais disponível
        if (!datas.includes(formData.data)) {
          setFormData(prev => ({ ...prev, data: '' }));
        }
      } else {
        setDatasDisponiveis([]);
      }
    } else {
      setDatasDisponiveis([]);
    }
  }, [formData.profissionalId, profissionais]);

  // Manipular mudanças no formulário
  const handleChange = e => {
    const { name, value } = e.target;
    console.log(`Mudança em ${name}: ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Obter horários disponíveis com base na data e grade do profissional
  const getHorariosDisponiveis = () => {
    if (!formData.profissionalId || !formData.data) return [];

    const profissional = profissionais.find(p => p.id === parseInt(formData.profissionalId));
    if (!profissional || !profissional.grade) return [];

    const diaSelecionado = new Date(formData.data).toLocaleString('pt-BR', { weekday: 'long' }).toLowerCase();
    const gradeDia = profissional.grade.find(g => g.dia_semana === diaSelecionado);

    if (!gradeDia) return [];

    const inicio = parseInt(gradeDia.horario_inicio.split(':')[0]);
    const fim = parseInt(gradeDia.horario_fim.split(':')[0]);
    const horarios = [];
    for (let hora = inicio; hora < fim; hora++) {
      horarios.push(`${hora.toString().padStart(2, '0')}:00`);
    }
    return horarios;
  };

  // Obter datas disponíveis com base na grade do profissional
  const getDatasDisponiveis = (grade) => {
    const datas = [];
    const hoje = new Date(); // Hoje é 11:18 AM -03 de quinta-feira, 29 de maio de 2025
    hoje.setHours(0, 0, 0, 0); // Resetar horas para comparação

    // Gerar as próximas 30 dias
    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);

      const diaSemana = data.toLocaleString('pt-BR', { weekday: 'long' }).toLowerCase();
      if (grade.some(g => g.dia_semana === diaSemana)) {
        // Formatar a data como YYYY-MM-DD para o <select>
        const dataFormatada = data.toISOString().split('T')[0];
        datas.push(dataFormatada);
      }
    }
    return datas;
  };

  // Manipular envio do formulário
  const handleSubmit = async e => {
    e.preventDefault();
    const { cliente, profissionalId, servico, data, horario } = formData;

    // Validação básica
    if (!cliente || !profissionalId || !servico || !data || !horario) {
      setMensagem('Preencha todos os campos.');
      return;
    }

    try {
      // Salvar o agendamento no backend
      const response = await axios.post('http://localhost:3000/agendamentos', {
        cliente,
        profissionalId,
        servico,
        data,
        horario,
      });

      setMensagem('Agendamento realizado com sucesso!');
      setFormData({ cliente: '', profissionalId: '', servico: '', data: '', horario: '' });

      // Redirecionar para a lista de agendamentos
      setTimeout(() => navigate('/lista-agendamentos'), 2000);
    } catch (error) {
      setMensagem(error.response?.data?.erro || 'Erro ao realizar agendamento.');
      console.error('Erro:', error);
    }
  };

  return (
    <main className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Agendar Serviço</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cliente" className="block font-bold text-gray-700">
            Nome do Cliente:
          </label>
          <input
            type="text"
            id="cliente"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="profissionalId" className="block font-bold text-gray-700">
            Profissional:
          </label>
          <select
            id="profissionalId"
            name="profissionalId"
            value={formData.profissionalId}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um profissional</option>
            {profissionais.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="servico" className="block font-bold text-gray-700">
            Serviço:
          </label>
          <select
            id="servico"
            name="servico"
            value={formData.servico}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um serviço</option>
            {formData.profissionalId &&
              profissionais
                .find(p => p.id === parseInt(formData.profissionalId))
                ?.servicos?.map(servico => (
                  <option key={servico} value={servico}>
                    {servico}
                  </option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor="data" className="block font-bold text-gray-700">
            Data:
          </label>
          <select
            id="data"
            name="data"
            value={formData.data}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma data</option>
            {datasDisponiveis.map(data => (
              <option key={data} value={data}>
                {new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="horario" className="block font-bold text-gray-700">
            Horário:
          </label>
          <select
            id="horario"
            name="horario"
            value={formData.horario}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um horário</option>
            {getHorariosDisponiveis().map(horario => (
              <option key={horario} value={horario}>
                {horario}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Agendar
        </button>
      </form>
      {mensagem && (
        <p className={`mt-4 text-center font-bold ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
          {mensagem}
        </p>
      )}
    </main>
  );
}

export default Agendamento;