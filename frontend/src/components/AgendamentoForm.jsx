import React, { useState } from 'react';

function AgendamentoForm({
  profissionais,
  servicos,
  horarios,
  onProfissionalChange,
  onDataChange,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    profissional: '',
    servico: '',
    data: '',
    horario: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'profissional') {
      onProfissionalChange(value);
    }
    if (name === 'data' || name === 'profissional') {
      onDataChange(formData.data || value, formData.profissional || value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nome: formData.nome,
      telefone: formData.telefone,
      servico: formData.servico,
      data: formData.data,
      horario: formData.horario,
      profissional_id: formData.profissional,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="block font-bold">Nome:</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="telefone" className="block font-bold">Telefone:</label>
        <input
          type="tel"
          id="telefone"
          name="telefone"
          pattern="[0-9]{10,11}"
          placeholder="Ex.: 11987654321"
          value={formData.telefone}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="profissional" className="block font-bold">Profissional:</label>
        <select
          id="profissional"
          name="profissional"
          value={formData.profissional}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione um profissional</option>
          {profissionais.map(prof => (
            <option key={prof.id} value={prof.id}>{prof.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="servico" className="block font-bold">Serviço:</label>
        <select
          id="servico"
          name="servico"
          value={formData.servico}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione um serviço</option>
          {servicos.map(servico => (
            <option key={servico} value={servico}>{servico}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="data" className="block font-bold">Data:</label>
        <input
          type="date"
          id="data"
          name="data"
          value={formData.data}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="horario" className="block font-bold">Horário:</label>
        <select
          id="horario"
          name="horario"
          value={formData.horario}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione um horário</option>
          {horarios.map(horario => (
            <option key={horario} value={horario}>{horario}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
      >
        Agendar
      </button>
    </form>
  );
}

export default AgendamentoForm;