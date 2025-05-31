import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { Modal } from '../Modal/Modal';

export const AddAlbumToDiscountDialog = ({ 
  open,
  onClose,
  onSubmit,
  albums
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedAlbum('');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAlbum) {
      onSubmit(selectedAlbum);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавить альбом к скидке"
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Альбом</InputLabel>
            <Select
              value={selectedAlbum}
              onChange={(e) => setSelectedAlbum(e.target.value)}
              label="Альбом"
              required
            >
              {albums.map(album => (
                <MenuItem key={album.id} value={album.id}>
                  {album.title} - {album.artist_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={onClose}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!selectedAlbum}
            >
              Добавить
            </Button>
          </Box>
        </Box>
      </form>
    </Modal>
  );
};