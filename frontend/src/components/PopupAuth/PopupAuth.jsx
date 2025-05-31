import React, { useState } from 'react';
import api from '../../api';
import PropTypes from 'prop-types';
import {
  Box, 
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
        const loginResponse = await api.login(email, password);
        onLogin(loginResponse);
      } else {
        const loginResponse = await api.login(email, password);
        onLogin(loginResponse);
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
    <Dialog 
      open 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      className="popup-auth-container"
    >
      <DialogTitle className="popup-auth-title">
        {isRegistering ? 'Регистрация' : 'Вход'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          className="popup-auth-close-btn"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="popup-auth-content">
        <div className="popup-auth-content-inner">
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box 
            component="form" 
            onSubmit={(e) => handleAuth(e, isRegistering)}
            className="popup-auth-form"
          >
            {isRegistering && (
              <>
                <TextField
                  required
                  fullWidth
                  label="Имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Фамилия"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </>
            )}

            <TextField
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              required
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputProps={{ minLength: 6 }}
            />

            <Box className="popup-auth-actions">
              <Button 
                type="submit" 
                fullWidth 
                variant="contained"
              >
                {isRegistering ? 'Зарегистрироваться' : 'Войти'}
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" className="popup-auth-toggle">
            {isRegistering ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
            <Button 
              color="primary" 
              size="small" 
              onClick={toggleAuthMode}
              sx={{ textTransform: 'none' }}
            >
              {isRegistering ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  );
};

PopupAuth.propTypes = {
  onClose: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired
};

export default PopupAuth;