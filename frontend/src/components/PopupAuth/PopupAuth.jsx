import React, { useState } from 'react';
import api from '../../api';  
import './PopupAuth.css';

const PopupAuth = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.login(email, password);
      localStorage.setItem('token', response.data.token);
      onLogin(response.data.user);
      onClose();
    } catch (err) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-auth">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Вход</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Войти</button>
        </form>
      </div>
    </div>
  );
};

export default PopupAuth;