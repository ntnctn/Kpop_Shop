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
  MenuOutlined as MenuIcon,
  // HomeOutlined as HomeIcon,
  AlbumOutlined as AlbumIcon,
  // GroupOutlined as GroupIcon,
  ShoppingCartOutlined as CartIcon,
  // PersonOutlined as PersonIcon,
  LoginOutlined as Login,
  LogoutOutlined as LogoutOut,
  AdminPanelSettingsOutlined as AdminIcon
} from '@mui/icons-material';

import SearchIcon from '@mui/icons-material/Search';

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
    <AppBar position="static" className="custom-navbar">
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
          {/* <IconButton component={Link} to="/" color="inherit" sx={{ mr: 1 }}>
            <HomeIcon />
          </IconButton> */}

          
        </Box>

        {/* Логотип текстом */}
        <Typography
          variant="navbar-logo"
          component={Link}
          to="/"
          className="navbar-logo"
          sx={{
            flexGrow: 1,
            textAlign: 'center'
          }}
        >
          MagicShop
        </Typography>

        {/* Иконка каталога */}
          <IconButton component={Link} to="/catalog" color="inherit" sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>

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
              {/* <IconButton 
                component={Link}
                to="/profile"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <PersonIcon />
              </IconButton> */}

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
                startIcon={<LogoutOut />}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={onAuthClick}
              startIcon={<Login />}
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