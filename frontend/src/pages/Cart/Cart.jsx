import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Link
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.getCart(); // Используем метод getCart из api
        setCartItems(response.data.items || []);
      } catch (err) {
        setError(err.message || 'Не удалось загрузить корзину');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCart();
  }, []);

  const handleRemoveItem = async (itemId) => {
    try {
      await api.removeFromCart(itemId); // Используем метод removeFromCart из api
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } catch (err) {
      setError(err.message || 'Не удалось удалить товар из корзины');
    }
  };

   const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  if (loading) return <Typography>Загрузка корзины...</Typography>;
  if (error) return <Typography color="error">Ошибка: {error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Ваша корзина
      </Typography>
      
      {cartItems.length === 0 ? (
        <Typography variant="h6">Ваша корзина пуста</Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Альбом</TableCell>
                  <TableCell>Версия</TableCell>
                  <TableCell>Цена</TableCell>
                  <TableCell>Количество</TableCell>
                  <TableCell>Сумма</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src={item.main_image_url} 
                          alt={item.album_title}
                          style={{ width: 50, height: 50, marginRight: 10 }}
                        />
                        {item.album_title}
                      </Box>
                    </TableCell>
                    <TableCell>{item.version_name}</TableCell>
                    <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${(Number(item.price) * item.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h5">
              Итого: ${calculateTotal().toFixed(2)}
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              color="primary"
              component={Link}
              to="/checkout"
            >
              Оформить заказ
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Cart;