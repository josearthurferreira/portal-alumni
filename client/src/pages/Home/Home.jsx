import React, { useState } from 'react';
import Header from '../../components/Header/Header';
import SearchBar from '../../components/SearchBar/SearchBar';
import AlumniCard from '../../components/AlumniCard/AlumniCard';
import Modal from '../../components/Modal/Modal';
import Footer from '../../components/Footer/Footer';
import AddAlumniModal from '../../components/AddAlumniModal/AddAlumniModal'; // Modal de cadastro de ex-aluno
import { Search, Filter, Plus, RotateCcw } from 'lucide-react';

// Dados mockados
import alumniData from '../../data/alumni.json';

// Estilos
import styles from './Home.module.css';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {

  const [alumni, setAlumni] = useState(alumniData);

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null); // Controla o Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); //controla o Modal de adcionar um novo ex aluno

  // --- LÓGICA DE DADOS ---

  // Gera listas únicas para os selects da SearchBar automaticamente
  const cursosUnicos = [...new Set(alumniData.map((a) => a.curso))].sort();
  const anosUnicos = [...new Set(alumniData.map((a) => a.ano))].sort(
    (a, b) => b - a,
  );

  // Filtra a lista principal com base nos 3 critérios simultâneos
  const filteredAlumni = alumni.filter((alumnus) => {
    const matchesSearch = alumnus.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurso = selectedCurso === "" || alumnus.curso === selectedCurso;
    const matchesAno = selectedAno === "" || String(alumnus.ano) === String(selectedAno);
    return matchesSearch && matchesCurso && matchesAno;
  });

  // --- HANDLERS ---

  const handleOpenModal = (alumnus) => {
    setSelectedAlumni(alumnus);
  };

  const handleCloseModal = () => {
    setSelectedAlumni(null);
  };

  const handleAddProfile = () => {
    setIsAddModalOpen(true);
    // O Header chama esse handler via prop (onAddClick) quando o usuário clica em "Adicionar Perfil".
  };

  return (
    <div className={styles.wrapper}>
      <Header
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <main className={styles.container}>
        {/* 2. Barra de Busca e Filtros Dinâmicos */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          cursos={cursosUnicos}
          selectedCurso={selectedCurso}
          onCursoChange={setSelectedCurso}
          anos={anosUnicos}
          selectedAno={selectedAno}
          onAnoChange={setSelectedAno}
        />

        {/* 3. Contador de Resultados */}
        <p className={styles.resultsInfo}>
          Mostrando <strong>{filteredAlumni.length}</strong> de{' '}
          {alumniData.length} ex-alunos
        </p>

        {/* 4. Grid de Cards - APENAS UM BLOCO AQUI */}
        {filteredAlumni.length > 0 ? (
          <section className={styles.cardsGrid}>
            {filteredAlumni.map((alumnus) => (
              <AlumniCard
                key={alumnus.id}
                data={alumnus}
                onClick={() => handleOpenModal(alumnus)}
              />
            ))}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Search size={48} color="#cc4b00" />
            </div>
            <h2>Nenhum resultado encontrado</h2>
            <p>Não encontramos nenhum ex-aluno que corresponda aos filtros selecionados.</p>
            <button
              className={styles.clearBtn}
              onClick={() => {
                setSearchTerm('');
                setSelectedCurso('');
                setSelectedAno('');
              }}
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </main>

      {/* 5. Modal de Detalhes (só aparece se selectedAlumni não for null) */}
      {selectedAlumni && (
        <Modal data={selectedAlumni} onClose={handleCloseModal} />
      )}
      {/* 6. Modal de Cadastro de Ex-Aluno */}
      {isAddModalOpen && (
        <AddAlumniModal
          // Mantém a API do modal explícita:
          // - isOpen controla renderização interna do componente
          // - onClose fecha e volta o estado para false no Home
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* 7. Rodapé */}
      <Footer />
    </div>
  );
};

export default Home;
