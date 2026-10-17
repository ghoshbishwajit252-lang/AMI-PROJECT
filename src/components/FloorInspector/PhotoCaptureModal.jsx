import React, { useState } from 'react';
import { Camera, Image, CheckCircle, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function PhotoCaptureModal({ 
  isOpen, 
  dimensionName, 
  measuredValue, 
  specLimits, 
  isCTQ,
  existingPhotos = [], 
  onSavePhotos, 
  onClose 
}) {
  const [photos, setPhotos] = useState(existingPhotos.length > 0 ? existingPhotos : []);
  const [photoPreview, setPhotoPreview] = useState(null);

  if (!isOpen) return null;

  // Add sample high-res defect snapshot
  const handleCaptureSnapshot = () => {
    sounds.playClick();
    const newPhotoUrl = photos.length % 2 === 0 
      ? "/assets/defect_shaft_reading.jpg" 
      : "/assets/defect_shaft_reading.jpg";
    
    const updated = [...photos, newPhotoUrl];
    setPhotos(updated);
    sounds.playPass();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, reader.result]);
        sounds.playPass();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    sounds.playClick();
  };

  const handleSave = () => {
    if (photos.length < 2) {
      sounds.playAlarm();
      alert("MANDATORY PRD RULE 5.4: At least 2 clear defect or gauge photos must be captured before proceeding!");
      return;
    }
    onSavePhotos(photos);
    onClose();
  };

  const meetsRequirement = photos.length >= 2;

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-content-lg" style={{ padding: 24 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-fail-bg)',
              border: '2px solid var(--status-fail-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseFail 1.5s infinite'
            }}>
              <Camera size={24} color="#ef4444" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, color: '#f87171' }}>Mandatory Non-Conformance Photo Capture</h2>
                {isCTQ && (
                  <span className="badge badge-ctq">
                    <ShieldAlert size={12} /> CTQ BREACH
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Rule 5.4: Out-of-tolerance reading detected on <strong>{dimensionName}</strong> ({measuredValue} vs spec {specLimits}).
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Banner Explaining Mandatory 2 Photos */}
        <div style={{
          padding: '12px 16px',
          background: meetsRequirement ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${meetsRequirement ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 13 }}>
            <strong>Mandatory Evidence Requirement:</strong> Minimum 2 high-clarity photos required (defect macro view + gauge dial reading).
          </div>
          <span className={`badge ${meetsRequirement ? 'badge-pass' : 'badge-fail'}`} style={{ fontSize: 12 }}>
            {photos.length} / 2 Minimum
          </span>
        </div>

        {/* Captured Photos Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: 14, 
          marginBottom: 20 
        }}>
          {photos.map((src, idx) => (
            <div 
              key={idx}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-medium)',
                aspectRatio: '4/3',
                backgroundColor: '#000'
              }}
            >
              <img 
                src={src} 
                alt={`Defect Proof #${idx + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                fontSize: 11,
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Photo #{idx + 1}</span>
                <button 
                  onClick={() => handleRemovePhoto(idx)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14 }}
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Add / Capture Button Card */}
          <button
            onClick={handleCaptureSnapshot}
            className="btn btn-outline"
            style={{
              height: '100%',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <Camera size={26} color="#06b6d4" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Capture Snapshot</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Simulate Tablet Camera</span>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: 12 }}>
            <Upload size={14} />
            <span>Upload From File</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn btn-outline">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!meetsRequirement}
              className={`btn ${meetsRequirement ? 'btn-success' : 'btn-danger'}`}
            >
              <CheckCircle size={16} />
              <span>{meetsRequirement ? 'Confirm & Attach Evidence (Ready)' : `Take ${2 - photos.length} More Photo(s)`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
