import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header/Header';
import SearchBar from '../../components/SearchBar/SearchBar';
import AlumniCard from '../../components/AlumniCard/AlumniCard';
import Modal from '../../components/Modal/Modal';
import Footer from '../../components/Footer/Footer';
import AddAlumniModal from '../../components/AddAlumniModal/AddAlumniModal';
import { Search } from 'lucide-react';
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { getAlumni, upsertMyProfile, getMyProfile } from '../../services/api';

// Estilos
import styles from './Home.module.css';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  async function fetchAlumni(filters = {}) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await getAlumni(filters);
      setAlumni(response.data);

      // Se for a primeira carga (sem filtros), guardamos para as opções de curso/ano
      if (Object.keys(filters).length === 0) {
        setFilterOptions(response.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao carregar dados.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const query = {};
    if (selectedCurso) query.course = selectedCurso;
    if (selectedAno) query.graduationYear = selectedAno;
    // Se quiser busca por nome no backend, adicione aqui (veja nota abaixo)
    // if (searchTerm) query.fullName = searchTerm;

    fetchAlumni(query);
  }, [selectedCurso, selectedAno]);

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

  const cursosUnicos = useMemo(() => {
    return [...new Set(filterOptions.map((a) => a.course).filter(Boolean))].sort();
  }, [filterOptions]);

  const anosUnicos = useMemo(() => {
    return [...new Set(filterOptions.map((a) => a.graduationYear).filter(Boolean))]
      .sort((a, b) => b - a);
  }, [filterOptions]);

  // --- HANDLERS ---
  const handleOpenModal = (alumnus) => setSelectedAlumni(alumnus);
  const handleCloseModal = () => setSelectedAlumni(null);

  const filteredAlumni = useMemo(() => {
    return alumni.filter((alumnus) =>
      (alumnus.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alumni, searchTerm]);

  return (
    <div className={styles.wrapper}>
      <Header
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        onAddClick={() => setIsAddModalOpen(true)}
        addLabel={hasProfile ? 'Editar Perfil' : 'Adicionar Perfil'}
      />

      <main className={styles.container}>
        <ErrorBanner
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />

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
          {loading ? (
            ""
          ) : (
            <>Mostrando <strong>{filteredAlumni.length}</strong> de {alumni.length} ex-alunos</>
          )}
        </p>

        {loading ? (
          <section>
            <div className={styles.loadingGrid}>
              {/* Criamos 6 cards falsos enquanto carrega */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className={styles.skeletonCard}></div>
              ))}
            </div>
            <p className={styles.loadingText}>Buscando ex-alunos na base de dados...</p>
          </section>
        ) : filteredAlumni.length > 0 ? (
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
