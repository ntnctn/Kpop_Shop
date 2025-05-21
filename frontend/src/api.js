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

  // Артисты
  getArtist(id) {
    return axios.get(`${API_BASE_URL}/artists/${id}`);
  },

  getArtistAlbums(id) {
    return axios.get(`${API_BASE_URL}/artists/${id}/albums`);
  },

  getArtistsByCategory(category) {
    return axios.get(`${API_BASE_URL}/artists/${category}`);
  },

  getArtistCategories() {
    return axios.get(`${API_BASE_URL}/artist_categories`);
  },

  // Получение полной информации об исполнителе с альбомами
  getArtistWithAlbums(artistId) {
    return axios.get(`${API_BASE_URL}/artists/${artistId}`);
  },

  // Авторизация
  login(email, password) {
    return axios.post(`${API_BASE_URL}/login`, { email, password });
  },

  register(userData) {
    return axios.post(`${API_BASE_URL}/register`, userData);
  }
};