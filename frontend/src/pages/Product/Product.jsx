import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { 
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import './Product.css';

const Product = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [currentImage, setCurrentImage] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        setLoading(true);
        const [albumResponse, discountsResponse] = await Promise.all([
          api.getAlbum(id),
          api.getAlbumDiscounts(id)
        ]);
        
        setAlbum(albumResponse.data);
        setDiscounts(discountsResponse.data);
        setCurrentImage(albumResponse.data.main_image_url);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching album:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  useEffect(() => {
    if (!album || !album.versions) return;
    
    const version = album.versions[selectedVersion];
    const versionImage = version?.images?.[0] || album.main_image_url;
    setCurrentImage(versionImage);
    setImageLoading(true);
  }, [selectedVersion, album]);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '300px'
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) return <Alert severity="error">Ошибка: {error}</Alert>;
  if (!album) return <Alert severity="warning">Альбом не найден</Alert>;

  // Price calculations
  const basePrice = typeof album.base_price === 'string' 
    ? parseFloat(album.base_price) 
    : album.base_price;

  const currentVersion = album.versions?.[selectedVersion] || null;
  
  const versionPriceDiff = currentVersion 
    ? (typeof currentVersion.price_diff === 'string'
      ? parseFloat(currentVersion.price_diff)
      : currentVersion.price_diff || 0)
    : 0;

  const priceWithoutDiscount = basePrice + versionPriceDiff;
  
  // Filter active discounts
  const now = new Date();
  const activeDiscounts = discounts.filter(d => {
    const startDate = new Date(d.start_date);
    const endDate = new Date(d.end_date);
    return d.is_active && startDate <= now && endDate >= now;
  });

  // Find max discount
  const maxDiscount = activeDiscounts.length > 0
    ? Math.max(...activeDiscounts.map(d => d.discount_percent))
    : 0;

  const discountedPrice = maxDiscount > 0
    ? priceWithoutDiscount * (100 - maxDiscount) / 100
    : priceWithoutDiscount;

  // Format price with 2 decimal places
  const formatPrice = (price) => price.toFixed(2);

  // Format date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Check if album is in stock
  const isInStock = currentVersion?.stock_quantity > 0;

  return (
    <Container maxWidth="lg" className="product-page">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        mt: 4,
        mb: 6
      }}>
        {/* Image block - теперь квадратный */}
        <Box sx={{ 
          width: { xs: '100%', md: '400px' },
          height: '400px',
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>
          {imageLoading && (
            <CircularProgress sx={{ position: 'absolute' }} />
          )}
          
          {currentImage ? (
            <img
              src={currentImage}
              alt={album.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageLoading ? 'none' : 'block'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : null}
          
          <Box sx={{
            display: currentImage ? 'none' : 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#e0e0e0',
            color: '#616161',
            p: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h5" component="div">
              {album.title}
            </Typography>
            <Typography variant="subtitle1">
              {album.artist_name}
            </Typography>
          </Box>
        </Box>

        {/* Info block */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {album.title}
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
            {album.artist_name}
          </Typography>
          
          {/* Discounts section */}
          {activeDiscounts.length > 0 && (
            <Box sx={{ 
              backgroundColor: 'warning.light',
              borderRadius: 1,
              p: 2,
              mb: 3
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                🎉 Акционные предложения
              </Typography>
              
              {activeDiscounts.map((discount) => (
                <Box key={discount.id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Chip 
                      label={`-${discount.discount_percent}%`}
                      color="error"
                      size="small"
                      sx={{ 
                        mr: 1, 
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {discount.name}
                    </Typography>
                  </Box>
                  
                  {discount.description && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {discount.description}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Действует до: {formatDate(discount.end_date)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Version selector */}
          {album.versions?.length > 1 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Версия:
              </Typography>
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1
              }}>
                {album.versions.map((version, index) => (
                  <Button
                    key={version.id}
                    variant={selectedVersion === index ? 'contained' : 'outlined'}
                    onClick={() => setSelectedVersion(index)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 1,
                      borderWidth: selectedVersion === index ? 0 : 1
                    }}
                  >
                    {version.version_name}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* Version details */}
          {currentVersion && (
            <Box sx={{ mb: 3 }}>
              {currentVersion.packaging_details && (
                <Typography paragraph sx={{ mb: 1 }}>
                  <strong>Упаковка:</strong> {currentVersion.packaging_details}
                </Typography>
              )}
              
              {currentVersion.preorder_bonuses && (
                <Typography paragraph sx={{ mb: 1 }}>
                  <strong>Бонусы предзаказа:</strong> {currentVersion.preorder_bonuses}
                </Typography>
              )}
              
              {currentVersion.is_limited && (
                <Typography paragraph sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  color: 'warning.dark',
                  mb: 1
                }}>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Лимитированная версия
                </Typography>
              )}
            </Box>
          )}

          {/* Price block */}
          <Box sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 1,
            p: 2,
            mb: 3
          }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Цена:
            </Typography>
            
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              {maxDiscount > 0 ? (
                <>
                  <Typography variant="h4" sx={{ 
                    color: 'error.main',
                    fontWeight: 'bold'
                  }}>
                    ${formatPrice(discountedPrice)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    textDecoration: 'line-through',
                    color: 'text.secondary'
                  }}>
                    ${formatPrice(priceWithoutDiscount)}
                  </Typography>
                  <Chip 
                    label={`-${maxDiscount}%`}
                    color="error"
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </>
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ${formatPrice(priceWithoutDiscount)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Add to cart button */}
          <Tooltip 
            title={!isInStock ? "Товар временно отсутствует" : ""}
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!isInStock}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 1
                }}
              >
                {isInStock ? 'Есть в наличии' : 'Нет в наличии'}
              </Button>
            </span>
          </Tooltip>

          {/* Album description */}
          {album.description && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                Описание
              </Typography>
              <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
                {album.description}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Product;