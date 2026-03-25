import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

import { login, register } from '../../services/api';
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner';
import { Eye, EyeOff, Mail } from 'lucide-react';

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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

        setSuccessMessage('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
        setIsRegister(false); 
        setFullName('');
        setPassword('');
        setConfirmPassword('');
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

      let msg = data?.message || err?.message || 'Erro ao autenticar.';

      if (data?.errors?.length) {
        msg = data.errors.map((e) => e.mensagem).join(' | ');
      } else if (data?.issues?.length) {
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

        <ErrorBanner message={error} onClose={() => setError('')} />

        {successMessage && (
          <div className={styles.successBanner}>
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage('')}>X</button>
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
          />
          <span onClick={() => setShowPassword(!showPassword)}>
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
            />
          </div>
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

        {!isRegister && (
          <button
            type="button"
            className={styles.forgotBtn}
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
