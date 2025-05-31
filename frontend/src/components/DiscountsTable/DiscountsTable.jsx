import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
    FormControlLabel,
    Checkbox,
    Button
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';

import { DiscountForm } from '../DiscountForm/DiscountForm';
import { AddAlbumToDiscountDialog } from '../AddAlbumToDiscountDialog/AddAlbumToDiscountDialog';
import { ConfirmationDialog } from '../ConfirmationDialog/ConfirmationDialog';
import api from '../../api';

const DiscountRow = ({ row, onDelete, onEdit, onAddAlbum, onRemoveAlbum }) => {
    const [open, setOpen] = useState(false);
    const [albums, setAlbums] = useState([]);
    const [loadingAlbums, setLoadingAlbums] = useState(false);

    useEffect(() => {
        if (open && albums.length === 0) {
            fetchDiscountAlbums();
        }
    }, [open]);

    const fetchDiscountAlbums = async () => {
        try {
            setLoadingAlbums(true);
            const response = await api.getDiscountAlbums(row.id);
            setAlbums(response.data);
        } catch (error) {
            console.error('Error fetching discount albums:', error);
        } finally {
            setLoadingAlbums(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <React.Fragment>
            <TableRow>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.description || '-'}</TableCell>
                <TableCell align="right">{row.discount_percent}%</TableCell>
                <TableCell>{formatDate(row.start_date)}</TableCell>
                <TableCell>{formatDate(row.end_date)}</TableCell>
                <TableCell>
                    <FormControlLabel
                        control={<Checkbox checked={row.is_active} disabled />}
                        label={row.is_active ? 'Активна' : 'Не активна'}
                    />
                </TableCell>
                <TableCell>
                    <IconButton onClick={() => onEdit(row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(row.id)} color="error">
                        <DeleteIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Альбомы со скидкой
                            </Typography>
                            {loadingAlbums ? (
                                <Typography>Загрузка...</Typography>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Название</TableCell>
                                            <TableCell>Артист</TableCell>
                                            <TableCell>Цена</TableCell>
                                            <TableCell>Действия</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {albums.map((album) => (
                                            <TableRow key={album.id}>
                                                <TableCell>{album.title}</TableCell>
                                                <TableCell>{album.artist_name}</TableCell>
                                                <TableCell>${album.base_price}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        onClick={() => onRemoveAlbum(row.id, album.id)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <Button
                                                    startIcon={<AddIcon />}
                                                    onClick={() => onAddAlbum(row.id)}
                                                >
                                                    Добавить альбом
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

export const DiscountsTable = ({ 
    formOpen, 
    onFormClose, 
    onEditDiscount,  
    editingDiscount,  
    onAddDiscount }) => {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);



    const [addAlbumDialogOpen, setAddAlbumDialogOpen] = useState(false);
    const [selectedDiscountId, setSelectedDiscountId] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [discountToDelete, setDiscountToDelete] = useState(null);

    const [albums, setAlbums] = useState([]);
    const [loadingAlbums, setLoadingAlbums] = useState(false);

    const fetchDiscounts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.getDiscounts();
            setDiscounts(response.data);
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAlbums = useCallback(async () => {
        try {
            setLoadingAlbums(true);
            const response = await api.getAdminAlbums();
            setAlbums(response.data);
        } catch (error) {
            console.error('Error fetching albums:', error);
        } finally {
            setLoadingAlbums(false);
        }
    }, []);

    useEffect(() => {
        fetchDiscounts();
        fetchAlbums();
    }, [fetchDiscounts, fetchAlbums]);

    const handleEditDiscount = (discount) => {
        onEditDiscount(discount);
    };

    const handleSaveDiscount = useCallback(async (discountData) => {
        try {
            if (editingDiscount) {
                await api.updateDiscount(editingDiscount.id, discountData);
            } else {
                await api.createDiscount(discountData);
            }
            fetchDiscounts();
            onFormClose(); 
            onEditDiscount(null);
        } catch (error) {
            console.error('Error saving discount:', error);
            alert(`Ошибка сохранения: ${error.response?.data?.message || error.message}`);
        }
    }, [editingDiscount, fetchDiscounts]);

    const handleDeleteDiscount = useCallback(async (id) => {
        try {
            await api.deleteDiscount(id);
            fetchDiscounts();
        } catch (error) {
            console.error('Error deleting discount:', error);
            alert(`Ошибка удаления: ${error.response?.data?.message || error.message}`);
        } finally {
            setDeleteConfirmOpen(false);
            setDiscountToDelete(null);
        }
    }, [fetchDiscounts]);

    const handleAddAlbumToDiscount = useCallback(async (discountId, albumId) => {
        try {
            await api.addAlbumToDiscount(discountId, albumId);
            fetchDiscounts();
        } catch (error) {
            console.error('Error adding album to discount:', error);
            alert(`Ошибка добавления альбома: ${error.response?.data?.message || error.message}`);
        }
    }, [fetchDiscounts]);

    const handleRemoveAlbumFromDiscount = useCallback(async (discountId, albumId) => {
        try {
            await api.removeAlbumFromDiscount(discountId, albumId);
            fetchDiscounts();
        } catch (error) {
            console.error('Error removing album from discount:', error);
            alert(`Ошибка удаления альбома: ${error.response?.data?.message || error.message}`);
        }
    }, [fetchDiscounts]);

    const memoizedAlbums = useMemo(() => albums, [albums]);

    if (loading) {
        return <Typography>Загрузка скидок...</Typography>;
    }

    if (error) {
        return (
            <Box>
                <Typography color="error">Ошибка: {error}</Typography>
                <Button onClick={fetchDiscounts}>Попробовать снова</Button>
            </Box>
        );
    }

    return (
        <Box>
            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Название</TableCell>
                            <TableCell>Описание</TableCell>
                            <TableCell align="right">Скидка</TableCell>
                            <TableCell>Дата начала</TableCell>
                            <TableCell>Дата окончания</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {discounts.map((discount) => (
                            <DiscountRow
                                key={discount.id}
                                row={discount}
                                onDelete={(id) => {
                                    setDiscountToDelete(id);
                                    setDeleteConfirmOpen(true);
                                }}
                                onEdit={(discount) => {
                                   onEditDiscount(discount);
                                    // setFormOpen(true);
                                }}
                                onAddAlbum={(discountId) => {
                                    setSelectedDiscountId(discountId);
                                    setAddAlbumDialogOpen(true);
                                }}
                                onRemoveAlbum={handleRemoveAlbumFromDiscount}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <DiscountForm
                open={formOpen}
                onClose={onFormClose}
                onSubmit={handleSaveDiscount}
                initialData={editingDiscount}
            />

            <AddAlbumToDiscountDialog
                open={addAlbumDialogOpen}
                onClose={() => setAddAlbumDialogOpen(false)}
                onSubmit={(albumId) => handleAddAlbumToDiscount(selectedDiscountId, albumId)}
                albums={memoizedAlbums}
            />

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={() => handleDeleteDiscount(discountToDelete)}
                title="Подтверждение удаления"
                message="Вы уверены, что хотите удалить эту скидку? Это действие нельзя отменить."
            />
        </Box>
    );
};