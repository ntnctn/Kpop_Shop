// src/components/ArtistMenu/ArtistMenu.jsx
import React from 'react';
import './ArtistMenu.css';

const ArtistMenu = ({ onClose }) => {
  return (
    <div className="artist-menu">
      {/* Ваше содержимое меню */}
      <button onClick={onClose}>Закрыть</button>
    </div>
  );
};

export default ArtistMenu; // Важно: default export