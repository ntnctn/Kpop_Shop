import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export default {
  // Альбомы
  getAlbums() {
    return axios.get(`${API_BASE_URL}/albums`);
  },
  
  getAlbum(id) {
    return axios.get(`${API_BASE_URL}/albums/${id}`);
  },

  // Авторизация
  login(email, password) {
    return axios.post(`${API_BASE_URL}/login`, { email, password });
  },

  register(userData) {
    return axios.post(`${API_BASE_URL}/register`, userData);
  },

  // Корзина
  getCart(userId) {
    return axios.get(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }
};