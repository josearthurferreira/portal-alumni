import React, { useState } from 'react';
import { Plus, LogOut, Menu, X } from 'lucide-react'; // Importados novos ícones
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({
  onAddClick,
  isLoggedIn,
  setIsLoggedIn,
  addLabel = 'ADICIONAR PERFIL',
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
    localStorage.removeItem('token');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const links = [
    { src: 'https://alumniime.com.br/', label: 'ASSOCIAÇÃO' },
    { src: 'https://alumniime.com.br/eventos', label: 'EVENTOS' },
    { src: 'https://alumniime.com.br/projetos', label: 'PROJETOS' },
    { src: '#', label: 'PORTAL DE ALUNOS' },
    { src: 'https://www.reserva.ink/alumniime#', label: 'LOJA ALUMNIIME' },
    { src: 'https://alumniime.com.br/pesquisa-de-vagas', label: 'VAGAS' },
    { src: 'https://alumniime.com.br/transparencia', label: 'TRANSPARÊNCIA' },
    { src: 'https://alumniime.com.br/doe', label: 'DOAR' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.titleLogo} onClick={() => navigate('/')}>
          <div className={styles.logoWrapper}>
            <img
              src="https://optim.tildacdn.one/tild6638-3331-4435-b761-623064663465/-/resize/90x/-/format/webp/AlumniIME_Logo.png.webp"
              alt="Logo alumni"
              width={96}
              height={120}
            />
          </div>
        </h1>

        {/* Botão visível apenas no Mobile */}
        <button className={styles.menuMobileIcon} onClick={toggleMenu}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Links - Classe condicional para abrir/fechar no mobile */}
        <div
          className={`${styles.linksContainer} ${isMenuOpen ? styles.open : ''}`}
        >
          {links.map((path, index) => (
            <a
              key={index}
              className={
                path.label === 'PORTAL DE ALUNOS'
                  ? styles.linkPortal
                  : styles.links
              }
              href={path.src}
              onClick={() => setIsMenuOpen(false)}
            >
              {path.label}
            </a>
          ))}
          <div className={styles.actions}>
            {isLoggedIn ? (
              <>
                <button className={styles.addBtn} onClick={onAddClick}>
                  <Plus size={16} /> {addLabel}
                </button>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  <LogOut size={16} /> SAIR
                </button>
              </>
            ) : (
              <button
                className={styles.loginBtn}
                onClick={() => navigate('/login')}
              >
                ENTRAR
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.subtitle}>
        <strong>ENCONTRE EX-ALUNOS DO IME</strong>
      </div>
      <div className={styles.inferiorBar}></div>
    </header>
  );
};

export default Header;
