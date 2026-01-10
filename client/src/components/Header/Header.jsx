import React from 'react';
import { Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({
  onAddClick,
  isLoggedIn,
  setIsLoggedIn,
  addLabel = 'Adicionar Perfil',
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
    localStorage.removeItem('token');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.logo} onClick={() => navigate('/')}>
          IME Alumni
        </h1>

        <div className={styles.actions}>
          {isLoggedIn ? (
            <>
              <button className={styles.addBtn} onClick={onAddClick}>
                <Plus size={18} /> {addLabel}
              </button>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <LogOut size={18} /> Sair
              </button>
            </>
          ) : (
            <button
              className={styles.loginBtn}
              onClick={() => navigate('/login')}
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
