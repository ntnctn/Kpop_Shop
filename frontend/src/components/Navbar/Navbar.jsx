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
  Menu,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Album as AlbumIcon,
  Group as GroupIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const Navbar = ({ currentUser, onAuthClick, onLogout, cartItemCount = 0 }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPreloaded, setMenuPreloaded] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

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
          {/* Иконка меню артистов */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            onMouseEnter={handleMenuHover}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            TransitionProps={{ timeout: 150 }}
          >
            <ArtistMenu 
              onClose={handleMenuClose} 
              preloaded={menuPreloaded}
            />
          </Menu>

          {/* Иконка главной страницы */}
          <IconButton component={Link} to="/" color="inherit" sx={{ mr: 1 }}>
            <HomeIcon />
          </IconButton>

          {/* Иконка каталога */}
          <IconButton component={Link} to="/catalog" color="inherit" sx={{ mr: 1 }}>
            <AlbumIcon />
          </IconButton>
        </Box>

        {/* Логотип - оставляем текстом */}
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textAlign: 'center', 
            textDecoration: 'none', 
            color: 'inherit',
            fontFamily: 'fantasy',
            letterSpacing: '3px'
          }}
        >
          MagicShop
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Иконка корзины с бейджем */}
          <IconButton 
            component={Link} 
            to="/cart" 
            color="inherit"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={cartItemCount} color="secondary">
              <CartIcon />
            </Badge>
          </IconButton>

          {/* Иконка личного кабинета */}
          {currentUser ? (
            <>
              <IconButton 
                component={Link}
                to="/profile"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <PersonIcon />
              </IconButton>

              {currentUser.isAdmin && (
                <IconButton 
                  component={Link}
                  to="/admin"
                  color="inherit"
                  sx={{ mr: 1 }}
                >
                  <AdminIcon />
                </IconButton>
              )}

              <Button 
                color="inherit"
                onClick={onLogout}
                startIcon={<PersonIcon />}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button 
              color="inherit"
              onClick={onAuthClick}
              startIcon={<PersonIcon />}
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