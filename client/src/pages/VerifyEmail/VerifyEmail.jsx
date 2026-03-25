import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './VerifyEmail.module.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token && email) {
      axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email`, { token, email })
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <div className={styles.container}>
      {status === 'loading' && <h2>Verificando seu e-mail...</h2>}
      {status === 'success' && (
        <div className={styles.card}>
          <h2>E-mail Confirmado!</h2>
          <p>Sua conta está ativa. Agora você pode acessar o portal.</p>
          <button onClick={() => navigate('/login')}>Ir para Login</button>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.card}>
          <h2 style={{ color: '#ff4d4d' }}>Falha na Verificação ❌</h2>
          <p>O link pode ter expirado ou é inválido. Tente se cadastrar novamente.</p>
          <button onClick={() => navigate('/login')}>Voltar</button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;