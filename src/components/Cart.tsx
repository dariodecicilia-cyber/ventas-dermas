'use client';

import React from 'react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export default function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartProps) {
  const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    // Construir mensaje de WhatsApp
    let mensaje = "Hola! Quiero realizar este pedido:\n\n";
    items.forEach(item => {
      mensaje += `- ${item.quantity}x ${item.product.name} (${item.product.brand}): $${(item.product.price * item.quantity).toLocaleString('es-AR')}\n`;
    });
    mensaje += `\n*TOTAL: $${total.toLocaleString('es-AR')}*`;
    
    // Número oficial de WhatsApp de Derma's
    const WHA_NUMBER = "542235952405"; 
    const url = `https://wa.me/${WHA_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', zIndex: 90
        }}
        onClick={onClose}
      />
      <div className="glass-card" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
        zIndex: 100, borderRadius: '16px 0 0 16px', display: 'flex', flexDirection: 'column',
        border: 'none', borderLeft: '1px solid var(--glass-border)', padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Tu Pedido</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Tu carrito está vacío.</p>
          ) : (
            items.map(item => (
              <div key={item.product.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>{item.product.brand}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{item.product.name}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        style={{ background: 'none', border: 'none', color: '#fff', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                      >-</button>
                      <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        style={{ background: 'none', border: 'none', color: '#fff', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                      >+</button>
                    </div>
                    <button 
                      onClick={() => onRemove(item.product.id)}
                      style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>
                  ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
            <span>Total:</span>
            <span>${total.toLocaleString('es-AR')}</span>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={items.length === 0}
            onClick={handleCheckout}
          >
            Confirmar Pedido (WhatsApp)
          </button>
        </div>
      </div>
    </>
  );
}
