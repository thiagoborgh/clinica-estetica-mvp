import { useState, useEffect } from 'react';
import axios from 'axios';
import AgendamentoForm from '../components/AgendamentoForm.jsx';

function Home() {
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    // Carregar profissionais
    axios.get('http://localhost:3000/profissionais')
      .then(response => setProfissionais(response.data))
      .catch(error => console.error('Erro ao carregar profissionais:', error));
  }, []);

  const handleProfissionalChange = async (profissionalId) => {
    if (profissionalId) {
      try {
        const response = await axios.get(`http://localhost:3000/profissional-servicos/${profissionalId}`);
        setServicos(response.data);
        setHorarios([]);
      } catch (error) {
        console.error('Erro ao carregar serviços:', error);
      }
    } else {
      setServicos([]);
      setHorarios([]);
    }
  };

  const handleDataChange = async (data, profissionalId) => {
    if (data && profissionalId) {
      try {
        const response = await axios.get(
          `http://localhost:3000/horarios-disponiveis?data=${data}&profissional_id=${profissionalId}`
        );
        setHorarios(response.data);
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
      }
    } else {
      setHorarios([]);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post('http://localhost:3000/agendamentos', formData);
      setMensagem(response.data.mensagem || response.data.erro);
    } catch (error) {
      setMensagem('Erro ao enviar agendamento.');
      console.error(error);
    }
  };

  return (
    <main className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <AgendamentoForm
        profissionais={profissionais}
        servicos={servicos}
        horarios={horarios}
        onProfissionalChange={handleProfissionalChange}
        onDataChange={handleDataChange}
        onSubmit={handleSubmit}
      />
      {mensagem && <p className="mt-4 text-center font-bold text-gray-800">{mensagem}</p>}
    </main>
  );
}

export default Home;