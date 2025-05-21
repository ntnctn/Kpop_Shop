import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';  
import './Product.css';

const Product = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await api.getAlbum(id);
        setAlbum(response.data);
      } catch (error) {
        console.error('Error fetching album:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!album) return <div>Album not found</div>;

  return (
    <div className="product-page">
      <div className="product-image">
        <img src={album.main_image_url} alt={album.title} />
      </div>
      <div className="product-info">
        <h1>{album.title}</h1>
        <h2>{album.artist}</h2>
        <p className="price">${album.base_price}</p>
        <p>{album.description}</p>
        <button>Добавить в корзину</button>
      </div>
    </div>
  );
};

export default Product;