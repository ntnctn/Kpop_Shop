import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import './ArtistMenu.css';

const ArtistMenu = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getArtistCategories();
        setCategories(response.data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const loadArtists = async (categoryId) => {
    if (!artists[categoryId]) {
      try {
        const response = await api.getArtistsByCategory(categoryId);
        setArtists(prev => ({
          ...prev,
          [categoryId]: response.data
        }));
      } catch (err) {
        console.error(`Error fetching artists for category ${categoryId}:`, err);
        setArtists(prev => ({
          ...prev,
          [categoryId]: [] // Устанавливаем пустой массив в случае ошибки
        }));
      }
    }
  };

  const handleCategoryClick = (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      loadArtists(categoryId);
      setExpandedCategory(categoryId);
    }
  };

  if (loading) return <div className="loading-menu">Загрузка...</div>;
  if (error) return <div className="error-menu">Ошибка загрузки: {error}</div>;

  return (
    <div className="artist-menu">
      <button className="close-menu" onClick={onClose}>×</button>
      <h3>Категории исполнителей</h3>
      
      <div className="categories-container">
        {categories.map(category => (
          <div key={category.id} className="category-section">
            <div 
              className="category-header"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name}
              <span className="toggle-icon">
                {expandedCategory === category.id ? '▼' : '►'}
              </span>
            </div>
            
            {expandedCategory === category.id && (
              <div className="artists-list">
                {artists[category.id]?.length > 0 ? (
                  artists[category.id].map(artist => (
                    <Link
                      key={artist.id}
                      to={`/artist/${artist.id}`}
                      className="artist-link"
                      onClick={onClose}
                    >
                      {artist.name}
                    </Link>
                  ))
                ) : (
                  <div className="no-artists">Нет артистов в этой категории</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtistMenu;