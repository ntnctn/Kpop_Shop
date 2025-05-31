import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';

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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return <Alert severity="error">Ошибка: {error}</Alert>;
  if (!album) return <Alert severity="warning">Альбом не найден</Alert>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        {album.title}
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Исполнитель: {album.artist_name}
      </Typography>
      
      {album.versions?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Информация о версиях:
          </Typography>
          <List>
            {album.versions.map(version => (
              <ListItem key={version.id}>
                <ListItemText 
                  primary={version.version_name} 
                  secondary={`$${version.price_diff}`} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Typography paragraph>
        {album.description}
      </Typography>
    </Container>
  );
};

export default Product;