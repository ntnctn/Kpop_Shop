import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ArtistMenu from '../ArtistMenu/ArtistMenu';
import './Navbar.css';

const Navbar = ({ currentUser, onAuthClick, onLogout }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="menu-button"
          onClick={() => setMenuOpen(!isMenuOpen)}
        >
          ☰ Группы
        </button>
        {isMenuOpen && <ArtistMenu onClose={() => setMenuOpen(false)} />}
      </div>
      
      <div className="navbar-center">
        <Link to="/" className="logo">KpopShop</Link>
      </div>
      
      <div className="navbar-right">
        {currentUser ? (
          <>
            {currentUser.isAdmin && (
              <Link 
                to="/admin" 
                className="admin-link"
                style={{ 
                  color: 'white',
                  textDecoration: 'none',
                  marginRight: '20px',
                  fontWeight: '500'
                }}
              >
                Админ-панель
              </Link>
            )}
            <button 
              className="logout-button" 
              onClick={onLogout}
              style={{ 
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.4rem',
                cursor: 'pointer'
              }}
            >
              Выйти
            </button>
          </>
        ) : (
          <button 
            className="auth-button" 
            onClick={onAuthClick}
            style={{ 
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.4rem',
              cursor: 'pointer'
            }}
          >
            Войти
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;