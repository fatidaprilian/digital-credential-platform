// frontend/app/components/MagicLogin.tsx
"use client";

import { useAccount, useConnect } from 'wagmi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function MagicLoginContent() {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Jika sudah terkoneksi setelah login (baik via email atau google), arahkan ke galeri
    if (isMounted && isConnected && (isEmailLoading || isGoogleLoading)) {
      router.push('/holder');
    }
  }, [isConnected, isMounted, isEmailLoading, isGoogleLoading, router]);

  // Cari konektor Magic dari daftar yang disediakan oleh Wagmi/RainbowKit
  const magicConnector = connectors.find(c => c.id === 'magic');

  const handleEmailLogin = async () => {
    if (!email) {
      alert("Silakan masukkan email Anda.");
      return;
    }
    if (magicConnector) {
      setIsEmailLoading(true);
      try {
        connect({
          connector: magicConnector,
          email, // Kirim email untuk otentikasi Magic Link
        });
      } catch (error) {
        console.error("Magic email login error:", error);
        setIsEmailLoading(false);
      }
    } else {
      alert("Konektor Magic tidak ditemukan. Silakan periksa konfigurasi.");
    }
  };

  const handleGoogleLogin = async () => {
    if (magicConnector) {
      setIsGoogleLoading(true);
      try {
        connect({
          connector: magicConnector,
          oauthProvider: 'google', // Tentukan Google sebagai provider OAuth
        });
      } catch (error) {
        console.error("Magic Google login error:", error);
        setIsGoogleLoading(false);
      }
    } else {
      alert("Konektor Magic tidak ditemukan. Silakan periksa konfigurasi.");
    }
  };

  // Jangan tampilkan apapun jika pengguna sudah login atau komponen belum siap
  if (!isMounted || isConnected) return null;

  const isLoading = isEmailLoading || isGoogleLoading;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Login atau Daftar</h3>
      <p style={styles.subtitle}>Gunakan akun sosial atau email Anda.</p>
      
      {/* Tombol Login Google */}
      <button 
        onClick={handleGoogleLogin} 
        disabled={isLoading} 
        style={buttonStyle('#4285F4', isGoogleLoading)}
      >
        {isGoogleLoading ? "Mengarahkan ke Google..." : "Masuk dengan Google"}
      </button>

      <div style={styles.divider}>
        <span style={styles.dividerLine}></span>
        <span style={styles.dividerText}>atau</span>
        <span style={styles.dividerLine}></span>
      </div>

      {/* Form Login Email */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Masukkan email Anda"
        style={styles.input}
        disabled={isLoading}
      />
      <button 
        onClick={handleEmailLogin} 
        disabled={isLoading} 
        style={buttonStyle('#2980b9', isEmailLoading)}
      >
        {isEmailLoading ? "Periksa email Anda..." : "Masuk dengan Email"}
      </button>
    </div>
  );
}

export default function MagicLogin() {
  return <MagicLoginContent />;
}

// Helper untuk styling
const buttonStyle = (color: string, disabled: boolean = false) => ({
  padding: '0.8rem 1.5rem',
  fontSize: '1rem',
  color: '#fff',
  backgroundColor: disabled ? '#555' : color,
  border: 'none',
  borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  width: '100%',
  fontWeight: '600',
  transition: 'background-color 0.2s'
} as const);

const styles = {
  container: { 
    display: 'flex', 
    flexDirection: 'column' as const, 
    gap: '1rem', 
    alignItems: 'center', 
    padding: '2rem',
    backgroundColor: '#1c1c1c',
    borderRadius: '12px',
    border: '1px solid #333',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  subtitle: {
    margin: '0 0 1rem 0',
    opacity: 0.7,
    fontSize: '0.9rem'
  },
  input: {
    padding: '0.8rem', 
    fontSize: '1rem', 
    borderRadius: '8px',
    border: '1px solid #555', 
    backgroundColor: '#222', 
    color: 'white', 
    width: '100%'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center' as const,
    color: '#666',
    width: '100%',
    margin: '0.5rem 0'
  },
  dividerLine: {
    flex: 1,
    borderBottom: '1px solid #444',
  },
  dividerText: {
    padding: '0 1rem'
  }
};
