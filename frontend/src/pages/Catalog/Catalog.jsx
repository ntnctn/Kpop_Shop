import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api'; 
import './Catalog.css';

const Catalog = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await api.getAlbums();
        setAlbums(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <div className="catalog">
      <h2>Каталог альбомов</h2>
      <div className="album-grid">
        {albums.map(album => (
          <div key={album.id} className="album-card">
            <Link to={`/album/${album.id}`}>
              <h3>{album.title}</h3>
              <p>Исполнитель: {album.artist}</p>
              <p>Цена: ${album.base_price}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;