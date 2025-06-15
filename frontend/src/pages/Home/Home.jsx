import React from 'react';
import { Box, Typography } from '@mui/material';

const Home = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/love_yourself-answer/discography-pattern.png)',
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/map_of_the_soul-persona/discography-bg.png)',
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/love_yourself-her/discography-bg.png)',
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/love_yourself-tear/discography-bg.png)',


        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/proof/gallery/pc-section-6-archive-16.svg)',
        backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/proof/gallery/pc-section-6-archive-14.svg)',
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/proof/gallery/pc-section-6-archive-12.svg)',
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/proof/gallery/pc-section-6-archive-10.svg)',
        
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/proof/gallery/pc-section-6-archive-6.svg)',
        // backgroundImage: 'url(https://ibighit.com/bts/images/bts/discography/proof/gallery/pc-section-6-archive-5.svg)',
        

        backgroundSize: 'cover',
        
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.14)',
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1,
        width: '100%',
        maxWidth: '1200px',
        px: 3,
        mt: 8, // Отступ для навбара
      }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            color: 'white',
            fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
            fontWeight: 900,
            marginTop: '-160px',
            letterSpacing: '0.5rem',
            textTransform: 'uppercase',
            mb: 2,
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          MAGIC SHOP
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            fontStyle: 'italic',
            letterSpacing: '0.2rem',
            textShadow: '0 0 5px rgba(0,0,0,0.5)',
          }}
        >
          тут будет чето
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;