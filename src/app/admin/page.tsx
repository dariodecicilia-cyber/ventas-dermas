'use client';
import React, { useState } from 'react';
import { Product } from '../../types';
import { PDFDocument } from 'pdf-lib';

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [brand, setBrand] = useState('Bioalquimia');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passInput })
    });
    if (res.ok) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Panel Prohibido 🔒</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              placeholder="Escribe la clave secreta..."
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '8px', outline: 'none' }}
            />
            <button className="btn-primary" type="submit">Entrar</button>
            {authError && <p style={{ color: '#ff4d4f', fontSize: '0.9rem' }}>{authError}</p>}
          </form>
        </div>
      </div>
    );
  }

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResults([]);
    setStatusText('Iniciando maquinaria de escaneo...');

    try {
      if (file.name.endsWith('.pdf')) {
        // CORTE MICROSCÓPICO: 1 PÁGINA A LA VEZ PARA EVITAR LA "PEREZA" VISUAL
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();
        let allProducts: Product[] = [];

        for (let i = 0; i < totalPages; i++) {
          setStatusText(`🧠 Escaneando milimétricamente tabla por tabla... página ${i + 1} de ${totalPages}...`);
          
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          
          const chunkBytes = await newPdf.save();
          const chunkBlob = new Blob([chunkBytes as any], { type: 'application/pdf' });
          const fd = new FormData();
          fd.append('file', chunkBlob, `page_${i}.pdf`);
          fd.append('brand', brand);

          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          const data = await res.json();
          
          if (!res.ok) {
             console.error("Fallo parcial en pagina:", data);
             continue; 
          }
          
          if (data.products && data.products.length > 0) {
            allProducts = [...allProducts, ...data.products];
            setResults([...allProducts]); 
          }
          
          // Pausa táctica
          if (i < totalPages - 1) {
             await new Promise(r => setTimeout(r, 4200));
          }
        }
        setStatusText(`¡Documento colosal dominado! Total rescatado: ${allProducts.length}`);
      } else {
        // EXCEL FLUJO NORMAL
        setStatusText('🧠 Extrayendo todas las celdas del Excel...');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('brand', brand);

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Falló la conexión con la Inteligencia Artificial.');
        }
        
        setResults(data.products || []);
        setStatusText(`¡Planilla Excel dominada!`);
      }
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
      <h1 className="title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Panel Administrativo 🤖</h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.2rem' }}>
        Añade hojas de cálculo y PDFs titánicos sin preocuparte por el tamaño.
      </p>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.8rem', padding: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 600, color: 'var(--accent-color)' }}>1. Marca Proveedora</label>
          <select 
            value={brand} 
            onChange={e => setBrand(e.target.value)} 
            style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '1rem', borderRadius: '8px', cursor: 'pointer', outline: 'none' }} 
          >
            <option value="Bioalquimia" style={{ color: '#000' }}>Bioalquimia</option>
            <option value="NÜR" style={{ color: '#000' }}>NÜR</option>
            <option value="Rouse Arey" style={{ color: '#000' }}>Rouse Arey</option>
            <option value="Ale Piña" style={{ color: '#000' }}>Ale Piña</option>
            <option value="Derma's" style={{ color: '#000' }}>Derma's</option>
            <option value="K-beauty" style={{ color: '#000' }}>K-beauty</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 600, color: 'var(--accent-color)' }}>2. Sube la Lista de Precios (.pdf o .xlsx)</label>
          <input 
            type="file" 
            accept=".pdf, .xlsx" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '8px' }} 
          />
        </div>

        <button 
          className="btn-primary" 
          onClick={handleUpload} 
          disabled={loading || !file} 
          style={{ width: '100%', padding: '1.2rem', marginTop: '1rem', fontSize: '1.1rem', letterSpacing: '1px', opacity: (loading || !file) ? 0.6 : 1, transition: 'all 0.3s' }}
        >
          {loading ? statusText || '🧠 Analizando con IA...' : 'Analizar Lista y Extraer Productos'}
        </button>

        {error && (
          <div style={{ color: '#ff4d4f', padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', border: '1px solid #ff4d4f' }}>
            ⚠️ Error: {error}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '5rem', maxWidth: '800px', margin: '5rem auto 0 auto' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'var(--text-main)', textAlign: 'center' }}>
            {statusText.includes('dominado') ? '¡Éxito Total!' : 'Descubriendo...'} <span style={{ color: 'var(--accent-color)' }}>{results.length} Productos</span> Extráidos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((p, i) => (
              <div key={i} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600, textTransform: 'uppercase' }}>{p.brand} | {p.category}</div>
                  <strong style={{ fontSize: '1.1rem' }}>
                    {p.name} 
                    {p.presentation && <span style={{fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '6px'}}>- {p.presentation}</span>}
                  </strong>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#fff' }}>
                  ${p.price.toLocaleString('es-AR')}
                </div>
              </div>
            ))}
          </div>
          
          {/* BOTÓN TITÁNICO DE GUARDADO */}
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={async () => {
                setSaveStatus('guardando');
                try {
                   const res = await fetch('/api/save', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ brand: brand, products: results })
                   });
                   const data = await res.json();
                   if (!res.ok) throw new Error(data.error);
                   setSaveStatus('ok');
                   setTimeout(() => setSaveStatus(''), 4000);
                } catch(e: any) {
                   setError("Error al guardar: " + e.message);
                   setSaveStatus('');
                }
              }} 
              disabled={saveStatus === 'guardando' || saveStatus === 'ok'}
              style={{ 
                width: '100%', 
                maxWidth: '500px', 
                padding: '1.2rem', 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                letterSpacing: '1px', 
                transition: 'all 0.3s',
                backgroundColor: saveStatus === 'ok' ? '#27ae60' : (saveStatus === 'guardando' ? '#f39c12' : '#2ecc71'),
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: saveStatus === 'ok' ? '0 0 20px rgba(39, 174, 96, 0.5)' : '0 0 20px rgba(46, 204, 113, 0.4)'
              }}
            >
              {saveStatus === 'guardando' ? '💾 Escribiendo Base de Datos...' : 
               saveStatus === 'ok' ? '✅ ¡Publicado Exitosamente!' : 
               `🛒 Publicar ${results.length} Productos en Catálogo Oficial`}
            </button>
            {saveStatus === 'ok' && <p style={{color: '#27ae60', marginTop: '1rem', fontWeight: 'bold'}}>¡Tus productos ya son visibles en la tienda para tus clientes!</p>}
          </div>
        </div>
      )}
    </div>
  )
}
