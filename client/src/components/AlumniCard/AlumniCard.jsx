import React from 'react';
import { GraduationCap, Calendar, MapPin, Building, Mail, Phone, Linkedin } from 'lucide-react';
import styles from './AlumniCard.module.css';

const AlumniCard = ({ data, onClick }) => {
  return (
    <div className={styles.card} onClick={() => onClick(data)}>
      <img src={data.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`} alt={data.nome} className={styles.profilePic} />
      <h3>{data.fullName}</h3>
      <p><GraduationCap size={16} /> {data.course}</p>
      <p><Calendar size={16} /> Turma de {data.graduationYear}</p>
      <p><MapPin size={16} /> {data.city}, {data.state}</p>
      <p><Building size={16} /> {data.company || 'Autônomo'}</p>

      <div className={styles.icons}>
        <button title="Email"><Mail size={18} /></button>
        <button title="Telefone"><Phone size={18} /></button>
        <button title="LinkedIn"><Linkedin size={18} /></button>
      </div>
    </div>
  );
};

export default AlumniCard;
