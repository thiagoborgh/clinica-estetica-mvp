import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="text-center mb-8">
      <img
        src="https://via.placeholder.com/150x50?text=Logo"
        alt="Logo da Clínica"
        className="mx-auto mb-4"
      />
      <h1 className="text-3xl font-bold text-gray-800">Clínica de Estética</h1>
      <p className="text-gray-600">Agende seu horário agora!</p>
      <nav className="mt-4">
        <Link to="/" className="text-green-600 hover:underline mx-2">
          Agendamento
        </Link>
        <Link to="/profissionais" className="text-green-600 hover:underline mx-2">
          Cadastrar Profissional
        </Link>
        <Link to="/agendamentos" className="text-green-600 hover:underline mx-2">
          Lista de Agendamentos
        </Link>
      </nav>
    </header>
  );
}

export default Header;