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
  InputLabel,
  Button
} from '@mui/material';

const ArtistPage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('release_date_desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Загрузка альбомов с пагинацией и сортировкой
  const fetchAlbums = useCallback(async (pageNum = 1, sortOption = sortBy, shouldReset = false) => {
    try {
      setIsLoadingMore(true);
      
      const params = {
        page: pageNum,
        sort: sortOption,
        limit: 10
      };

      const response = await api.getArtistAlbums(id, params);
      const receivedAlbums = response.data.albums || response.data || [];

      if (shouldReset || pageNum === 1) {
        setAlbums(response.data.albums || []);
      } else {
        setAlbums(prev => [...prev, ...(response.data.albums || [])]);
      }

      setHasMore((response.data.albums || []).length >= 10);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки альбомов');
    } finally {
      setIsLoadingMore(false);
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
          fetchAlbums(1, sortBy, true)
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
    setPage(1);
    fetchAlbums(1, newSort, true);
  };

  // Загрузка дополнительных альбомов
  const loadMoreAlbums = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAlbums(nextPage);
  };

  // Обработчик бесконечного скролла
  const handleScroll = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreAlbums();
    }
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
//отладка
  useEffect(() => {
    console.log('Artist data:', artist);
    console.log('Albums data:', albums);
  }, [artist, albums]);

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
      {/* Секция с артистом  */}
      <div className="artist-hero">
        {artist.image_url ? (
          <img 
            src={artist.image_url} 
            alt={artist.name}
            className="artist-hero-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="artist-image-placeholder" style={{ height: '100%' }}>
            <Typography variant="h2">{artist.name}</Typography>
          </div>
        )}
        
        <div className="artist-hero-content">
          <div className="artist-hero-name">
<Typography variant="h1" className="artist-hero-title" >
            {artist.name}
          </Typography>
          
          
          {artist.description && (
            <Typography className="artist-hero-description">
              {artist.description}
            </Typography>
          )}
          </div>
          
        </div>
      </div>

      <div className="albums-section">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h2" className="artist-title">Альбомы</Typography>
          <FormControl className="filter-section" size="small">
            <InputLabel id="sort-label">Сортировка</InputLabel>
            <Select
              labelId="sort-label"
              value={sortBy}
              onChange={handleSortChange}
              className="filter-select"
              label="Сортировка"
            >
              <MenuItem value="release_date_desc">По дате (новые)</MenuItem>
              <MenuItem value="release_date_asc">По дате (старые)</MenuItem>
              <MenuItem value="price_asc">По цене (дешевые)</MenuItem>
              <MenuItem value="price_desc">По цене (дорогие)</MenuItem>
              <MenuItem value="title_asc">По названию (А-Я)</MenuItem>
              <MenuItem value="title_desc">По названию (Я-А)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {albums && albums.length > 0 ? (
          <>
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
                      <Typography variant="h3" className="album-title">{album.title}</Typography>
                      <Typography className="album-date">
                        {new Date(album.release_date).toLocaleDateString()}
                      </Typography>
                      <Typography className="album-price">
                        От {album.base_price} ₽
                      </Typography>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {isLoadingMore && (
              <div className="loading-indicator">
                <CircularProgress />
              </div>
            )}

            {!isLoadingMore && hasMore && (
              <div className="load-more-container">
                <Button 
                  variant="contained" 
                  onClick={loadMoreAlbums}
                  disabled={isLoadingMore}
                >
                  Показать еще
                </Button>
              </div>
            )}
          </>
        ) : (
          <Typography className="no-albums">У исполнителя пока нет альбомов</Typography>
        )}
      </div>
    </div>
  );
};

export default ArtistPage;