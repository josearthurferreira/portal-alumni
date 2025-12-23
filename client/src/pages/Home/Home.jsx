import React, { useState } from 'react';
import Header from '../../components/Header/Header';
import SearchBar from '../../components/SearchBar/SearchBar';
import AlumniCard from '../../components/AlumniCard/AlumniCard';
import Modal from '../../components/Modal/Modal';
import Footer from '../../components/Footer/Footer';
import AddAlumniModal from '../../components/AddAlumniModal/AddAlumniModal'; // Modal de cadastro de ex-aluno

// Dados mockados
import alumniData from '../../data/alumni.json';

// Estilos
import styles from './Home.module.css';

const Home = ({ isLoggedIn }) => {
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
  const filteredAlumni = alumniData.filter((alumnus) => {
    const matchesName = alumnus.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCurso =
      selectedCurso === '' || alumnus.curso === selectedCurso;
    const matchesAno = selectedAno === '' || alumnus.ano === selectedAno;
    return matchesName && matchesCurso && matchesAno;
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
    // Abre o modal de cadastro.
    // O Header chama esse handler via prop (onAddClick) quando o usuário clica em "Adicionar Perfil".
  };

  return (
    <div className={styles.wrapper}>
      {/* 1. Cabeçalho com botão de ação */}
      <Header
        isLoggedIn={isLoggedIn}
        onAddClick={handleAddProfile}
        // Callback que o Header dispara ao clicar em "Adicionar Perfil".
        // Mantive esse controle no Home para centralizar o estado do modal.
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

        {/* 4. Grid de Cards */}
        <section className={styles.cardsGrid}>
          {filteredAlumni.length > 0 ? (
            filteredAlumni.map((alumnus) => (
              <AlumniCard
                key={alumnus.id}
                data={alumnus}
                onClick={handleOpenModal}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <Search size={48} />
              <p>Nenhum ex-aluno encontrado com esses filtros.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCurso('');
                  setSelectedAno('');
                }}
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </section>
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
