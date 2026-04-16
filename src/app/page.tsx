'use client';

import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { Product, CartItem } from '../types';

export default function Home() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/products', { 
       cache: 'no-store', 
       headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    })
      .then(res => res.json())
      .then(data => {
         // Eliminamos keys duplicadas por seguridad de React
         const uniqueData = Array.from(new Map(data.map((item: any) => [item.id, item])).values());
         setProducts(uniqueData as Product[]);
         setLoading(false);
      })
      .catch((err) => {
         alert("Error en celular: " + err.message);
         setLoading(false);
      });
  }, []);

  const handleAddToCart = (product: Product) => {
    setItems(prevItems => {
      const existing = prevItems.find(item => item.product.id === product.id);
      if (existing) {
        return prevItems.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
    // Opcional: setIsCartOpen(true) para mostrarlo ni bien agrega uno
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty === 0) {
      setItems(prev => prev.filter(item => item.product.id !== id));
      return;
    }
    setItems(prev => prev.map(item => item.product.id === id ? { ...item, quantity: qty } : item));
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.product.id !== id));
  };

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <header className="main-header">
        <div className="container header-content">
          <div className="logo" style={{ color: 'var(--accent-color)', fontWeight: 700, letterSpacing: '1px', fontSize: '1.4rem' }}>
            Derma's
          </div>
          <nav>
            <button className="btn-primary" onClick={() => setIsCartOpen(true)} style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛒</span> Mi Pedido ({cartItemsCount})
            </button>
          </nav>
        </div>
      </header>

      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 className="title">Catálogo Profesional</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Selecciona tus productos para armar tu pedido express.
        </p>

        <div style={{ maxWidth: '900px', margin: '0 auto', marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Buscar por marca, producto o activo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem 1.5rem', 
              borderRadius: '8px', 
              border: '1px solid var(--glass-border)', 
              background: 'var(--glass-bg)', 
              color: '#fff',
              fontSize: '1.1rem',
              outline: 'none',
              backdropFilter: 'blur(10px)'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', maxWidth: '900px', margin: '0 auto' }}>
          {loading ? (
             <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando catálogo en vivo...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron productos.</p>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
            ))
          )}
        </div>
      </div>

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
    </>
  );
}
