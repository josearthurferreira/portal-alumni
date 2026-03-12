import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import SearchBar from '../../components/SearchBar/SearchBar';
import AlumniCard from '../../components/AlumniCard/AlumniCard';
import Modal from '../../components/Modal/Modal';
import Footer from '../../components/Footer/Footer';
import AddAlumniModal from '../../components/AddAlumniModal/AddAlumniModal';
import { Search } from 'lucide-react';
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { getAlumni, upsertMyProfile, getMyProfile, getFilters } from '../../services/api';

import styles from './Home.module.css';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filtros / Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Estados para as opções reais do banco
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  // UI e Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // 1. CARREGAR OPÇÕES DE FILTRO (Executa 1x ao montar)
  useEffect(() => {
    async function loadFilters() {
      try {
        const response = await getFilters();
        // O backend deve retornar: { courses: [], years: [], roles: [] }
        setAvailableCourses(response.data.courses || []);
        setAvailableYears(response.data.years || []);
        setAvailableRoles(response.data.roles || []);
      } catch (err) {
        console.error("Erro ao carregar filtros do banco:", err);
      }
    }
    loadFilters();
  }, []);

  // 2. BUSCAR ALUNOS (Sempre que página ou filtros mudarem)
  async function fetchAlumni(filters = {}, currentPage = 1) {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getAlumni({ ...filters, page: currentPage });
      const result = response.data;
      const dataArray = Array.isArray(result.data) ? result.data : [];

      setAlumni(dataArray);

      if (result.meta) {
        setTotalPages(result.meta.totalPages);
        setTotalItems(result.meta.total);
      }
    } catch (err) {
      setAlumni([]);
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
    if (selectedArea) query.role = selectedArea;
    if (searchTerm) query.fullName = searchTerm;

    fetchAlumni(query, page);
  }, [selectedCurso, selectedAno, selectedArea, searchTerm, page]);

  // Reset de página ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCurso, selectedAno, selectedArea]);

  // Verifica perfil do usuário logado
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

  return (
    <div className={styles.wrapper}>
      <Header
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        onAddClick={() => setIsAddModalOpen(true)}
        addLabel={hasProfile ? 'EDITAR PERFIL' : 'ADICIONAR PERFIL'}
      />

      <main className={styles.container}>
        <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          cursos={availableCourses}
          selectedCurso={selectedCurso}
          onCursoChange={setSelectedCurso}
          anos={availableYears}
          selectedAno={selectedAno}
          onAnoChange={setSelectedAno}
          areas={availableRoles}
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
        />

        {!loading && (
          <p className={styles.resultsInfo}>
            Mostrando página <strong>{page}</strong> de {totalPages} ({totalItems} ex-alunos no total)
          </p>
        )}

        {loading ? (
          <section className={styles.loadingGrid}>
            {Array.from({ length: 8 }).map((_, n) => (
              <div key={n} className={styles.skeletonCard}></div>
            ))}
          </section>
        ) : alumni.length > 0 ? (
          <>
            <section className={styles.cardsGrid}>
              {alumni.map((alumnus) => (
                <AlumniCard
                  key={alumnus.id}
                  data={alumnus}
                  onClick={() => setSelectedAlumni(alumnus)}
                />
              ))}
            </section>

            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <button
                  className={styles.controlPageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                > &lt; </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                  if (num === 1 || num === totalPages || (num >= page - 1 && num <= page + 1)) {
                    return (
                      <button
                        key={num}
                        className={`${styles.circleBtn} ${page === num ? styles.active : ''}`}
                        onClick={() => setPage(num)}
                      > {num} </button>
                    );
                  }
                  if (num === page - 2 || num === page + 2) {
                    return <span key={num} className={styles.dots}>...</span>;
                  }
                  return null;
                })}

                <button
                  className={styles.controlPageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                > &gt; </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Search size={48} color="#cc4b00" />
            <h2>Nenhum resultado encontrado</h2>
            <button className={styles.clearBtn} onClick={() => {
              setSearchTerm(''); setSelectedCurso(''); setSelectedAno(''); setSelectedArea(''); setPage(1);
            }}> Limpar filtros </button>
          </div>
        )}
      </main>

      {selectedAlumni && (
        <Modal data={selectedAlumni} onClose={() => setSelectedAlumni(null)} />
      )}

      {isAddModalOpen && (
        <AddAlumniModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (payload) => {
            try {
              await upsertMyProfile(payload);
              setHasProfile(true);
              setIsAddModalOpen(false);
              fetchAlumni({}, 1);
            } catch (error) {
              setErrorMessage("Erro ao salvar perfil.");
            }
          }}
        />
      )}
      <Footer />
    </div>
  );
};

export default Home;
