import React, { useState } from 'react';
import api from '../../api';
import './PopupAuth.css';
import PropTypes from 'prop-types';

const PopupAuth = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

 const handleAuth = async (e, isRegistration) => {
  e.preventDefault();
  setError('');

  try {
    if (isRegistration) {
      await api.register(email, password, firstName, lastName);
      // После регистрации автоматически входим
      const loginResponse = await api.login(email, password);
      onLogin(loginResponse); // Передаем полный ответ
    } else {
      const loginResponse = await api.login(email, password);
      onLogin(loginResponse); // Передаем полный ответ
    }
    
    onClose();
  } catch (err) {
    setError(err.message || 'Ошибка авторизации');
  }
};

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
  };

  return (
    <div className="popup-overlay">
      <div className="popup-auth">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{isRegistering ? 'Регистрация' : 'Вход'}</h2>
        
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={(e) => handleAuth(e, isRegistering)}>
          {isRegistering && (
            <>
              <div className="form-group">
                <label>Имя</label>
                <input
                  type="text"
                  placeholder="Введите имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Фамилия</label>
                <input
                  type="text"
                  placeholder="Введите фамилию"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-button">
            {isRegistering ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegistering ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <button type="button" onClick={toggleAuthMode} className="toggle-button">
            {isRegistering ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
};

PopupAuth.propTypes = {
  onClose: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired
};

export default PopupAuth;