import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Home = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Добро пожаловать в MagicShop
        </Typography>
        <Typography variant="h5" color="text.secondary">
          любите чонгука
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;