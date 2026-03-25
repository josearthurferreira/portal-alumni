import React from 'react';
import { Search } from 'lucide-react'; // Import limpo
import styles from './SearchBar.module.css';

const SearchBar = ({
  searchTerm,
  onSearchChange,
  cursos = [], // Garantindo array vazio por padrão
  selectedCurso,
  onCursoChange,
  anos = [],
  selectedAno,
  onAnoChange,
  areas = [],
  selectedArea,
  onAreaChange
}) => {
  return (
    <section className={styles.searchBar}>
      <div className={styles.searchBox}>
        <Search size={20} color="#666" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className={styles.filterSelect}
        value={selectedCurso}
        onChange={(e) => onCursoChange(e.target.value)}
      >
        <option value="">Todos os Cursos</option>
        {cursos?.map(curso => (
          <option key={curso} value={curso}>{curso}</option>
        ))}
      </select>

      <select
        className={styles.filterSelect}
        value={selectedAno}
        onChange={(e) => onAnoChange(e.target.value)}
      >
        <option value="">Todos os Anos</option>
        {anos?.map(ano => (
          <option key={ano} value={ano}>{ano}</option>
        ))}
      </select>

      <select
        className={styles.filterSelect}
        value={selectedArea}
        onChange={(e) => onAreaChange(e.target.value)}
      >
        <option value="">Todas as Áreas</option> {/* Corrigido */}
        {areas?.map(area => (
          <option key={area} value={area}>{area}</option>
        ))}
      </select>
    </section>
  );
};

export default SearchBar;
