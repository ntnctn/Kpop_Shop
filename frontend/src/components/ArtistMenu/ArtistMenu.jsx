import React, { useState, useEffect } from 'react'; // Добавлен useEffect
import { Link } from 'react-router-dom';
import api from '../../api';
import './ArtistMenu.css';

const ArtistMenu = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка категорий при монтировании
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

  // Загрузка артистов при раскрытии категории
  const loadArtists = async (categoryId) => {
    if (!artists[categoryId]) {
      try {
        const response = await api.getArtistsByCategory(categoryId);
        setArtists(prev => ({
          ...prev,
          [categoryId]: response.data
        }));
      } catch (err) {
        console.error('Error fetching artists:', err);
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
  if (error) return <div className="error-menu">Ошибка загрузки</div>;

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
                {artists[category.id]?.map(artist => (
                  <Link
                    key={artist.id}
                    to={`/artist/${artist.id}`}
                    className="artist-link"
                    onClick={onClose}
                  >
                    {artist.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtistMenu;