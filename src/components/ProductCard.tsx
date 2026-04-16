'use client';

import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div 
      className="glass-card" 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        marginBottom: '0.8rem',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#000', 
            backgroundColor: 'var(--accent-color)', 
            padding: '0.1rem 0.5rem', 
            borderRadius: '4px', 
            fontWeight: 700, 
            letterSpacing: '0.5px',
            textTransform: 'uppercase' 
          }}>
            {product.brand}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.category || 'Varios'}</span>
        </div>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.3rem', fontWeight: 500, lineHeight: 1.2 }}>
          {product.name}
          {product.presentation && <span style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '6px'}}>- {product.presentation}</span>}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{product.description}</p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600', color: '#fff', fontSize: '1.3rem', minWidth: '110px', textAlign: 'right' }}>
          ${product.price.toLocaleString('es-AR')}
        </span>
        <button 
          onClick={() => onAdd(product)}
          className="btn-primary" 
          style={{ padding: '0.55rem 1.2rem', fontSize: '0.95rem' }}
        >
          Agregar +
        </button>
      </div>
    </div>
  );
}
