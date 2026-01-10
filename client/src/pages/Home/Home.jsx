import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header/Header';
import SearchBar from '../../components/SearchBar/SearchBar';
import AlumniCard from '../../components/AlumniCard/AlumniCard';
import Modal from '../../components/Modal/Modal';
import Footer from '../../components/Footer/Footer';
import AddAlumniModal from '../../components/AddAlumniModal/AddAlumniModal';
import { Search } from 'lucide-react';
import { getAlumni, upsertMyProfile, getMyProfile } from '../../services/api';

// Estilos
import styles from './Home.module.css';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  async function fetchAlumni() {
    setLoading(true);
    try {
      const response = await getAlumni();
      setAlumni(response.data);
    } catch (err) {
      console.error('Erro ao carregar alumni:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlumni();
  }, []);

  //Botao virar EDITAR

  useEffect(() => {
    if (!isLoggedIn) return setHasProfile(false);

    getMyProfile()
      .then(() => setHasProfile(true))
      .catch((err) => {
        if (err?.response?.status === 404) setHasProfile(false);
      });
  }, [isLoggedIn]);
  // --- LÓGICA DE DADOS ---

  const filteredAlumni = useMemo(() => {
    return alumni.filter((alumnus) => {
      const matchesSearch = (alumnus.fullName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCurso =
        selectedCurso === '' || alumnus.course === selectedCurso;

      const matchesAno =
        selectedAno === '' ||
        String(alumnus.graduationYear) === String(selectedAno);

      return matchesSearch && matchesCurso && matchesAno;
    });
  }, [alumni, searchTerm, selectedCurso, selectedAno]);

  const cursosUnicos = useMemo(() => {
    return [...new Set(alumni.map((a) => a.course).filter(Boolean))].sort();
  }, [alumni]);

  const anosUnicos = useMemo(() => {
    return [
      ...new Set(alumni.map((a) => a.graduationYear).filter(Boolean)),
    ].sort((a, b) => b - a);
  }, [alumni]);

  // --- HANDLERS ---
  const handleOpenModal = (alumnus) => setSelectedAlumni(alumnus);
  const handleCloseModal = () => setSelectedAlumni(null);

  if (loading) return <div>Carregando ex-alunos...</div>;

  return (
    <div className={styles.wrapper}>
      <Header
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        onAddClick={() => setIsAddModalOpen(true)}
        addLabel={hasProfile ? 'Editar Perfil' : 'Adicionar Perfil'}
      />

      <main className={styles.container}>
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

        <p className={styles.resultsInfo}>
          Mostrando <strong>{filteredAlumni.length}</strong> de {alumni.length}{' '}
          ex-alunos
        </p>

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
            <p>
              Não encontramos nenhum ex-aluno que corresponda aos filtros
              selecionados.
            </p>
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

      {/* Modal de Detalhes */}
      {selectedAlumni && (
        <Modal data={selectedAlumni} onClose={handleCloseModal} />
      )}

      {/* Modal de Cadastro/Perfil */}
      {isAddModalOpen && (
        <AddAlumniModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (payload) => {
            // 1) salva/atualiza o perfil do usuário logado
            await upsertMyProfile(payload);

            // 2) fecha o modal
            setIsAddModalOpen(false);

            // 3) recarrega a listagem pública (pra aparecer o card atualizado)
            await fetchAlumni();
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default Home;
