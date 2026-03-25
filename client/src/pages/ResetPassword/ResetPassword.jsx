import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import styles from './ResetPassword.module.css';

import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { resetPassword } from '../../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token de redefinição não encontrado na URL.');
      return;
    }

    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        token,
        password,
      });

      setSuccess(response?.data?.message || 'Senha redefinida com sucesso.');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const data = err?.response?.data;

      let msg = data?.message || err?.message || 'Erro ao redefinir a senha.';

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
        <h2>Redefinir senha</h2>
        <p>Digite sua nova senha para concluir a recuperação da conta.</p>

        <ErrorBanner message={error} onClose={() => setError('')} />

        {success && <div className={styles.successBox}>{success}</div>}

        <div className={styles.inputBox}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nova senha"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Lock color="#666" size={20} />
        </div>

        <div className={styles.inputBox}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirmar nova senha"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? 'Salvando...' : 'Redefinir senha'}
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

export default ResetPassword;
