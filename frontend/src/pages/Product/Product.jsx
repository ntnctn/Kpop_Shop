import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import './Product.css';

const Product = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(0);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await api.getAlbum(id);
        setAlbum(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching album:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!album) return <div className="error">Альбом не найден</div>;

  // Преобразуем цены в числа, если они строками
  const basePrice = typeof album.base_price === 'string' 
    ? parseFloat(album.base_price) 
    : album.base_price;

  const currentVersion = album.versions?.[selectedVersion] || null;
  
  // Обработка цены версии
  const versionPriceDiff = currentVersion 
    ? (typeof currentVersion.price_diff === 'string'
      ? parseFloat(currentVersion.price_diff)
      : currentVersion.price_diff || 0)
    : 0;

  const totalPrice = (basePrice + versionPriceDiff).toFixed(2);

  return (
    <div className="product-page">
      <div className="product-image">
        <img 
          src={currentVersion?.images?.[0] || album.main_image_url} 
          alt={album.title} 
        />
      </div>
      
      <div className="product-info">
        <h1>{album.title}</h1>
        <h2>{album.artist_name}</h2>
        
        {album.versions?.length > 1 && (
          <div className="version-selector">
            <h3>Выберите версию:</h3>
            <div className="version-buttons">
              {album.versions.map((version, index) => (
                <button
                  key={version.id}
                  className={selectedVersion === index ? 'active' : ''}
                  onClick={() => setSelectedVersion(index)}
                >
                  {version.version_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentVersion && (
          <div className="version-info">
            <h3>Версия: {currentVersion.version_name}</h3>
            {currentVersion.packaging_details && (
              <p><strong>Упаковка:</strong> {currentVersion.packaging_details}</p>
            )}
            {currentVersion.preorder_bonuses && (
              <p><strong>Бонусы предзаказа:</strong> {currentVersion.preorder_bonuses}</p>
            )}
            {currentVersion.is_limited && (
              <p className="limited-edition">⏳ Ограниченный тираж</p>
            )}
          </div>
        )}

        <p className="price">${totalPrice}</p>
        <p className="description">{album.description}</p>
        
        {currentVersion?.stock_quantity > 0 ? (
          <button className="add-to-cart">
            Добавить в корзину
          </button>
        ) : (
          <button className="out-of-stock" disabled>
            Нет в наличии
          </button>
        )}
      </div>
    </div>
  );
};

export default Product;