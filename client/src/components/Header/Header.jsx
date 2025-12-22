import React from 'react';
import { Plus } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ onAddClick }) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.logo}>IME Alumni</h1>
        <button className={styles.addBtn} onClick={onAddClick}>
          <Plus size={18} /> Adicionar Perfil
        </button>
      </div>
    </header>
  );
};

export default Header;
