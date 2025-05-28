import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true
});


// Добавьте в начало api.js
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('LocalStorage blocked:', e);
}


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


// Обработчик ответов
// apiInstance.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('userData');
//     }
//     return Promise.reject(error);
//   }
// );

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

  getArtistsByCategory(category) {
    return apiInstance.get(`/artists/${category}`);
  },

  getArtistCategories() {
    return apiInstance.get('/artist_categories');
  },

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