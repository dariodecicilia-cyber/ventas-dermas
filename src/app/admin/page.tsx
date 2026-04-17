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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [managementSearch, setManagementSearch] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const fetchExisting = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setAllProducts(data);
  };

  React.useEffect(() => {
    if (isAuthenticated) fetchExisting();
  }, [isAuthenticated]);

  const handleDeleteProduct = async (id: any) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchExisting();
  };

  const handleClearBrand = async () => {
    if (!confirm(`¿Seguro que quieres BORRAR TODO lo de la marca ${brand}?`)) return;
    const res = await fetch(`/api/products?brand=${brand}`, { method: 'DELETE' });
    if (res.ok) {
       alert(`Se ha vaciado la marca ${brand}`);
       fetchExisting();
    }
  };

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
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();
        let currentProducts: Product[] = [];

        for (let i = 0; i < totalPages; i++) {
          setStatusText(`🧠 Escaneando... página ${i + 1} de ${totalPages}...`);
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          const chunkBytes = await newPdf.save();
          const chunkBlob = new Blob([chunkBytes as any], { type: 'application/pdf' });
          const fd = new FormData();
          fd.append('file', chunkBlob, `page_${i}.pdf`);
          fd.append('brand', brand);
          // Pequeña pausa para no saturar la API
          await new Promise(r => setTimeout(r, 2000));

          let success = false;
          let retries = 0;
          while (!success && retries < 3) {
            try {
              const res = await fetch('/api/upload', { method: 'POST', body: fd });
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Error desconocido del servidor' }));
                throw new Error(errorData.error || `Error en la página ${i+1}`);
              }
              const data = await res.json();
              if (data.products) {
                // Asignamos un orden global basado en lo que ya tenemos acumulado
                const globalProducts = data.products.map((p: any, idx: number) => ({
                  ...p,
                  order_index: currentProducts.length + idx
                }));
                currentProducts = [...currentProducts, ...globalProducts];
                setResults([...currentProducts]);
              }
              success = true;
            } catch (err: any) {
              retries++;
              if (retries >= 3) throw err;
              setStatusText(`⚠️ Reintentando página ${i+1}... (Intento ${retries+1})`);
              await new Promise(r => setTimeout(r, 7000)); // Esperar 7s antes de reintentar
            }
          }
        }
      } else if (file.name.toLowerCase().endsWith('.xlsx')) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('brand', brand);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.products || []);
      }
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredManagement = allProducts.filter(p => 
    p.brand.toLowerCase().includes(managementSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(managementSearch.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Panel de Control Derma's 🛸</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 450px) 1fr', gap: '3rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: CARGA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>1. Cargar Nueva Lista</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Marca Proveedora</label>
              <select 
                value={brand} 
                onChange={e => setBrand(e.target.value)} 
                style={{ width: '100%', padding: '0.8rem', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '6px' }} 
              >
                <option value="Bioalquimia">Bioalquimia</option>
                <option value="NÜR">NÜR</option>
                <option value="Rouse Arey">Rouse Arey</option>
                <option value="Ale Piña">Ale Piña</option>
                <option value="Derma's">Derma's</option>
                <option value="K-beauty">K-beauty</option>
                <option value="Desconocida">Desconocida</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
               <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Archivo (.pdf o .xlsx)</label>
               <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ width: '100%', fontSize: '0.8rem' }} />
            </div>

            <button className="btn-primary" onClick={handleUpload} disabled={loading || !file} style={{ width: '100%', padding: '1rem' }}>
              {loading ? 'Analizando...' : 'Analizar y Previsualizar'}
            </button>

            {loading && statusText && (
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--accent-color)', textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
                {statusText}
              </p>
            )}

            {error && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 77, 79, 0.1)', border: '1px solid #ff4d4f', borderRadius: '6px', color: '#ff4d4f', fontSize: '0.85rem' }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <button 
              onClick={handleClearBrand}
              style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', background: 'transparent', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              🗑️ Vaciar TODA la marca {brand}
            </button>
          </div>

          {results.length > 0 && (
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--accent-color)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Previsualización ({results.length})</h3>
              <button 
                className="btn-primary" 
                onClick={async () => {
                  setSaveStatus('guardando');
                  const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand, products: results }) });
                  if (res.ok) { 
                    setSaveStatus('ok'); 
                    fetchExisting(); 
                    setResults([]); 
                  }
                  else setSaveStatus('');
                }}
                disabled={saveStatus === 'guardando'}
                style={{ width: '100%', marginBottom: '1rem', background: '#27ae60' }}
              >
                {saveStatus === 'ok' ? '✅ ¡PUBLICADO!' : '🚀 PUBLICAR AL CATÁLOGO'}
              </button>
              <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.85rem' }}>
                 {results.slice(0, 10).map((r, i) => <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #333' }}>{r.name} - ${r.price}</div>)}
                 {results.length > 10 && <div style={{ textAlign: 'center', marginTop: '10px', color: '#888' }}>... y {results.length - 10} más</div>}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: GESTIÓN */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>2. Gestión de Catálogo Existente</h2>
          
          <input 
            type="text" 
            placeholder="Buscar en el catálogo actual..."
            value={managementSearch}
            onChange={e => setManagementSearch(e.target.value)}
            style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', color: '#fff', marginBottom: '2rem' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {filteredManagement.length === 0 ? <p style={{ color: '#888' }}>No hay productos para mostrar.</p> : 
              filteredManagement.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>{p.brand}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{p.name}</div>
                  </div>
                  <button 
                    onClick={() => handleDeleteProduct(p.id)}
                    style={{ background: '#ff4d4f22', color: '#ff4d4f', border: '1px solid #ff4d4f', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Eliminar
                  </button>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  );
}
