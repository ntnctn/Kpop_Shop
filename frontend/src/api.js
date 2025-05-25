import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Добавляем все необходимые методы
export default {
  // Альбомы
  getAlbums() {
    return apiInstance.get('/albums');
  },
  
  getAlbum(id) {
    return apiInstance.get(`/albums/${id}`);
  },

  // Артисты
  getArtist(id) {
    return apiInstance.get(`/artists/${id}`);
  },

  getArtistWithAlbums(artistId) {
    return apiInstance.get(`/artists/${artistId}/albums`);
  },

  getArtistsByCategory(category) {
    return apiInstance.get(`/artists/${category}`);
  },

  getArtistCategories() {
    return apiInstance.get('/artist_categories');
  },

  // Авторизация
  register: async (email, password, firstName, lastName) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/login`, {
        auth: {
          username: email.trim(),
          password: password.trim()
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Корзина
  getCart() {
    return apiInstance.get('/cart');
  },

  addToCart(versionId, quantity = 1) {
    return apiInstance.post('/cart', { version_id: versionId, quantity });
  },

  // Избранное
  getWishlist() {
    return apiInstance.get('/wishlist');
  },

  addToWishlist(albumId) {
    return apiInstance.post('/wishlist', { album_id: albumId });
  },

  removeFromWishlist(albumId) {
    return apiInstance.delete(`/wishlist/${albumId}`);
  }
};