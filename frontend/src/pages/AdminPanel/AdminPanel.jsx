import React, { useState, useEffect } from 'react';
import { 
  Tab, Tabs, Box, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel, 
  Checkbox, FormControlLabel, CircularProgress
} from '@mui/material';
import api from '../../api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояния для артистов
  const [artists, setArtists] = useState([]);
  const [newArtist, setNewArtist] = useState({
    name: '',
    category: 'female_group',
    description: '',
    image_url: ''
  });

  // Состояния для альбомов
  const [albums, setAlbums] = useState([]);
  const [newAlbum, setNewAlbum] = useState({
    artist_id: '',
    title: '',
    base_price: '',
    description: '',
    status: 'in_stock',
    preorder_start: '',
    preorder_end: '',
    versions: [{ 
      version_name: '', 
      price_diff: 0, 
      description: '', 
      packaging_details: '', 
      preorder_bonuses: '', 
      is_limited: false, 
      stock_quantity: 0 
    }]
  });

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // setError(null);
        
        // Загружаем артистов и альбомы параллельно
        const authCheck = await api.checkAuth();
    if (!authCheck.data.is_admin) {
      throw new Error('You do not have admin privileges');
    }
        
        const [artistsRes, albumsRes] = await Promise.all([
          api.getAdminArtists(),
          api.getAdminAlbums()
        ]);
        
        setArtists(artistsRes.data);
        setAlbums(albumsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
    console.error('Admin panel error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Создание нового артиста
  const handleCreateArtist = async () => {
    if (!newArtist.name) {
      alert('Название группы обязательно');
      return;
    }
    
    try {
      const response = await api.createArtist(newArtist);
      setArtists([...artists, response.data]);
      
      // Сброс формы
      setNewArtist({
        name: '',
        category: 'female_group',
        description: '',
        image_url: ''
      });
      
      alert('Артист успешно создан!');
    } catch (error) {
      console.error('Error creating artist:', error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };

  // Обработчики для версий альбома
  const handleAlbumVersionChange = (index, field, value) => {
    const newVersions = [...newAlbum.versions];
    newVersions[index][field] = value;
    setNewAlbum({ ...newAlbum, versions: newVersions });
  };

  // Добавление новой версии
  const addNewVersion = () => {
    setNewAlbum({
      ...newAlbum,
      versions: [
        ...newAlbum.versions,
        { 
          version_name: '', 
          price_diff: 0, 
          description: '', 
          packaging_details: '', 
          preorder_bonuses: '', 
          is_limited: false, 
          stock_quantity: 0 
        }
      ]
    });
  };

  // Удаление версии
  const removeVersion = (index) => {
    const newVersions = [...newAlbum.versions];
    newVersions.splice(index, 1);
    setNewAlbum({ ...newAlbum, versions: newVersions });
  };

  // Создание нового альбома
  const handleCreateAlbum = async () => {
    // Валидация
    if (!newAlbum.artist_id || !newAlbum.title || !newAlbum.base_price) {
      alert('Заполните обязательные поля: артист, название, базовая цена');
      return;
    }
    
    if (newAlbum.versions.some(v => !v.version_name)) {
      alert('У всех версий должно быть название');
      return;
    }
    
    try {
      // Преобразование типов данных
      const albumData = {
        ...newAlbum,
        base_price: parseFloat(newAlbum.base_price),
        versions: newAlbum.versions.map(v => ({
          ...v,
          price_diff: parseFloat(v.price_diff),
          stock_quantity: parseInt(v.stock_quantity)
        }))
      };
      
      const response = await api.createAlbum(albumData);
      setAlbums([...albums, response.data]);
      
      // Сброс формы
      setNewAlbum({
        artist_id: '',
        title: '',
        base_price: '',
        description: '',
        status: 'in_stock',
        preorder_start: '',
        preorder_end: '',
        versions: [{ 
          version_name: '', 
          price_diff: 0, 
          description: '', 
          packaging_details: '', 
          preorder_bonuses: '', 
          is_limited: false, 
          stock_quantity: 0 
        }]
      });
      
      alert('Альбом успешно создан!');
    } catch (error) {
      console.error('Error creating album:', error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel-loading">
        <CircularProgress size={60} />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h2>Административная панель</h2>
      
      <Tabs 
        value={tabValue} 
        onChange={(e, newVal) => setTabValue(newVal)}
        variant="fullWidth"
      >
        <Tab label="Артисты" />
        <Tab label="Альбомы" />
      </Tabs>

      {/* Вкладка артистов */}
      {tabValue === 0 && (
        <Box p={3}>
          <h3>Управление артистами</h3>
          
          <div className="form-section">
            <TextField
              label="Название группы*"
              value={newArtist.name}
              onChange={(e) => setNewArtist({...newArtist, name: e.target.value})}
              fullWidth
              margin="normal"
              variant="outlined"
            />
            
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Категория</InputLabel>
              <Select
                value={newArtist.category}
                onChange={(e) => setNewArtist({...newArtist, category: e.target.value})}
                label="Категория"
              >
                <MenuItem value="female_group">Женская группа</MenuItem>
                <MenuItem value="male_group">Мужская группа</MenuItem>
                <MenuItem value="solo">Сольный артист</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Описание"
              value={newArtist.description}
              onChange={(e) => setNewArtist({...newArtist, description: e.target.value})}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              label="URL изображения"
              value={newArtist.image_url}
              onChange={(e) => setNewArtist({...newArtist, image_url: e.target.value})}
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="https://example.com/image.jpg"
            />

            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateArtist}
              style={{ marginTop: 20 }}
              fullWidth
              size="large"
            >
              Создать артиста
            </Button>
          </div>

          <div className="list-section">
            {artists.map(artist => (
              <div key={artist.id} className="list-item">
                <h4>{artist.name}</h4>
                <p>
                  <strong>Категория:</strong> 
                  {artist.category === 'female_group' ? ' Женская группа' : 
                   artist.category === 'male_group' ? ' Мужская группа' : ' Сольный артист'}
                </p>
                {artist.description && (
                  <p><strong>Описание:</strong> {artist.description}</p>
                )}
                {artist.image_url && (
                  <div className="artist-image-preview">
                    <img 
                      src={artist.image_url} 
                      alt={artist.name} 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Вкладка альбомов */}
      {tabValue === 1 && (
        <Box p={3}>
          <h3>Управление альбомами</h3>
          
          <div className="form-section">
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Артист*</InputLabel>
              <Select
                value={newAlbum.artist_id}
                onChange={(e) => setNewAlbum({...newAlbum, artist_id: e.target.value})}
                label="Артист*"
              >
                <MenuItem value="">Выберите артиста</MenuItem>
                {artists.map(artist => (
                  <MenuItem key={artist.id} value={artist.id}>
                    {artist.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Название альбома*"
              value={newAlbum.title}
              onChange={(e) => setNewAlbum({...newAlbum, title: e.target.value})}
              fullWidth
              margin="normal"
              variant="outlined"
            />

            <TextField
              label="Базовая цена*"
              type="number"
              value={newAlbum.base_price}
              onChange={(e) => setNewAlbum({...newAlbum, base_price: e.target.value})}
              fullWidth
              margin="normal"
              variant="outlined"
              inputProps={{ min: "0", step: "0.01" }}
            />

            <TextField
              label="Описание альбома"
              value={newAlbum.description}
              onChange={(e) => setNewAlbum({...newAlbum, description: e.target.value})}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              variant="outlined"
            />

            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Статус</InputLabel>
              <Select
                value={newAlbum.status}
                onChange={(e) => setNewAlbum({...newAlbum, status: e.target.value})}
                label="Статус"
              >
                <MenuItem value="in_stock">В наличии</MenuItem>
                <MenuItem value="pre_order">Предзаказ</MenuItem>
                <MenuItem value="out_of_stock">Нет в наличии</MenuItem>
              </Select>
            </FormControl>

            {newAlbum.status === 'pre_order' && (
              <div className="preorder-dates">
                <TextField
                  label="Дата начала предзаказа"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newAlbum.preorder_start}
                  onChange={(e) => setNewAlbum({...newAlbum, preorder_start: e.target.value})}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  label="Дата окончания предзаказа"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newAlbum.preorder_end}
                  onChange={(e) => setNewAlbum({...newAlbum, preorder_end: e.target.value})}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </div>
            )}

            <h3>Версии альбома</h3>
            {newAlbum.versions.map((version, index) => (
              <div key={index} className="version-form">
                <div className="version-header">
                  <h4>Версия #{index + 1}</h4>
                  <Button 
                    variant="outlined" 
                    color="error"
                    size="small"
                    onClick={() => removeVersion(index)}
                    disabled={newAlbum.versions.length === 1}
                  >
                    Удалить
                  </Button>
                </div>
                
                <TextField
                  label="Название версии*"
                  value={version.version_name}
                  onChange={(e) => handleAlbumVersionChange(index, 'version_name', e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                
                <TextField
                  label="Доплата за версию"
                  type="number"
                  value={version.price_diff}
                  onChange={(e) => handleAlbumVersionChange(index, 'price_diff', e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: "0", step: "0.01" }}
                />
                
                <TextField
                  label="Описание версии"
                  value={version.description}
                  onChange={(e) => handleAlbumVersionChange(index, 'description', e.target.value)}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  variant="outlined"
                />
                
                <TextField
                  label="Наполнение"
                  value={version.packaging_details}
                  onChange={(e) => handleAlbumVersionChange(index, 'packaging_details', e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                
                <TextField
                  label="Бонусы предзаказа"
                  value={version.preorder_bonuses}
                  onChange={(e) => handleAlbumVersionChange(index, 'preorder_bonuses', e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={version.is_limited}
                      onChange={(e) => handleAlbumVersionChange(index, 'is_limited', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Лимитированная версия"
                />
                
                <TextField
                  label="Количество в наличии"
                  type="number"
                  value={version.stock_quantity}
                  onChange={(e) => handleAlbumVersionChange(index, 'stock_quantity', e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: "0" }}
                />
              </div>
            ))}

            <Button 
              variant="outlined" 
              onClick={addNewVersion}
              style={{ marginTop: 10 }}
              fullWidth
            >
              + Добавить версию
            </Button>

            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateAlbum}
              style={{ marginTop: 20 }}
              fullWidth
              size="large"
            >
              Создать альбом
            </Button>
          </div>

          <div className="list-section">
            {albums.map(album => (
              <div key={album.id} className="list-item">
                <h4>{album.title}</h4>
                <p><strong>Артист:</strong> {album.artist_name}</p>
                <p><strong>Базовая цена:</strong> ${album.base_price}</p>
                <p>
                  <strong>Статус:</strong> 
                  {album.status === 'in_stock' ? ' В наличии' : 
                   album.status === 'pre_order' ? ' Предзаказ' : ' Нет в наличии'}
                </p>
                
                {album.versions && album.versions.length > 0 && (
                  <div className="album-versions">
                    <p><strong>Версии:</strong></p>
                    <ul>
                      {album.versions.map(version => (
                        <li key={version.id}>
                          {version.version_name} (+${version.price_diff})
                          {version.is_limited && ' (Лимитированная)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Box>
      )}
    </div>
  );
};

export default AdminPanel;