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

const PAGE_SIZE = 9;

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // filtros / busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedAno, setSelectedAno] = useState('');

  // UI
  const [page, setPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  //Paginacao
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  // -------------------------
  // DATA
  // -------------------------
  async function fetchAlumni(filters = {}) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await getAlumni(filters);
      setAlumni(response.data);

      if (Object.keys(filters).length === 0) {
        setFilterOptions(response.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao carregar dados.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const query = {};
    if (selectedCurso) query.course = selectedCurso;
    if (selectedAno) query.graduationYear = selectedAno;
    fetchAlumni(query);
  }, [selectedCurso, selectedAno]);

  // verifica se usuário já tem perfil
  useEffect(() => {
    if (!isLoggedIn) {
      setHasProfile(false);
      return;
    }

    getMyProfile()
      .then(() => setHasProfile(true))
      .catch((err) => {
        if (err?.response?.status === 404) setHasProfile(false);
      });
  }, [isLoggedIn]);

  // -------------------------
  // FILTROS
  // -------------------------
  const cursosUnicos = useMemo(() => {
    return [
      ...new Set(filterOptions.map((a) => a.course).filter(Boolean)),
    ].sort();
  }, [filterOptions]);

  const anosUnicos = useMemo(() => {
    return [
      ...new Set(filterOptions.map((a) => a.graduationYear).filter(Boolean)),
    ].sort((a, b) => b - a);
  }, [filterOptions]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter((alumnus) =>
      (alumnus.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [alumni, searchTerm]);
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCurso, selectedAno]);
  const totalPages = Math.max(1, Math.ceil(filteredAlumni.length / PAGE_SIZE));

  const pagedAlumni = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAlumni.slice(start, start + PAGE_SIZE);
  }, [filteredAlumni, page]);

  // reset de página ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCurso, selectedAno]);

  // -------------------------
  // PAGINAÇÃO
  // -------------------------
  const totalPages = Math.max(1, Math.ceil(filteredAlumni.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageAlumni = filteredAlumni.slice(start, start + PAGE_SIZE);

  // -------------------------
  // RENDER
  // -------------------------
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

        {!loading && (
          <p className={styles.resultsInfo}>
            {!loading && (
              <>
                Mostrando <strong>{pageAlumni.length}</strong> de{' '}
                {filteredAlumni.length} ex-alunos
              </>
            )}
          </p>
        )}

        {loading ? (
          <section>
            <div className={styles.loadingGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div key={n} className={styles.skeletonCard}></div>
              ))}
            </div>
            <p className={styles.loadingText}>
              Buscando ex-alunos na base de dados...
            </p>
          </section>
        ) : filteredAlumni.length > 0 ? (
          <>
            <section className={styles.cardsGrid}>
              {pageAlumni.map((alumnus) => (
                <AlumniCard
                  key={alumnus.id}
                  data={alumnus}
                  onClick={() => setSelectedAlumni(alumnus)}
                />
              ))}
            </section>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>

                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
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
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>

          <span className={styles.pageInfo}>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>

          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </button>
        </div>
      </main>

      {selectedAlumni && (
        <Modal data={selectedAlumni} onClose={() => setSelectedAlumni(null)} />
      )}

      {isAddModalOpen && (
        <AddAlumniModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (payload) => {
            await upsertMyProfile(payload);
            setHasProfile(true);
            setIsAddModalOpen(false);
            await fetchAlumni();
          }}
        />
      )}
      <div className={styles.footerDivider}></div>
      <Footer />
    </div>
  );
};

export default Home;
