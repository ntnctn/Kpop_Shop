import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

import SortOutlinedIcon from '@mui/icons-material/SortOutlined';

import './ArtistPage.css';

const ArtistPage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('release_date_desc');

  // Загрузка данных артиста
  const fetchArtistData = useCallback(async () => {
    try {
      const response = await api.getArtist(id);
      // Проверяем структуру ответа
      if (response.data && response.data.artist) {
        setArtist(response.data.artist);
      } else {
        // Если структура другая, пробуем получить данные напрямую
        setArtist(response.data || null);
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных артиста');
      console.error('Error fetching artist:', err);
    }
  }, [id]);

  // Загрузка всех альбомов с сортировкой
  const fetchAlbums = useCallback(async (sortOption = sortBy) => {
    try {
      setLoading(true);

      const params = {
        sort: sortOption
      };

      const response = await api.getArtistAlbums(id, params);
      const receivedAlbums = response.data.albums || response.data || [];
      setAlbums(receivedAlbums);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки альбомов');
    } finally {
      setLoading(false);
    }
  }, [id, sortBy]);

  // Первоначальная загрузка данных
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Загружаем данные артиста и альбомы параллельно
        await Promise.all([
          fetchArtistData(),
          fetchAlbums(sortBy)
        ]);
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных');
      }
    };
    loadInitialData();
  }, [fetchArtistData, fetchAlbums, sortBy]);

  // Обработчик изменения сортировки
  const handleSortChange = (event) => {
    const newSort = event.target.value;
    setSortBy(newSort);
    fetchAlbums(newSort);
  };

  // Получение названия категории
  const getCategoryName = (category) => {
    const categories = {
      'female_group': 'Женская группа',
      'male_group': 'Мужская группа',
      'solo': 'Сольный исполнитель'
    };
    return categories[category] || '';
  };

  if (loading && !artist) {
    return (
      <Box className="artist-page-container" display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="artist-page-container">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!artist) {
    return (
      <Box className="artist-page-container">
        <Alert severity="warning">Исполнитель не найден</Alert>
      </Box>
    );
  }

  return (
    <div className="artist-page-container">
      {/* Контейнер для изображения артиста */}
      <div className="artist-image-container">
        {artist.image_url ? (
          <img
            src={artist.image_url}
            alt={artist.name}
            className="artist-hero-image"
          />
        ) : (
          <div className="artist-image-placeholder">
            <Typography variant="h2">{artist.name}</Typography>
          </div>
        )}
      </div>

      {/* Контент, который накладывается на изображение */}
      <div className="artist-content-overlay">
        <div className="artist-header">
          <Typography variant="h1" className="artist-title">
            {artist.name}
          </Typography>
          {artist.description && (
            <Typography className="artist-description">
              {artist.description}
            </Typography>
          )}
        </div>
      </div>

      {/* Секция с альбомами (наезжает на изображение) */}
      <div className="albums-section-wrapper">
        <div className="albums-section">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <SortOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography  variant="body1" sx={{ color: 'text.secondary' }}>
                сортировка
            </Typography>
            <FormControl className="filter-section" size="small">
              <InputLabel id="sort-label" ></InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                onChange={handleSortChange}
                sx={{paddingLeft: '250px'}}
                className="filter-select"
              >
                <MenuItem value="release_date_desc">по дате (новые)</MenuItem>
                <MenuItem value="release_date_asc">по дате (старые)</MenuItem>
                <MenuItem value="price_asc">по возрастанию цены</MenuItem>
                <MenuItem value="price_desc">по убыванию цены</MenuItem>
                <MenuItem value="title_asc">по названию (А-Я)</MenuItem>
                <MenuItem value="title_desc">по названию (Я-А)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : albums && albums.length > 0 ? (
            <div className="albums-grid">
              {albums.map(album => (
                <Link
                  to={`/album/${album.id}`}
                  key={album.id}
                  className="album-card-link"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="album-card">
                    <div className="album-image-container">
                      {album.main_image_url ? (
                        <img
                          src={album.main_image_url}
                          alt={album.title}
                          className="album-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="album-image-placeholder">
                          <Typography>{album.title}</Typography>
                        </div>
                      )}
                      {album.main_image_url && (
                        <div className="album-image-placeholder" style={{ display: 'none' }}>
                          <Typography>{album.title}</Typography>
                        </div>
                      )}
                    </div>
                    <div className="album-info">
                      <Typography variant="albumDate" className="album-date">
                        {new Date(album.release_date).toLocaleDateString()}
                      </Typography>

                      <Typography variant="albumTitle" className="album-title">{album.title}</Typography>

                      <Typography variant="albumPrice" className="album-price">
                        от {album.base_price} ₽
                      </Typography>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Typography className="no-albums">У исполнителя пока нет альбомов</Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistPage;