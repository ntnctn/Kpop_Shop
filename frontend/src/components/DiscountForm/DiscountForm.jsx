import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Modal } from '../Modal/Modal';
import { formatDateForInput, formatDateForServer } from '../../utils/dateFormatter';




export const DiscountForm = ({ 
  open,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState(initialData ||{
    name: '',
    description: '',
    discount_percent: 10,
    start_date: '',
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    if (open) {
      setFormData(initialData || {
        name: '',
        description: '',
        discount_percent: 10,
        start_date: '',
        end_date: '',
        is_active: true
      });
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData?.id ? 'Редактирование скидки' : 'Добавление новой скидки'}
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          <TextField
            label="Название скидки*"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Описание"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
          
          <TextField
            label="Размер скидки (%)*"
            name="discount_percent"
            type="number"
            value={formData.discount_percent}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 1, max: 100 }}
          />
          
          <TextField
            label="Дата начала*"
            name="start_date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.start_date}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Дата окончания*"
            name="end_date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.end_date}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <FormControlLabel
            control={
              <Checkbox
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
            }
            label="Активная скидка"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Сохранить
            </Button>
          </Box>
        </Box>
      </form>
    </Modal>
  );
};