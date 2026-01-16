import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

import { login, register } from '../../services/api';
// 1. Importe o componente
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mantemos o estado de erro que você já tinha
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      if (isRegister) {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        });
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

      // Lógica aprimorada para erros do Zod
      let msg = data?.message || err?.message || 'Erro ao autenticar.';

      if (data?.errors?.length) {
        // Se o seu middleware retorna 'errors' do Zod:
        msg = data.errors.map((e) => e.mensagem).join(' | ');
      } else if (data?.issues?.length) {
        // Fallback para o formato 'issues'
        msg = data.issues.map((i) => i.message).join(' | ');
      }

      setError(msg);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2>{isRegister ? 'Criar Conta' : 'Acessar Portal'}</h2>
        <p>Apenas membros cadastrados podem adicionar novos ex-alunos.</p>

        {/* 2. Substituímos o <p> antigo pelo ErrorBanner */}
        <ErrorBanner message={error} onClose={() => setError('')} />

        {isRegister && (
          <input
            type="text"
            placeholder="Nome Completo"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="E-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isRegister && (
          <input
            type="password"
            placeholder="Confirme a senha"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}

        <button type="submit" className={styles.loginBtn}>
          {isRegister ? 'Cadastrar' : 'Entrar'}
        </button>

        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setPassword('');
            setConfirmPassword('');
            setFullName('');
          }}
        >
          {isRegister ? 'Já tenho conta' : 'Não tenho conta'}
        </button>
      </form>
    </div>
  );
};

export default Login;
