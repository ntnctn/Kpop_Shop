import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import PopupAuth from './components/PopupAuth/PopupAuth';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Profile from './pages/Profile/Profile';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import ArtistPage from './pages/ArtistPage/ArtistPage';
import apiInstance from './api';
import api from './api';
import './App.css';

function App() {
  const [isAuthPopupOpen, setAuthPopupOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Инициализация пользователя при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData'));

      if (token && userData) {
        // Проверка валидности токена
        try {
          // await apiInstance.get('/api/validate-token');
          await api.validateToken();

          setCurrentUser(userData);
        } catch (error) {

          // ошибка
          console.error('Token validation failed:', error); 
          
          
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
        }
      }
    };
    initializeAuth();
  }, []);

  const handleLogin = async (responseData) => {
    try {
      console.log('Raw response data:', responseData); // Для отладки

      // Проверяем новую структуру ответа
      if (responseData.accessToken && responseData.user) {
        const { accessToken, user } = responseData;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('userData', JSON.stringify(user));
        setCurrentUser(user);
        setAuthPopupOpen(false);
        return;
      }

    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      setCurrentUser(null);
      throw error; // Пробрасываем ошибку выше
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setCurrentUser(null);
    window.location.reload();
  };

  return (
    <Router>
      <div className="app">
        <Navbar
          currentUser={currentUser}
          onAuthClick={() => setAuthPopupOpen(true)}
          onLogout={handleLogout}
          cartItemCount={cartItemCount}
        />

        {isAuthPopupOpen && (
          <PopupAuth
            onClose={() => setAuthPopupOpen(false)}
            onLogin={handleLogin}
          />
        )}

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/catalog" element={<Catalog />} />
             <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile currentUser={currentUser} />} /> 
            <Route
              path="/admin"
              element={
                currentUser?.isAdmin ? <AdminPanel /> : <Navigate to="/" />
              }
            />
            <Route path="/album/:id" element={<Product />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;