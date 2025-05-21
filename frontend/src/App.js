import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import PopupAuth from './components/PopupAuth/PopupAuth';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Profile from './pages/Profile/Profile';
import Wishlist from './pages/Wishlist/Wishlist';
import './App.css';
//???

function App() {
  const [isAuthPopupOpen, setAuthPopupOpen] = useState(false);

  return (
    <Router>
      <div className="app">
        <Navbar onAuthClick={() => setAuthPopupOpen(true)} />
        
        {isAuthPopupOpen && (
          <PopupAuth onClose={() => setAuthPopupOpen(false)} />
        )}

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;