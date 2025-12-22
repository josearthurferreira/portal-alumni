import React from 'react';
import { Instagram, Linkedin, Facebook } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <div className={styles.footerLeft}>
          <h3>Sobre o Portal</h3>
          <p>Conectando gerações de engenheiros formados pelo Instituto Militar de Engenharia.</p>
        </div>

        <div className={styles.footerRight}>
          <div className={styles.footerSocial}>
            <a href="#" className={styles.socialBtn}><Instagram color="#fff" /></a>
            <a href="#" className={styles.socialBtn}><Linkedin color="#fff" /></a>
            <a href="#" className={styles.socialBtn}><Facebook color="#fff" /></a>
          </div>
          <p>© 2024 IME Alumni</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
