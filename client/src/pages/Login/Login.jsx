import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

import { login, register } from '../../services/api';
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister && password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const response = await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        });

        setSuccess(
          response?.data?.message ||
            'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de entrar.',
        );

        resetForm();
        setIsRegister(false);
        return;
      }

      const response = await login({
        email: email.trim(),
        password,
      });

      const token = response?.data?.token;

      if (!token) {
        setError('Login falhou: token não retornado pelo servidor.');
        return;
      }

      localStorage.setItem('token', token);
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      const data = err?.response?.data;

      let msg = 'Erro ao autenticar.';

      if (err?.code === 'ERR_NETWORK') {
        msg =
          'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      } else if (data?.errors?.length) {
        msg = data.errors.map((e) => e.mensagem).join(' | ');
      } else if (data?.issues?.length) {
        msg = data.issues.map((i) => i.message).join(' | ');
      } else {
        msg = data?.message || err?.message || msg;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <button
          type="button"
          className={styles.backArrowBtn}
          onClick={() => navigate('/')}
          aria-label="Voltar para a página inicial"
          disabled={loading}
        >
          <ArrowLeft size={22} />
        </button>

        <h2>{isRegister ? 'Criar Conta' : 'Acessar Portal'}</h2>
        <p>Apenas membros cadastrados podem adicionar novos ex-alunos.</p>

        <ErrorBanner message={error} onClose={() => setError('')} />

        {success && (
          <div className={styles.successBanner}>
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess('')}
              aria-label="Fechar mensagem de sucesso"
            >
              ×
            </button>
          </div>
        )}

        {isRegister && (
          <div className={styles.inputBox}>
            <input
              type="text"
              placeholder="Nome Completo"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        <div className={styles.inputBox}>
          <input
            type="email"
            placeholder="E-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Mail color="#666" size={20} />
        </div>

        <div className={styles.inputBox}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <span onClick={() => !loading && setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        {isRegister && (
          <div className={styles.inputBox}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirme a senha"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? (
            <span className={styles.buttonContent}>
              <span className={styles.buttonLoader}></span>
              <span>{isRegister ? 'Cadastrando...' : 'Entrando...'}</span>
            </span>
          ) : isRegister ? (
            'Cadastrar'
          ) : (
            'Entrar'
          )}
        </button>

        <button
          type="button"
          className={styles.toggleBtn}
          disabled={loading}
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setSuccess('');
            resetForm();
          }}
        >
          {isRegister ? 'Já tenho conta' : 'Não tenho conta'}
        </button>

        {!isRegister && (
          <button
            type="button"
            className={styles.forgotBtn}
            disabled={loading}
            onClick={() => navigate('/forgot-password')}
          >
            Esqueci minha senha
          </button>
        )}
      </form>
    </div>
  );
};

export default Login;
