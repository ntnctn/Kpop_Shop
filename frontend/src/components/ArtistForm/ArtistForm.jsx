import React, { useState } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box
} from '@mui/material';

export const ArtistForm = ({ 
  onSubmit, 
  onCancel,
  initialData = {
    name: '',
    category: 'female_group',
    description: '',
    image_url: ''
  }
}) => {
  const [artistData, setArtistData] = useState(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(artistData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Название группы/артиста*"
          value={artistData.name}
          onChange={(e) => setArtistData({...artistData, name: e.target.value})}
          fullWidth
          required
        />

        <FormControl fullWidth>
          <InputLabel>Категория*</InputLabel>
          <Select
            value={artistData.category}
            onChange={(e) => setArtistData({...artistData, category: e.target.value})}
            label="Категория*"
            required
          >
            <MenuItem value="female_group">Женская группа</MenuItem>
            <MenuItem value="male_group">Мужская группа</MenuItem>
            <MenuItem value="solo">Сольный артист</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Описание"
          value={artistData.description}
          onChange={(e) => setArtistData({...artistData, description: e.target.value})}
          fullWidth
          multiline
          rows={3}
        />

        <TextField
          label="URL изображения"
          value={artistData.image_url}
          onChange={(e) => setArtistData({...artistData, image_url: e.target.value})}
          fullWidth
          placeholder="https://example.com/image.jpg"
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Сохранить
          </Button>
        </Box>
      </Box>
    </form>
  );
};