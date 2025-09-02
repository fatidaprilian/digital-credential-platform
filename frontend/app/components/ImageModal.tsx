"use client";

// Komponen ini menampilkan gambar dalam layar penuh (modal) saat diklik.
export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  tokenId,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  tokenId: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '2px solid #333',
            fontSize: '1.2rem',
            cursor: 'pointer',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Gambar */}
        <img
          src={imageUrl}
          alt={title}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        />

        {/* Info Gambar */}
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '0',
            right: '0',
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{title}</h3>
          <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.8 }}>Token ID: {tokenId}</p>
        </div>
      </div>
    </div>
  );
}