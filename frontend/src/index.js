import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';
import './fonts.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ffffff' },
    secondary: { main: '#f48fb1' },
    background: {
      default: '#000000',
      paper: '#000000',
    },
  },
  
  typography: {
    fontFamily: '"GraphikLCG-Medium", "DrukText-Medium", sans-serif',
    // Глобальные настройки типографики
    h1: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
      fontWeight: 400,
    },
    h2: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
      fontWeight: 400,
    },
    // Кастомные варианты
    albumTitle: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
      fontSize: '2rem',
      fontWeight: 300, 
      lineHeight: 1.3,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    albumDate: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
      fontSize: '0.8rem',
      letterSpacing: '1px',
      color: 'text.secondary',
    },
    albumPrice: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 400, // Medium обычно 500, но у вас указано 400
      color: 'primary.main',
    },

    // шрифт по умолчанию
    body1: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
    },
    body2: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
    },
    button: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
    },
    caption: {
      fontFamily: '"GraphikLCG-Medium", sans-serif',
    },


  },
  
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'DrukText-Medium';
          src: url('C:\Users\katy\Documents\GitHub\Kpop_Shop\frontend\public\fonts\DrukText-Medium.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'GraphikLCG-Medium';
          src: url('C:\Users\katy\Documents\GitHub\Kpop_Shop\frontend\public\fonts\GraphikLCG-Medium.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'GraphikLCG-Regular';
          src: url('C:\Users\katy\Documents\GitHub\Kpop_Shop\frontend\public\fonts\GraphikLCG-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `,
    },
    MuiCssBaseline: {
      styleOverrides: {
        // Глобальное отключение теней для всех компонентов
        '& .MuiPaper-root, & .MuiCard-root, & .MuiAppBar-root, & .MuiDrawer-paper, & .MuiPopover-paper, & .MuiMenu-paper, & .MuiDialog-paper': {
          boxShadow: 'none !important',
          backgroundImage: 'none !important',
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          backgroundImage: 'none',
          boxShadow: 'none',
          '&.MuiPaper-root': {
            backgroundImage: 'none'
          }
        },
      },
    },
  },
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);