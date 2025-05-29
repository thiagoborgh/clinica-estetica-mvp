import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function CadastroProfissional() {
  const [profissionais, setProfissionais] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    servicos: [],
    grade: [],
  });
  const [mensagem, setMensagem] = useState('');
  const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  const servicosDisponiveis = [
    'massagem',
    'limpeza',
    'manicure',
    'botox',
    'depilacao',
    'hidratacao',
    'peeling',
  ];

  // Carregar profissionais e converter servicos de string para array
  useEffect(() => {
    axios
      .get('http://localhost:3000/profissionais')
      .then(response => {
        console.log('Dados recebidos da API:', response.data);
        const profissionaisFormatados = response.data.map(prof => ({
          ...prof,
          servicos: typeof prof.servicos === 'string' ? JSON.parse(prof.servicos) : prof.servicos,
          grade: typeof prof.grade === 'string' ? JSON.parse(prof.grade) : prof.grade,
        }));
        setProfissionais(profissionaisFormatados);
      })
      .catch(error => console.error('Erro ao carregar profissionais:', error));
  }, []);

  // Validação simples de horário (HH:MM)
  const isValidTime = (time) => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Manipular mudanças no formulário
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'servicos') {
      setFormData(prev => ({
        ...prev,
        servicos: checked
          ? [...prev.servicos, value]
          : prev.servicos.filter(s => s !== value),
      }));
    } else if (type === 'checkbox' && name === 'dias') {
      setFormData(prev => {
        const newGrade = checked
          ? [...prev.grade, { dia_semana: value, horario_inicio: '', horario_fim: '' }]
          : prev.grade.filter(g => g.dia_semana !== value);
        console.log('Grade atualizada (checkbox):', newGrade);
        return { ...prev, grade: newGrade };
      });
    } else if (name.includes('-horario_inicio') || name.includes('-horario_fim')) {
      const [dia, campo] = name.split('-');
      console.log('Alterando horário - antes:', { dia, campo, value, currentGrade: formData.grade });
      setFormData(prev => {
        const newGrade = prev.grade.map(g => {
          if (g.dia_semana === dia) {
            return { ...g, [campo]: value };
          }
          return { ...g };
        });
        if (!prev.grade.some(g => g.dia_semana === dia)) {
          newGrade.push({ dia_semana: dia, horario_inicio: '', horario_fim: '' });
        }
        console.log('Grade atualizada (horário) - depois:', newGrade);
        return { ...prev, grade: [...newGrade] };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, [formData]);

  // Manipular envio do formulário
  const handleSubmit = async e => {
    e.preventDefault();
    const { id, nome, servicos, grade } = formData;

    // Validação básica
    if (!nome || servicos.length === 0 || grade.length === 0) {
      setMensagem('Preencha nome, pelo menos um serviço e uma grade de horário.');
      return;
    }

    // Validação da grade
    const gradeValida = grade.every(g => {
      const inicio = g.horario_inicio || '';
      const fim = g.horario_fim || '';
      const isValid = (inicio === '' || isValidTime(inicio)) && (fim === '' || isValidTime(fim));
      if (!isValid) {
        console.log('Horário inválido:', { inicio, fim });
      }
      if (inicio && fim && inicio >= fim) {
        console.log('Horário de início deve ser anterior ao fim:', { inicio, fim });
        return false;
      }
      return isValid;
    });

    if (!gradeValida) {
      setMensagem('Preencha horários válidos (início antes do fim, formato HH:MM).');
      return;
    }

    try {
      console.log('Enviando dados:', { nome, servicos, grade });
      const payload = {
        nome,
        servicos: JSON.stringify(servicos),
        grade: JSON.stringify(grade),
      };
      console.log('Payload enviado:', payload);
      let response;
      if (id) {
        response = await axios.put(`http://localhost:3000/profissionais/${id}`, payload);
      } else {
        response = await axios.post('http://localhost:3000/profissionais', payload);
      }
      setMensagem(response.data.mensagem || response.data.erro);
      setFormData({ id: null, nome: '', servicos: [], grade: [] });
      const updatedResponse = await axios.get('http://localhost:3000/profissionais');
      const profissionaisFormatados = updatedResponse.data.map(prof => ({
        ...prof,
        servicos: typeof prof.servicos === 'string' ? JSON.parse(prof.servicos) : prof.servicos,
        grade: typeof prof.grade === 'string' ? JSON.parse(prof.grade) : prof.grade,
      }));
      setProfissionais(profissionaisFormatados);
    } catch (error) {
      const errorMsg = error.response?.data?.erro || 'Erro ao salvar profissional.';
      setMensagem(errorMsg);
      console.error('Erro ao salvar:', error);
      console.log('Resposta do erro:', error.response?.data);
    }
  };

  // Editar profissional
  const handleEdit = useCallback((profissional) => {
    setFormData({
      id: profissional.id,
      nome: profissional.nome,
      servicos: Array.isArray(profissional.servicos) ? profissional.servicos : JSON.parse(profissional.servicos || '[]'),
      grade: Array.isArray(profissional.grade) ? profissional.grade : JSON.parse(profissional.grade || '[]'),
    });
    setMensagem('');
    console.log('Editando profissional:', profissional);
  }, []);

  // Excluir profissional
  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Deseja excluir este profissional?')) {
      try {
        const response = await axios.delete(`http://localhost:3000/profissionais/${id}`);
        setMensagem(response.data.mensagem || response.data.erro);
        const updated = await axios.get('http://localhost:3000/profissionais');
        const profissionaisFormatados = updated.data.map(prof => ({
          ...prof,
          servicos: typeof prof.servicos === 'string' ? JSON.parse(prof.servicos) : prof.servicos,
          grade: typeof prof.grade === 'string' ? JSON.parse(prof.grade) : prof.grade,
        }));
        setProfissionais(profissionaisFormatados);
      } catch (error) {
        setMensagem(error.response?.data?.erro || 'Erro ao excluir profissional.');
        console.error('Erro ao excluir:', error);
      }
    }
  }, []);

  return (
    <main className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Cadastrar Profissional</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block font-bold text-gray-700">
            Nome:
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700">Serviços:</label>
          <div className="grid grid-cols-2 gap-2">
            {servicosDisponiveis.map(servico => (
              <label key={servico} className="flex items-center">
                <input
                  type="checkbox"
                  name="servicos"
                  value={servico}
                  checked={formData.servicos.includes(servico)}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">{servico}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-bold text-gray-700">Grade de Horário:</label>
          <div className="space-y-3 mt-2">
            {diasSemana.map(dia => {
              let diaGrade = formData.grade.find(g => g.dia_semana === dia);
              if (!diaGrade && formData.grade.some(g => g.dia_semana === dia)) {
                diaGrade = { dia_semana: dia, horario_inicio: '', horario_fim: '' };
              }
              console.log(`Renderizando ${dia} - horário início: ${diaGrade?.horario_inicio || ''}, fim: ${diaGrade?.horario_fim || ''}`);
              return (
                <div key={dia} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-md">
                  <label className="flex items-center w-28">
                    <input
                      type="checkbox"
                      name="dias"
                      value={dia}
                      checked={formData.grade.some(g => g.dia_semana === dia)}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-600">
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </span>
                  </label>
                  {formData.grade.some(g => g.dia_semana === dia) && diaGrade && (
                    <div className="flex space-x-2 items-center">
                      <div className="relative">
                        <input
                          type="time"
                          name={`${dia}-horario_inicio`}
                          value={diaGrade.horario_inicio || ''}
                          onChange={handleChange}
                          required
                          className="p-2 border rounded-md w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      </div>
                      <span className="self-center text-gray-500">até</span>
                      <div className="relative">
                        <input
                          type="time"
                          name={`${dia}-horario_fim`}
                          value={diaGrade.horario_fim || ''}
                          onChange={handleChange}
                          required
                          className="p-2 border rounded-md w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {formData.id ? 'Salvar Alterações' : 'Cadastrar'}
        </button>
      </form>
      {mensagem && (
        <p className={`mt-4 text-center font-bold ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
          {mensagem}
        </p>
      )}

      <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-700">Profissionais Cadastrados</h2>
      <ul className="space-y-2">
        {profissionais.map(prof => (
          <li
            key={prof.id}
            className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-md"
          >
            <div>
              <strong className="text-gray-800">{prof.nome}</strong> - Serviços: {Array.isArray(prof.servicos) ? prof.servicos.join(', ') : 'Nenhum serviço'} - Grade:{' '}
              {Array.isArray(prof.grade)
                ? prof.grade.map(g => `${g.dia_semana}: ${g.horario_inicio}-${g.horario_fim}`).join('; ')
                : 'Nenhuma grade'}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(prof)}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(prof.id)}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default CadastroProfissional;