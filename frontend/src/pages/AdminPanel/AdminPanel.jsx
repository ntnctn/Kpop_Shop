import React, { useState, useEffect } from 'react';
import {
  Tab, Tabs, Box, Button, CircularProgress
} from '@mui/material';

import AddIcon from '@mui/icons-material/Close';

import api from '../../api';
import { Modal } from '../../components/Modal/Modal';
import { AlbumForm } from '../../components/AlbumForm/AlbumForm';
import { ArtistForm } from '../../components/ArtistForm/ArtistForm';
import './AdminPanel.css';



const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для артистов
  const [artists, setArtists] = useState([]);

  
   const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
   const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);

  // Состояния для альбомов
  const [albums, setAlbums] = useState([]);


  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // setError(null);

        // Загружаем артистов и альбомы параллельно
        const authCheck = await api.checkAuth();
        if (!authCheck.data.is_admin) {
          throw new Error('You do not have admin privileges');
        }

        const [artistsRes, albumsRes] = await Promise.all([
          api.getAdminArtists(),
          api.getAdminAlbums()
        ]);

        // Добавляем категории к артистам, если их нет
      const artistsWithCategory = artistsRes.data.map(artist => ({
        ...artist,
        category: artist.category || 'other'
      }));
      
      setArtists(artistsWithCategory);
      setAlbums(albumsRes.data);

      } catch (err) {
        setError(err.response?.data?.message || err.message);
        console.error('Admin panel error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Создание нового артиста

const handleCreateArtist = async (artistData) => {
    try {
      const response = await api.createArtist(artistData);
      setArtists([...artists, response.data]);
      setIsArtistModalOpen(false);
      alert('Артист успешно создан!');
    } catch (error) {
      console.error('Error creating artist:', error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };

  // Создание нового альбома
 const handleCreateAlbum = async (albumData) => {
    try {
      const response = await api.createAlbum(albumData);
      setAlbums([...albums, response.data]);
      setIsAlbumModalOpen(false);
      alert('Альбом успешно создан!');
    } catch (error) {
      console.error('Error creating album:', error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };

  // Группировка артистов по категориям
  const groupedArtists = artists.reduce((acc, artist) => {
    const category = artist.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(artist);
    return acc;
  }, {});

  // Группировка альбомов по артистам и категориям
  const groupedAlbums = albums.reduce((acc, album) => {
    const artist = artists.find(a => a.id === album.artist_id);
    if (artist) {
      const category = artist.category || 'other';
      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][artist.id]) {
        acc[category][artist.id] = {
          artist,
          albums: []
        };
      }
      acc[category][artist.id].albums.push(album);
    }
    return acc;
  }, {});

  // Функции для перевода категорий
  const translateCategory = (category) => {
    switch (category) {
      case 'female_group': return 'Женские группы';
      case 'male_group': return 'Мужские группы';
      case 'solo': return 'Сольные исполнители';
      default: return 'Другие';
    }
  };

  if (loading) {
    return (
      <div className="admin-panel-loading">
        <CircularProgress size={60} />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </Button>
      </div>
    );
  }

  //наполнение страницы

  return (
    <div className="admin-panel">
      <h2>Административная панель</h2>

      <Tabs
        value={tabValue}
        onChange={(e, newVal) => setTabValue(newVal)}
        variant="fullWidth"
      >
        <Tab label="Артисты" />
        <Tab label="Альбомы" />
      </Tabs>

      {/* Вкладка артистов */}
      {tabValue === 0 && (
        <Box p={3}>
          <h3>Управление артистами</h3>

          {/* форма добавления артиста */}

          
          <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsArtistModalOpen(true)}
            >
              Добавить артиста
            </Button>

         

          {/* существующие артисты */}

          <div className="list-section">
            {Object.entries(groupedArtists).map(([category, artistsList]) => (
              <div key={category} className="category-group">
                <h3 className="category-header">{translateCategory(category)}</h3>
                <div className="artists-list">
                  {artistsList.map(artist => (
                    <div key={artist.id} className="artist-item">
                      <div className="artist-info">
                        <h4>{artist.name}</h4>
                        {artist.image_url && (
                          <img 
                            src={artist.image_url} 
                            alt={artist.name}
                            className="artist-image"
                          />
                        )}
                      </div>
                      {artist.description && (
                        <p className="artist-description">{artist.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

            

        </Box>
      )}

      {/* Вкладка альбомов */}

      {tabValue === 1 && (
        <Box p={3}>
          <h3>Управление альбомами</h3>


          {/* форма добавления альбома */}
          
          <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsAlbumModalOpen(true)}
            >
              Добавить альбом
            </Button>

          {/* существующие альбомы */}

          <div className="list-section">
            {Object.entries(groupedAlbums).map(([category, artistsData]) => (
              <div key={category} className="category-group">
                <h3 className="category-header">{translateCategory(category)}</h3>
                {Object.values(artistsData).map(({artist, albums}) => (
                  <div key={artist.id} className="artist-albums-group">
                    <div className="artist-header">
                      <h4>{artist.name}</h4>
                    </div>
                    <div className="albums-list">
                      {albums.map(album => (
                        <div key={album.id} className="album-item">
                          <div className="album-main-info">
                            <h5>{album.title}</h5>
                            <p>Цена: ${album.base_price}</p>
                            <p>Статус: {album.status === 'in_stock' ? 'В наличии' : 
                                       album.status === 'pre_order' ? 'Предзаказ' : 'Нет в наличии'}</p>
                          </div>
                          {album.versions && album.versions.length > 0 && (
                            <div className="album-versions">
                              <h6>Версии:</h6>
                              <ul>
                                {album.versions.map(version => (
                                  <li key={version.id}>
                                    {version.version_name} (+${version.price_diff})
                                    {version.is_limited && ' (Лимитированная)'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </Box>
      )}

        {/* Модальные окна */}


        <Modal 
        open={isArtistModalOpen} 
        onClose={() => setIsArtistModalOpen(false)}
        title="Добавление нового артиста"
      >
        <ArtistForm 
          onSubmit={handleCreateArtist}
          onCancel={() => setIsArtistModalOpen(false)}
        />
      </Modal>

       <Modal 
        open={isAlbumModalOpen} 
        onClose={() => setIsAlbumModalOpen(false)}
        title="Добавление нового альбома"
      >
        <AlbumForm 
          artists={artists} 
          onSubmit={handleCreateAlbum}
          onCancel={() => setIsAlbumModalOpen(false)}
        />
      </Modal>


    </div>
  );
};

export default AdminPanel;