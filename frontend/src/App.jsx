import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Header from './components/Header.jsx';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendamentos" element={<ListaAgendamentos />} />
        <Route path="/profissionais" element={<CadastroProfissional />} />
      </Routes>
    </div>
  );
}

export default App;