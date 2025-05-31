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
  Alert
} from '@mui/material';

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
      
      <Grid container spacing={3}>
        {albums.map(album => (
          <Grid item xs={12} sm={6} md={4} key={album.id}>
            <Card component={Link} to={`/album/${album.id}`} sx={{ textDecoration: 'none', height: '100%' }}>
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {album.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Исполнитель: {album.artist}
                </Typography>
                <Typography variant="body1">
                  Цена: ${album.base_price}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Catalog;