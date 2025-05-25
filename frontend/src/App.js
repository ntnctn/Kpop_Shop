import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import PopupAuth from './components/PopupAuth/PopupAuth';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Profile from './pages/Profile/Profile';
import Wishlist from './pages/Wishlist/Wishlist';
import ArtistPage from './pages/ArtistPage/ArtistPage';
import './App.css';

function App() {
  const [isAuthPopupOpen, setAuthPopupOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Проверка токена и загрузка данных пользователя
      // В реальном приложении здесь должен быть запрос к API
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) setCurrentUser(userData);
    }
  }, []);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setAuthPopupOpen(false);
    localStorage.setItem('token', 'dummy-token');
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  };

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      setAuthPopupOpen(true);
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app">
        <Navbar 
          currentUser={currentUser}
          onAuthClick={() => setAuthPopupOpen(true)}
          onLogout={handleLogout}
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
            <Route path="/album/:id" element={<Product />} />
            
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile user={currentUser} />
              </ProtectedRoute>
            } />
            
            <Route path="/wishlist" element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;