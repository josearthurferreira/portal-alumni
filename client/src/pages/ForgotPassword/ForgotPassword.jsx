import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import styles from './ForgotPassword.module.css';

import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { forgotPassword } from '../../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await forgotPassword({ email: email.trim() });

      setSuccess(
        response?.data?.message ||
          'Se o e-mail existir no sistema, as instruções de recuperação foram enviadas.',
      );
    } catch (err) {
      const data = err?.response?.data;

      let msg =
        data?.message ||
        err?.message ||
        'Erro ao solicitar recuperação de senha.';

      if (data?.errors?.length) {
        msg = data.errors.map((e) => e.mensagem).join(' | ');
      } else if (data?.issues?.length) {
        msg = data.issues.map((i) => i.message).join(' | ');
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2>Recuperar senha</h2>
        <p>Digite seu e-mail para receber as instruções de redefinição.</p>

        <ErrorBanner message={error} onClose={() => setError('')} />

        {success && <div className={styles.successBox}>{success}</div>}

        <div className={styles.inputBox}>
          <input
            type="email"
            placeholder="E-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Mail color="#666" size={20} />
        </div>

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/login')}
        >
          Voltar para o login
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
