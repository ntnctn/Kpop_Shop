import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import api from '../../api';

const Profile = ({ currentUser }) => {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, ordersResponse] = await Promise.all([
          api.get(`/users/${currentUser.id}`),
          api.get('/orders')
        ]);
        
        setUserData(userResponse.data);
        setOrders(ordersResponse.data.orders || []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) return <Typography>Загрузка...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Личный кабинет
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 3 }}>
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h5">
              {userData?.first_name} {userData?.last_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <EmailIcon color="action" sx={{ mr: 1 }} />
              <Typography color="text.secondary">
                {userData?.email}
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />}
            sx={{ ml: 'auto' }}
          >
            Редактировать
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1 }} />
            История заказов
          </Typography>
          
          {orders.length === 0 ? (
            <Typography>У вас пока нет заказов</Typography>
          ) : (
            <List>
              {orders.map(order => (
                <ListItem key={order.id} divider>
                  <ListItemAvatar>
                    <Avatar>
                      {order.status === 'delivered' ? '✓' : order.status.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Заказ #${order.id}`}
                    secondary={`${new Date(order.created_at).toLocaleDateString()} • ${order.total_amount} ₽`}
                  />
                  <Button size="small">Подробнее</Button>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
        
        <Paper sx={{ p: 3, width: 300 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FavoriteIcon sx={{ mr: 1 }} />
            Избранное
          </Typography>
          <Typography>Список избранного будет здесь</Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;