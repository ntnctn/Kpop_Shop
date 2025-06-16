import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Catalog = () => {
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await api.getAlbums();
        setAlbums(response.data);
        setFilteredAlbums(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAlbums(albums);
    } else {
      const filtered = albums.filter(album => 
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAlbums(filtered);
    }
  }, [searchQuery, albums]);

  if (loading) return (
    <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Container>
  );
  
  if (error) return <Alert severity="error">Ошибка: {error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Каталог альбомов
      </Typography>
      
      <TextField
        className='catalog-search'
        fullWidth
        // label="Поиск альбомов (по названию или исполнителю)"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Grid container spacing={3}>
        {filteredAlbums.length > 0 ? (
          filteredAlbums.map(album => (
            <Grid item xs={12} sm={6} md={4} key={album.id}>
              <Card component={Link} to={`/album/${album.id}`} sx={{ textDecoration: 'none', height: '100%' }}>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {album.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                     {album.artist}
                  </Typography>
                  <Typography variant="body1">
                     ${album.base_price}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" textAlign="center">
              Ничего не найдено
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Catalog;