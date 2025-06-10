import React, { useState, useEffect } from 'react';
import {
  Box, Button, CircularProgress, Paper, List, ListItem,
  ListItemButton, ListItemText, Toolbar, Typography,
  Checkbox, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import api from '../../api';
import { Modal } from '../../components/Modal/Modal';
import { AlbumForm } from '../../components/AlbumForm/AlbumForm';
import { ArtistForm } from '../../components/ArtistForm/ArtistForm';
import { formatDateForInput, formatDateForServer } from '../../utils/dateFormatter';
import { ConfirmationDialog } from '../../components/ConfirmationDialog/ConfirmationDialog';
import { DiscountsTable } from '../../components/DiscountsTable/DiscountsTable';
import { OrdersTable } from '../../components/OrdersTable/OrdersTable';
import './AdminPanel.css';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState('albums');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для данных
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  //Модалки
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);

  //Редактирование
  const [editingArtist, setEditingArtist] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);

  //Удаление
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'artist' или 'album'

  // 
  const [discountFormOpen, setDiscountFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authCheck = await api.checkAuth();
        if (!authCheck.data.is_admin) {
          throw new Error('You do not have admin privileges');
        }

        const [artistsRes, albumsRes, usersRes, ordersRes] = await Promise.all([
          api.getAdminArtists(),
          api.getAdminAlbums(),
          api.getAllUsers(),
          api.getAllOrders()
        ]);

        const safeOrders = (ordersRes.data?.orders || []).map(order => ({
          
          id: order?.id || 0,
          user_email: order?.user_email || 'Неизвестный пользователь',
          total_amount: order?.total_amount || 0,
          status: order?.status || 'created',
          created_at: order?.created_at || null,
          items: order?.items?.map(item => ({
            id: item?.id || 0,
            album_title: item?.album_title || 'Неизвестный альбом',
            version_name: item?.version_name || 'Стандарт',
            quantity: item?.quantity || 0,
            price_per_unit: item?.price_per_unit || 0
          })) || []
        }));
        

        setArtists(artistsRes.data.map(artist => ({
          ...artist,
          category: artist.category || 'other'
        })));
        setAlbums(albumsRes.data);
        setUsers(usersRes.data.users.map(user => ({
          id: user.id,
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          is_admin: user.is_admin || false
        })));
        setOrders(safeOrders);

      } catch (err) {
        setError(err.response?.data?.message || err.message);
        console.error('Admin panel error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Функции для перевода категорий
  const translateCategory = (category) => {
    switch (category) {
      case 'female_group': return 'Женские группы';
      case 'male_group': return 'Мужские группы';
      case 'solo': return 'Сольные исполнители';
      default: return 'Другие';
    }
  };

  // Создание нового артиста
  const handleCreateArtist = async (artistData) => {
    try {
      const response = await api.createArtist(artistData);
      setArtists([...artists, response.data]);
      setIsArtistModalOpen(false);
      alert('Артист успешно создан!');
    } catch (error) {
      console.error('Error creating artist:', error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };

  // Создание нового альбома
  const handleCreateAlbum = async (albumData) => {
    try {
      const response = await api.createAlbum(albumData);
      setAlbums([...albums, response.data]);
      setIsAlbumModalOpen(false);
      alert('Альбом успешно создан!');
    } catch (error) {
      console.error('Error creating album:', error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };


  // Функции для открытия форм редактирования
  const handleEditArtist = async (id) => {
    try {
      const response = await api.getArtistById(id);
      setEditingArtist(response.data);
      setIsArtistModalOpen(true);
    } catch (error) {
      console.error('Error fetching artist:', error);
      alert('Не удалось загрузить данные артиста');
    }
  };

  const handleEditAlbum = async (id) => {
    try {
      const response = await api.getAlbumById(id);

      // Форматируем дату в формат yyyy-MM-dd
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const albumData = {
        ...response.data,
        artist_id: response.data.artist_id?.toString() || '',
        release_date: formatDateForInput(response.data.release_date),
        versions: response.data.versions || [{
          version_name: '',
          price_diff: 0,
          packaging_details: '',
          is_limited: false,
          stock_quantity: 0
        }]
      };

      setEditingAlbum(albumData);
      setIsAlbumModalOpen(true);
    } catch (error) {
      console.error('Error fetching album:', error);
      alert('Не удалось загрузить данные альбома');
    }
  };


  // Обновленные обработчики сохранения
  const handleSaveArtist = async (artistData) => {
    try {
      let response;
      if (editingArtist) {
        response = await api.updateArtist(editingArtist.id, artistData);
        setArtists(artists.map(a => a.id === editingArtist.id ? response.data : a));
      } else {
        response = await api.createArtist(artistData);
        setArtists([...artists, response.data]);
      }
      setIsArtistModalOpen(false);
      setEditingArtist(null);
      alert('Данные артиста успешно сохранены!');
    } catch (error) {
      console.error('Error saving artist:', error);
      alert(`Ошибка сохранения: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSaveAlbum = async (albumData) => {
    try {
      // Преобразуем дату обратно в ISO строку перед отправкой
      const dataToSend = {
        ...albumData,
        release_date: albumData.release_date ? new Date(albumData.release_date).toISOString() : null
      };

      let response;
      if (editingAlbum) {
        response = await api.updateAlbum(editingAlbum.id, dataToSend);
        setAlbums(albums.map(a => a.id === editingAlbum.id ? response.data : a));
      } else {
        response = await api.createAlbum(dataToSend);
        setAlbums([...albums, response.data]);
      }

      setIsAlbumModalOpen(false);
      setEditingAlbum(null);
      alert('Данные альбома успешно сохранены!');
    } catch (error) {
      console.error('Error saving album:', error);
      alert(`Ошибка сохранения: ${error.response?.data?.message || error.message}`);
    }
  };

  // Функции для удаления
  const handleDeleteClick = (id, type) => {
    setItemToDelete(id);
    setDeleteType(type);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'artist') {
        await api.deleteArtist(itemToDelete);
        setArtists(artists.filter(a => a.id !== itemToDelete));
        // Удаляем все альбомы этого артиста из состояния
        setAlbums(albums.filter(a => a.artist_id !== itemToDelete));
      } else {
        await api.deleteAlbum(itemToDelete);
        setAlbums(albums.filter(a => a.id !== itemToDelete));
      }
      alert('Удаление прошло успешно!');
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`Ошибка удаления: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  //юзеры
  const [users, setUsers] = useState([]);

  const [orders, setOrders] = useState([]);

  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      const response = await api.updateUser(userId, { is_admin: !isAdmin });
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !isAdmin } : u));
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Ошибка обновления: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('Пользователь успешно удален!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Ошибка удаления: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await api.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Ошибка обновления: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await api.deleteOrder(orderId);
      setOrders(orders.filter(order => order.id !== orderId));
      alert('Заказ успешно удален!');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(`Ошибка удаления: ${error.response?.data?.message || error.message}`);
    }
  };

  // Подготовка данных для таблицы альбомов
  const preparedAlbums = albums.map(album => {
    const artist = artists.find(a => a.id === album.artist_id);
    return {
      ...album,
      artistName: artist?.name || 'Неизвестно',
      statusText: album.status === 'in_stock' ? 'В наличии' :
        album.status === 'pre_order' ? 'Предзаказ' : 'Нет в наличии',
      isLimited: album.versions?.some(v => v.is_limited) || false,
      isPreOrder: album.status === 'pre_order',
      priceText: `$${album.base_price}`
    };
  });

  // Колонки для таблицы артистов
  const artistColumns = [
    {
      field: 'name',
      headerName: 'Имя артиста',
      width: 200,
      sortable: true
    },
    {
      field: 'category',
      headerName: 'Категория',
      width: 200,
      sortable: true,
      valueGetter: (params) => params?.row?.category ? translateCategory(params.row.category) : ''
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div>
          <Button
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditArtist(params.row.id);
            }}
          >

          </Button>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row.id, 'artist');
            }}
          >

          </Button>
        </div>
      ),
    },
  ];

  // Колонки для таблицы альбомов
  const albumColumns = [
    {
      field: 'title',
      headerName: 'Название альбома',
      width: 200,
      sortable: true
    },
    {
      field: 'artistName',
      headerName: 'Артист',
      width: 200,
      sortable: true
    },
    {
      field: 'priceText',
      headerName: 'Базовая цена',
      width: 150,
      sortable: true
    },
    {
      field: 'isPreOrder',
      headerName: 'Предзаказ',
      width: 150,
      sortable: true,
      valueGetter: (params) => params?.row?.isPreOrder ? 'Да' : 'Нет'
    },
    {
      field: 'isLimited',
      headerName: 'Лимитированная',
      width: 150,
      sortable: true,
      valueGetter: (params) => params?.row?.isLimited ? 'Да' : 'Нет'
    },
    {
      field: 'statusText',
      headerName: 'Статус',
      width: 150,
      sortable: true
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div>
          <Button
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditAlbum(params.row.id);
            }}
          >

          </Button>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row.id, 'album');
            }}
          >

          </Button>
        </div>
      ),
    },
  ];



  const userColumns = [
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      sortable: true
    },
    {
      field: 'first_name',
      headerName: 'Имя',
      width: 150,
      sortable: true
    },
    {
      field: 'last_name',
      headerName: 'Фамилия',
      width: 150,
      sortable: true
    },
    {
      field: 'is_admin',
      headerName: 'Админ',
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.is_admin || false}
          onChange={() => handleToggleAdmin(params.row.id, params.row.is_admin)}
          color="primary"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => handleDeleteUser(params.row.id)}
        >
          Удалить
        </Button>
      )
    }
  ];


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
      <div className="admin-layout">
        {/* Боковое меню */}
        <div className="admin-menu">
          <Paper elevation={3}>
            <List>

              <ListItem disablePadding>
                <ListItemButton
                  selected={tabValue === 'albums'}
                  onClick={() => setTabValue('albums')}
                >
                  <ListItemText primary="Альбомы" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  selected={tabValue === 'artists'}
                  onClick={() => setTabValue('artists')}
                >
                  <ListItemText primary="Артисты" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  selected={tabValue === 'discounts'}
                  onClick={() => setTabValue('discounts')}
                >
                  <ListItemText primary="Скидки" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  selected={tabValue === 'users'}
                  onClick={() => setTabValue('users')}
                >
                  <ListItemText primary="Пользователи" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  selected={tabValue === 'orders'}
                  onClick={() => setTabValue('orders')}
                >
                  <ListItemText primary="Заказы" />
                </ListItemButton>
              </ListItem>

            </List>
          </Paper>
        </div>

        {/* Основное содержимое */}
        <div className="admin-content">
          <Paper elevation={3} className="content-paper">
            {tabValue === 'artists' && (
              <Box p={3} sx={{ height: '100%' }}>
                <Toolbar className="admin-header">
                  <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                    Управление артистами
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsArtistModalOpen(true)}
                  >
                    Добавить артиста
                  </Button>
                </Toolbar>




                <Box sx={{ height: 600, width: '100%', mt: 2 }}>
                  <DataGrid
                    rows={artists}
                    columns={artistColumns}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                        },
                      },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                  />
                </Box>
              </Box>
            )}

            {tabValue === 'albums' && (
              <Box p={3} sx={{ height: '100%' }}>
                <Toolbar className="admin-header">
                  <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                    Управление альбомами
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAlbumModalOpen(true)}
                  >
                    Добавить альбом
                  </Button>
                </Toolbar>




                <Box sx={{ height: 600, width: '100%', mt: 2 }}>
                  <DataGrid
                    rows={preparedAlbums}
                    columns={albumColumns}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                        },
                      },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                  />
                </Box>
              </Box>
            )}

            {tabValue === 'discounts' && (
              <Box p={3} sx={{ height: '100%' }}>
                <Toolbar className="admin-header">
                  <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                    Управление скидками
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingDiscount(null);
                      setDiscountFormOpen(true);
                    }}
                  >
                    Добавить скидку
                  </Button>
                </Toolbar>
                <DiscountsTable
                  formOpen={discountFormOpen}
                  onFormClose={() => setDiscountFormOpen(false)}
                  editingDiscount={editingDiscount}
                  onEditDiscount={(discount) => {
                    setEditingDiscount(discount);
                    setDiscountFormOpen(true);
                  }}
                  onAddDiscount={() => {
                    setEditingDiscount(null); // Сбрасываем редактирование при добавлении
                    setDiscountFormOpen(true); // Открываем форму
                  }}
                />
              </Box>
            )}



            {tabValue === 'users' && (
              <Box p={3} sx={{ height: '100%' }}>
                <Toolbar className="admin-header">
                  <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                    Управление пользователями
                  </Typography>
                </Toolbar>
                <Box sx={{ height: 600, width: '100%', mt: 2 }}>
                  <DataGrid
                    rows={users}
                    columns={userColumns}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                        },
                      },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                  />
                </Box>
              </Box>
            )}


            {tabValue === 'orders' && (
              <Box p={3} sx={{ height: '100%' }}>
                <Toolbar className="admin-header">
                  <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                    Управление заказами
                  </Typography>
                </Toolbar>
                <OrdersTable
                  orders={orders}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteOrder}
                />
              </Box>
            )}


          </Paper>
        </div>
      </div>

      <div className="admin-panel">
        {/* */}

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Подтверждение удаления"
          message={
            deleteType === 'artist'
              ? `Вы уверены, что хотите удалить этого артиста и все его альбомы? Это действие нельзя отменить.`
              : deleteType === 'album'
                ? `Вы уверены, что хотите удалить этот альбом? Это действие нельзя отменить.`
                : `Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.`
          }
        />
      </div>


      {/* Для артистов */}
      <Modal
        open={isArtistModalOpen}
        onClose={() => {
          setIsArtistModalOpen(false);
          setEditingArtist(null);
        }}
        title={editingArtist ? 'Редактирование артиста' : 'Добавление нового артиста'}
      >
        <ArtistForm
          onSubmit={handleSaveArtist}
          onCancel={() => {
            setIsArtistModalOpen(false);
            setEditingArtist(null);
          }}
          initialData={editingArtist || {
            name: '',
            category: 'female_group',
            description: '',
            image_url: ''
          }}
        />
      </Modal>

      {/* Для альбомов */}
      <Modal
        open={isAlbumModalOpen}
        onClose={() => {
          setIsAlbumModalOpen(false);
          setEditingAlbum(null);
        }}
        title={editingAlbum ? 'Редактирование альбома' : 'Добавление нового альбома'}
      >
        <AlbumForm
          artists={artists}
          onSubmit={handleSaveAlbum}
          onCancel={() => {
            setIsAlbumModalOpen(false);
            setEditingAlbum(null);
          }}
          initialData={editingAlbum || {
            artist_id: '',
            title: '',
            base_price: '',
            description: '',
            release_date: '',
            status: 'in_stock',
            versions: [{
              version_name: '',
              price_diff: 0,
              packaging_details: '',
              is_limited: false,
              stock_quantity: 0
            }]
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminPanel;