'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, PackageSearch, X, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ name: '', description: '', price: 0, stock: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setIsEditing(true);
      setCurrentProduct(product);
      setImagePreview(product.imageUrl || null);
    } else {
      setIsEditing(false);
      setCurrentProduct({ name: '', description: '', price: 0, stock: 0 });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isUploading) return;
    setIsModalOpen(false);
    setCurrentProduct({ name: '', description: '', price: 0, stock: 0 });
    setImagePreview(null);
    setImageFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalImageUrl = currentProduct.imageUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!uploadRes.ok) throw new Error('Error al subir la imagen');
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.imageUrl;
      }

      const url = isEditing 
        ? `/api/products/${currentProduct.id}`
        : '/api/products';
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...currentProduct, imageUrl: finalImageUrl })
      });

      if (!res.ok) throw new Error('Error al guardar el producto');
      
      handleCloseModal();
      refreshProducts(); // Refresh list
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    showConfirm('Eliminar Producto', '¿Estás seguro de eliminar este producto?', async () => {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Error al eliminar');
        refreshProducts();
      } catch (err: any) {
        showAlert('Error', err.message, 'error');
      }
    });
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Catálogo de Productos</h2>
          <p className="text-secondary">Gestiona tu inventario y precios</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {error ? (
        <div className="card text-error" style={{ textAlign: 'center', padding: '2rem' }}>{error}</div>
      ) : products.length === 0 ? (
        <div className="card flex-center" style={{ flexDirection: 'column', padding: '4rem', gap: '1rem' }}>
          <PackageSearch size={48} className="text-muted" />
          <p className="text-secondary">Aún no hay productos en tu catálogo.</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>Crear el primero</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products.map((product) => (
            <div key={product.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ height: '220px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="/logo.png" alt="Comerza" style={{ width: '50%', height: 'auto', opacity: 0.3, objectFit: 'contain' }} />
                )}
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    title="Editar"
                    style={{ padding: '0.5rem', borderRadius: '50%', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex' }} 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    title="Eliminar"
                    style={{ padding: '0.5rem', borderRadius: '50%', background: 'white', color: '#ef4444', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex' }} 
                    onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', flex: 1, margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description || 'Sin descripción'}
                </p>
                <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>Q {product.price.toFixed(2)}</span>
                  <span className={`badge ${product.stock > 5 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-error'}`}>
                    {product.stock} und
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="modal-close" onClick={handleCloseModal} disabled={isUploading}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProduct}>
              
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ textAlign: 'left' }}>Imagen del Producto</label>
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    height: '200px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    overflow: 'hidden',
                    backgroundColor: '#f8fafc',
                    position: 'relative',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseOver={(e) => { if(!isUploading) e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onMouseOut={(e) => { if(!isUploading) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <div style={{ background: '#e2e8f0', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: '#64748b' }}>
                        <ImageIcon size={32} />
                      </div>
                      <span style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>Haz clic para subir una imagen</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>PNG, JPG o WEBP (máx. 5MB)</span>
                    </>
                  )}
                  {isUploading && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Subiendo...</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del producto</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  disabled={isUploading}
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  disabled={isUploading}
                  value={currentProduct.description || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Precio (Q)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    required 
                    disabled={isUploading}
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock disponible</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    disabled={isUploading}
                    value={currentProduct.stock}
                    onChange={(e) => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal} disabled={isUploading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  {isUploading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
