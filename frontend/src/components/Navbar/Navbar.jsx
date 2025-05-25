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
        <button className="search-button">🔍</button>
        
        {currentUser ? (
          <>
            <Link to="/wishlist" className="wishlist-button">❤️</Link>
            <Link to="/cart" className="cart-button">🛒</Link>
            <Link to="/profile" className="profile-button">👤</Link>
            <button className="logout-button" onClick={onLogout}>🚪</button>
          </>
        ) : (
          <button className="auth-button" onClick={onAuthClick}>👤</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;