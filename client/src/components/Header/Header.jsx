import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import styles from './Header.module.css';

// No Header.jsx
const Header = ({ onAddClick, isLoggedIn }) => {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.logo} onClick={() => navigate('/')}>IME Alumni</h1>

        {isLoggedIn ? (
          <button className={styles.addBtn} onClick={onAddClick}>
            <Plus size={18} /> Adicionar Perfil
          </button>
        ) : (
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>
            Entrar
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
