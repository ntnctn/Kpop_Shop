import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Select,
   TableSortLabel,
  MenuItem
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { ConfirmationDialog } from '../ConfirmationDialog/ConfirmationDialog';
import api from '../../api';

const OrdersTable = ({ orders: initialOrders, onStatusChange, onDelete }) => {
  // Состояние для сортировки
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [orders, setOrders] = useState(initialOrders);

  // Функция для сортировки
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    
    const sortedOrders = [...orders].sort((a, b) => {
      // Особые правила сортировки для разных полей
      if (property === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return isAsc ? dateA - dateB : dateB - dateA;
      }
      if (property === 'status') {
        const statusOrder = ['created', 'paid', 'shipped', 'delivered', 'cancelled'];
        const aIndex = statusOrder.indexOf(a.status);
        const bIndex = statusOrder.indexOf(b.status);
        return isAsc ? aIndex - bIndex : bIndex - aIndex;
      }
      if (property === 'total_amount') {
        return isAsc ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
      }
      // Стандартная сортировка для строк
      return isAsc 
        ? String(a[property]).localeCompare(String(b[property]))
        : String(b[property]).localeCompare(String(a[property]));
    });
    
    setOrders(sortedOrders);
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неизвестно';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    } catch (e) {
      return 'Неизвестно';
    }
  };

  // Функция для форматирования суммы
  const formatAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <TableContainer component={Paper}>
      <Table aria-label="orders table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>
              <TableSortLabel
                active={orderBy === 'id'}
                direction={orderBy === 'id' ? order : 'asc'}
                onClick={() => handleSort('id')}
              >
                ID заказа
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'created_at'}
                direction={orderBy === 'created_at' ? order : 'desc'}
                onClick={() => handleSort('created_at')}
              >
                Дата создания
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'user_email'}
                direction={orderBy === 'user_email' ? order : 'asc'}
                onClick={() => handleSort('user_email')}
              >
                Пользователь
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'total_amount'}
                direction={orderBy === 'total_amount' ? order : 'desc'}
                onClick={() => handleSort('total_amount')}
              >
                Сумма
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'status'}
                direction={orderBy === 'status' ? order : 'asc'}
                onClick={() => handleSort('status')}
              >
                Статус
              </TableSortLabel>
            </TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((row) => (
            <OrderRow 
              key={row.id}
              row={row}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              formatDate={formatDate}
              formatAmount={formatAmount}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// для лучшей читаемости
const OrderRow = ({ row, onStatusChange, onDelete, formatDate, formatAmount }) => {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.id}</TableCell>
        <TableCell>{formatDate(row.created_at)}</TableCell>
        <TableCell>{row.user_email || 'Неизвестно'}</TableCell>
        <TableCell>{formatAmount(row.total_amount)}</TableCell>
        <TableCell>
          <Select
            value={row.status || 'created'}
            onChange={(e) => onStatusChange(row.id, e.target.value)}
            sx={{ width: '100%' }}
          >
            <MenuItem value="created">Создан</MenuItem>
            <MenuItem value="paid">Оплачен</MenuItem>
            <MenuItem value="shipped">Отправлен</MenuItem>
            <MenuItem value="delivered">Доставлен</MenuItem>
            <MenuItem value="cancelled">Отменен</MenuItem>
          </Select>
        </TableCell>
        <TableCell>
          <IconButton onClick={() => onDelete(row.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom>
                Детали заказа #{row.id}
              </Typography>
              {row.items?.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альбом</TableCell>
                      <TableCell>Версия</TableCell>
                      <TableCell>Количество</TableCell>
                      <TableCell>Цена</TableCell>
                      <TableCell>Сумма</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.items.map((item) => (
                      <TableRow key={item.id || Math.random()}>
                        <TableCell>{item.album_title || 'Неизвестно'}</TableCell>
                        <TableCell>{item.version_name || 'Стандарт'}</TableCell>
                        <TableCell>{item.quantity || 0}</TableCell>
                        <TableCell>{formatAmount(item.price_per_unit)}</TableCell>
                        <TableCell>
                          {formatAmount((item.price_per_unit || 0) * (item.quantity || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography>Нет товаров в заказе</Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export { OrdersTable };