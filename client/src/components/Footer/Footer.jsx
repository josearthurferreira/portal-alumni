import React from 'react';
import { Linkedin, Facebook, Youtube, Instagram } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Lado Esquerdo: Informações Institucionais */}
        <div className={styles.leftSection}>
          <strong>
            Associação dos ex-alunos do Instituto Militar de Engenharia
          </strong>
          <span>Apoiando o IME e a comunidade IMEana.</span>
          <span>© 2024 Alumni IME. Todos os direitos reservados.</span>
          <span>CNPJ: 19.335.957/0001-17</span>
        </div>

        {/* Lado Direito: Social e Links */}
        <div className={styles.rightSection}>
          <div className={styles.socialIcons}>
            <a
              href="https://www.linkedin.com/company/alumniime"
              className={styles.iconCircle}
            >
              {/* LinkedIn e Facebook ficam bons com fill para parecerem sólidos */}
              <Linkedin size={23} fill="currentColor" strokeWidth={0} />
            </a>
            <a
              href="https://www.facebook.com/AlumniIME"
              className={styles.iconCircle}
            >
              <Facebook size={23} fill="currentColor" strokeWidth={0} />
            </a>
            <a
              href="https://www.youtube.com/c/AlumniIME/featured"
              className={styles.iconCircle}
            >
              {/* YouTube: SEM fill e com strokeWidth maior para aparecer o triângulo */}
              <Youtube size={23} strokeWidth={2.5} />
            </a>
            <a
              href="https://www.instagram.com/alumniime/"
              className={styles.iconCircle}
            >
              {/* Instagram: Segue o padrão de traço mais grosso */}
              <Instagram size={23} strokeWidth={2.5} />
            </a>
          </div>

          <a
            href="https://alumniime.com.br/spanolitica-de-privacidade"
            className={styles.legalLink}
          >
            Termos de Uso e Política de Privacidade
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
