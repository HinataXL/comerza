'use client';

import React, { useState } from 'react';
import { Trash2, ZoomIn, X } from 'lucide-react';

interface Photo {
  id: string;
  category: string;
  viewUrl: string;
  description?: string;
  createdAt: string;
  uploadedByName?: string;
}

interface Props {
  workOrderId: string;
  token: string;
  photos: Photo[];
  category: string;
  canUpload: boolean;
  onUpdate: () => void;
}

export default function WorkOrderPhotoGallery({ workOrderId, token, photos, category, canUpload, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const categoryPhotos = photos.filter(p => p.category === category);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 10MB.');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }
    
    setUploading(true);
    try {
      const res = await fetch(`/api/taller/work-orders/${workOrderId}/photos`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir foto');
      setDescription('');
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Error al subir la fotografía');
    } finally {
      setUploading(false);
      // clear input
      e.target.value = '';
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('¿Seguro que desea eliminar esta fotografía?')) return;
    try {
      const res = await fetch(`/api/taller/work-orders/${workOrderId}/photos/${photoId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="photo-gallery">
      {canUpload && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Descripción opcional" 
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ flex: 1, minWidth: '150px' }}
          />
          <div style={{ position: 'relative' }}>
            <button className="btn btn-outline" disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Agregar Foto'}
            </button>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              capture="environment" // allows opening camera on mobile
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        </div>
      )}

      {categoryPhotos.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay fotografías en esta sección.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {categoryPhotos.map(photo => (
            <div key={photo.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              <img 
                src={photo.viewUrl} 
                alt={photo.description || 'Evidencia'} 
                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                onClick={() => setSelectedImage(photo.viewUrl)}
              />
              <div style={{ padding: '0.5rem', fontSize: '0.8rem', backgroundColor: 'var(--card-bg)' }}>
                {photo.description && <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{photo.description}</div>}
                <div style={{ color: 'var(--text-muted)' }}>
                  {new Date(photo.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              {canUpload && (
                <button 
                  onClick={() => handleDelete(photo.id)}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Modal Modal */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <img src={selectedImage} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} alt="Ampliada" />
        </div>
      )}
    </div>
  );
}
