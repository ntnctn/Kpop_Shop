import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import './Product.css';

const Product = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await api.getAlbum(id);
        setAlbum(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!album) return <div className="error">Альбом не найден</div>;

  return (
    <div className="product-page">
      <div className="product-info">
        <h1>{album.title}</h1>
        <h2>Исполнитель: {album.artist_name}</h2>
        
        <div className="version-info">
          <h3>Информация о версиях:</h3>
          <ul>
            {album.versions?.map(version => (
              <li key={version.id}>
                {version.version_name} - ${version.price_diff}
              </li>
            ))}
          </ul>
        </div>

        <p className="description">{album.description}</p>
      </div>
    </div>
  );
};

export default Product;