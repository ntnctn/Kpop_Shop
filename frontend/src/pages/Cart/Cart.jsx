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
  Snackbar,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../api';

const Cart = () => {
  const [cartData, setCartData] = useState({
    items: [],
    totals: { base_total: 0, final_total: 0, total_discount: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchCart = async () => {
    try {
      const response = await api.getCart();
      setCartData({
        items: response.data.items || [],
        totals: response.data.totals || { 
          base_total: 0, 
          final_total: 0, 
          total_discount: 0 
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Не удалось загрузить корзину');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemoveItem = async (itemId) => {
    try {
      await api.removeFromCart(itemId);
      await fetchCart(); // Обновляем корзину после удаления
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Не удалось удалить товар из корзины');
    }
  };

  const handleCheckout = async () => {
    try {
      if (cartData.items.length === 0) {
        throw new Error('Корзина пуста');
      }

      await api.createOrder();
      await fetchCart(); // Обновляем корзину (она станет пустой)
      
      setSuccess('Заказ успешно оформлен!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка оформления заказа');
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };


  if (loading) return <Typography>Загрузка корзины...</Typography>;
  if (error) return <Typography color="error">Ошибка: {error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Ваша корзина
      </Typography>

      {/* Уведомления */}
       <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {success}
        </Alert>
      </Snackbar>


      {cartData.items.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" gutterBottom>
            {success ? 'Заказ оформлен!' : 'Ваша корзина пуста'}
          </Typography>
          {success && (
            <Typography color="text.secondary">
              Номер вашего заказа: {success.orderId}
            </Typography>
          )}
        </Box>
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
                {cartData.items.map((item) => (
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
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {item.discount_percent > 0 && (
                          <>
                            <Typography sx={{
                              textDecoration: 'line-through',
                              color: 'text.secondary',
                              fontSize: '0.875rem'
                            }}>
                              ${Number(item.base_price).toFixed(2)}
                            </Typography>
                            <Typography sx={{
                              color: 'error.main',
                              fontWeight: 'bold'
                            }}>
                              ${Number(item.final_price).toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.main' }}>
                              Скидка {item.discount_percent}%
                            </Typography>
                          </>
                        )}
                        {item.discount_percent <= 0 && (
                          <Typography>
                            ${Number(item.base_price).toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      ${(Number(item.final_price) * item.quantity).toFixed(2)}
                    </TableCell>
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

          <Box sx={{
            mt: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1
          }}>
            <Typography variant="h6" sx={{ textDecoration: 'line-through' }}>
              Итого без скидки: ${cartData.totals.base_total.toFixed(2)}
            </Typography>
            {cartData.totals.total_discount > 0 && (
              <Typography variant="h6" color="success.main">
                Ваша скидка: ${cartData.totals.total_discount.toFixed(2)}
              </Typography>
            )}
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Итого к оплате: ${cartData.totals.final_total.toFixed(2)}
            </Typography>

            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={handleCheckout}
              sx={{ mt: 2 }}
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