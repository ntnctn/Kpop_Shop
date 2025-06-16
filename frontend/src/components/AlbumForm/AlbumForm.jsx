import React, { useState } from 'react';
import {
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormControlLabel,
    Checkbox,
    Box,
    Typography
} from '@mui/material';

export const AlbumForm = ({
    artists,
    onSubmit,
    onCancel,
    initialData = {
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
    }
}) => {
    const [albumData, setAlbumData] = useState(initialData);

    const handleVersionChange = (index, field, value) => {
        const newVersions = [...albumData.versions];
        newVersions[index][field] = value;
        setAlbumData({ ...albumData, versions: newVersions });
    };

    const addNewVersion = () => {
        setAlbumData({
            ...albumData,
            versions: [
                ...albumData.versions,
                {
                    version_name: '',
                    price_diff: 0,
                    packaging_details: '',
                    is_limited: false,
                    stock_quantity: 0
                }
            ]
        });
    };

    const removeVersion = (index) => {
        const newVersions = [...albumData.versions];
        newVersions.splice(index, 1);
        setAlbumData({ ...albumData, versions: newVersions });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(albumData);
    };

    return (
        <form onSubmit={handleSubmit} className="album-form">
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                width: '100%',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                },
            }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="artist-select-label">Артист*</InputLabel>
                    <Select
                        labelId="artist-select-label"
                        value={albumData.artist_id}
                        onChange={(e) => setAlbumData({ ...albumData, artist_id: e.target.value })}
                        label="Артист*"
                        required
                        sx={{
                            '& .MuiSelect-select': {
                                whiteSpace: 'normal',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                     maxHeight: 700,
                                    '& .MuiMenuItem-root': {
                                        whiteSpace: 'normal',
                                        border: '1px solid white !important',
                                    }
                                }
                            }
                        }}
                    >
                        <MenuItem value="">Выберите артиста</MenuItem>
                        {artists.map(artist => (
                            <MenuItem
                                key={artist.id}
                                value={artist.id}
                                sx={{
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    
                                }}
                            >
                                {artist.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Название альбома*"
                    value={albumData.title}
                    onChange={(e) => setAlbumData({ ...albumData, title: e.target.value })}
                    fullWidth
                    required
                />

                <TextField
                    label="Базовая цена*"
                    type="number"
                    value={albumData.base_price}
                    onChange={(e) => setAlbumData({ ...albumData, base_price: e.target.value })}
                    fullWidth
                    required
                    inputProps={{ min: "0", step: "0.01" }}
                />

                <TextField
                    label="Описание альбома"
                    value={albumData.description}
                    onChange={(e) => setAlbumData({ ...albumData, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                />

                <TextField
                    label="Дата релиза"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={albumData.release_date || ''}
                    onChange={(e) => setAlbumData({ ...albumData, release_date: e.target.value })}
                    fullWidth
                />

                <FormControl fullWidth>
                    <InputLabel>Статус</InputLabel>
                    <Select
                        className='modal-select'
                        value={albumData.status}
                        onChange={(e) => setAlbumData({ ...albumData, status: e.target.value })}
                        label="Статус"
                    >
                        <MenuItem value="in_stock">В наличии</MenuItem>
                        <MenuItem value="pre_order">Предзаказ</MenuItem>
                        <MenuItem value="out_of_stock">Нет в наличии</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="h6" sx={{ mt: 2 }}>Версии альбома</Typography>

                {albumData.versions.map((version, index) => (
                    <Box
                        className="modal-version-container"
                        key={index}
                        sx={{
                            p: 2,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            mb: 2
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 1
                        }}>
                            <Typography variant="subtitle1">Версия #{index + 1}</Typography>
                            {albumData.versions.length > 1 && (
                                <Button
                                className='modal-button-delete'    
                                size="small"
                                    color="error"
                                    onClick={() => removeVersion(index)}
                                >
                                    Удалить
                                </Button>
                            )}
                        </Box>

                        <TextField
                            label="Название версии*"
                            value={version.version_name}
                            onChange={(e) => handleVersionChange(index, 'version_name', e.target.value)}
                            fullWidth
                            required
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Доплата за версию"
                            type="number"
                            value={version.price_diff}
                            onChange={(e) => handleVersionChange(index, 'price_diff', e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                            inputProps={{ min: "0", step: "0.01" }}
                        />

                        <TextField
                            label="Наполнение"
                            value={version.packaging_details}
                            onChange={(e) => handleVersionChange(index, 'packaging_details', e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Количество в наличии"
                            type="number"
                            value={version.stock_quantity}
                            onChange={(e) => handleVersionChange(index, 'stock_quantity', e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                            inputProps={{ min: "0" }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={version.is_limited}
                                    onChange={(e) => handleVersionChange(index, 'is_limited', e.target.checked)}
                                />
                            }
                            label="Лимитированная версия"
                        />
                    </Box>
                ))}

                <Button
                    variant="outlined"
                    onClick={addNewVersion}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    + Добавить версию
                </Button>

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: 3,
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'background.paper',
                    py: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}>
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