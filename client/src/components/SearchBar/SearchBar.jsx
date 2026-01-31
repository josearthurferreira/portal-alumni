import React from 'react';
import { Calendar, Search } from 'lucide-react';
import styles from './SearchBar.module.css';

const SearchBar = ({
  searchTerm,
  onSearchChange,
  cursos,
  selectedCurso,
  onCursoChange,
  anos,
  selectedAno,
  onAnoChange
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
        {cursos.map(curso => (
          <option key={curso} value={curso}>{curso}</option>
        ))}
      </select>

      <select
        className={styles.filterSelect}
        value={selectedAno}
        onChange={(e) => onAnoChange(e.target.value)}
      >
        <option value="">Todos os Anos</option>
        {anos.map(ano => (
          <option key={ano} value={ano}>{ano}</option>
        ))}
      </select>
    </section>
  );
};

export default SearchBar;
