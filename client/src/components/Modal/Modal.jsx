import React from 'react';
import {
  X,
  GraduationCap,
  MapPin,
  Briefcase,
  Mail,
  Linkedin,
  User,
} from 'lucide-react';
import styles from './Modal.module.css';

const Modal = ({ data, onClose }) => {
  if (!data) return null;
  //Fix do Não informar cargo
  const isMeaningful = (v) => v && v !== 'Prefiro não informar';

  const roleText = isMeaningful(data.role) ? data.role : null;
  const companyText = isMeaningful(data.company) ? data.company : null;

  const headline =
    roleText && companyText
      ? `${roleText} na ${companyText}`
      : companyText
        ? companyText
        : roleText
          ? roleText
          : 'Ex-aluno';

  // Fallback para imagem caso profilePicture seja nulo
  const avatarUrl =
    data.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
        {/* Cabeçalho do Perfil */}
        <header className={styles.header}>
          <img src={avatarUrl} alt={data.fullName} className={styles.avatar} />
          <div className={styles.titleInfo}>
            <h1>{data.fullName}</h1>
            <p className={styles.headline}>{headline}</p>
          </div>
        </header>

        <div className={styles.content}>
          {/* Coluna Esquerda */}
          <div className={styles.mainInfo}>
            <section>
              <h3> Informações Acadêmicas</h3>
              <ul>
                <li>
                  <GraduationCap size={16} /> {data.course} • Turma de{' '}
                  {data.graduationYear}
                </li>
                <li>
                  <MapPin size={16} /> {data.city || 'Cidade não informada'}
                  {data.state ? `, ${data.state}` : ''}
                </li>
                <li>
                  <Briefcase size={16} />{' '}
                  {data.yearsOfExperience
                    ? `${data.yearsOfExperience} anos de experiência`
                    : 'Experiência não informada'}
                </li>
              </ul>
            </section>

            <section>
              <h3>Sobre</h3>
              <p className={styles.description}>
                {data.bio || 'Este ex-aluno ainda não adicionou uma biografia.'}
              </p>
            </section>

            <section>
              <h3>Habilidades</h3>
              <div className={styles.tags}>
                {data.skills && data.skills.length > 0 ? (
                  data.skills.map((skill, index) => (
                    <span key={index} className={styles.tag}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className={styles.noSkills}>
                    Nenhuma habilidade listada
                  </span>
                )}
              </div>
            </section>
          </div>

          {/* Coluna Direita */}
          <div className={styles.sideInfo}>
            <section>
              <h3>Contato</h3>
              <div className={styles.contactItem}>
                <div className={styles.iconBox}>
                  <Mail size={16} />
                </div>
                <div>
                  <span>Email</span>
                  <p>{data.email}</p>
                </div>
              </div>
              {data.linkedinUrl && (
                <div className={styles.contactItem}>
                  <div className={styles.iconBox}>
                    <Linkedin size={16} />
                  </div>
                  <div>
                    <span>LinkedIn</span>
                    <p>
                      <a
                        href={data.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver Perfil
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h3>Atuação Profissional</h3>
              <div className={styles.contactItem}>
                <div className={styles.iconBox}>
                  <Briefcase size={16} />
                </div>
                <div>
                  <span>Empresa</span>
                  <p>{data.company || 'Não informado'}</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <div className={styles.iconBox}>
                  <Briefcase size={16} />
                </div>
                <div>
                  <span>Cargo</span>
                  <p>{roleText || 'Não informado'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
