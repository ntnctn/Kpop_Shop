import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Alert, 
  Skeleton
} from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
const ArtistMenu = ({ onClose, preloaded }) => {
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(!preloaded); // Если предзагружено, не показываем загрузку
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем категории
        const categoriesResponse = await api.getArtistCategories();
        setCategories(categoriesResponse.data);
        
        // Если предзагрузка активна, загружаем всех артистов сразу
        if (preloaded) {
          const allArtists = {};
          for (const category of categoriesResponse.data) {
            const artistsResponse = await api.getArtistsByCategory(category.id);
            allArtists[category.id] = artistsResponse.data;
          }
          setArtists(allArtists);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preloaded]);

  // Загружаем артистов для категории при необходимости
  const handleCategoryClick = async (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      if (!artists[categoryId] && !preloaded) {
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
            [categoryId]: []
          }));
        }
      }
      setExpandedCategory(categoryId);
    }
  };

  if (loading) return (
    <Box p={2}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1 }} />
      ))}
    </Box>
  );

  if (error) return (
    <Box p={2}>
      <Alert severity="error">Ошибка загрузки: {error}</Alert>
    </Box>
  );

 return (
    <>
      <div className="artist-menu-backdrop" onClick={onClose} />
      
      <Box 
        className="artist-menu-container"
        sx={{
          backgroundColor: 'background.paper', // Явно задаем непрозрачный фон
          '& *': {
            borderLeft: 'none !important', // Убираем все левые границы
            borderRight: 'none !important' // Убираем все правые границы
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography variant="h6">Категории исполнителей</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: 'transparent' }} /> {/* Прозрачный разделитель */}
        
        <Box sx={{ 
          height: 'calc(100% - 64px)',
          overflow: 'hidden',
          '&:hover': {
            overflowY: 'auto'
          }
        }}>
          <List component="nav" sx={{ border: 'none' }}>
            {categories.map(category => (
              <Box key={category.id} sx={{ border: 'none' }}>
                <ListItemButton 
                  onClick={() => handleCategoryClick(category.id)}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    border: 'none'
                  }}
                >
                  <ListItemText primary={category.name} />
                  {expandedCategory === category.id ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </ListItemButton>
                
                <Collapse in={expandedCategory === category.id} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ border: 'none' }}>
                    {artists[category.id]?.map(artist => (
                      <ListItem 
                        key={artist.id} 
                        component={Link} 
                        to={`/artist/${artist.id}`}
                        onClick={onClose}
                        sx={{
                          pl: 4,
                          color: 'text.primary',
                          textDecoration: 'none',
                          '&:hover': { backgroundColor: 'action.selected' },
                          border: 'none'
                        }}
                      >
                        <ListItemText primary={artist.name} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
                <Divider sx={{ borderColor: 'transparent' }} /> {/* Прозрачный разделитель */}
              </Box>
            ))}
          </List>
        </Box>
      </Box>
    </>
  );
};

export default ArtistMenu;