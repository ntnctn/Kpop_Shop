import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ArtistMenu from '../ArtistMenu/ArtistMenu';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Button, 
  Typography, 
  Box,
  Menu
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ currentUser, onAuthClick, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPreloaded, setMenuPreloaded] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  // Предзагрузка данных при наведении
  const handleMenuHover = () => {
    if (!menuPreloaded) {
      setMenuPreloaded(true);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            onMouseEnter={handleMenuHover} // Обработчик наведения
            sx={{ mr: 2 }}
          >
            <MenuIcon />
            <Typography variant="body1" sx={{ ml: 1 }}>Группы</Typography>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            // Небольшая задержка перед закрытием для плавности
            TransitionProps={{ timeout: 150 }}
          >
            <ArtistMenu 
              onClose={handleMenuClose} 
              preloaded={menuPreloaded} // Флаг предзагрузки
            />
          </Menu>
        </Box>

        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textAlign: 'center', 
            textDecoration: 'none', 
            color: 'inherit' 
          }}
        >
          MagicShop
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {currentUser ? (
            <>
              {currentUser.isAdmin && (
                <Button 
                  component={Link}
                  to="/admin"
                  color="inherit"
                  sx={{ mr: 2 }}
                >
                  Админ-панель
                </Button>
              )}
              <Button 
                color="inherit"
                onClick={onLogout}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button 
              color="inherit"
              onClick={onAuthClick}
            >
              Войти
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;