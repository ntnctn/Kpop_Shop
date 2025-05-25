import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import './ArtistPage.css';

const ArtistPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.getArtist(id);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!data) return <div className="error">Исполнитель не найден</div>;

  const { artist, albums } = data;

  return (
    <div className="artist-page">
      <div className="artist-header">
        <h1>{artist.name}</h1>
        <p className="artist-category">
          {artist.category === 'female_group' && 'Женская группа'}
          {artist.category === 'male_group' && 'Мужская группа'}
          {artist.category === 'solo' && 'Сольный исполнитель'}
        </p>
      </div>

      {artist.description && (
        <div className="artist-description">
          <p>{artist.description}</p>
        </div>
      )}

      <div className="artist-image">
        <img 
          src={artist.image_url || '/default-artist.jpg'} 
          alt={artist.name}
        />
      </div>

      <h2>Альбомы</h2>
      {albums && albums.length > 0 ? (
        <div className="albums-grid">
          {albums.map(album => (
            <div key={album.id} className="album-card">
              <Link to={`/album/${album.id}`}>
                <img 
                  src={album.main_image_url || '/default-album.jpg'} 
                  alt={album.title}
                />
                <h3>{album.title}</h3>
                <p>{new Date(album.release_date).toLocaleDateString()}</p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p>У исполнителя пока нет альбомов</p>
      )}
    </div>
  );
};

export default ArtistPage;