import React from 'react';
import { GraduationCap, Calendar, MapPin, Building, Mail, Phone, Linkedin} from 'lucide-react';
import styles from './AlumniCard.module.css';

const AlumniCard = ({ data, onClick }) => {
  return (
    <div className={styles.card} onClick={() => onClick(data)}>
      <img src={data.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`} alt={data.fullName} className={styles.profilePic} onError={(e) => {e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`; }}/>
      <div className={styles.list}>
        <h3>{data.fullName.split(' ').slice(0, 5).filter((word,index, array)=>index!==array.length-1 || !['de','da','do','dos','das'].includes(word.toLowerCase())).join(' ')}</h3>
        <span className={styles.course}><GraduationCap  className={styles.gradicon} size={16} /> {data.course.replace('Engenharia', 'Eng.')}</span>
        <p><Calendar size={16} /> Turma de {data.graduationYear}</p>
        <p><MapPin size={16} /> {data.city}, {data.state}</p>
        <p><Building size={16} /> {data.company || 'Autônomo'}</p>
      </div>

      <div className={styles.icons}>
        <button title="Email"><Mail size={18} /></button>
        <button title="Telefone"><Phone size={18} /></button>
        {data.linkedinUrl && <button title="LinkedIn"><Linkedin size={18} /></button>}
      </div>
    </div>
  );
};

export default AlumniCard;
