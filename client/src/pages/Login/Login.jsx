import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

import { login, register } from '../../services/api';

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  // Campos
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Estados para validar as senhas
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Erro simples (opcional)
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validação de confirmação de senha
    if (isRegister && password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      if (isRegister) {
        // 1) cria conta
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        });
      }

      // 2) faz login (tanto no modo login quanto após cadastrar)
      const response = await login({
        email: email.trim(),
        password,
      });

      const token = response?.data?.token;
      if (!token) {
        setError('Login falhou: token não retornado pelo servidor.');
        return;
      }

      // 3) salva token e marca como logado
      localStorage.setItem('token', token);
      setIsLoggedIn(true);

      // 4) volta pra home
      navigate('/');
    } catch (err) {
      const data = err?.response?.data;
      let msg =
        data?.message ||
        err?.message ||
        'Erro ao autenticar. Verifique suas credenciais.';

      if (data?.issues?.length) {
        msg = data.issues
          .map((i) => `${i.path?.join('.') || 'campo'}: ${i.message}`)
          .join(' | ');
      }

      setError(msg);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2>{isRegister ? 'Criar Conta' : 'Acessar Portal'}</h2>
        <p>Apenas membros cadastrados podem adicionar novos ex-alunos.</p>

        {/* Erro */}
        {error ? (
          <p style={{ color: '#a8071a', marginTop: 8, marginBottom: 8 }}>
            {error}
          </p>
        ) : null}

        {isRegister && (
          <input
            type="text"
            placeholder="Nome"
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
            // mantém email se tu quiser (eu deixei), mas zera nome no toggle
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
