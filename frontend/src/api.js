import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true
});


// эээээээээээээээээээээээээээ
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('LocalStorage blocked:', e);
}


// токен в заголовки 
apiInstance.interceptors.request.use(config => { 
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Обработчик запросов
apiInstance.interceptors.request.use(config => {
  // Для OPTIONS запросов не добавляем заголовки
  if (config.method.toUpperCase() !== 'OPTIONS') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});


export default {
  getAlbums() {
    return apiInstance.get('/albums');
  },

  getAlbum(id) {
    return apiInstance.get(`/albums/${id}`);
  },

  getArtist(id) {
    return apiInstance.get(`/artists/${id}`);
  },

  //сортировка
getArtistAlbums(artistId, params = {}) {
  return apiInstance.get(`/artists/${artistId}/albums`, { 
    params: { ...params, limit: 1000 } // Явно указываем большой лимит
  });
},


  getArtistsByCategory(category) {
    return apiInstance.get(`/artists/${category}`);
  },

  getArtistCategories() {
    return apiInstance.get('/artist_categories');
  },


  // Админские методы для управления пользователями
  getAllUsers: (params = {}) => apiInstance.get('/admin/users', { params }),
  getUserById: (userId) => apiInstance.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => apiInstance.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => apiInstance.delete(`/admin/users/${userId}`),




  // НОВЫЕ АДМИНСКИЕ МЕТОДЫ
  getAdminAlbums: () => apiInstance.get('/admin/albums'),
  createAlbum: (albumData) => apiInstance.post('/admin/albums', albumData),


  //Метод для проверки авторизации
  checkAuth: () => apiInstance.get('/check-auth'),

  // Запросы к админке с обработкой ошибок
  getAdminArtists: async () => {
    try {
      // Сначала проверяем авторизацию
      const authCheck = await apiInstance.get('/check-auth');
      if (!authCheck.data.is_admin) {
        throw new Error('Not an admin');
      }
      // Затем делаем запрос
      return await apiInstance.get('/admin/artists');
    } catch (error) {
      console.error('Admin request failed:', error);
      throw error;
    }
  },



  createArtist: (artistData) => apiInstance.post('/admin/artists', artistData),



  // Метод для валидации токена
  validateToken: () => apiInstance.get('/api/validate-token'),








  // Новые методы для редактирования
  updateArtist: (id, artistData) => apiInstance.put(`/admin/artists/${id}`, artistData),
  updateAlbum: (id, albumData) => apiInstance.put(`/admin/albums/${id}`, albumData),
  getArtistById: (id) => apiInstance.get(`/admin/artists/${id}`),
  getAlbumById: (id) => apiInstance.get(`/admin/albums/${id}`),


  deleteArtist: (id) => apiInstance.delete(`/admin/artists/${id}`),
  deleteAlbum: (id) => apiInstance.delete(`/admin/albums/${id}`),

  //обработка ошибок
  deleteArtist: async (id) => {
    try {
      const response = await apiInstance.delete(`/admin/artists/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting artist:', error);
      throw error;
    }
  },

  deleteAlbum: async (id) => {
    try {
      const response = await apiInstance.delete(`/admin/albums/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting album:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiInstance.delete(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  updateUser: async (userId, userData) => {
    try {
      const response = await apiInstance.put(`/admin/users/${userId}`, userData);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  // Скидки для админской панели
  getDiscounts: () => apiInstance.get('/admin/discounts'),
  createDiscount: (discountData) => apiInstance.post('/admin/discounts', discountData),
  updateDiscount: (id, discountData) => apiInstance.put(`/admin/discounts/${id}`, discountData),
  deleteDiscount: (id) => apiInstance.delete(`/admin/discounts/${id}`),
  getDiscountAlbums: (discountId) => apiInstance.get(`/admin/discounts/${discountId}/albums`),
  addAlbumToDiscount: (discountId, albumId) => apiInstance.post(`/admin/discounts/${discountId}/albums`, { album_id: albumId }),
  removeAlbumFromDiscount: (discountId, albumId) => apiInstance.delete(`/admin/discounts/${discountId}/albums/${albumId}`),

  // скидки для простых юзеров для страницы альбома

  getAlbumDiscounts: (albumId) => apiInstance.get(`/albums/${albumId}/discounts`),





  // Админские методы для управления заказами
  getAllOrders: (params = {}) => apiInstance.get('/admin/orders', { params }),
  getOrderById: (orderId) => apiInstance.get(`/admin/orders/${orderId}`),
  updateOrderStatus: (orderId, statusData) => apiInstance.put(`/admin/orders/${orderId}/status`, statusData),
  deleteOrder: (orderId) => apiInstance.delete(`/admin/orders/${orderId}`),

  // С обработкой ошибок:
  deleteOrder: async (orderId) => {
    try {
      const response = await apiInstance.delete(`/admin/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },
  updateOrderStatus: async (orderId, statusData) => {
    try {
      const response = await apiInstance.put(`/admin/orders/${orderId}/status`, statusData);
      return response;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },





  // Корзина
  getCart: () => apiInstance.get('/cart'),
  addToCart: (versionId, quantity = 1) => apiInstance.post('/cart', { version_id: versionId, quantity }),
  removeFromCart: (itemId) => apiInstance.delete(`/cart/${itemId}`),
  getCartItemsCount: () => apiInstance.get('/cart/items/count'),
  clearCart: () => apiInstance.post('/cart/clear'),

  //заказ 
  createOrder: () => apiInstance.post('/orders'),
  clearCart: () => apiInstance.post('/cart/clear'),

  // Профиль
  getProfile: () => apiInstance.get('/profile'),
  updateProfile: (profileData) => apiInstance.put('/profile', profileData),

  // Адреса
  getAddresses: () => apiInstance.get('/addresses'),
  createAddress: (addressData) => apiInstance.post('/addresses', addressData),
  updateAddress: (id, addressData) => apiInstance.put(`/addresses/${id}`, addressData),
  deleteAddress: (id) => apiInstance.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => apiInstance.patch(`/addresses/${id}`),

  // Избранное
  getWishlist: () => apiInstance.get('/wishlist'),
  addToWishlist: (albumId) => apiInstance.post('/wishlist', { album_id: albumId }),
  removeFromWishlist: (albumId) => apiInstance.delete('/wishlist', { data: { album_id: albumId } }),

  // заказы для пользователя 

  // Для получения списка заказов
  getUserOrders: (params = {}) => apiInstance.get('/orders', { params }),

  // Для получения конкретного заказа
  getUserOrder: (orderId) => apiInstance.get(`/orders/${orderId}`),






  // Изменяем функцию регистрации
  // Исправляем запрос регистрации
  register: async (email, password, firstName, lastName) => {
    try {
      // Сначала отправляем OPTIONS запрос
      await apiInstance.options('/register');

      // Затем основной POST запрос
      const response = await apiInstance.post('/register', {
        email,
        password,
        firstName,
        lastName
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Аналогично для login
  login: async (email, password) => {
    try {
      const response = await apiInstance.post('/login', { email, password });
      console.log("Full login response:", response.data); // Для отладки

      // Возвращаем весь объект ответа
      return response.data;
    } catch (error) {
      console.error('Login request error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  }
};