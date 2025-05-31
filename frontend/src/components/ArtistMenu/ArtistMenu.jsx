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
  Alert
} from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

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
          [categoryId]: []
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

  if (loading) return (
    <Box display="flex" justifyContent="center" p={3}>
      <CircularProgress />
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