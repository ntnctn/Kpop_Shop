import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Box, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '../../api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  
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
    main_image_url: '',
    versions: [{ version_name: '', price_diff: 0 }]
  });

  // Состояния для скидок
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({
    album_version_id: '',
    percentage: '',
    start_date: '',
    end_date: ''
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artistsRes, albumsRes, discountsRes] = await Promise.all([
          api.get('/admin/artists'),
          api.get('/albums'),
          api.get('/discounts')
        ]);
        setArtists(artistsRes.data);
        setAlbums(albumsRes.data);
        setDiscounts(discountsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Обработчики для артистов
  const handleCreateArtist = async () => {
    if (!newArtist.name) {
      alert('Название группы обязательно');
      return;
    }
    
    try {
      const response = await api.post('/admin/artists', newArtist);
      setArtists([...artists, response.data]);
      setNewArtist({
        name: '',
        category: 'female_group',
        description: '',
        image_url: ''
      });
    } catch (error) {
      console.error('Error creating artist:', error.response?.data);
    }
  };

  // Обработчики для альбомов
  const handleAlbumVersionChange = (index, field, value) => {
    const newVersions = [...newAlbum.versions];
    newVersions[index][field] = value;
    setNewAlbum({ ...newAlbum, versions: newVersions });
  };

  const handleCreateAlbum = async () => {
    if (!newAlbum.artist_id || !newAlbum.title || !newAlbum.base_price || newAlbum.versions.length === 0) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      const response = await api.post('/admin/albums', newAlbum);
      setAlbums([...albums, response.data]);
      setNewAlbum({
        artist_id: '',
        title: '',
        base_price: '',
        description: '',
        main_image_url: '',
        versions: [{ version_name: '', price_diff: 0 }]
      });
    } catch (error) {
      console.error('Error creating album:', error.response?.data);
    }
  };

  // Обработчики для скидок
  const handleCreateDiscount = async () => {
    if (!newDiscount.album_version_id || !newDiscount.percentage || !newDiscount.start_date || !newDiscount.end_date) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await api.post('/admin/discounts', newDiscount);
      setDiscounts([...discounts, response.data]);
      setNewDiscount({
        album_version_id: '',
        percentage: '',
        start_date: '',
        end_date: ''
      });
    } catch (error) {
      console.error('Error creating discount:', error.response?.data);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Административная панель</h2>
      
      <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)}>
        <Tab label="Артисты" />
        <Tab label="Альбомы" />
        <Tab label="Скидки" />
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
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Категория</InputLabel>
              <Select
                value={newArtist.category}
                onChange={(e) => setNewArtist({...newArtist, category: e.target.value})}
              >
                <MenuItem value="female_group">Женская группа</MenuItem>
                <MenuItem value="male_group">Мужская группа</MenuItem>
                <MenuItem value="solo">Сольный артист</MenuItem>
              </Select>
            </FormControl>

            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateArtist}
              style={{ marginTop: 20 }}
            >
              Создать артиста
            </Button>
          </div>

          <div className="list-section">
            {artists.map(artist => (
              <div key={artist.id} className="list-item">
                <h4>{artist.name}</h4>
                <p>Категория: {artist.category}</p>
                {artist.image_url && <img src={artist.image_url} alt={artist.name} className="preview-image" />}
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
            <TextField
              label="ID артиста*"
              value={newAlbum.artist_id}
              onChange={(e) => setNewAlbum({...newAlbum, artist_id: e.target.value})}
              fullWidth
              margin="normal"
            />
            
            <TextField
              label="Название альбома*"
              value={newAlbum.title}
              onChange={(e) => setNewAlbum({...newAlbum, title: e.target.value})}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Базовая цена*"
              type="number"
              value={newAlbum.base_price}
              onChange={(e) => setNewAlbum({...newAlbum, base_price: e.target.value})}
              fullWidth
              margin="normal"
            />

            <h4>Версии альбома</h4>
            {newAlbum.versions.map((version, index) => (
              <div key={index} className="version-input">
                <TextField
                  label="Название версии*"
                  value={version.version_name}
                  onChange={(e) => handleAlbumVersionChange(index, 'version_name', e.target.value)}
                  fullWidth
                  margin="dense"
                />
                <TextField
                  label="Доплата за версию"
                  type="number"
                  value={version.price_diff}
                  onChange={(e) => handleAlbumVersionChange(index, 'price_diff', e.target.value)}
                  margin="dense"
                />
              </div>
            ))}

            <Button 
              variant="outlined" 
              onClick={() => setNewAlbum({
                ...newAlbum,
                versions: [...newAlbum.versions, { version_name: '', price_diff: 0 }]
              })}
            >
              Добавить версию
            </Button>

            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateAlbum}
              style={{ marginTop: 20 }}
            >
              Создать альбом
            </Button>
          </div>

          <div className="list-section">
            {albums.map(album => (
              <div key={album.id} className="list-item">
                <h4>{album.title}</h4>
                <p>Артист: {album.artist_id}</p>
                <p>Базовая цена: ${album.base_price}</p>
                {album.main_image_url && <img src={album.main_image_url} alt={album.title} className="preview-image" />}
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Вкладка скидок */}
      {tabValue === 2 && (
        <Box p={3}>
          <h3>Управление скидками</h3>
          
          <div className="form-section">
            <TextField
              label="ID версии альбома*"
              value={newDiscount.album_version_id}
              onChange={(e) => setNewDiscount({...newDiscount, album_version_id: e.target.value})}
              fullWidth
              margin="normal"
            />
            
            <TextField
              label="Процент скидки*"
              type="number"
              value={newDiscount.percentage}
              onChange={(e) => setNewDiscount({...newDiscount, percentage: e.target.value})}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Дата начала*"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={newDiscount.start_date}
              onChange={(e) => setNewDiscount({...newDiscount, start_date: e.target.value})}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Дата окончания*"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={newDiscount.end_date}
              onChange={(e) => setNewDiscount({...newDiscount, end_date: e.target.value})}
              fullWidth
              margin="normal"
            />

            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateDiscount}
              style={{ marginTop: 20 }}
            >
              Создать скидку
            </Button>
          </div>

          <div className="list-section">
            {discounts.map(discount => (
              <div key={discount.id} className="list-item">
                <h4>Скидка #{discount.id}</h4>
                <p>Версия альбома: {discount.album_version_id}</p>
                <p>Процент: {discount.percentage}%</p>
                <p>Действует с {new Date(discount.start_date).toLocaleDateString()} по {new Date(discount.end_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </Box>
      )}
    </div>
  );
};

export default AdminPanel;