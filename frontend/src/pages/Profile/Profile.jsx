import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import './Profile.css';

const Profile = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка данных пользователя
        const ordersResponse = await api.getOrders();
        setOrders(ordersResponse.data || []);
        setUserData(user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="profile-page">
      <h2>Личный кабинет</h2>
      
      <div className="profile-section">
        <h3>Личные данные</h3>
        <div className="user-info">
          <p><strong>Имя:</strong> {userData?.first_name || 'Не указано'}</p>
          <p><strong>Фамилия:</strong> {userData?.last_name || 'Не указано'}</p>
          <p><strong>Email:</strong> {userData?.email}</p>
        </div>
      </div>

      <div className="orders-section">
        <h3>Мои заказы</h3>
        {orders.length > 0 ? (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <p>Заказ #{order.id} - {order.status}</p>
                <p>Сумма: ${order.total_amount}</p>
                <Link to={`/order/${order.id}`}>Подробнее</Link>
              </div>
            ))}
          </div>
        ) : (
          <p>У вас пока нет заказов</p>
        )}
      </div>

      <div className="actions-section">
        <button className="edit-profile-btn">Редактировать профиль</button>
      </div>
    </div>
  );
};

export default Profile;